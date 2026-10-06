/** Tiền thuê đất theo cấp: [đất trống, 1 nhà, 2 nhà, 3 nhà, 4 nhà, khách sạn]. */
export type RentTable = readonly [number, number, number, number, number, number];

interface TileBase {
  index: number;
  name: string;
}

export interface PropertyTile extends TileBase {
  kind: 'property';
  price: number;
  rents: RentTable;
  /** Giá nâng mỗi cấp (nhà và khách sạn như nhau). */
  upgradeCost: number;
}

export interface StationTile extends TileBase {
  kind: 'station';
  price: number;
}

export interface UtilityTile extends TileBase {
  kind: 'utility';
  price: number;
}

export interface TaxTile extends TileBase {
  kind: 'tax';
  amount: number;
}

export interface SimpleTile extends TileBase {
  kind: 'go' | 'jail' | 'parking' | 'goToJail' | 'chance' | 'community';
}

export type Tile = PropertyTile | StationTile | UtilityTile | TaxTile | SimpleTile;
export type OwnableTile = PropertyTile | StationTile | UtilityTile;
export type TileKind = Tile['kind'];

export type DeckKind = 'chance' | 'community';

/** Thẻ được giữ lại sau khi rút. */
export type KeepableCard = 'rentWaiver' | 'jailFree' | 'fortuneMirror' | 'taxWaiver';

export type CardEffect =
  | { type: 'moveTo'; target: number }
  | {
      type: 'advanceToNearest';
      target: 'property' | 'station';
      diceMultiplier: number;
      /** false: tiến qua ô Bắt Đầu cũng không nhận 200Đ. */
      collectGo: boolean;
    }
  | { type: 'moveBack'; steps: number }
  /** Gieo 2 viên, xử lý lần lượt: viên chẵn tiến, viên lẻ lùi đúng số điểm của viên đó. */
  | { type: 'flyDice' }
  | { type: 'goToJail' }
  | { type: 'receive'; amount: number }
  | { type: 'pay'; amount: number }
  | { type: 'collectFromEach'; amount: number }
  | { type: 'payEach'; amount: number }
  | {
      type: 'buildingFee';
      perHouse: number;
      perHotel: number;
      utilityIndex: number;
      /** Phần trăm tổng phí chủ nhà máy (đang hoạt động) được nhận. */
      ownerPercent: number;
    }
  | { type: 'payPerStation'; amounts: readonly number[] }
  | { type: 'lottery'; payouts: Readonly<Record<1 | 2 | 3 | 4 | 5 | 6, number>> }
  | { type: 'cashBrackets'; brackets: readonly { maxCash: number | null; amount: number }[] }
  | { type: 'helpThePoor'; collectFromEach: number; payToPoorest: number }
  | { type: 'keep'; card: KeepableCard }
  /** Người thủ đô: chỉ có hiệu lực nếu đang sở hữu ô `requiredTile` khi rút; giữ quyền miễn 1 lần thuế. */
  | { type: 'capitalCitizen'; requiredTile: number }
  /** Canh bạc xây dựng: so số đất màu với trung bình (chưa làm tròn) của mọi người. */
  | { type: 'buildingGamble' }
  /** Cháy nhà hàng xóm: mọi người gieo 2 viên, cộng hết, đếm từ vị trí người rút. */
  | { type: 'neighborFire' }
  /** Ngân hàng tái cơ cấu: tiền mặt người rút thành phần nguyên trung bình tiền mặt mọi người. */
  | { type: 'bankRestructure' }
  /** Mở đường cao tốc: chọn 1 trong 22 đất màu, gieo 1 viên: 1/2/3 đi tiếp 10/20/30 bước, 4/5/6 đứng tại ô chọn. */
  | { type: 'highway'; stepsByDie: Readonly<Record<1 | 2 | 3 | 4 | 5 | 6, number>> }
  /** Thằng Bờm đổi quạt mo: viên 1 chọn đối thủ, viên 2 quyết định đổi gì; thiếu tài sản thì đối thủ trả `penalty`. */
  | { type: 'swapProperty'; penalty: number };

export interface Card {
  id: string;
  deck: DeckKind;
  title: string;
  description: string;
  effect: CardEffect;
}
