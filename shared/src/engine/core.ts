import { BOARD, getTile } from '../board';
import { CHANCE_CARDS, COMMUNITY_CARDS } from '../cards';
import {
  BOARD_SIZE,
  GO_REWARD,
  JAIL_INDEX,
  STATION_RENTS,
  UTILITY_MULTIPLIERS,
} from '../constants';
import { downgradeRefund, sellValue } from '../finance';
import type { DeckKind, KeepableCard, OwnableTile, PropertyTile } from '../types';
import type { GameState, LogEntry, PlayerState, TileState } from './types';

/** Lỗi do người chơi gửi thao tác không hợp lệ; trả về cho client, không làm hỏng ván. */
export class RuleError extends Error {}

export const MAX_LOG_ENTRIES = 100;

export function getPlayer(s: GameState, id: string): PlayerState {
  const p = s.players.find((x) => x.id === id);
  if (!p) throw new RuleError(`Không có người chơi ${id}`);
  return p;
}

export const currentPlayer = (s: GameState): PlayerState => s.players[s.current]!;

export const activePlayers = (s: GameState): PlayerState[] =>
  s.players.filter((p) => p.status === 'active');

/** Những người chơi còn lại theo vòng ghế, bắt đầu từ người ngồi sau `id`. */
export function othersInSeatOrder(s: GameState, id: string): PlayerState[] {
  const start = s.players.findIndex((p) => p.id === id);
  const out: PlayerState[] = [];
  for (let k = 1; k < s.players.length; k++) {
    const p = s.players[(start + k) % s.players.length]!;
    if (p.status === 'active') out.push(p);
  }
  return out;
}

export function tileState(s: GameState, index: number): TileState {
  const t = s.tiles[index];
  if (!t) throw new RuleError(`Ô ${index} không mua được`);
  return t;
}

export function ownableTile(index: number): OwnableTile {
  const t = getTile(index);
  if (t.kind !== 'property' && t.kind !== 'station' && t.kind !== 'utility') {
    throw new RuleError(`Ô ${index} không mua được`);
  }
  return t;
}

export function propertyTile(index: number): PropertyTile {
  const t = getTile(index);
  if (t.kind !== 'property') throw new RuleError(`Ô ${index} không phải đất màu`);
  return t;
}

export const ownedTiles = (s: GameState, playerId: string): number[] =>
  s.tiles.flatMap((t, i) => (t?.owner === playerId ? [i] : []));

export const ownedProperties = (s: GameState, playerId: string): number[] =>
  ownedTiles(s, playerId).filter((i) => BOARD[i]!.kind === 'property');

/** Số ô loại `kind` của chủ đang hoạt động (không bị cắm). */
export function activeCount(s: GameState, owner: string, kind: 'station' | 'utility'): number {
  return s.tiles.filter((t, i) => t?.owner === owner && !t.mortgaged && BOARD[i]!.kind === kind)
    .length;
}

export const stationRent = (s: GameState, owner: string): number =>
  STATION_RENTS[activeCount(s, owner, 'station')] ?? 0;

export const utilityMultiplier = (s: GameState, owner: string): number =>
  UTILITY_MULTIPLIERS[activeCount(s, owner, 'utility')] ?? 0;

export function addLog(s: GameState, playerId: string | null, text: string, amount?: number) {
  const entry: LogEntry = { turn: s.turnNumber, playerId, text };
  if (amount !== undefined) entry.amount = amount;
  s.log.push(entry);
  if (s.log.length > MAX_LOG_ENTRIES) s.log.splice(0, s.log.length - MAX_LOG_ENTRIES);
}

export const hasCard = (p: PlayerState, kind: KeepableCard): boolean =>
  p.heldCards.some((c) => c.kind === kind);

const DECK_OF = new Map<string, DeckKind>(
  [...CHANCE_CARDS, ...COMMUNITY_CARDS].map((c) => [c.id, c.deck]),
);

/** Ô phải sở hữu để giữ quyền Người thủ đô. */
const CAPITAL_TILE = (() => {
  const e = CHANCE_CARDS.find((c) => c.effect.type === 'capitalCitizen')?.effect;
  if (e?.type !== 'capitalCitizen') throw new Error('Thiếu thẻ Người thủ đô');
  return e.requiredTile;
})();

/** Bỏ thẻ đang giữ và trả nó về đáy chồng thẻ của nó. */
export function takeCard(s: GameState, p: PlayerState, kind: KeepableCard): boolean {
  const i = p.heldCards.findIndex((c) => c.kind === kind);
  if (i < 0) return false;
  const [card] = p.heldCards.splice(i, 1);
  s.decks[DECK_OF.get(card!.cardId)!].push(card!.cardId);
  return true;
}

/** Người giữ quyền Người thủ đô mà không còn sở hữu Phố Cổ thì quyền hết hiệu lực. */
export function expireTaxWaivers(s: GameState) {
  for (const p of s.players) {
    if (hasCard(p, 'taxWaiver') && s.tiles[CAPITAL_TILE]?.owner !== p.id) {
      takeCard(s, p, 'taxWaiver');
      addLog(s, p.id, 'Mất Phố Cổ, quyền Người thủ đô hết hiệu lực');
    }
  }
}

/** Tiến `steps` ô; qua hoặc dừng ô 00 thì nhận 200Đ nếu `collectGo`. */
export function moveForward(s: GameState, p: PlayerState, steps: number, collectGo: boolean) {
  const raw = p.position + steps;
  p.position = raw % BOARD_SIZE;
  if (collectGo && raw >= BOARD_SIZE) {
    p.cash += GO_REWARD;
    addLog(s, p.id, `Qua ô Bắt Đầu`, GO_REWARD);
  }
}

/** Tiến đến ô `target` theo chiều kim đồng hồ. */
export function moveForwardTo(s: GameState, p: PlayerState, target: number, collectGo: boolean) {
  const steps = (target - p.position + BOARD_SIZE) % BOARD_SIZE;
  moveForward(s, p, steps === 0 ? BOARD_SIZE : steps, collectGo);
}

/** Lùi `steps` ô, không bao giờ nhận tiền ô 00. */
export function moveBack(p: PlayerState, steps: number) {
  p.position = (((p.position - steps) % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
}

export function sendToJail(s: GameState, p: PlayerState) {
  p.position = JAIL_INDEX;
  p.inJail = true;
  p.jailAttempts = 0;
  if (currentPlayer(s).id === p.id) s.extraRoll = false;
  addLog(s, p.id, 'Vào tù');
}

/** Tiền tối đa người chơi có thể gom bằng cách hạ hết công trình rồi bán hết tài sản. */
export function maxLiquidationValue(s: GameState, playerId: string): number {
  let total = 0;
  for (const i of ownedTiles(s, playerId)) {
    const t = s.tiles[i]!;
    const tile = ownableTile(i);
    if (tile.kind === 'property') total += t.level * downgradeRefund(tile.upgradeCost);
    total += sellValue(tile.price, t.mortgaged);
  }
  return total;
}

/** Đất màu rẻ nhất của người chơi (kể cả đang cắm), bằng giá thì lấy ô số nhỏ hơn. */
export function cheapestProperty(s: GameState, playerId: string): number | null {
  let best: number | null = null;
  for (const i of ownedProperties(s, playerId)) {
    if (best === null || propertyTile(i).price < propertyTile(best).price) best = i;
  }
  return best;
}
