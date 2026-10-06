/** 8 màu người chơi: `main` cho viền, chữ, dải chủ; `soft` cho nền nhạt (nhật ký, thẻ người chơi). */
export const PLAYER_COLORS = [
  { name: 'Xanh ngọc', main: '#12876f', soft: '#e5f3ee' },
  { name: 'Tím', main: '#7b4fc0', soft: '#f0eafa' },
  { name: 'Cam', main: '#dc7533', soft: '#fcefe4' },
  { name: 'Xanh dương', main: '#3f78c2', soft: '#e8f0fa' },
  { name: 'Hồng', main: '#c0518a', soft: '#f9e9f1' },
  { name: 'Xám than', main: '#4c566a', soft: '#eceef2' },
  { name: 'Vàng', main: '#d39b12', soft: '#fbf2d9' },
  { name: 'Đỏ', main: '#d33d48', soft: '#fbe7e8' },
] as const;

/** 20 kí hiệu quân cờ, cùng thứ tự với hình vẽ trong TokenIcon. */
export const ICON_NAMES = [
  'Lá',
  'Trăng',
  'Ô tô',
  'Thuyền',
  'Tàu hoả',
  'Mây',
  'Gió',
  'Chiếc giày',
  'Cái mũ',
  'Bàn tay',
  'Thỏ',
  'Táo cắn dở',
  'Ngôi nhà',
  'Nam sinh',
  'Nữ sinh',
  'Chữ thập',
  'Chữ vạn',
  'Búa liềm',
  'Ngôi sao',
  'Tên lửa',
] as const;

/** Người chơi gợi ý khi tạo ván (tên, màu, kí hiệu khác nhau). */
export const DEFAULT_PLAYERS = [
  { name: 'Linh', color: 0, icon: 0 },
  { name: 'Minh', color: 1, icon: 1 },
  { name: 'An', color: 2, icon: 2 },
  { name: 'Vy', color: 3, icon: 3 },
  { name: 'Huy', color: 4, icon: 4 },
  { name: 'Nam', color: 5, icon: 10 },
] as const;

export const colorOf = (index: number) => PLAYER_COLORS[index] ?? PLAYER_COLORS[0];
