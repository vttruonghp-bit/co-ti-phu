import { useEffect, useState, type ReactNode } from 'react';
import {
  BOARD,
  HOTEL_LEVEL,
  LOG_VISIBLE_ENTRIES,
  redeemCost,
  type Action,
  type GameState,
  type PlayerState,
} from '@cotiphu/shared';
import { Board } from '../components/Board';
import { Dice } from '../components/Dice';
import { TokenIcon } from '../components/TokenIcon';
import {
  assetCount,
  levelText,
  money,
  playerById,
  rentText,
  signed,
  tileName,
} from '../game/format';
import { debtorOf } from '../game/draft';
import type { HotSeatGame } from '../game/useHotSeat';
import { AppearanceSheet } from '../sheets/AppearanceSheet';
import { CardSheet } from '../sheets/CardSheet';
import { ChooseTileSheet } from '../sheets/ChooseTileSheet';
import { GameOverSheet } from '../sheets/GameOverSheet';
import { JailSheet } from '../sheets/JailSheet';
import { ManageSheet, type ManageMode } from '../sheets/ManageSheet';
import { MetroSheet } from '../sheets/MetroSheet';
import { SurrenderSheet } from '../sheets/SurrenderSheet';
import type { CardEvent, HighwayEvent } from '../sheets/types';
import { colorOf } from '../theme';
import './game-screen.css';

interface GameScreenProps {
  hotSeat: HotSeatGame;
  dispatch: (action: Action) => string | null;
  onNewGame: () => void;
}

/** 'board': tạm ẩn Xử lý nợ để xem bàn cờ (nút chính "Xử lý nợ" mở lại). */
type Manual = null | 'manage' | 'appearance' | 'surrender' | 'board';

/** Người ván đang chờ (người phải bấm nút tiếp theo); khi ván kết thúc là người giữ lượt cuối. */
function waitingPlayer(s: GameState): PlayerState {
  const pd = s.pending;
  const id = 'playerId' in pd ? pd.playerId : s.players[s.current]!.id;
  return s.players.find((p) => p.id === id)!;
}

/** Ụp/Mở đầy đủ chỉ ở đầu lượt của mình (trước khi đổ); lúc khác chỉ xem. */
function canManage(s: GameState, p: PlayerState): boolean {
  return (
    s.players[s.current]!.id === p.id &&
    !s.rolled &&
    (s.pending.type === 'roll' || s.pending.type === 'jail')
  );
}

interface MainAction {
  label: string;
  tone: string;
  run: () => void;
}

