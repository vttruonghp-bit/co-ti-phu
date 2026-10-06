import { describe, expect, it } from 'vitest';
import {
  BOARD,
  BOARD_SIZE,
  GO_TO_JAIL_INDEX,
  JAIL_INDEX,
  MAX_BUILDING_LEVEL,
  METRO_INDEX,
  gridPosition,
  isOwnable,
  nearestAhead,
  type PropertyTile,
} from '../src';

const properties = BOARD.filter((t): t is PropertyTile => t.kind === 'property');

describe('bàn cờ', () => {
  it('có đúng 40 ô, chỉ số khớp vị trí', () => {
    expect(BOARD).toHaveLength(BOARD_SIZE);
    BOARD.forEach((tile, i) => expect(tile.index).toBe(i));
  });

  it('đúng số lượng từng loại ô', () => {
    const count = (kind: string) => BOARD.filter((t) => t.kind === kind).length;
    expect(count('property')).toBe(22);
    expect(count('station')).toBe(4);
    expect(count('utility')).toBe(2);
    expect(count('chance')).toBe(3);
    expect(count('community')).toBe(3);
    expect(count('tax')).toBe(2);
  });

  it('các góc nằm đúng chỗ', () => {
    expect(BOARD[0]?.kind).toBe('go');
    expect(BOARD[JAIL_INDEX]?.kind).toBe('jail');
    expect(METRO_INDEX).toBe(JAIL_INDEX);
    expect(BOARD[20]?.kind).toBe('parking');
    expect(BOARD[GO_TO_JAIL_INDEX]?.kind).toBe('goToJail');
  });

  it('tên ô không trùng, trừ Cơ Hội và Khí Vận', () => {
    const names = BOARD.filter((t) => t.kind !== 'chance' && t.kind !== 'community').map(
      (t) => t.name,
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it('tiền thuê đất tăng dần theo cấp', () => {
    for (const p of properties) {
      for (let level = 1; level < p.rents.length; level++) {
        expect(p.rents[level]!, `${p.name} cấp ${level}`).toBeGreaterThan(p.rents[level - 1]!);
      }
    }
  });

  it('giữ đúng số liệu Wins đã chốt', () => {
    const byName = (name: string) => properties.find((p) => p.name === name)!;
    expect(byName('Dinh Độc Lập').price).toBe(260);
    expect(byName('Bến Nhà Rồng')).toMatchObject({
      price: 280,
      rents: [24, 120, 360, 850, 1025, 1200],
      upgradeCost: 150,
    });
  });

  it('mỗi đất có 6 mức thuê: đất trống, 1–4 nhà, khách sạn', () => {
    for (const p of properties) expect(p.rents, p.name).toHaveLength(MAX_BUILDING_LEVEL + 1);
  });

  it('ô cùng giá mua có cùng bảng thuê và giá xây', () => {
    for (const a of properties) {
      for (const b of properties) {
        if (a.price === b.price) {
          expect(a.rents, `${a.name} / ${b.name}`).toEqual(b.rents);
          expect(a.upgradeCost).toBe(b.upgradeCost);
        }
      }
    }
  });

  it('isOwnable chỉ đúng với đất, ga, nhà máy', () => {
    expect(BOARD.filter(isOwnable)).toHaveLength(28);
  });
});

describe('nearestAhead', () => {
  it('tìm ga kế tiếp theo chiều kim đồng hồ', () => {
    expect(nearestAhead(7, 'station').index).toBe(15);
    expect(nearestAhead(36, 'station').index).toBe(5);
  });

  it('tìm đất kế tiếp, không tính ô đang đứng', () => {
    expect(nearestAhead(22, 'property').index).toBe(23);
    expect(nearestAhead(39, 'property').index).toBe(1);
  });
});

describe('gridPosition', () => {
  it('đặt 4 góc vào 4 góc lưới', () => {
    expect(gridPosition(0)).toEqual({ row: 10, col: 10 });
    expect(gridPosition(10)).toEqual({ row: 10, col: 0 });
    expect(gridPosition(20)).toEqual({ row: 0, col: 0 });
    expect(gridPosition(30)).toEqual({ row: 0, col: 10 });
  });

  it('mỗi ô một vị trí riêng trên viền lưới', () => {
    const seen = new Set<string>();
    for (let i = 0; i < BOARD_SIZE; i++) {
      const { row, col } = gridPosition(i);
      expect(row === 0 || row === 10 || col === 0 || col === 10).toBe(true);
      seen.add(`${row},${col}`);
    }
    expect(seen.size).toBe(BOARD_SIZE);
  });
});
