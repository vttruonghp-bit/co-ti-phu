/** Tình huống kiểm thử từng ô / từng lá thẻ (mở `/?scenario=test-community-...`). */
import type { GameState } from '@cotiphu/shared';
import { at, own, sample, top } from './helpers';

/*
 * Kiểm thử 21 thẻ Khí Vận bằng thao tác thật: mỗi tình huống dừng NGAY TRƯỚC một lần bấm
 * (thường là nút Sục của Linh), lá thẻ cần thử nằm trên cùng chồng Khí Vận. Nhờ vậy màn thẻ có
 * trạng thái trước thao tác như khi chơi thật (hiện đủ tiền người nhận).
 *
 * Xúc xắc lấy từ hạt giống của ván, nên kịch bản kiểm thử
 * (scratchpad/test-community/run.cjs) cố định hạt giống để lần Sục ra đúng số ghi ở từng dòng.
 * Mở tay thì xúc xắc ngẫu nhiên.
 *
 * Bàn mẫu (helpers.ts sample): Linh p1, Minh p2, An p3, Vy p4, Huy p5, Nam p6;
 * tiền 480 / 220 / 360 / 270 / 400 / 310. Khí Vận ở ô 02, 17, 33.
 */

/** Linh đứng ở ô `from` (mặc định 14), lá `card` trên cùng chồng Khí Vận. Từ 14 Sục 1 + 2 tới ô 17. */
const draw = (s: GameState, card: string, from = 14, cash?: number) => top(at(s, from, cash), card);

/** Người `i` (0 = Linh … 5 = Nam) đang giữ thẻ Kẻ khóc người cười. */
function holdsMirror(s: GameState, i: number): GameState {
  s.players[i]!.heldCards.push({ cardId: 'community-fortune-mirror', kind: 'fortuneMirror' });
  s.decks.community = s.decks.community.filter((c) => c !== 'community-fortune-mirror');
  return s;
}

/** Đặt tiền mặt cho từng người theo chỉ số. */
function cash(s: GameState, values: Record<number, number>): GameState {
  for (const [i, v] of Object.entries(values)) s.players[+i]!.cash = v;
  return s;
}

/** Linh đang ở tù, đã thử `attempts` lần, giữ thẻ ra tù rút từ chồng Khí Vận. */
function jailedWithCard(s: GameState, attempts: number, money: number): GameState {
  const p = s.players[0]!;
  Object.assign(p, { position: 10, inJail: true, jailAttempts: attempts, cash: money });
  p.heldCards.push({ cardId: 'community-jail-free', kind: 'jailFree' });
  s.decks.community = s.decks.community.filter((c) => c !== 'community-jail-free');
  s.pending = { type: 'jail', playerId: 'p1' };
  return s;
}

