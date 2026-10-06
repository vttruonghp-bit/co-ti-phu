/** Tiền thuê đất theo cấp: [đất trống, 1 nhà, 2 nhà, 3 nhà, khách sạn]. */
export type RentTable = readonly [number, number, number, number, number];

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
export type KeepableCard = 'rentWaiver' | 'jailFree' | 'fortuneMirror';

export type CardEffect =
  | { type: 'moveTo'; target: number }
  | { type: 'advanceToNearest'; target: 'property' | 'station'; diceMultiplier: number }
  | { type: 'moveBack'; steps: number }
  | { type: 'flyDice' }
  | { type: 'goToJail' }
  | { type: 'receive'; amount: number }
  | { type: 'pay'; amount: number }
  | { type: 'collectFromEach'; amount: number }
  | { type: 'payEach'; amount: number }
  | { type: 'buildingFee'; perHouse: number; perHotel: number; utilityIndex: number }
  | { type: 'payPerStation'; amounts: readonly number[] }
  | { type: 'lottery'; payouts: Readonly<Record<1 | 2 | 3 | 4 | 5 | 6, number>> }
  | { type: 'cashBrackets'; brackets: readonly { maxCash: number | null; amount: number }[] }
  | { type: 'helpThePoor'; collectFromEach: number; payToPoorest: number }
  | { type: 'keep'; card: KeepableCard };

export interface Card {
  id: string;
  deck: DeckKind;
  title: string;
  description: string;
  effect: CardEffect;
}
