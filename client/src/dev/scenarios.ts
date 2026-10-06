/**
 * Tình huống dựng sẵn để xem nhanh từng màn khi phát triển: mở `/?scenario=<tên>`.
 * Chỉ nạp ở chế độ dev, không vào bản build. Mỗi nhóm màn thêm tình huống ở file riêng.
 */
import { seededRng, type GameState } from '@cotiphu/shared';
import { act, at, fresh, mid, roll, sample, top } from './helpers';
import { BOARD_SCENARIOS } from './scenarios-board';
import { CARD_SCENARIOS } from './scenarios-cards';
import { MANAGE_SCENARIOS } from './scenarios-manage';
import { MOVE_SCENARIOS } from './scenarios-moves';
import { QA_SCENARIOS } from './scenarios-qa';
import { SETUP_SCENARIOS } from './scenarios-setup';
import { TEST_CHANCE_SCENARIOS } from './scenarios-test-chance';
import { TEST_COMMUNITY_SCENARIOS } from './scenarios-test-community';
import { TEST_TILES_SCENARIOS } from './scenarios-test-tiles';

const BASE: Record<string, () => GameState> = {
  start: () => fresh(6),
  start2: () => fresh(2),
  mid,
  sample,
  // Dừng ở đất người khác: Linh từ ô 20 đổ 1+3 tới Hội An (Minh, 2 nhà, thuê 300Đ).
  rent: () => roll(at(sample(), 20), 1, 3),
  // Dừng ô thuế 04.
  tax: () => roll(at(sample(), 0), 1, 3),
  // Đất vô chủ: Linh đổ 3+4 từ ô 0... tới ô 07 là Cơ Hội nên dùng 2+4 tới Bưu Điện (06).
  buy: () => roll(at(sample(), 0), 2, 4),
  // Đất của mình: Hạ Long 2 nhà (Linh) từ ô 13 đổ 1+2.
  upgrade: () => {
    const s = roll(at(sample(), 13), 1, 2);
    return s;
  },
  // Đất của mình đang cắm: Cầu Rồng.
  redeem: () => roll(at(sample(), 19), 1, 1, 1, 1),
  // Metro: tới ô 10 khi không bị giam.
  metro: () => roll(at(sample(), 4), 2, 4),
  // Đang ở tù, đã thử 1 lần, có thẻ ra tù.
  jail: () => {
    const s = sample();
    const p = s.players[0]!;
    Object.assign(p, { position: 10, inJail: true, jailAttempts: 1, cash: 180 });
    p.heldCards.push({ cardId: 'community-jail-free', kind: 'jailFree' });
    s.decks.community = s.decks.community.filter((c) => c !== 'community-jail-free');
    s.pending = { type: 'jail', playerId: 'p1' };
    return s;
  },
  // Ụp/Mở ở đầu lượt.
  manage: () => sample(),
  // Xử lý nợ: Linh 180Đ tới Bitexco khách sạn của Minh (thuê 1400Đ) — quá lớn; dùng Hội An 300Đ.
  debt: () => roll(at(sample(), 20, 180), 1, 3),
  // Thẻ Khí Vận Mở đường cao tốc: từ ô 15 đổ 1+1 tới ô 17.
  highway: () => roll(top(at(sample(), 15), 'community-highway'), 1, 1),
  // Thẻ Cơ Hội Canh bạc xây dựng (Linh nhiều đất hơn trung bình → hạ cấp).
  gamble: () => roll(top(at(sample(), 3), 'chance-building-gamble'), 1, 3),
  // Thẻ Khí Vận Thằng Bờm: viên 1 ra 1 (Minh), viên 2 ra 4 (đổi đất rẻ nhất).
  swap: () => roll(top(at(sample(), 15), 'community-swap'), 1, 1, 1, 4),
  // Thẻ Cơ Hội Cháy nhà hàng xóm.
  fire: () =>
    roll(top(at(sample(), 3), 'chance-neighbor-fire'), 1, 3, 3, 4, 2, 2, 3, 2, 1, 5, 4, 3, 6, 2),
  // Thẻ Khí Vận Ngân hàng tái cơ cấu.
  restructure: () => roll(top(at(sample(), 15), 'community-bank-restructure'), 1, 1),
  // Thẻ Khí Vận Mừng sinh nhật (mọi người trả 10Đ).
  birthday: () => roll(top(at(sample(), 15), 'community-birthday'), 1, 1),
  // Thẻ Cơ Hội Xổ số.
  lottery: () => roll(top(at(sample(), 3), 'chance-lottery'), 1, 3, 6),
  // Ván kết thúc: Vy đầu hàng.
  ended: () => act(sample(), { type: 'surrender', playerId: 'p4' }, seededRng(1)),
};

export const SCENARIOS: Record<string, () => GameState> = {
  ...BASE,
  ...SETUP_SCENARIOS,
  ...BOARD_SCENARIOS,
  ...TEST_CHANCE_SCENARIOS,
  ...TEST_COMMUNITY_SCENARIOS,
  ...TEST_TILES_SCENARIOS,
  ...MANAGE_SCENARIOS,
  ...MOVE_SCENARIOS,
  ...CARD_SCENARIOS,
  ...QA_SCENARIOS,
};