export function GameScreen({ hotSeat, dispatch, onNewGame }: GameScreenProps) {
  const { game, previous, actions } = hotSeat;
  const [manual, setManual] = useState<Manual>(null);
  const [viewTile, setViewTile] = useState<number | null>(null);
  const [cardsSeen, setCardsSeen] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const cur = game.players[game.current]!;
  const me = waitingPlayer(game);
  const meColor = colorOf(me.color);
  const pd = game.pending;

  // Mỗi thao tác mới: về xem ô đang đứng, chưa xem thẻ nào. Đặt lại ngay trong lần vẽ này
  // (không đợi effect) để không lóe màn cũ hay hiện nhầm lá thẻ trong một khung hình.
  const [seenAt, setSeenAt] = useState(actions);
  if (seenAt !== actions) {
    setSeenAt(actions);
    setViewTile(null);
    setCardsSeen(0);
  }
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 3500);
    return () => clearTimeout(t);
  }, [error]);

  const send = (a: Action) => {
    const err = dispatch(a);
    if (err) setError(err);
    return err;
  };

  // Thẻ vừa rút và kết quả đổ xúc xắc Cao tốc lần lượt hiện cho người chơi xem.
  const cardEvents = game.events.filter(
    (e): e is CardEvent | HighwayEvent => e.type === 'card' || e.type === 'highway',
  );
  const pendingCard = cardEvents[cardsSeen];
  const lastRoll = [...game.events].reverse().find((e) => e.type === 'roll');
  const dice = lastRoll?.type === 'roll' ? lastRoll.dice : (game.lastDice ?? null);
  // Xúc xắc mang màu người gieo: lần đổ trong thao tác này, không thì người giữ lượt
  // (lastDice bị xóa khi sang lượt mới nên luôn là của người giữ lượt).
  const roller = lastRoll?.type === 'roll' ? playerById(game, lastRoll.playerId) : cur;
  const rollerColor = colorOf((roller ?? cur).color).main;

  const sheetProps = {
    game,
    previous,
    dispatch: send,
    onClose: () => setManual(null),
  };

  // Màn phụ: thẻ vừa rút trước, rồi tới việc ván đang chờ, rồi các màn người chơi tự mở.
  const debtor = debtorOf(game, previous);
  let sheet: ReactNode = null;
  // Thẻ làm phá sản vẫn hiện trước, rồi mới tới màn kết thúc.
  if (pendingCard) {
    sheet = (
      <CardSheet
        {...sheetProps}
        event={pendingCard}
        onContinue={() => setCardsSeen((n) => n + 1)}
      />
    );
  } else if (pd.type === 'ended') {
    sheet = <GameOverSheet game={game} onNewGame={onNewGame} />;
  } else if (manual === 'appearance') {
    sheet = <AppearanceSheet {...sheetProps} playerId={me.id} />;
  } else if (manual === 'surrender') {
    sheet = <SurrenderSheet {...sheetProps} playerId={me.id} />;
  } else if (manual === 'manage' || (debtor && manual !== 'board')) {
    // Xử lý nợ là của người đang nợ (có thể không phải người giữ lượt), không đóng được.
    const mode: ManageMode = debtor ? 'debt' : canManage(game, me) ? 'manage' : 'view';
    sheet = (
      <ManageSheet
        {...sheetProps}
        mode={mode}
        playerId={debtor ?? me.id}
        onShowBoard={() => setManual('board')}
      />
    );
  } else if (pd.type === 'metro') {
    sheet = <MetroSheet {...sheetProps} />;
  } else if (pd.type === 'jail' || pd.type === 'jailRelease') {
    sheet = <JailSheet {...sheetProps} onOpenManage={() => setManual('manage')} />;
  } else if (pd.type === 'chooseTile') {
    sheet = <ChooseTileSheet {...sheetProps} />;
  }

  const main = ((): MainAction | null => {
    const id = me.id;
    switch (pd.type) {
      case 'roll':
        return { label: 'Sục', tone: '', run: () => send({ type: 'roll', playerId: id }) };
      case 'buy': {
        const t = BOARD[pd.tile]!;
        const price = 'price' in t ? t.price : 0;
        return {
          label: `Mua · ${money(price)}`,
          tone: 'btn-teal',
          run: () => send({ type: 'buy', playerId: id }),
        };
      }
      case 'upgrade': {
        const t = BOARD[pd.tile]!;
        const st = game.tiles[pd.tile]!;
        const price = 'price' in t ? t.price : 0;
        const build = t.kind === 'property' ? t.upgradeCost : 0;
        const label =
          pd.mode === 'build'
            ? `Nâng lên ${levelText(st.level + 1)} · ${money(build)}`
            : pd.mode === 'redeemBuild'
              ? `Chuộc + xây 1 nhà · ${money(redeemCost(price) + build)}`
              : `Chuộc · ${money(redeemCost(price))}`;
        return { label, tone: 'btn-teal', run: () => send({ type: 'upgrade', playerId: id }) };
      }
      case 'pay':
        if (me.cash < pd.total) {
          return { label: 'Xử lý nợ', tone: 'btn-red', run: () => setManual('manage') };
        }
        return pd.reason === 'tax'
          ? {
              label: `Là nó · ${money(pd.total)}`,
              tone: 'btn-red',
              run: () => send({ type: 'pay', playerId: id }),
            }
          : {
              label: `Trả tiền · ${money(pd.total)}`,
              tone: '',
              run: () => send({ type: 'pay', playerId: id }),
            };
      default:
        return null;
    }
  })();

  const secondary: MainAction =
    pd.type === 'buy'
      ? {
          label: 'Không mua',
          tone: 'btn-outline',
          run: () => send({ type: 'declineBuy', playerId: me.id }),
        }
      : pd.type === 'upgrade'
        ? {
            label: 'Bỏ qua',
            tone: 'btn-outline',
            run: () => send({ type: 'skipUpgrade', playerId: me.id }),
          }
        : { label: 'Ụp / Mở', tone: 'btn-outline', run: () => setManual('manage') };

  const accentStyle = {
    ['--accent' as string]: meColor.main,
    ['--accent-soft' as string]: meColor.soft,
  };

  return (
    <main className="phone game-screen" style={accentStyle}>
      {/* Khi màn phụ đang mở, màn chính phía sau không bấm hay đọc tới được. */}
      <div className="game-main" inert={sheet !== null}>
        <header className="app-header">
          <h1 className="app-title">CỜ TỶ PHÚ</h1>
          <span className="app-turn" style={{ color: colorOf(cur.color).main }}>
            Lượt {cur.name} · {money(cur.cash)}
          </span>
        </header>

        {me.id !== cur.id && pd.type !== 'ended' && (
          <p className="handoff" style={{ background: meColor.soft, color: meColor.main }}>
            Chuyển máy cho <b>{me.name}</b>: {waitingText(game, me)}
          </p>
        )}

        <PlayersBar game={game} />

        <Board
          game={game}
          focus={viewTile ?? me.position}
          onTileClick={(i) => setViewTile((v) => (v === i ? null : i))}
        >
          <CenterPanel
            game={game}
            me={me}
            tile={viewTile ?? me.position}
            viewing={viewTile !== null}
            dice={dice}
            diceColor={rollerColor}
            rollKey={actions}
          />
        </Board>

        <div className="btn-row action-bar">
          {main ? (
            <button type="button" className={`btn btn-grow ${main.tone}`} onClick={main.run}>
              {main.label}
            </button>
          ) : (
            <button type="button" className="btn btn-grow" disabled>
              {waitingText(game, me)}
            </button>
          )}
          <button type="button" className={`btn ${secondary.tone}`} onClick={secondary.run}>
            {secondary.label}
          </button>
        </div>

        <LogPanel game={game} />

        <div className="btn-row danger-row">
          <button
            type="button"
            className="btn btn-surrender"
            onClick={() => setManual('surrender')}
          >
            ⚠ ĐẦU HÀNG
          </button>
          <button type="button" className="btn btn-denvl" onClick={() => setManual('appearance')}>
            ĐEN VL
          </button>
        </div>
        <p className="hint hint-center">Đầu hàng cần xác nhận · Đen vl mở bảng đổi kí hiệu.</p>
      </div>

      {sheet}
      {error && (
        <div className="toast" role="alert">
          {error}
        </div>
      )}
    </main>
  );
}

