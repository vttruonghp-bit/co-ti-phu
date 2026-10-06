/** Tình huống kiểm thử từng ô / từng lá thẻ (mở `/?scenario=test-tiles-...`). */
import { scriptedRng, type GameState, type KeepableCard } from '@cotiphu/shared';
import { act, at, own, roll, sample, top, who } from './helpers';

/*
 * Bàn mẫu (dev/helpers.ts sample): Linh p1 480Đ, Minh p2 220Đ, An p3 360Đ, Vy p4 270Đ, Huy p5 400Đ,
 * Nam p6 310Đ.
 * Linh: Đồng Xuân 03, Ga Hà Nội 05, Nhà Máy Điện 12 (cắm), Hạ Long 16 (2 nhà), Cầu Rồng 21 (cắm),
 *       Dinh Độc Lập 26 (khách sạn).
 * Minh: Phố Cổ 01, Hội An 24 (2 nhà), Bitexco 34 (khách sạn). An: Tháp Rùa 09 (3 nhà), Ga Vinh 15.
 * Vy: Phú Quốc 39 (1 nhà). Huy: Văn Miếu 14 (3 nhà). Nam: Nhà Máy Nước 28.
 * Tình huống đã có sẵn và dùng lại nguyên tên: tax, buy, rent, upgrade, moves-metro, moves-metro-poor,
 * moves-jail, moves-jail-release, moves-jail-release-poor, manage-debt, cards-ended-bankrupt,
 * test-chance-capital-use.
 */

/** Linh giữ sẵn thẻ `cardId` (đã lấy khỏi chồng). */
function hold(s: GameState, cardId: string, kind: KeepableCard): GameState {
  s.players[0]!.heldCards.push({ cardId, kind });
  const deck = cardId.startsWith('chance-') ? 'chance' : 'community';
  s.decks[deck] = s.decks[deck].filter((c) => c !== cardId);
  return s;
}

/** Linh (p1) đang ở tù ô 10 với `attempts` lần đã thử, `cash` tiền, có hoặc không có thẻ ra tù. */
function jailed(attempts: number, cash: number, card: boolean): GameState {
  const s = sample();
  Object.assign(s.players[0]!, { position: 10, inJail: true, jailAttempts: attempts, cash });
  if (card) hold(s, 'community-jail-free', 'jailFree');
  s.pending = { type: 'jail', playerId: 'p1' };
  return s;
}

