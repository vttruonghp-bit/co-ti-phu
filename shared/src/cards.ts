import type { Card } from './types';

const LOTTERY_PAYOUTS = { 1: 5, 4: 5, 2: 50, 5: 50, 3: 150, 6: 150 } as const;

export const CHANCE_CARDS: readonly Card[] = [
  {
    id: 'chance-ga-ha-noi',
    deck: 'chance',
    title: 'Đi đến Ga Hà Nội đây',
    description: 'Nếu qua ô Bắt Đầu nhận 200Đ.',
    effect: { type: 'moveTo', target: 5 },
  },
  {
    id: 'chance-phu-quoc',
    deck: 'chance',
    title: 'Đi đến Phú Quốc đây',
    description: 'Di chuyển đến ô Phú Quốc.',
    effect: { type: 'moveTo', target: 39 },
  },
  {
    id: 'chance-nearest-property',
    deck: 'chance',
    title: 'Tiến đến ô đất gần nhất đây',
    description:
      'Nếu chưa có ai sở hữu, bạn phải mua. Nếu đã có người sở hữu, gieo 2 xúc xắc và trả chủ 10 lần tổng.',
    effect: { type: 'advanceToNearest', target: 'property', diceMultiplier: 10 },
  },
  {
    id: 'chance-hoi-an',
    deck: 'chance',
    title: 'Đi đến Hội An đây',
    description: 'Nếu qua ô Bắt Đầu nhận 200Đ.',
    effect: { type: 'moveTo', target: 24 },
  },
  {
    id: 'chance-fly-dice',
    deck: 'chance',
    title: 'Tàu bay xúc xắc đây',
    description: 'Gieo 1 xúc xắc: ra số chẵn tiến lên, ra số lẻ lùi lại đúng số đã gieo.',
    effect: { type: 'flyDice' },
  },
  {
    id: 'chance-electricity',
    deck: 'chance',
    title: 'Trả tiền điện đây',
    description:
      'Mỗi nhà trả 25Đ, mỗi khách sạn trả 100Đ. Chủ Nhà Máy Điện nhận 1/5, còn lại trả ngân hàng.',
    effect: { type: 'buildingFee', perHouse: 25, perHotel: 100, utilityIndex: 12 },
  },
  {
    id: 'chance-go',
    deck: 'chance',
    title: 'Về điểm xuất phát đây (START!)',
    description: 'Nhận 200Đ ngon ơ.',
    effect: { type: 'moveTo', target: 0 },
  },
  {
    id: 'chance-rent-waiver',
    deck: 'chance',
    title: 'Miễn thuế nhà đất đây (100% OFF)',
    description:
      'Giữ lại thẻ này. Lần tiếp theo phải trả tiền thuê đất cho người khác, bắt buộc dùng để miễn hoàn toàn.',
    effect: { type: 'keep', card: 'rentWaiver' },
  },
  {
    id: 'chance-lottery',
    deck: 'chance',
    title: 'Xổ số kiến thiết đây',
    description: 'Gieo 1 xúc xắc: 1 hoặc 4 nhận 5Đ, 2 hoặc 5 nhận 50Đ, 3 hoặc 6 nhận 150Đ.',
    effect: { type: 'lottery', payouts: LOTTERY_PAYOUTS },
  },
  {
    id: 'chance-nearest-station',
    deck: 'chance',
    title: 'Đến ga gần nhất đây',
    description:
      'Nếu chưa có ai sở hữu, bạn phải mua. Nếu đã có người sở hữu, gieo 2 xúc xắc và trả chủ 10 lần tổng.',
    effect: { type: 'advanceToNearest', target: 'station', diceMultiplier: 10 },
  },
  {
    id: 'chance-railway-repair',
    deck: 'chance',
    title: 'Hỏng đường ray nè',
    description: 'Trả theo số ga đang sở hữu: 1 ga 25Đ, 2 ga 50Đ, 3 ga 100Đ, 4 ga 200Đ.',
    effect: { type: 'payPerStation', amounts: [0, 25, 50, 100, 200] },
  },
  {
    id: 'chance-ba-dinh',
    deck: 'chance',
    title: 'Đi đến Quảng Trường Ba Đình đây',
    description: 'Nếu qua ô Bắt Đầu nhận 200Đ.',
    effect: { type: 'moveTo', target: 11 },
  },
  {
    id: 'chance-acting',
    deck: 'chance',
    title: 'Diễn kịch giỏi nhỉ',
    description: 'Nhận 50Đ.',
    effect: { type: 'receive', amount: 50 },
  },
  {
    id: 'chance-hopscotch',
    deck: 'chance',
    title: 'Nhảy lò cò đây',
    description: 'Lùi về sau 3 bước.',
    effect: { type: 'moveBack', steps: 3 },
  },
  {
    id: 'chance-jail',
    deck: 'chance',
    title: 'Vào tù là rõ',
    description: 'Đi thẳng vào tù, qua ô Bắt Đầu không nhận 200Đ.',
    effect: { type: 'goToJail' },
  },
  {
    id: 'chance-ga-da-nang',
    deck: 'chance',
    title: 'Đi đến Ga Đà Nẵng đây',
    description: 'Nếu qua ô Bắt Đầu nhận 200Đ.',
    effect: { type: 'moveTo', target: 25 },
  },
  {
    id: 'chance-parking',
    deck: 'chance',
    title: 'Đi đến Bãi Đỗ Xe đây',
    description: 'Nếu qua ô Bắt Đầu nhận 200Đ.',
    effect: { type: 'moveTo', target: 20 },
  },
];

