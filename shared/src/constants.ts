// Các hằng số luật chơi (xem docs/luat-choi.md).

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export const BOARD_SIZE = 40;
export const GO_INDEX = 0;
export const JAIL_INDEX = 10;
export const GO_TO_JAIL_INDEX = 30;

export const START_MONEY = 500;
export const GO_REWARD = 200;

export const JAIL_BAIL = 50;
export const MAX_JAIL_TURNS = 3;
export const MAX_DOUBLES_BEFORE_JAIL = 3;

/** Cấp công trình: 0 = đất trống, 1–3 = số nhà, 4 = khách sạn. */
export const MAX_BUILDING_LEVEL = 4;

/** Tiền thuê ga theo số ga chưa bị cắm của chủ (chỉ số = số ga). */
export const STATION_RENTS = [0, 25, 50, 100, 200] as const;

/** Hệ số nhân tổng xúc xắc theo số nhà máy chưa bị cắm của chủ. */
export const UTILITY_MULTIPLIERS = [0, 4, 10] as const;

/** Tỉ lệ tính bằng phần trăm để giữ phép tính là số nguyên. */
export const MORTGAGE_PERCENT = 50;
export const REDEEM_PERCENT = 55;
export const SELL_PERCENT = 60;
export const SELL_MORTGAGED_PERCENT = 10;
export const DOWNGRADE_PERCENT = 50;