export const TEST_TILES_SCENARIOS: Record<string, () => GameState> = {
  // --- 00 Bắt Đầu ---
  // Từ ô 36 đổ 1 + 3 dừng đúng ô 00: +200Đ, không còn việc gì.
  'test-tiles-go-land': () => roll(at(sample(), 36), 1, 3),
  // Từ ô 37 đổ 4 + 5 qua ô 00 (+200Đ) tới Bưu Điện vô chủ: mời mua 100Đ.
  'test-tiles-go-pass': () => roll(at(sample(), 37), 4, 5),

  // --- 04 / 38 Thuế (tax: ô 04 có sẵn) ---
  // Từ ô 34 đổ 1 + 3 tới Thuế Lợi Tức 38: Là nó 100Đ.
  'test-tiles-tax-38': () => roll(at(sample(), 34), 1, 3),
  // Từ ô 36 đổ 2 + 6 qua ô 00 (+200Đ) rồi dừng Thuế Lương Bổng 04.
  'test-tiles-tax-04-go': () => roll(at(sample(), 36), 2, 6),
  // Linh chỉ có 120Đ tới ô 04 (200Đ): Xử lý nợ.
  'test-tiles-tax-debt': () => roll(at(sample(), 0, 120), 1, 3),
  // Linh chỉ có 40Đ tới ô 38 (100Đ): Xử lý nợ.
  'test-tiles-tax-38-debt': () => roll(at(sample(), 34, 40), 1, 3),
  // Linh có Phố Cổ và giữ quyền Người thủ đô, tới ô 04: tự miễn thuế.
  'test-tiles-tax-waiver-04': () =>
    roll(at(hold(own(sample(), 'p1', 1), 'chance-capital-citizen', 'taxWaiver'), 0), 1, 3),

  // --- 10 Tù ---
  // Lần thử 1 không ra đôi (2 + 5): vẫn ở tù, sang Minh.
  'test-tiles-jail-try1-fail': () => roll(jailed(0, 180, false), 2, 5),
  // Lần thử 2 không ra đôi (1 + 4): vẫn ở tù, sang Minh.
  'test-tiles-jail-try2-fail': () => roll(jailed(1, 180, false), 1, 4),
  // Lần thử 2 ra đôi 4 + 4: ra tù, đi 8 ô tới Sơn Đoòng vô chủ (mời mua 180Đ), không có lượt thêm.
  'test-tiles-jail-double': () => roll(jailed(1, 300, false), 4, 4),
  // Lần thử 3 không ra đôi (4 + 6), không có thẻ, đủ tiền: tự trả 50Đ rồi đi 10 ô tới Bãi Đỗ Xe.
  'test-tiles-jail-third-pay': () => roll(jailed(2, 180, false), 4, 6),
  // Như trên nhưng chỉ có 30Đ: Xử lý nợ 50Đ rồi mới đi.
  'test-tiles-jail-third-debt': () => roll(jailed(2, 30, false), 4, 6),
  // Lần thử 3 không ra đôi (4 + 6) và có thẻ: chọn dùng thẻ hoặc trả 50Đ rồi đi 10 ô.
  'test-tiles-jail-third-card': () => roll(jailed(2, 180, true), 4, 6),
  // Lần thử 1, chỉ có 30Đ, không có thẻ: trả 50Đ bị khóa, Ụp/Mở để có tiền rồi trả.
  'test-tiles-jail-poor': () => jailed(0, 30, false),
  // Lần thử 3 bấm trên giao diện (xúc xắc ngẫu nhiên), có thẻ ra tù và 180Đ.
  'test-tiles-jail-last-card': () => jailed(2, 180, true),

  // --- 20 Bãi Đỗ Xe ---
  'test-tiles-parking': () => roll(at(sample(), 16), 1, 3),

  // --- 30 Vào Tù ---
  // Từ ô 26 đổ 1 + 3 tới ô 30: vào tù ô 10, không nhận 200Đ.
  'test-tiles-gotojail': () => roll(at(sample(), 26), 1, 3),
  // Như trên nhưng đổ đôi 2 + 2: vào tù, không có lượt thêm.
  'test-tiles-gotojail-double': () => roll(at(sample(), 26), 2, 2),

  // --- Ga 05 / 15 / 25 / 35 ---
  // Từ ô 21 đổ 1 + 3 tới Ga Đà Nẵng vô chủ: mời mua 200Đ.
  'test-tiles-station-buy': () => roll(at(sample(), 21), 1, 3),
  // Từ ô 11 đổ 1 + 3 tới Ga Vinh của An (1 ga): 25Đ.
  'test-tiles-station-rent-1': () => roll(at(sample(), 11), 1, 3),
  // An có 3 ga (15, 25, 35): 100Đ.
  'test-tiles-station-rent-3': () => roll(at(own(own(sample(), 'p3', 25), 'p3', 35), 11), 1, 3),
  // An có cả 4 ga (Ga Hà Nội lấy của Linh): 200Đ.
  'test-tiles-station-rent-4': () =>
    roll(at(own(own(own(sample(), 'p3', 5), 'p3', 25), 'p3', 35), 11), 1, 3),
  // An có 3 ga nhưng Ga Đà Nẵng đang cắm: chỉ 2 ga hoạt động, 50Đ.
  'test-tiles-station-rent-active': () =>
    roll(at(own(own(sample(), 'p3', 25, 0, true), 'p3', 35), 11), 1, 3),
  // Ga Vinh của An đang cắm: không trả gì.
  'test-tiles-station-mortgaged': () => roll(at(own(sample(), 'p3', 15, 0, true), 11), 1, 3),
  // Ga Sài Gòn của Linh đang cắm: chỉ được chuộc (110Đ).
  'test-tiles-station-own-redeem': () => roll(at(own(sample(), 'p1', 35, 0, true), 31), 1, 3),

  // --- Nhà máy 12 / 28 ---
  // Nhà Máy Điện vô chủ: từ ô 08 đổ 1 + 3, mời mua 150Đ.
  'test-tiles-utility-buy': () => roll(at(own(sample(), null, 12), 8), 1, 3),
  // Nhà Máy Nước của Nam (1 nhà máy): từ ô 24 đổ 1 + 3, trả 4 × 4 = 16Đ.
  'test-tiles-utility-rent-1': () => roll(at(sample(), 24), 1, 3),
  // Nam có cả 2 nhà máy: 10 × 4 = 40Đ.
  'test-tiles-utility-rent-2': () => roll(at(own(sample(), 'p6', 12), 24), 1, 3),
  // Nhà Máy Nước của Nam đang cắm: không trả gì.
  'test-tiles-utility-mortgaged': () => roll(at(own(sample(), 'p6', 28, 0, true), 24), 1, 3),
  // Nhà Máy Điện của Linh đang cắm: từ ô 08 đổ 1 + 3, chỉ được chuộc (82Đ).
  'test-tiles-utility-own-redeem': () => roll(at(sample(), 8), 1, 3),

  // --- Đất màu của mình (upgrade: Hạ Long 2 nhà → 3 nhà có sẵn) ---
  // Hạ Long 4 nhà: nâng lên khách sạn (100Đ).
  'test-tiles-own-to-hotel': () => roll(at(own(sample(), 'p1', 16, 4), 13), 1, 2),
  // Dinh Độc Lập đã là khách sạn: không có gì để nâng.
  'test-tiles-own-hotel': () => roll(at(sample(), 22), 1, 3),
  // Hạ Long 2 nhà nhưng Linh chỉ có 60Đ (cần 100Đ): không mời nâng.
  'test-tiles-own-poor': () => roll(at(sample(), 13, 60), 1, 2),
  // Cầu Rồng đang cắm, đủ tiền: chuộc + xây 1 nhà (121Đ + 150Đ).
  'test-tiles-own-redeem-build': () => roll(at(sample(), 18), 1, 2),
  // Cầu Rồng đang cắm, chỉ có 200Đ: chuộc riêng 121Đ (mục 13.1).
  'test-tiles-own-redeem-only': () => roll(at(sample(), 18, 200), 1, 2),
  // Cầu Rồng đang cắm, chỉ có 100Đ: không đủ chuộc, không mời gì.
  'test-tiles-own-redeem-none': () => roll(at(sample(), 18, 100), 1, 2),
  // Đổ đôi 2 + 2 tới Tràng An vô chủ và mua; lượt thêm 1 + 2 tới Cơ Hội 22 rút Nhảy lò cò,
  // lùi về Tràng An vừa mua: lượt vừa mua chưa được nâng.
  'test-tiles-own-just-bought': () => {
    const s = roll(top(at(sample(), 15), 'chance-hopscotch'), 2, 2);
    return roll(act(s, { type: 'buy', playerId: who(s) }, scriptedRng([])), 1, 2);
  },

  // --- Đất người khác (rent: Hội An 2 nhà 300Đ có sẵn) ---
  // Đồng Xuân của Minh có khách sạn: từ ô 00 đổ 1 + 2, thuê 250Đ.
  'test-tiles-rent-hotel': () => roll(at(own(sample(), 'p2', 3, 5), 0), 1, 2),
  // Hội An của Minh đang cắm: không trả gì.
  'test-tiles-rent-mortgaged': () => roll(at(own(sample(), 'p2', 24, 0, true), 20), 1, 3),
  // Linh chỉ có 50Đ tới Bưu Điện vô chủ (100Đ): không đủ tiền mua, không mời mua.
  'test-tiles-buy-poor': () => roll(at(sample(), 0, 50), 2, 4),
};
