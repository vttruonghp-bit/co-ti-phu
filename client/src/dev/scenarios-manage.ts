import type { GameState } from '@cotiphu/shared';
import { at, own, roll, sample, top } from './helpers';

/**
 * Bàn mẫu, Linh có đủ loại tài sản: khách sạn (Dinh Độc Lập, Bến Nhà Rồng), nhà (Hạ Long,
 * Ba Đình, Tháp Chăm), đất trống (Đồng Xuân), đất cắm (Cầu Rồng), ga (Ga Hà Nội), nhà máy
 * đang cắm (Điện) và đang hoạt động (Nước).
 */
function linhRich(): GameState {
  const s = sample();
  own(s, 'p1', 11, 1);
  own(s, 'p1', 28);
  own(s, 'p1', 29, 5);
  own(s, 'p1', 37, 4);
  return s;
}

/** Tình huống thêm cho nhóm màn Ụp/Mở và Xử lý nợ (xem dev/helpers.ts để dựng nhanh). */
export const MANAGE_SCENARIOS: Record<string, () => GameState> = {
  // Đầu lượt của Linh (480Đ), chưa đổ: Ụp/Mở đầy đủ.
  'manage-start': () => linhRich(),
  // Như trên nhưng Linh chỉ có 50Đ: chuộc phải kèm thanh lý ô khác mới xác nhận được.
  'manage-start-poor': () => {
    const s = linhRich();
    s.players[0]!.cash = 50;
    return s;
  },
  // Linh 60Đ từ ô 20 đổ 1 + 3 tới Hội An (Minh, 2 nhà): nợ 300Đ, thanh lý được.
  'manage-debt': () => roll(at(sample(), 20, 60), 1, 3),
  // Linh rút Mừng sinh nhật (ô 17): Minh tự trả 10Đ, An chỉ có 5Đ nên phải xử lý nợ ngoài lượt.
  'manage-debt-multi': () => {
    const s = top(at(sample(), 15), 'community-birthday');
    s.players[2]!.cash = 5;
    return roll(s, 1, 1);
  },
  // Linh 100Đ rút Trả tiền điện ở ô 07 (7 nhà, 2 khách sạn: 375Đ); Linh có Nhà Máy Điện nên chỉ
  // nợ Ngân hàng 80% (300Đ).
  'manage-debt-fee': () => {
    const s = top(at(own(linhRich(), 'p1', 12), 3, 100), 'chance-electricity');
    return roll(s, 1, 3);
  },
  // Linh 120Đ tới Bitexco khách sạn của Minh (thuê 1400Đ): thanh lý hết vẫn thiếu, phá sản ngay.
  'manage-bankrupt': () => roll(at(sample(), 30, 120), 1, 3),
  // Linh đã đổ tới Hội An, đủ tiền trả thuê: Ụp/Mở lúc này chỉ xem.
  'manage-view': () => roll(at(linhRich(), 20), 1, 3),
};
