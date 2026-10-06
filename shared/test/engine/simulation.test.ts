import { describe, expect, it } from 'vitest';
import { isGameOver, winners } from '../../src';
import { simulate } from './sim';

describe('giả lập trọn ván', () => {
  it('200 ván ngẫu nhiên giữ đúng mọi bất biến và kết thúc có người thua', () => {
    let ended = 0;
    let totalActions = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { s, actions, n } = simulate(seed);
      totalActions += actions;
      if (isGameOver(s)) {
        ended++;
        expect(winners(s)).toHaveLength(n - 1);
        const loser = s.players.find((p) => p.id === s.loserId)!;
        expect(['bankrupt', 'surrendered']).toContain(loser.status);
      }
    }
    // Với 500Đ khởi điểm, gần như mọi ván phải có người phá sản trước giới hạn thao tác.
    expect(ended).toBeGreaterThanOrEqual(190);
    expect(totalActions).toBeGreaterThan(0);
  }, 120_000);

  it('cùng hạt giống thì cùng kết quả', () => {
    const a = simulate(42).s;
    const b = simulate(42).s;
    expect(a).toEqual(b);
  });
});
