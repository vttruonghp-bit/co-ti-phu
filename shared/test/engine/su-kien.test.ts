import { describe, expect, it } from 'vitest';
import { act, newGame, own, roll, setPlayer, topCard } from './helpers';

describe('diễn biến của thao tác cuối (cho giao diện)', () => {
  it('đổ và đi: có xúc xắc và đường đi, thao tác sau xóa diễn biến cũ', () => {
    const s = roll(setPlayer(newGame(), 'a', { position: 35 }), 3, 4);
    expect(s.events).toEqual([
      { type: 'roll', playerId: 'a', dice: [3, 4], jail: false },
      { type: 'move', playerId: 'a', from: 35, to: 2, passedGo: true },
      { type: 'card', playerId: 'a', cardId: expect.any(String) },
    ]);
    const next = roll(own(s, null, 5), 1, 2);
    expect(next.events[0]).toMatchObject({ type: 'roll', playerId: 'b' });
  });

  it('vào ô 30: đi tới 30 rồi chuyển về tù', () => {
    const s = roll(setPlayer(newGame(), 'a', { position: 26 }), 1, 3);
    expect(s.events).toEqual([
      { type: 'roll', playerId: 'a', dice: [1, 3], jail: false },
      { type: 'move', playerId: 'a', from: 26, to: 30, passedGo: false },
      { type: 'move', playerId: 'a', from: 30, to: 10, passedGo: false },
      { type: 'jail', playerId: 'a' },
    ]);
  });

  it('Cháy nhà hàng xóm: ghi xúc xắc từng người, tổng và ô bị cháy', () => {
    const s0 = own(newGame(3), 'b', 24, { level: 2 });
    topCard(s0, 'chance-neighbor-fire');
    // a đi 3 + 4 tới ô 07; cả bàn gieo 2+3, 4+1, 6+1 = 17 → ô 24.
    const s = roll(s0, 3, 4, 2, 3, 4, 1, 6, 1);
    expect(s.events.at(-1)).toEqual({
      type: 'card',
      playerId: 'a',
      cardId: 'chance-neighbor-fire',
      detail: {
        kind: 'fire',
        rolls: [
          { playerId: 'a', dice: [2, 3] },
          { playerId: 'b', dice: [4, 1] },
          { playerId: 'c', dice: [6, 1] },
        ],
        total: 17,
        target: 24,
        hit: true,
      },
    });
    expect(s.tiles[24]!.level).toBe(1);
  });

  it('Ngân hàng tái cơ cấu: ghi tiền từng người lúc rút và mức trung bình', () => {
    const s0 = setPlayer(setPlayer(newGame(3), 'b', { cash: 200 }), 'c', { cash: 300 });
    topCard(s0, 'community-bank-restructure');
    const s = roll(s0, 1, 1);
    expect(s.events.at(-1)).toMatchObject({
      type: 'card',
      cardId: 'community-bank-restructure',
      detail: {
        kind: 'restructure',
        cash: [
          { playerId: 'a', cash: 500 },
          { playerId: 'b', cash: 200 },
          { playerId: 'c', cash: 300 },
        ],
        average: 333,
        before: 500,
      },
    });
  });

  it('Thằng Bờm: ghi các lần gieo viên 1, viên 2 và hai ô đổi', () => {
    const s0 = own(own(newGame(2), 'a', 1), 'b', 24);
    topCard(s0, 'community-swap');
    // a đi 1 + 1 tới ô 02; viên 1 ra 4 (gieo lại), 1 → Bình; viên 2 ra 2 (chẵn).
    const s = roll(s0, 1, 1, 4, 1, 2);
    expect(s.events.at(-1)).toMatchObject({
      detail: { kind: 'swap', opponentId: 'b', die1: [4, 1], die2: 2, mine: 1, theirs: 24 },
    });
  });

  it('Cao tốc: ghi ô chọn, viên xúc xắc và ô đến', () => {
    const s0 = newGame(2);
    topCard(s0, 'community-highway');
    const s1 = roll(s0, 1, 1);
    expect(s1.pending).toMatchObject({ type: 'chooseTile', purpose: 'highway' });
    const s = act(s1, { type: 'chooseTile', playerId: 'a', tile: 24 }, [2]);
    expect(s.events).toEqual([
      { type: 'highway', playerId: 'a', tile: 24, die: 2, to: 4 },
      { type: 'move', playerId: 'a', from: 2, to: 4, passedGo: false },
    ]);
  });

  it('nhật ký ghi rõ lý do trả tiền', () => {
    const s1 = roll(own(newGame(), 'b', 6), 2, 4);
    const s = act(s1, { type: 'pay', playerId: 'a' });
    expect(s.log.at(-1)).toMatchObject({
      playerId: 'a',
      text: 'Trả thuê Bưu Điện Hà Nội',
      amount: -6,
    });
    const t1 = roll(newGame(), 1, 3);
    const t = act(t1, { type: 'pay', playerId: 'a' });
    expect(t.log.at(-1)).toMatchObject({ text: 'Nộp Thuế Lương Bổng', amount: -200 });
  });
});
