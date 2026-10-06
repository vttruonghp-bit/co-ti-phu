import { scriptedRng, seededRng, type GameState } from '@cotiphu/shared';
import { act, at, mid, own, roll, sample, top, who } from './helpers';

/*
 * Bàn mẫu (dev/helpers.ts sample): Linh p1, Minh p2, An p3, Vy p4, Huy p5, Nam p6;
 * tiền 480 / 220 / 360 / 270 / 400 / 310. Cơ Hội ở ô 07, 22, 36; Khí Vận ở ô 02, 17, 33.
 * Linh từ ô 03 đổ 1 + 3 tới Cơ Hội 07; từ ô 14 đổ 1 + 2 tới Khí Vận 17.
 */

/** Linh rút thẻ Cơ Hội `card` ở ô 07; `dice` là xúc xắc thẻ tự gieo (nếu có). */
const chance = (s: GameState, card: string, ...dice: number[]) =>
  roll(top(at(s, 3), card), 1, 3, ...dice);

/** Linh rút thẻ Khí Vận `card` ở ô 17. */
const community = (s: GameState, card: string, ...dice: number[]) =>
  roll(top(at(s, 14), card), 1, 2, ...dice);

/** Minh giữ sẵn thẻ Kẻ khóc người cười. */
function minhMirror(s: GameState): GameState {
  s.players[1]!.heldCards.push({ cardId: 'community-fortune-mirror', kind: 'fortuneMirror' });
  s.decks.community = s.decks.community.filter((c) => c !== 'community-fortune-mirror');
  return s;
}

/**
 * Linh đứng ở Metro ô 10 (không ở tù), thẻ `card` nằm trên cùng. Chọn một ô Cơ Hội / Khí Vận rồi
 * bấm "Đi Metro" để rút thẻ bằng thao tác thật: màn thẻ có trạng thái trước nên hiện đủ tiền của
 * người nhận (nạp tình huống trực tiếp thì chỉ có nhật ký, không thấy tiền người nhận).
 */
function metro(s: GameState, card: string): GameState {
  Object.assign(s.players[0]!, { position: 10, inJail: false });
  s.rolled = true;
  s.pending = { type: 'metro', playerId: 'p1' };
  return top(s, card);
}

