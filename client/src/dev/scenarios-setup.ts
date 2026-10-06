import type { GameState } from '@cotiphu/shared';
import { fresh, sample } from './helpers';

/**
 * Tình huống cho Đen vl. Màn đổi quân chỉ mở khi bấm nút "ĐEN VL" ở màn chính;
 * màn tạo ván hiện ở `/` khi máy chưa lưu ván nào.
 */
export const SETUP_SCENARIOS: Record<string, () => GameState> = {
  // 6 người: 5 màu và 5 kí hiệu của người khác bị khóa.
  'setup-appearance': sample,
  // 2 người: gần như mọi màu và kí hiệu đều chọn được.
  'setup-appearance-2': () => fresh(2),
};