export const TEST_COMMUNITY_SCENARIOS: Record<string, () => GameState> = {
  // 01 Mừng sinh nhật: Sục 1 + 2, mỗi người trả Linh 10Đ (Linh 480 → 530).
  'test-community-birthday': () => draw(sample(), 'community-birthday'),
  // Mừng sinh nhật, An chỉ có 5Đ nhưng có Tháp Rùa 3 nhà, Ga Vinh: An Xử lý nợ ngoài lượt.
  'test-community-birthday-debt': () => draw(cash(sample(), { 2: 5 }), 'community-birthday'),
  // 02 Chuyển nhầm tài khoản: trả 100Đ (480 → 380).
  'test-community-wrong-transfer': () => draw(sample(), 'community-wrong-transfer'),
  // Chuyển nhầm tài khoản khi Linh chỉ có 60Đ: Linh Xử lý nợ trong lượt mình.
  'test-community-wrong-transfer-debt': () => draw(sample(), 'community-wrong-transfer', 14, 60),
  // 03 Thần tài ban lộc: +100Đ.
  'test-community-god-of-wealth': () => draw(sample(), 'community-god-of-wealth'),
  // 04 Hát hay múa giỏi: +30Đ.
  'test-community-singing': () => draw(sample(), 'community-singing'),
  // 05 Về điểm xuất phát: từ 17 tới ô 00, nhận đúng 200Đ một lần.
  'test-community-go': () => draw(sample(), 'community-go'),
  // 06 Lật ngược tình thế ở ba mốc tiền: 99Đ (+400), 499Đ (+50), 500Đ (+10).
  'test-community-turnaround-low': () => draw(sample(), 'community-turnaround', 14, 99),
  'test-community-turnaround-mid': () => draw(sample(), 'community-turnaround', 14, 499),
  'test-community-turnaround-high': () => draw(sample(), 'community-turnaround', 14, 500),
  // Lật ngược sau khi qua ô 00 (luật 13.7): Linh 0Đ ở ô 39, Sục 1 + 2 tới Khí Vận 02:
  // +200Đ trước rồi mới xét mốc, nên chỉ nhận 50Đ.
  'test-community-turnaround-after-go': () => draw(sample(), 'community-turnaround', 39, 0),
  // 07 Thừa kế gia sản: +100Đ.
  'test-community-inheritance': () => draw(sample(), 'community-inheritance'),
  // 08 Nhặt được của rơi: +200Đ.
  'test-community-found-money': () => draw(sample(), 'community-found-money'),
  // 09 Quá ngây thơ: −50Đ.
  'test-community-naive': () => draw(sample(), 'community-naive'),
  // 10 Ủng hộ người nghèo: Minh (220Đ) ít tiền nhất, Linh trả Minh 50Đ.
  'test-community-help-poor': () => draw(sample(), 'community-help-the-poor'),
  // Linh 220Đ bằng Minh (đồng hạng ít nhất): Linh nhận 20Đ từ mỗi người.
  'test-community-help-poor-collect': () => draw(sample(), 'community-help-the-poor', 14, 220),
  // Minh, Vy, Nam cùng 200Đ: Linh trả 50Đ, mỗi người 16Đ, 2Đ lẻ cho Ngân hàng.
  'test-community-help-poor-tie': () =>
    draw(cash(sample(), { 1: 200, 3: 200, 5: 200 }), 'community-help-the-poor'),
  // 11 Trả tiền nước: Hạ Long 2 nhà + Dinh Độc Lập khách sạn = 200Đ; Nam (Nhà Máy Nước) nhận 40Đ.
  'test-community-water': () => draw(sample(), 'community-water'),
  // Trả tiền nước khi Linh là chủ Nhà Máy Nước (luật 13.6): chỉ trả Ngân hàng 160Đ.
  'test-community-water-owner': () => draw(own(sample(), 'p1', 28), 'community-water'),
  // 12 Chó cắn áo rách: −20Đ.
  'test-community-dog-bite': () => draw(sample(), 'community-dog-bite'),
  // 13 Thẻ ra tù miễn phí: rút và giữ.
  'test-community-jail-free': () => draw(sample(), 'community-jail-free'),
  // Dùng thẻ ra tù ở lần thử thứ 3: Linh 30Đ (không đủ 50Đ), Thử đôi lần cuối ra 2 + 3,
  // dùng thẻ rồi đi 5 ô tới Ga Vinh của An (thuê 25Đ).
  'test-community-jail-free-third': () => jailedWithCard(sample(), 2, 30),
  // 14 Kẻ gian đột nhập: −30Đ.
  'test-community-burglar': () => draw(sample(), 'community-burglar'),
  // 15 Bầu tổng thống: Linh trả mỗi người 30Đ (−150Đ).
  'test-community-election': () => draw(sample(), 'community-election'),
  // Bầu tổng thống khi Linh chỉ có 100Đ: Xử lý nợ 150Đ, trả đủ cả 5 người một lần.
  'test-community-election-debt': () => draw(sample(), 'community-election', 14, 100),
  // 16 Kẻ khóc người cười: rút và giữ.
  'test-community-fortune-mirror': () => draw(sample(), 'community-fortune-mirror'),
  // Minh giữ Kẻ khóc người cười, Linh nhặt được 200Đ: Minh trả Linh 40Đ.
  'test-community-mirror-receive': () => draw(holdsMirror(sample(), 1), 'community-found-money'),
  // Minh giữ Kẻ khóc người cười, Linh Quá ngây thơ trả 50Đ: Linh trả Minh 40Đ.
  'test-community-mirror-pay': () => draw(holdsMirror(sample(), 1), 'community-naive'),
  // Minh giữ Kẻ khóc người cười nhưng chỉ có 10Đ: Minh Xử lý nợ 40Đ ngoài lượt.
  'test-community-mirror-debt': () =>
    draw(holdsMirror(cash(sample(), { 1: 10 }), 1), 'community-found-money'),
  // Chính Linh giữ Kẻ khóc người cười rồi nhặt được 200Đ: không kích hoạt.
  'test-community-mirror-self': () => draw(holdsMirror(sample(), 0), 'community-found-money'),
  // Minh giữ Kẻ khóc người cười, Linh Về điểm xuất phát: 200Đ qua ô 00 không tính, không kích hoạt.
  'test-community-mirror-go': () => draw(holdsMirror(sample(), 1), 'community-go'),
  // 17 Thiên tai lũ lụt: +50Đ.
  'test-community-flood': () => draw(sample(), 'community-flood'),
  // 18 Vào tù là rõ: Linh từ ô 15 Sục đôi 1 + 1 tới Khí Vận 17, vào tù và mất lượt thêm.
  'test-community-jail': () => draw(sample(), 'community-jail', 15),
  // 19 Ngân hàng tái cơ cấu: 2040 ÷ 6 = 340, Linh 480 → 340.
  'test-community-restructure': () => draw(sample(), 'community-bank-restructure'),
  // Tái cơ cấu khi Linh 100Đ: 1660 ÷ 6 = 276,67 → 276 (+176Đ).
  'test-community-restructure-up': () => draw(sample(), 'community-bank-restructure', 14, 100),
  // 20 Mở đường cao tốc: chọn Hội An (Minh, 2 nhà), gieo 5 → đứng tại Hội An, Trả tiền 300Đ.
  'test-community-highway-rent': () => draw(sample(), 'community-highway'),
  // Cao tốc chọn Hội An, gieo 2 → tiến 20 ô qua ô 00 (không nhận 200Đ) tới thuế 04: Là nó 200Đ.
  'test-community-highway-tax': () => draw(sample(), 'community-highway'),
  // Cao tốc chọn Bến Thành, gieo 1 → qua ô 00 tới Phố Cổ (Minh): Trả tiền 2Đ, không nhận 200Đ.
  'test-community-highway-nogo': () => draw(sample(), 'community-highway'),
  // Cao tốc chọn Cung Đình, gieo 1 → Khí Vận 33, rút tiếp Nhặt được của rơi.
  'test-community-highway-chain': () =>
    top(draw(sample(), 'community-found-money'), 'community-highway'),
  // 21 Thằng Bờm: viên 1 = 1 (Minh), viên 2 = 4 → đổi Đồng Xuân (1 nhà) lấy Phố Cổ.
  'test-community-swap-even': () => draw(own(sample(), 'p1', 3, 1), 'community-swap'),
  // Thằng Bờm: viên 1 ra 6 gieo lại, ra 5 (Nam); viên 2 = 3 → lấy Nhà Máy Nước của Nam.
  'test-community-swap-odd': () => draw(sample(), 'community-swap'),
  // Thằng Bờm: viên 1 = 2 (An), viên 2 = 1 → lấy Ga Vinh đang cắm của An (luật 13.5).
  'test-community-swap-mortgaged': () => draw(own(sample(), 'p3', 15, 0, true), 'community-swap'),
  // Thằng Bờm: viên 1 = 3 (Vy), viên 2 = 5, Vy không có ga / nhà máy → Vy trả Linh 100Đ.
  'test-community-swap-penalty': () => draw(sample(), 'community-swap'),
  // Như trên nhưng Vy chỉ có 50Đ (Phú Quốc 1 nhà): Vy Xử lý nợ 100Đ ngoài lượt.
  'test-community-swap-penalty-debt': () => draw(cash(sample(), { 3: 50 }), 'community-swap'),
};
