import { BOARD_SIZE } from './constants';
import type { OwnableTile, PropertyTile, RentTable, Tile } from './types';

const property = (
  index: number,
  name: string,
  price: number,
  rents: RentTable,
  upgradeCost: number,
): PropertyTile => ({ kind: 'property', index, name, price, rents, upgradeCost });

const STATION_PRICE = 200;
const UTILITY_PRICE = 150;

/** 40 ô theo chiều kim đồng hồ, bắt đầu từ ô Bắt Đầu (chỉ số 0). */
export const BOARD: readonly Tile[] = [
  // Cạnh 1 (dưới, từ phải sang trái)
  { kind: 'go', index: 0, name: 'Bắt Đầu' },
  property(1, 'Phố Cổ', 60, [2, 10, 30, 90, 250], 50),
  { kind: 'community', index: 2, name: 'Khí Vận' },
  property(3, 'Chợ Đồng Xuân', 60, [2, 10, 30, 90, 250], 50),
  { kind: 'tax', index: 4, name: 'Thuế Lương Bổng', amount: 200 },
  { kind: 'station', index: 5, name: 'Ga Hà Nội', price: STATION_PRICE },
  property(6, 'Bưu Điện Hà Nội', 100, [6, 30, 90, 270, 550], 50),
  { kind: 'chance', index: 7, name: 'Cơ Hội' },
  property(8, 'Nhà Hát Lớn', 100, [6, 30, 90, 270, 550], 50),
  property(9, 'Tháp Rùa', 120, [8, 40, 100, 300, 600], 50),
  // Cạnh 2 (trái, từ dưới lên trên)
  { kind: 'jail', index: 10, name: 'Tù / Thăm Tù' },
  property(11, 'Quảng Trường Ba Đình', 140, [10, 50, 150, 450, 750], 100),
  { kind: 'utility', index: 12, name: 'Nhà Máy Điện', price: UTILITY_PRICE },
  property(13, 'Hoàng Thành', 140, [10, 50, 150, 450, 750], 100),
  property(14, 'Văn Miếu', 160, [12, 60, 180, 500, 900], 100),
  { kind: 'station', index: 15, name: 'Ga Vinh', price: STATION_PRICE },
  property(16, 'Vịnh Hạ Long', 180, [14, 70, 200, 550, 950], 100),
  { kind: 'community', index: 17, name: 'Khí Vận' },
  property(18, 'Sơn Đoòng', 180, [14, 70, 200, 550, 950], 100),
  property(19, 'Tràng An', 200, [16, 80, 220, 600, 1000], 100),
  // Cạnh 3 (trên, từ trái sang phải)
  { kind: 'parking', index: 20, name: 'Bãi Đỗ Xe' },
  property(21, 'Cầu Rồng Đà Nẵng', 220, [18, 90, 250, 700, 1050], 150),
  { kind: 'chance', index: 22, name: 'Cơ Hội' },
  property(23, 'Cung Đình Huế', 220, [18, 90, 250, 700, 1050], 150),
  property(24, 'Hội An', 240, [20, 100, 300, 750, 1100], 150),
  { kind: 'station', index: 25, name: 'Ga Đà Nẵng', price: STATION_PRICE },
  property(26, 'Dinh Độc Lập', 260, [22, 110, 330, 800, 1150], 150),
  property(27, 'Nhà Thờ Đức Bà', 260, [22, 110, 330, 800, 1150], 150),
  { kind: 'utility', index: 28, name: 'Nhà Máy Nước', price: UTILITY_PRICE },
  property(29, 'Bến Nhà Rồng', 280, [24, 120, 360, 850, 1200], 150),
  // Cạnh 4 (phải, từ trên xuống dưới)
  { kind: 'goToJail', index: 30, name: 'Vào Tù' },
  property(31, 'Chợ Bến Thành', 300, [26, 130, 390, 900, 1275], 200),
  property(32, 'Landmark 81', 300, [26, 130, 390, 900, 1275], 200),
  { kind: 'community', index: 33, name: 'Khí Vận' },
  property(34, 'Bitexco', 320, [28, 150, 450, 1000, 1400], 200),
  { kind: 'station', index: 35, name: 'Ga Sài Gòn', price: STATION_PRICE },
  { kind: 'chance', index: 36, name: 'Cơ Hội' },
  property(37, 'Tháp Chăm', 350, [35, 175, 500, 1100, 1500], 200),
  { kind: 'tax', index: 38, name: 'Thuế Lợi Tức', amount: 100 },
  property(39, 'Phú Quốc', 400, [50, 200, 600, 1400, 2000], 200),
];

export function getTile(index: number): Tile {
  const tile = BOARD[index];
  if (!tile) throw new RangeError(`Không có ô số ${index}`);
  return tile;
}

export function isOwnable(tile: Tile): tile is OwnableTile {
  return tile.kind === 'property' || tile.kind === 'station' || tile.kind === 'utility';
}

/** Ô kế tiếp theo chiều kim đồng hồ có loại `kind`, không tính ô đang đứng. */
export function nearestAhead(from: number, kind: Tile['kind']): Tile {
  for (let step = 1; step <= BOARD_SIZE; step++) {
    const tile = getTile((from + step) % BOARD_SIZE);
    if (tile.kind === kind) return tile;
  }
  throw new Error(`Bàn cờ không có ô loại ${kind}`);
}

/**
 * Vị trí ô trên lưới 11×11 (hàng, cột tính từ 0 ở góc trên bên trái).
 * Ô Bắt Đầu ở góc dưới bên phải, đi theo chiều kim đồng hồ.
 */
export function gridPosition(index: number): { row: number; col: number } {
  if (index < 0 || index >= BOARD_SIZE) throw new RangeError(`Không có ô số ${index}`);
  if (index <= 10) return { row: 10, col: 10 - index };
  if (index <= 20) return { row: 20 - index, col: 0 };
  if (index <= 30) return { row: 0, col: index - 20 };
  return { row: index - 30, col: 10 };
}
