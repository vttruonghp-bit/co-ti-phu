/** Tình huống kiểm thử từng ô / từng lá thẻ (mở `/?scenario=test-chance-...`). */
import type { GameState, KeepableCard } from '@cotiphu/shared';
import { at, own, roll, sample, top } from './helpers';

/*
 * Bàn mẫu (dev/helpers.ts sample): Linh p1 480Đ, Minh p2 220Đ, An p3 360Đ, Vy p4 270Đ, Huy p5 400Đ,
 * Nam p6 310Đ.
 * Linh: Đồng Xuân 03, Ga Hà Nội 05, Nhà Máy Điện 12 (cắm), Hạ Long 16 (2 nhà), Cầu Rồng 21 (cắm),
 *       Dinh Độc Lập 26 (khách sạn).
 * Minh: Phố Cổ 01, Hội An 24 (2 nhà), Bitexco 34 (khách sạn). An: Tháp Rùa 09 (3 nhà), Ga Vinh 15.
 * Vy: Phú Quốc 39 (1 nhà). Huy: Văn Miếu 14 (3 nhà). Nam: Nhà Máy Nước 28.
 * Các ô khác vô chủ. Các tình huống đã có sẵn ở scenarios-cards.ts (cards-*) không lặp lại ở đây.
 */

/** Linh đổ 1 + 3 tới ô Cơ Hội `tile` và rút `card`; `dice` là xúc xắc thẻ tự gieo (nếu có). */
const draw = (s: GameState, card: string, tile: 7 | 22 | 36, ...dice: number[]) =>
  roll(top(at(s, tile - 4), card), 1, 3, ...dice);

/** Đặt tiền mặt của người chơi thứ `i` (0 = Linh). */
function cash(s: GameState, amount: number, i = 0): GameState {
  s.players[i]!.cash = amount;
  return s;
}

/** Người chơi thứ `i` giữ sẵn thẻ `cardId` (đã lấy khỏi chồng). */
function hold(s: GameState, cardId: string, kind: KeepableCard, i = 0): GameState {
  s.players[i]!.heldCards.push({ cardId, kind });
  const deck = cardId.startsWith('chance-') ? 'chance' : 'community';
  s.decks[deck] = s.decks[deck].filter((c) => c !== cardId);
  return s;
}

/**
 * Linh đứng ở Metro ô 10 (không ở tù), `card` nằm trên cùng: chọn ô Cơ Hội rồi bấm "Đi Metro" để
 * rút bằng thao tác thật (màn thẻ có trạng thái trước, giống khi chơi thật).
 */
function metro(s: GameState, card: string): GameState {
  Object.assign(s.players[0]!, { position: 10, inJail: false });
  s.rolled = true;
  s.pending = { type: 'metro', playerId: 'p1' };
  return top(s, card);
}