export const COMMUNITY_CARDS: readonly Card[] = [
  {
    id: 'community-birthday',
    deck: 'community',
    title: 'Mừng sinh nhật đây',
    description: 'Nhận 10Đ từ mỗi người.',
    effect: { type: 'collectFromEach', amount: 10 },
  },
  {
    id: 'community-wrong-transfer',
    deck: 'community',
    title: 'Chuyển nhầm tài khoản đây',
    description: 'Trả 100Đ.',
    effect: { type: 'pay', amount: 100 },
  },
  {
    id: 'community-god-of-wealth',
    deck: 'community',
    title: 'Thần tài ban lộc đây',
    description: 'Nhận 100Đ.',
    effect: { type: 'receive', amount: 100 },
  },
  {
    id: 'community-singing',
    deck: 'community',
    title: 'Hát hay múa giỏi quá',
    description: 'Nhận 30Đ.',
    effect: { type: 'receive', amount: 30 },
  },
  {
    id: 'community-go',
    deck: 'community',
    title: 'Về điểm xuất phát đây (START!)',
    description: 'Nhận 200Đ ngon ơ.',
    effect: { type: 'moveTo', target: 0 },
  },
  {
    id: 'community-turnaround',
    deck: 'community',
    title: 'Lật ngược tình thế đây',
    description: 'Tiền mặt 0–99Đ nhận 400Đ, 100–499Đ nhận 50Đ, từ 500Đ trở lên nhận 10Đ.',
    effect: {
      type: 'cashBrackets',
      brackets: [
        { maxCash: 99, amount: 400 },
        { maxCash: 499, amount: 50 },
        { maxCash: null, amount: 10 },
      ],
    },
  },
  {
    id: 'community-inheritance',
    deck: 'community',
    title: 'Thừa kế gia sản đây',
    description: 'Nhận 100Đ.',
    effect: { type: 'receive', amount: 100 },
  },
  {
    id: 'community-found-money',
    deck: 'community',
    title: 'Nhặt được của rơi nè',
    description: 'Nhận 200Đ.',
    effect: { type: 'receive', amount: 200 },
  },
  {
    id: 'community-naive',
    deck: 'community',
    title: 'Quá ngây thơ đi',
    description: 'Trả 50Đ.',
    effect: { type: 'pay', amount: 50 },
  },
  {
    id: 'community-help-the-poor',
    deck: 'community',
    title: 'Ủng hộ người nghèo đây',
    description:
      'Nếu bạn có ít tiền mặt nhất, nhận 20Đ từ mỗi người. Nếu không, trả 50Đ cho người có ít tiền mặt nhất.',
    effect: { type: 'helpThePoor', collectFromEach: 20, payToPoorest: 50 },
  },
  {
    id: 'community-water',
    deck: 'community',
    title: 'Trả tiền nước nè',
    description:
      'Mỗi nhà trả 40Đ, mỗi khách sạn trả 120Đ. Chủ Nhà Máy Nước nhận 1/5, còn lại trả ngân hàng.',
    effect: { type: 'buildingFee', perHouse: 40, perHotel: 120, utilityIndex: 28 },
  },
  {
    id: 'community-dog-bite',
    deck: 'community',
    title: 'Chó cắn áo rách nữa',
    description: 'Trả 20Đ tiền chữa trị.',
    effect: { type: 'pay', amount: 20 },
  },
  {
    id: 'community-jail-free',
    deck: 'community',
    title: 'Thẻ ra tù miễn phí đây',
    description: 'Giữ lại thẻ này, dùng để ra tù miễn phí.',
    effect: { type: 'keep', card: 'jailFree' },
  },
  {
    id: 'community-burglar',
    deck: 'community',
    title: 'Kẻ gian đột nhập',
    description: 'Trả 30Đ.',
    effect: { type: 'pay', amount: 30 },
  },
  {
    id: 'community-election',
    deck: 'community',
    title: 'Bầu tổng thống đây',
    description: 'Trả 30Đ cho mỗi người.',
    effect: { type: 'payEach', amount: 30 },
  },
  {
    id: 'community-fortune-mirror',
    deck: 'community',
    title: 'Kẻ khóc người cười đây',
    description:
      'Giữ lại thẻ này. Lần tới người khác rút thẻ làm thay đổi tiền mặt: họ nhận tiền thì bạn trả 40Đ, họ trả tiền thì bạn nhận 40Đ.',
    effect: { type: 'keep', card: 'fortuneMirror' },
  },
  {
    id: 'community-flood',
    deck: 'community',
    title: 'Thiên tai lũ lụt',
    description: 'Nhận 50Đ.',
    effect: { type: 'receive', amount: 50 },
  },
  {
    id: 'community-jail',
    deck: 'community',
    title: 'Vào tù là rõ',
    description: 'Đi thẳng vào tù, qua ô Bắt Đầu không nhận 200Đ.',
    effect: { type: 'goToJail' },
  },
];

/** Tiền nhận hoặc trả của thẻ "Kẻ khóc người cười". */
export const FORTUNE_MIRROR_AMOUNT = 40;
