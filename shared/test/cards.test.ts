import { describe, expect, it } from 'vitest';
import { BOARD, CHANCE_CARDS, COMMUNITY_CARDS } from '../src';

describe('thẻ', () => {
  it('đủ 19 thẻ Cơ Hội và 21 thẻ Khí Vận theo bản 3.2', () => {
    expect(CHANCE_CARDS).toHaveLength(19);
    expect(COMMUNITY_CARDS).toHaveLength(21);
  });

  it('thẻ Cơ Hội đến đúng các ô của bản 3.2', () => {
    const targets = CHANCE_CARDS.flatMap((c) =>
      c.effect.type === 'moveTo' ? [c.effect.target] : [],
    );
    expect(targets.sort((a, b) => a - b)).toEqual([0, 6, 9, 32, 35, 39]);
  });

  it('chỉ thẻ đến ga gần nhất không nhận 200Đ khi qua ô Bắt Đầu', () => {
    for (const c of CHANCE_CARDS) {
      if (c.effect.type === 'advanceToNearest') {
        expect(c.effect.collectGo, c.id).toBe(c.effect.target !== 'station');
      }
    }
  });

  it('Người thủ đô yêu cầu sở hữu Phố Cổ', () => {
    const card = CHANCE_CARDS.find((c) => c.effect.type === 'capitalCitizen');
    expect(card?.effect).toEqual({ type: 'capitalCitizen', requiredTile: 1 });
    expect(BOARD[1]?.name).toBe('Phố Cổ');
  });

  it('cao tốc: 1/2/3 đi 10/20/30 bước, 4/5/6 đứng yên', () => {
    const card = COMMUNITY_CARDS.find((c) => c.effect.type === 'highway');
    expect(card?.effect).toEqual({
      type: 'highway',
      stepsByDie: { 1: 10, 2: 20, 3: 30, 4: 0, 5: 0, 6: 0 },
    });
  });

  it('id không trùng và đúng chồng thẻ', () => {
    const all = [...CHANCE_CARDS, ...COMMUNITY_CARDS];
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
    CHANCE_CARDS.forEach((c) => expect(c.deck).toBe('chance'));
    COMMUNITY_CARDS.forEach((c) => expect(c.deck).toBe('community'));
  });

  it('thẻ di chuyển và thẻ tiền điện/nước trỏ đúng ô', () => {
    for (const card of [...CHANCE_CARDS, ...COMMUNITY_CARDS]) {
      const e = card.effect;
      if (e.type === 'moveTo') expect(BOARD[e.target], card.id).toBeDefined();
      if (e.type === 'buildingFee') expect(BOARD[e.utilityIndex]?.kind, card.id).toBe('utility');
    }
  });
});