export const TEST_CHANCE_SCENARIOS: Record<string, () => GameState> = {
  // --- 01 Đi đến Ga Sài Gòn ---
  // Từ ô 07 tới Ga Sài Gòn vô chủ, không qua Xuất phát: mời mua 200Đ.
  'test-chance-saigon-buy': () => draw(sample(), 'chance-ga-sai-gon', 7),
  // Từ ô 36 tiến vòng qua Xuất phát (+200Đ) tới Ga Sài Gòn của An (An có 2 ga: thuê 50Đ).
  'test-chance-saigon-go-rent': () => draw(own(sample(), 'p3', 35), 'chance-ga-sai-gon', 36),

  // --- 02 Đi đến Phú Quốc (cards-phu-quoc: Vy 1 nhà, thuê 200Đ) ---
  // Linh chỉ có 100Đ: thiếu tiền thuê 200Đ, vào Xử lý nợ.
  'test-chance-phuquoc-debt': () => draw(cash(sample(), 100), 'chance-phu-quoc', 7),
  // Phú Quốc vô chủ: mời mua 400Đ (bấm Không mua).
  'test-chance-phuquoc-buy': () => draw(own(sample(), null, 39), 'chance-phu-quoc', 7),
  // Phú Quốc của Linh (1 nhà): được nâng lên 2 nhà (200Đ).
  'test-chance-phuquoc-upgrade': () => draw(own(sample(), 'p1', 39, 1), 'chance-phu-quoc', 7),
  // Phú Quốc của Vy có khách sạn (thuê 2000Đ): Linh bán hết vẫn thiếu, phá sản sau màn thẻ.
  'test-chance-phuquoc-bankrupt': () => draw(own(sample(), 'p4', 39, 5), 'chance-phu-quoc', 7),

  // --- 03 Đất gần nhất (cards-nearest-rent, cards-nearest-buy) ---
  // Nhà Hát của Linh (1 nhà): 0Đ, vẫn được nâng cấp như bình thường.
  'test-chance-nearest-own': () => draw(own(sample(), 'p1', 8, 1), 'chance-nearest-property', 7),
  // Nhà Hát của Minh đang cắm: 0Đ, không gieo.
  'test-chance-nearest-mortgaged': () =>
    draw(own(sample(), 'p2', 8, 0, true), 'chance-nearest-property', 7),
  // Bắt buộc mua Cung Đình 220Đ khi Linh chỉ có 100Đ: Xử lý nợ với Ngân hàng.
  'test-chance-nearest-buy-debt': () => draw(cash(sample(), 100), 'chance-nearest-property', 22),
  // Nhà Hát của chính Linh đang cắm: được chuộc + xây 1 nhà (55Đ + 50Đ).
  'test-chance-nearest-own-mortgaged': () =>
    draw(own(sample(), 'p1', 8, 0, true), 'chance-nearest-property', 7),
  // Linh giữ Miễn thuế nhà đất nhưng khoản 10 × xúc xắc vẫn phải trả (gieo 2 + 3 → 50Đ), giữ thẻ.
  'test-chance-nearest-waiver': () =>
    draw(
      hold(own(sample(), 'p2', 8, 1), 'chance-rent-waiver', 'rentWaiver'),
      'chance-nearest-property',
      7,
      2,
      3,
    ),

  // --- 04 Đi đến Bưu Điện Hà Nội ---
  // Từ ô 07 vòng qua Xuất phát (+200Đ) tới Bưu Điện vô chủ: mời mua 100Đ.
  'test-chance-buudien': () => draw(sample(), 'chance-buu-dien', 7),

  // --- 05 Tàu bay xúc xắc (cards-fly) ---
  // Từ ô 07: viên 3 lùi tới thuế 04 (không xử lý), viên 4 tiến tới Nhà Hát 08 vô chủ.
  'test-chance-fly-last-only': () => draw(sample(), 'chance-fly-dice', 7, 3, 4),
  // Từ ô 36: viên 4 dừng đúng ô 00 (+200Đ), viên 2 tới Khí Vận 02, rút tiếp Thần tài ban lộc (+100Đ).
  'test-chance-fly-chain': () =>
    draw(top(sample(), 'community-god-of-wealth'), 'chance-fly-dice', 36, 4, 2),

  // --- 06 Trả tiền điện (cards-electricity, cards-live-electricity) ---
  // Linh là chủ Nhà Máy Điện đang hoạt động: 150Đ, phần 20% không phải trả, trả Ngân hàng 120Đ.
  'test-chance-electricity-own': () => draw(own(sample(), 'p1', 12), 'chance-electricity', 7),
  // Nhà Máy Điện của Linh đang cắm: trả hết 150Đ cho Ngân hàng.
  'test-chance-electricity-mortgaged': () => draw(sample(), 'chance-electricity', 7),
  // Nam giữ Nhà Máy Điện, Linh chỉ có 100Đ: nợ 150Đ (Nam 30Đ, Ngân hàng 120Đ).
  'test-chance-electricity-debt': () =>
    draw(cash(own(sample(), 'p6', 12), 100), 'chance-electricity', 7),

  // --- 07 Về điểm xuất phát (cards-go) ---
  // Từ ô 36 tới ô 00: nhận đúng 200Đ một lần.
  'test-chance-go-36': () => draw(sample(), 'chance-go', 36),

  // --- 08 Miễn thuế nhà đất ---
  // Rút: giữ thẻ.
  'test-chance-waiver-draw': () => draw(sample(), 'chance-rent-waiver', 7),
  // Đang giữ thẻ, đổ 1 + 3 từ ô 20 tới Hội An của Minh (2 nhà, 300Đ): tự dùng thẻ, không trả.
  'test-chance-waiver-use': () =>
    roll(at(hold(sample(), 'chance-rent-waiver', 'rentWaiver'), 20), 1, 3),
  // Đang giữ thẻ, tới ô thuế 04: thẻ không dùng cho thuế, vẫn bấm Là nó 200Đ.
  'test-chance-waiver-tax': () =>
    roll(at(hold(sample(), 'chance-rent-waiver', 'rentWaiver'), 0), 1, 3),
  // Đang giữ thẻ, tới Ga Vinh của An: không dùng cho ga, trả 25Đ.
  'test-chance-waiver-station': () =>
    roll(at(hold(sample(), 'chance-rent-waiver', 'rentWaiver'), 11), 1, 3),

  // --- 09 Xổ số kiến thiết (cards-lottery: ra 3 → 150Đ) ---
  'test-chance-lottery-1': () => draw(sample(), 'chance-lottery', 7, 1),
  'test-chance-lottery-5': () => draw(sample(), 'chance-lottery', 7, 5),

  // --- 10 Đến ga gần nhất ---
  // Từ ô 07 tới Ga Vinh của An: gieo 2 + 5, bấm Trả tiền 70Đ.
  'test-chance-station-rent': () => draw(sample(), 'chance-nearest-station', 7, 2, 5),
  // Từ ô 36 qua Xuất phát (không nhận 200Đ) tới Ga Hà Nội vô chủ: bắt buộc mua 200Đ.
  'test-chance-station-buy': () => draw(own(sample(), null, 5), 'chance-nearest-station', 36),
  // Từ ô 36 tới Ga Hà Nội của chính Linh: không trả gì, không nhận 200Đ.
  'test-chance-station-own': () => draw(sample(), 'chance-nearest-station', 36),

  // --- 11 Hỏng đường ray (cards-railway: 1 ga → 25Đ) ---
  // Linh có 4 ga, Ga Sài Gòn đang cắm: 3 ga hoạt động → 100Đ.
  'test-chance-railway-3': () => {
    const s = sample();
    own(s, 'p1', 15);
    own(s, 'p1', 25);
    own(s, 'p1', 35, 0, true);
    return draw(s, 'chance-railway-repair', 7);
  },
  // Linh không có ga: không trả gì.
  'test-chance-railway-0': () => draw(own(sample(), null, 5), 'chance-railway-repair', 7),

  // --- 12 Đi đến Tháp Rùa ---
  // Từ ô 07 tới Tháp Rùa của An (3 nhà): bấm Trả tiền 300Đ.
  'test-chance-thaprua': () => draw(sample(), 'chance-thap-rua', 7),
  // Từ ô 36 qua Xuất phát (+200Đ) rồi trả An 300Đ.
  'test-chance-thaprua-go': () => draw(sample(), 'chance-thap-rua', 36),

  // --- 13 Diễn kịch giỏi (cards-acting) ---
  // Minh giữ Kẻ khóc người cười: Linh nhận 50Đ thì Minh trả Linh 40Đ.
  'test-chance-acting-mirror': () =>
    draw(hold(sample(), 'community-fortune-mirror', 'fortuneMirror', 1), 'chance-acting', 7),

  // --- 14 Nhảy lò cò (cards-hopscotch-chain) ---
  // Từ ô 07 lùi về thuế 04: bấm Là nó 200Đ.
  'test-chance-hopscotch-tax': () => draw(sample(), 'chance-hopscotch', 7),
  // Từ ô 22 lùi về Tràng An vô chủ: mời mua 200Đ.
  'test-chance-hopscotch-buy': () => draw(sample(), 'chance-hopscotch', 22),

  // --- 15 Vào tù là rõ (cards-jail) ---
  // Linh đổ đôi 2 + 2 tới Cơ Hội rồi vào tù: mất lượt thêm, tới lượt Minh.
  'test-chance-jail-double': () => roll(top(at(sample(), 3), 'chance-jail'), 2, 2),
  // So sánh: đổ đôi 2 + 2 tới Cơ Hội, rút Diễn kịch giỏi: vẫn được đổ thêm.
  'test-chance-double-extra': () => roll(top(at(sample(), 3), 'chance-acting'), 2, 2),

  // --- 16 Đi đến Landmark 81 ---
  // Từ ô 07 tới Landmark 81 vô chủ: mời mua 300Đ.
  'test-chance-landmark-buy': () => draw(sample(), 'chance-landmark', 7),
  // Landmark 81 của Linh (1 nhà), từ ô 36 qua Xuất phát (+200Đ): được nâng lên 2 nhà 200Đ.
  'test-chance-landmark-upgrade': () => draw(own(sample(), 'p1', 32, 1), 'chance-landmark', 36),

  // --- 17 Người thủ đô (cards-capital: không có Phố Cổ) ---
  // Linh sở hữu Phố Cổ: giữ quyền miễn một lần thuế.
  'test-chance-capital-keep': () => draw(own(sample(), 'p1', 1), 'chance-capital-citizen', 7),
  // Đang giữ quyền, Phố Cổ đang cắm: đổ 1 + 3 từ ô 34 tới Thuế Lợi Tức 38, tự miễn.
  'test-chance-capital-use': () =>
    roll(
      at(hold(own(sample(), 'p1', 1, 0, true), 'chance-capital-citizen', 'taxWaiver'), 34),
      1,
      3,
    ),
  // Đang giữ quyền, đầu lượt: bán Phố Cổ ở Ụp/Mở thì quyền hết hiệu lực.
  'test-chance-capital-expire': () =>
    hold(own(sample(), 'p1', 1), 'chance-capital-citizen', 'taxWaiver'),

  // --- 18 Canh bạc xây dựng (cards-gamble-down, cards-gamble-up) ---
  // Linh 2 đất màu = trung bình 12 ÷ 6: không đổi.
  'test-chance-gamble-equal': () => {
    const s = sample();
    own(s, null, 3);
    own(s, null, 21);
    for (const t of [6, 8, 11, 13]) own(s, 'p6', t);
    return draw(s, 'chance-building-gamble', 7);
  },
  // Linh 4 đất màu > trung bình nhưng không có công trình: không có ô hợp lệ, không đổi.
  'test-chance-gamble-none': () => {
    const s = sample();
    own(s, 'p1', 16);
    own(s, 'p1', 26);
    return draw(s, 'chance-building-gamble', 7);
  },

  // --- 19 Cháy nhà hàng xóm (cards-fire, cards-fire-miss) ---
  // 9 + 2 × 5 = 19 ô từ ô 07 tới Dinh Độc Lập của chính Linh (khách sạn → 4 nhà).
  'test-chance-fire-own': () =>
    draw(sample(), 'chance-neighbor-fire', 7, 4, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
  // 34 ô từ ô 07 tới Phố Cổ của Minh (đất trống): không có tác dụng.
  'test-chance-fire-empty': () =>
    draw(sample(), 'chance-neighbor-fire', 7, 6, 6, 6, 6, 2, 2, 1, 1, 1, 1, 1, 1),

  // --- Rút bằng Metro (chọn ô Cơ Hội, bấm Đi Metro): màn thẻ có trạng thái trước như khi chơi ---
  // Chọn ô 36: Tháp Rùa qua Xuất phát (+200Đ) rồi trả An 300Đ.
  'test-chance-live-thaprua': () => metro(sample(), 'chance-thap-rua'),
  // Chọn ô 07: Hỏng đường ray 25Đ.
  'test-chance-live-railway': () => metro(sample(), 'chance-railway-repair'),
  // Chọn ô 22: Đất gần nhất là Cung Đình vô chủ, bắt buộc mua 220Đ.
  'test-chance-live-nearest-buy': () => metro(sample(), 'chance-nearest-property'),
  // Chọn ô 07: Diễn kịch giỏi khi Minh giữ Kẻ khóc người cười.
  'test-chance-live-mirror': () =>
    metro(hold(sample(), 'community-fortune-mirror', 'fortuneMirror', 1), 'chance-acting'),
};
