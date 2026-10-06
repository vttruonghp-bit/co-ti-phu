import { describe, expect, it } from 'vitest';
import { downgradeRefund, mortgageValue, redeemCost, sellValue } from '../src';

describe('tài chính', () => {
  it('cắm bằng ½ giá mua', () => {
    expect(mortgageValue(60)).toBe(30);
    expect(mortgageValue(350)).toBe(175);
  });

  it('chuộc bằng 55% giá mua, làm tròn xuống', () => {
    expect(redeemCost(60)).toBe(33);
    expect(redeemCost(150)).toBe(82);
    expect(redeemCost(400)).toBe(220);
  });

  it('bán cho ngân hàng 55% nếu chưa cắm, 10% nếu đang cắm', () => {
    expect(sellValue(60, false)).toBe(33);
    expect(sellValue(200, false)).toBe(110);
    expect(sellValue(280, false)).toBe(154);
    expect(sellValue(280, true)).toBe(28);
  });

  it('hạ cấp nhận ½ giá nâng cấp', () => {
    expect(downgradeRefund(150)).toBe(75);
  });
});