/** Dòng mô tả ván đang chờ ai làm gì. */
export function waitingText(s: GameState, me: PlayerState): string {
  const pd = s.pending;
  switch (pd.type) {
    case 'roll':
      return `Chờ ${me.name} nhấn “Sục”`;
    case 'jail':
      return `${me.name} đang ở tù: thử đổ đôi, trả 50Đ hoặc dùng thẻ`;
    case 'jailRelease':
      return `${me.name} phải trả 50Đ hoặc dùng thẻ ra tù`;
    case 'buy':
      return `Chờ ${me.name} quyết định mua ${tileName(pd.tile)}`;
    case 'upgrade':
      return `Chờ ${me.name} quyết định ở ${tileName(pd.tile)}`;
    case 'metro':
      return `Chờ ${me.name} chọn ở lại hay đi Metro`;
    case 'pay':
      if (me.cash < pd.total) return `${me.name} thiếu tiền, đang xử lý nợ ${money(pd.total)}`;
      return pd.reason === 'tax' ? `Chờ ${me.name} nhấn “Là nó”` : `Chờ ${me.name} nhấn “Trả tiền”`;
    case 'chooseTile':
      return `Chờ ${me.name} chọn ô`;
    case 'ended':
      return 'Ván đã kết thúc';
  }
}

