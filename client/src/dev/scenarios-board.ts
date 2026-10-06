/** Tình huống xem màn chính: nhiều quân trên một ô, tên ô dài, chuyển máy cho người đang nợ. */
import type { GameState } from '@cotiphu/shared';
import { at, own, roll, sample, top } from './helpers';

/** Cả 6 người đứng trên cùng một ô. */
function crowd(tile: number): GameState {
  const s = sample();
  s.players.forEach((p) => (p.position = tile));
  return s;
}

export const BOARD_SCENARIOS: Record<string, () => GameState> = {
  // 6 quân trên ô cạnh trái tên 2 dòng (Hoàng Thành).
  'board-crowd-side': () => crowd(13),
  // 6 quân trên ô hàng trên tên 3 dòng (Bến Nhà Rồng).
  'board-crowd-top': () => crowd(29),
  // 6 quân trên ô có từ dài (Landmark 81).
  'board-crowd-landmark': () => crowd(32),
  // 6 quân ở góc Metro / Tù.
  'board-crowd-jail': () => crowd(10),
  // Ô trung tâm dài nhất: tên ô dài, có chủ 4 nhà, phải trả thuê lớn.
  'board-long': () => roll(at(own(sample(), 'p2', 11, 4), 8, 900), 1, 2),
  // Tên dài 12 kí tự, tiền 4 chữ số, nhiều thẻ: thẻ người chơi 3 cột ở màn 360px.
  'board-names': () => {
    const s = sample();
    const names = ['Nguyễn Hoàng', 'Thanh Phương', 'Bảo Ngọc', 'Quang Trường', 'Hải', 'Mỹ Duyên'];
    s.players.forEach((p, i) => {
      p.name = names[i]!;
      p.cash = 1000 + i * 1111;
      p.heldCards.push({ cardId: 'community-jail-free', kind: 'jailFree' });
    });
    return s;
  },
  // Khí Vận Mừng sinh nhật, Minh chỉ còn 5Đ: Minh nợ dù đang là lượt Linh (chuyển máy).
  'board-handoff': () => {
    const s = sample();
    s.players[1]!.cash = 5;
    const r = roll(top(at(s, 15), 'community-birthday'), 1, 1);
    // Bỏ diễn biến để màn thẻ không che, xem thẳng màn chính.
    r.events = [];
    return r;
  },
};
