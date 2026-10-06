import type { GameState } from '@cotiphu/shared';
import { at, own, roll, sample, top } from './helpers';

/** Linh (p1) đang ở tù ô 10 với `attempts` lần đã thử, `cash` tiền, có hoặc không có thẻ ra tù. */
function jailed(attempts: number, cash: number, card: boolean): GameState {
  const s = sample();
  const p = s.players[0]!;
  Object.assign(p, { position: 10, inJail: true, jailAttempts: attempts, cash });
  if (card) {
    p.heldCards.push({ cardId: 'community-jail-free', kind: 'jailFree' });
    s.decks.community = s.decks.community.filter((c) => c !== 'community-jail-free');
  }
  s.pending = { type: 'jail', playerId: 'p1' };
  return s;
}

/** Linh còn 3 đất màu (1 đang cắm), ít hơn trung bình 20/6 của cả bàn: Canh bạc được nâng. */
function fewLands(): GameState {
  const s = sample();
  own(s, 'p2', 26, 5);
  own(s, 'p2', 6);
  own(s, 'p2', 8);
  own(s, 'p3', 11);
  own(s, 'p3', 13, 1);
  own(s, 'p4', 31);
  own(s, 'p4', 37, 2);
  own(s, 'p5', 18);
  own(s, 'p5', 19, 1);
  own(s, 'p6', 23);
  own(s, 'p6', 27);
  return s;
}

/** Tình huống cho màn Metro, Ở tù, chọn ô Cao tốc / Canh bạc. */
export const MOVE_SCENARIOS: Record<string, () => GameState> = {
  // Metro: Linh 480Đ từ ô 04 đổ 2+4 tới ô 10 (không bị giam).
  'moves-metro': () => roll(at(sample(), 4), 2, 4),
  // Metro khi tiền lẻ: 75Đ, phí làm tròn xuống 37Đ, nhiều ô thuê lớn hơn số tiền còn lại.
  'moves-metro-poor': () => roll(at(sample(), 4, 75), 2, 4),
  // Ở tù lần thử đầu, 180Đ, có thẻ ra tù.
  'moves-jail': () => jailed(0, 180, true),
  // Nam vừa đổ 3+5 tới Bãi đỗ xe, tới lượt Linh đang ở tù: màn tù hiện xúc xắc vừa rồi của Nam.
  'moves-jail-after-roll': () => {
    const s = jailed(1, 180, false);
    Object.assign(s, { current: 5, pending: { type: 'roll', playerId: 'p6' } });
    s.players[5]!.position = 12;
    return roll(s, 3, 5);
  },
  // Lần thử thứ 3, chỉ có 30Đ và không có thẻ: không trả 50Đ được, mở Ụp/Mở để lấy tiền.
  'moves-jail-third': () => jailed(2, 30, false),
  // Lần thử thứ 3 không ra đôi (2+5) mà có thẻ: phải trả 50Đ hoặc dùng thẻ rồi đi 7 ô.
  'moves-jail-release': () => roll(jailed(2, 180, true), 2, 5),
  // Như trên nhưng chỉ có 30Đ: chỉ còn cách dùng thẻ.
  'moves-jail-release-poor': () => roll(jailed(2, 30, true), 3, 5),
  // Khí Vận Mở đường cao tốc: Linh từ ô 14 đổ 1+2 tới Khí Vận 17.
  'moves-highway': () => roll(top(at(sample(), 14), 'community-highway'), 1, 2),
  // Canh bạc xây dựng, Linh ít đất hơn trung bình: nâng miễn phí (đất cắm Cầu Rồng bị loại).
  'moves-gamble-up': () => roll(top(at(fewLands(), 3), 'chance-building-gamble'), 1, 3),
  // Canh bạc xây dựng, Linh nhiều đất hơn trung bình: hạ 1 cấp đất có công trình.
  'moves-gamble-down': () => roll(top(at(sample(), 3), 'chance-building-gamble'), 1, 3),
};
