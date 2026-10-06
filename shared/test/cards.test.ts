import { describe, expect, it } from 'vitest';
import { BOARD, CHANCE_CARDS, COMMUNITY_CARDS } from '../src';

describe('thẻ', () => {
  it('đủ 17 thẻ Cơ Hội và 18 thẻ Khí Vận', () => {
    expect(CHANCE_CARDS).toHaveLength(17);
    expect(COMMUNITY_CARDS).toHaveLength(18);
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