function PlayersBar({ game }: { game: GameState }) {
  const cur = game.players[game.current]!;
  const others = game.players.filter((p) => p.id !== cur.id);
  return (
    <section className="players" aria-label="Người chờ lượt">
      <p className="eyebrow">Người chờ lượt</p>
      <div className={`players-grid${others.length <= 2 ? ' is-wide' : ''}`}>
        {others.map((p) => {
          const c = colorOf(p.color);
          return (
            <div
              key={p.id}
              className={`player-chip${p.status !== 'active' ? ' is-out' : ''}`}
              style={{ borderColor: `color-mix(in srgb, ${c.main} 35%, #dfe5ee)` }}
            >
              <TokenIcon icon={p.icon} color={p.color} size={18} />
              <span className="player-chip-text">
                <span className="player-chip-top">
                  <b title={p.name}>{p.name}</b>
                  <span>{money(p.cash)}</span>
                </span>
                {/* "đất" như hình mẫu (gồm cả ga, nhà máy) để vừa 3 cột ở màn 360px */}
                <span className="player-chip-sub">
                  {assetCount(game, p.id)} đất · {p.heldCards.length} thẻ
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface CenterPanelProps {
  game: GameState;
  me: PlayerState;
  tile: number;
  viewing: boolean;
  dice: readonly number[] | null;
  diceColor: string;
  rollKey: number;
}

function tileDescription(game: GameState, i: number): string {
  const t = BOARD[i]!;
  const st = game.tiles[i];
  switch (t.kind) {
    case 'property':
    case 'station':
    case 'utility': {
      const owner = playerById(game, st?.owner);
      return owner ? `Chủ sở hữu: ${owner.name}` : `Chưa có chủ · giá ${money(t.price)}`;
    }
    case 'tax':
      return `Nộp ${money(t.amount)} cho Ngân hàng`;
    case 'chance':
      return 'Rút 1 thẻ Cơ Hội';
    case 'community':
      return 'Rút 1 thẻ Khí Vận';
    case 'go':
      return 'Qua hoặc dừng: nhận 200Đ';
    case 'jail':
      return 'Đi Metro (khi không bị giam) hoặc ở tù';
    case 'goToJail':
      return 'Vào tù, không nhận 200Đ';
    case 'parking':
      return 'Nghỉ chân, không có gì';
  }
}

/** Tiền người đang chờ sẽ còn nếu làm việc đang chờ (mua, nâng, trả). */
function cashAfter(game: GameState, me: PlayerState): number | null {
  const pd = game.pending;
  if (pd.type === 'pay' && pd.playerId === me.id) {
    const back = pd.creditors.find((c) => c.playerId === me.id)?.amount ?? 0;
    return me.cash - pd.total + back;
  }
  if (pd.type === 'buy') {
    const t = BOARD[pd.tile]!;
    return 'price' in t ? me.cash - t.price : null;
  }
  if (pd.type === 'upgrade') {
    const t = BOARD[pd.tile]!;
    const price = 'price' in t ? t.price : 0;
    const build = t.kind === 'property' ? t.upgradeCost : 0;
    const cost =
      pd.mode === 'build'
        ? build
        : pd.mode === 'redeemBuild'
          ? redeemCost(price) + build
          : redeemCost(price);
    return me.cash - cost;
  }
  return null;
}

/** Cấp nhà như hình mẫu: "2 / 4 nhà". */
function levelLabel(level: number): string {
  return level > 0 && level < HOTEL_LEVEL ? `${level} / 4 nhà` : levelText(level);
}

function CenterPanel({ game, me, tile, viewing, dice, diceColor, rollKey }: CenterPanelProps) {
  const t = BOARD[tile]!;
  const st = game.tiles[tile];
  const owner = playerById(game, st?.owner);
  const after = viewing ? null : cashAfter(game, me);
  const isTurn = game.players[game.current]?.id === me.id;
  const [rolling, setRolling] = useState(false);
  useEffect(() => {
    if (!game.events.some((e) => e.type === 'roll')) return;
    setRolling(true);
    const timer = setTimeout(() => setRolling(false), 650);
    return () => clearTimeout(timer);
  }, [rollKey, game.events]);

  return (
    <div className="center">
      <div className="center-turn">
        <TokenIcon icon={me.icon} color={me.color} size={30} blink />
        <div className="center-turn-main">
          <span className="center-turn-label">
            {isTurn ? `Lượt của ${me.name}` : `Đang chờ ${me.name}`}
          </span>
          <span className="center-turn-cash">{money(me.cash)}</span>
        </div>
        <div className="center-turn-side">
          <span>{assetCount(game, me.id)} tài sản</span>
          <span>{me.heldCards.length} thẻ</span>
        </div>
      </div>

      <div className="center-tile">
        <div className="center-tile-head">
          <span className="eyebrow">
            {viewing ? 'Ô đang xem · chạm lại để đóng' : 'Ô đang đứng'}
          </span>
          {dice && !viewing && (
            <Dice values={dice} color={diceColor} size={24} rolling={rolling} key={rollKey} />
          )}
        </div>
        <h2 className="center-tile-name">{t.name}</h2>
        <p
          className="center-tile-owner"
          style={owner ? { color: colorOf(owner.color).main } : undefined}
        >
          {tileDescription(game, tile)}
          {st?.mortgaged ? ' · đang cắm' : ''}
        </p>
        {owner && (
          <div className="center-info">
            <div>
              <span className="eyebrow">{t.kind === 'property' ? 'Cấp nhà' : 'Loại'}</span>
              <b>
                {t.kind === 'property'
                  ? levelLabel(st!.level)
                  : t.kind === 'station'
                    ? 'Ga tàu'
                    : 'Nhà máy'}
              </b>
            </div>
            <div className="right">
              <span className="eyebrow">Tiền thuê</span>
              <b>{rentText(game, tile)}</b>
            </div>
          </div>
        )}
        <div className="center-foot">
          {after !== null && (
            <div className="center-after">
              <span>Tiền của {me.name} sau giao dịch</span>
              <b>
                {money(me.cash)} <span aria-hidden="true">→</span>{' '}
                <span className={after < me.cash ? 'down' : 'up'}>
                  {after < 0 ? `thiếu ${money(-after)}` : money(after)}
                </span>
              </b>
            </div>
          )}
          <p className="center-wait">{waitingText(game, me)}</p>
        </div>
      </div>
    </div>
  );
}

function LogPanel({ game }: { game: GameState }) {
  const rows = game.log
    .filter((e) => e.amount !== undefined && e.amount !== 0)
    .slice(-LOG_VISIBLE_ENTRIES)
    .reverse();
  return (
    <section className="log" aria-label="Lịch sử giao dịch">
      <div className="log-head">
        <h2>Lịch sử giao dịch</h2>
        <span className="muted">{LOG_VISIBLE_ENTRIES} gần nhất · toàn bàn</span>
      </div>
      {rows.length === 0 && <p className="muted log-empty">Chưa có giao dịch nào.</p>}
      <ol>
        {rows.map((e, i) => {
          const p = playerById(game, e.playerId);
          const c = p ? colorOf(p.color) : null;
          return (
            <li key={`${e.turn}-${i}`} style={c ? { background: c.soft } : undefined}>
              {p && <TokenIcon icon={p.icon} color={p.color} size={18} />}
              <b style={c ? { color: c.main } : undefined}>{p?.name ?? 'Ngân hàng'}</b>
              <span className="log-text">{e.text}</span>
              <span className={`log-amount ${e.amount! > 0 ? 'up' : 'down'}`}>
                {signed(e.amount!)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