/** Tình huống cho màn thẻ Cơ Hội / Khí Vận, Đầu hàng và Ván kết thúc. */
export const CARD_SCENARIOS: Record<string, () => GameState> = {
  // --- Cơ Hội ---
  // Xổ số ra 3: nhận 150Đ.
  'cards-lottery': () => chance(sample(), 'chance-lottery', 3),
  // Tàu bay từ ô 36: viên 6 tiến qua Xuất phát (+200Đ) tới ô 02, viên 5 lùi về Tháp Chăm 37.
  'cards-fly': () => roll(top(at(sample(), 33), 'chance-fly-dice'), 1, 2, 6, 5),
  // Đất gần nhất là Nhà Hát (Minh, 1 nhà): gieo 3 + 4, phải bấm Trả tiền 70Đ.
  'cards-nearest-rent': () => chance(own(sample(), 'p2', 8, 1), 'chance-nearest-property', 3, 4),
  // Đất gần nhất từ ô 22 là Cung Đình (vô chủ): bắt buộc mua 220Đ.
  'cards-nearest-buy': () => roll(top(at(sample(), 18), 'chance-nearest-property'), 1, 3),
  // Cháy nhà: 7 + 5 + 11 + 4 + 11 + 9 = 47 ô từ ô 07 tới Văn Miếu 14 (Huy, 3 nhà) → 2 nhà.
  'cards-fire': () => chance(sample(), 'chance-neighbor-fire', 3, 4, 2, 3, 6, 5, 1, 3, 5, 6, 4, 5),
  // Cháy nhà trượt: 37 ô tới ô thuế 04.
  'cards-fire-miss': () =>
    chance(sample(), 'chance-neighbor-fire', 3, 4, 2, 2, 3, 2, 1, 5, 4, 3, 6, 2),
  // Canh bạc: Linh 4 đất màu > trung bình 10/6 → chọn đất bị hạ cấp.
  'cards-gamble-down': () => chance(sample(), 'chance-building-gamble'),
  // Canh bạc: Linh chỉ còn Đồng Xuân (1 < 7/6) → chọn đất được nâng.
  'cards-gamble-up': () => {
    const s = sample();
    for (const t of [16, 21, 26]) own(s, null, t);
    return chance(s, 'chance-building-gamble');
  },
  // Diễn kịch giỏi: nhận 50Đ.
  'cards-acting': () => chance(sample(), 'chance-acting'),
  // Hỏng đường ray: Linh có 1 ga đang hoạt động, trả 25Đ.
  'cards-railway': () => chance(sample(), 'chance-railway-repair'),
  // Trả tiền điện: 2 nhà + 1 khách sạn = 150Đ; Nam giữ Nhà Máy Điện nhận 20% (30Đ).
  'cards-electricity': () => chance(own(sample(), 'p6', 12), 'chance-electricity'),
  // Về điểm xuất phát: +200Đ.
  'cards-go': () => chance(sample(), 'chance-go'),
  // Vào tù là rõ (Cơ Hội).
  'cards-jail': () => chance(sample(), 'chance-jail'),
  // Đi đến Phú Quốc (Vy, 1 nhà): đến nơi phải trả thuê.
  'cards-phu-quoc': () => chance(sample(), 'chance-phu-quoc'),
  // Người thủ đô khi Linh không có Phố Cổ: không có tác dụng.
  'cards-capital': () => chance(sample(), 'chance-capital-citizen'),
  // Nhảy lò cò từ ô 36 lùi về Khí Vận 33, rút tiếp Chuyển nhầm tài khoản (2 thẻ một lần đi).
  'cards-hopscotch-chain': () => {
    const s = top(top(at(sample(), 33), 'chance-hopscotch'), 'community-wrong-transfer');
    return roll(s, 1, 2);
  },

  // --- Khí Vận ---
  // Mừng sinh nhật: mỗi người trả Linh 10Đ.
  'cards-birthday': () => community(sample(), 'community-birthday'),
  // Bầu tổng thống: Linh trả mỗi người 30Đ.
  'cards-election': () => community(sample(), 'community-election'),
  // Chuyển nhầm tài khoản: trả 100Đ.
  'cards-wrong-transfer': () => community(sample(), 'community-wrong-transfer'),
  // Chuyển nhầm tài khoản khi Linh chỉ có 60Đ: vào Xử lý nợ sau khi xem thẻ.
  'cards-wrong-transfer-debt': () => community(at(sample(), 14, 60), 'community-wrong-transfer'),
  // Nhặt được của rơi: +200Đ.
  'cards-found-money': () => community(sample(), 'community-found-money'),
  // Ủng hộ người nghèo: Minh ít tiền nhất, Linh trả Minh 50Đ.
  'cards-help-poor': () => community(sample(), 'community-help-the-poor'),
  // Lật ngược tình thế với 80Đ: +400Đ.
  'cards-turnaround': () => community(at(sample(), 14, 80), 'community-turnaround'),
  // Thẻ ra tù miễn phí: giữ lại.
  'cards-jail-free': () => community(sample(), 'community-jail-free'),
  // Tái cơ cấu: (480 + 220 + 360 + 270 + 400 + 310) ÷ 6 = 340, Linh 480Đ → 340Đ.
  'cards-restructure': () => community(sample(), 'community-bank-restructure'),
  // Tái cơ cấu khi Linh có 100Đ (+176Đ); Minh giữ Kẻ khóc người cười nên trả Linh 40Đ.
  'cards-restructure-mirror': () =>
    community(minhMirror(at(sample(), 14, 100)), 'community-bank-restructure'),
  // Thằng Bờm: viên 1 = 1 (Minh), viên 2 = 4 → đổi Đồng Xuân lấy Phố Cổ.
  'cards-swap': () => community(sample(), 'community-swap', 1, 4),
  // Thằng Bờm: viên 1 ra 6 gieo lại, ra 5 (Nam); viên 2 = 3 → lấy Nhà Máy Nước của Nam.
  'cards-swap-odd': () => community(sample(), 'community-swap', 6, 5, 3),
  // Thằng Bờm: viên 1 = 3 (Vy), viên 2 = 5 nhưng Vy không có ga/nhà máy → Vy trả Linh 100Đ.
  'cards-swap-penalty': () => community(sample(), 'community-swap', 3, 5),
  // Mở đường cao tốc: xem thẻ rồi chọn đất.
  'cards-highway': () => community(sample(), 'community-highway'),
  // Cao tốc đã chọn Hội An, gieo 2 → tiến 20 ô tới ô thuế 04 (giống hình 3).
  'cards-highway-roll': () => {
    const s = community(sample(), 'community-highway');
    return act(s, { type: 'chooseTile', playerId: who(s), tile: 24 }, scriptedRng([2]));
  },
  // Cao tốc từ Cung Đình gieo 1 → Khí Vận 33, rút tiếp Nhặt được của rơi.
  'cards-highway-chain': () => {
    const s = top(community(sample(), 'community-highway'), 'community-found-money');
    return act(s, { type: 'chooseTile', playerId: who(s), tile: 23 }, scriptedRng([1]));
  },

  // --- Rút bằng Metro (chọn ô 17 Khí Vận hoặc 07 Cơ Hội, bấm Đi Metro) ---
  'cards-live-birthday': () => metro(sample(), 'community-birthday'),
  'cards-live-election': () => metro(sample(), 'community-election'),
  // Minh giữ Kẻ khóc người cười: Linh nhặt được 200Đ thì Minh trả Linh 40Đ.
  'cards-live-mirror': () => metro(minhMirror(sample()), 'community-found-money'),
  // Nam giữ Nhà Máy Điện: nhận 20% tiền điện Linh trả.
  'cards-live-electricity': () => metro(own(sample(), 'p6', 12), 'chance-electricity'),

  // --- Đầu hàng và kết thúc ---
  // Giữa ván, đầu lượt: bấm ⚠ ĐẦU HÀNG.
  'cards-surrender': () => mid(),
  // Đang chờ trả thuê Hội An: đầu hàng bị khóa.
  'cards-surrender-blocked': () => roll(at(sample(), 20), 1, 3),
  // Linh 480Đ dừng Bitexco khách sạn của Minh (thuê 1400Đ), thanh lý hết vẫn thiếu: phá sản.
  'cards-ended-bankrupt': () => roll(at(sample(), 31), 1, 2),
  // Linh rút Mừng sinh nhật, An chỉ có 5Đ và không có tài sản: An phá sản.
  'cards-ended-card': () => {
    const s = sample();
    s.players[2]!.cash = 5;
    for (const t of [9, 15]) own(s, null, t);
    return community(s, 'community-birthday');
  },
  // Giữa ván, người đang tới lượt đầu hàng.
  'cards-ended-surrender': () => {
    const s = mid();
    return act(s, { type: 'surrender', playerId: who(s) }, seededRng(1));
  },
};
