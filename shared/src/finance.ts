import {
  DOWNGRADE_PERCENT,
  MORTGAGE_PERCENT,
  REDEEM_PERCENT,
  SELL_MORTGAGED_PERCENT,
  SELL_PERCENT,
} from './constants';

/** Lấy phần trăm và làm tròn xuống đến hàng đơn vị. */
const percentOf = (amount: number, percent: number): number => Math.floor((amount * percent) / 100);

/** Tiền nhận khi cắm ô (½ giá mua). */
export const mortgageValue = (price: number): number => percentOf(price, MORTGAGE_PERCENT);

/** Tiền phải trả để chuộc ô đang cắm (55% giá mua). */
export const redeemCost = (price: number): number => percentOf(price, REDEEM_PERCENT);

/** Tiền nhận khi bán ô cho ngân hàng (60% nếu chưa cắm, 10% nếu đang cắm). */
export const sellValue = (price: number, mortgaged: boolean): number =>
  percentOf(price, mortgaged ? SELL_MORTGAGED_PERCENT : SELL_PERCENT);

/** Tiền nhận khi hạ 1 cấp công trình (½ giá nâng cấp). */
export const downgradeRefund = (upgradeCost: number): number =>
  percentOf(upgradeCost, DOWNGRADE_PERCENT);
