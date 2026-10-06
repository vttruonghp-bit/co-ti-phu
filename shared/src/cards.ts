import type { Card } from './types';

const LOTTERY_PAYOUTS = { 1: 5, 4: 5, 2: 50, 5: 50, 3: 150, 6: 150 } as const;
const HIGHWAY_STEPS = { 1: 10, 2: 20, 3: 30, 4: 0, 5: 0, 6: 0 } as const;

export const CHANCE_CARDS: readonly Card[] = [
  {
    id: 'chance-ga-sai-gon',
    deck: 'chance',
    title: 'Đi đến Ga Sài Gòn',
    description: 'Tiến tới ô 35; qua ô Bắt Đầu nhận 200Đ; xử lý ga.',
    effect: { type: 'moveTo', target: 35 },
  },
  {
    id: 'chance-phu-quoc',
    deck: 'chance',
    title: 'Đi đến Phú Quốc',
    description: 'Tiến tới ô 39; qua ô Bắt Đầu nhận 200Đ; xử lý đất.',
    effect: { type: 'moveTo', target: 39 },
  },
  {
    id: 'chance-nearest-property',
    deck: 'chance',
    title: 'Đất gần nhất',
    description:
      'Tới đất màu đầu tiên phía trước. Vô chủ: bắt buộc mua. Đất người khác đang hoạt động: gieo 2 viên mới, trả 10 × tổng. Của mình hoặc đang cắm: 0Đ.',
    effect: { type: 'advanceToNearest', target: 'property', diceMultiplier: 10, collectGo: true },
  },
  {
    id: 'chance-buu-dien',
    deck: 'chance',
    title: 'Đi đến Bưu Điện Hà Nội',
    description: 'Tiến tới ô 06; qua ô Bắt Đầu nhận 200Đ; xử lý ô đến.',
    effect: { type: 'moveTo', target: 6 },
  },
  {
    id: 'chance-fly-dice',
    deck: 'chance',
    title: 'Tàu bay xúc xắc',
    description:
      'Gieo 2 viên, xử lý viên 1 rồi viên 2: viên chẵn tiến, viên lẻ lùi đúng số điểm của viên đó. Chỉ xử lý ô cuối.',
    effect: { type: 'flyDice' },
  },
  {
    id: 'chance-electricity',
    deck: 'chance',
    title: 'Trả tiền điện',
    description:
      'Mỗi nhà 25Đ, mỗi khách sạn 100Đ. Chủ Nhà Máy Điện đang hoạt động nhận 20% tổng phí, còn lại trả Ngân hàng.',
    effect: {
      type: 'buildingFee',
      perHouse: 25,
      perHotel: 100,
      utilityIndex: 12,
      ownerPercent: 20,
    },
  },
  {
    id: 'chance-go',
    deck: 'chance',
    title: 'Về điểm xuất phát',
    description: 'Đến ô Bắt Đầu, nhận đúng 200Đ một lần.',
    effect: { type: 'moveTo', target: 0 },
  },
  {
    id: 'chance-rent-waiver',
    deck: 'chance',
    title: 'Miễn thuế nhà đất',
    description:
      'Giữ thẻ; miễn một lần tiền thuê khi dừng ở đất màu đang hoạt động của người khác (không dùng cho ga, nhà máy).',
    effect: { type: 'keep', card: 'rentWaiver' },
  },
  {
    id: 'chance-lottery',
    deck: 'chance',
    title: 'Xổ số kiến thiết',
    description: 'Gieo 1 viên: 1 hoặc 4 nhận 5Đ; 2 hoặc 5 nhận 50Đ; 3 hoặc 6 nhận 150Đ.',
    effect: { type: 'lottery', payouts: LOTTERY_PAYOUTS },
  },
  {
    id: 'chance-nearest-station',
    deck: 'chance',
    title: 'Đến ga gần nhất',
    description:
      'Đến ga đầu tiên phía trước, qua ô Bắt Đầu không nhận 200Đ. Vô chủ: bắt buộc mua. Ga người khác đang hoạt động: gieo 2 viên mới, trả 10 × tổng.',
    effect: { type: 'advanceToNearest', target: 'station', diceMultiplier: 10, collectGo: false },
  },
  {
    id: 'chance-railway-repair',
    deck: 'chance',
    title: 'Hỏng đường ray',
    description: 'Trả theo số ga đang hoạt động (không kể ga cắm): 25/50/100/200Đ.',
    effect: { type: 'payPerStation', amounts: [0, 25, 50, 100, 200] },
  },
  {
    id: 'chance-thap-rua',
    deck: 'chance',
    title: 'Đi đến Tháp Rùa',
    description: 'Tiến tới ô 09; qua ô Bắt Đầu nhận 200Đ; xử lý ô đến.',
    effect: { type: 'moveTo', target: 9 },
  },
  {
    id: 'chance-acting',
    deck: 'chance',
    title: 'Diễn kịch giỏi',
    description: 'Nhận 50Đ từ Ngân hàng.',
    effect: { type: 'receive', amount: 50 },
  },
  {
    id: 'chance-hopscotch',
    deck: 'chance',
    title: 'Nhảy lò cò',
    description: 'Lùi 3 ô, không nhận 200Đ nếu đi qua ô Bắt Đầu; xử lý ô mới.',
    effect: { type: 'moveBack', steps: 3 },
  },
  {
    id: 'chance-jail',
    deck: 'chance',
    title: 'Vào tù là rõ',
    description: 'Đến ô 10, bị giam, không nhận 200Đ.',
    effect: { type: 'goToJail' },
  },
  {
    id: 'chance-landmark',
    deck: 'chance',
    title: 'Đi đến Landmark 81',
    description: 'Tiến tới ô 32; qua ô Bắt Đầu nhận 200Đ; xử lý ô đến.',
    effect: { type: 'moveTo', target: 32 },
  },
  {
    id: 'chance-capital-citizen',
    deck: 'chance',
    title: 'Người thủ đô',
    description:
      'Chỉ có hiệu lực nếu đang sở hữu Phố Cổ (kể cả đang cắm) khi rút. Giữ quyền miễn một lần thuế ở ô 04 hoặc 38. Mất Phố Cổ trước khi dùng thì quyền hết hiệu lực.',
    effect: { type: 'capitalCitizen', requiredTile: 1 },
  },
  {
    id: 'chance-building-gamble',
    deck: 'chance',
    title: 'Canh bạc xây dựng',
    description:
      'So số đất màu của bạn với trung bình (chưa làm tròn) của mọi người. Ít hơn: nâng miễn phí 1 cấp ở một đất hợp lệ. Nhiều hơn: hạ 1 cấp một đất có công trình, không hoàn tiền. Bằng nhau hoặc không có ô hợp lệ: không đổi.',
    effect: { type: 'buildingGamble' },
  },
  {
    id: 'chance-neighbor-fire',
    deck: 'chance',
    title: 'Cháy nhà hàng xóm',
    description:
      'Mỗi người gieo 2 viên. Cộng tất cả điểm, đếm từ vị trí người rút theo chiều đi. Ô đích là đất màu có công trình thì hạ 1 cấp, không hoàn tiền; ô khác không có tác dụng.',
    effect: { type: 'neighborFire' },
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
      'Mỗi nhà trả 40Đ, mỗi khách sạn trả 120Đ. Chủ Nhà Máy Nước đang hoạt động nhận 20% tổng phí, còn lại trả Ngân hàng.',
    effect: {
      type: 'buildingFee',
      perHouse: 40,
      perHotel: 120,
      utilityIndex: 28,
      ownerPercent: 20,
    },
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
  {
    id: 'community-bank-restructure',
    deck: 'community',
    title: 'Ngân hàng tái cơ cấu',
    description:
      'Tính phần nguyên trung bình tiền mặt của tất cả người chơi. Tiền mặt của bạn tăng hoặc giảm để bằng đúng mức đó; người khác không đổi.',
    effect: { type: 'bankRestructure' },
  },
  {
    id: 'community-highway',
    deck: 'community',
    title: 'Mở đường cao tốc',
    description:
      'Chọn 1 trong 22 đất màu (kể cả đang cắm), gieo 1 viên: 1/2/3 đi đến ô cách ô chọn 10/20/30 bước; 4/5/6 đứng tại ô chọn. Không nhận 200Đ; xử lý ô đích.',
    effect: { type: 'highway', stepsByDie: HIGHWAY_STEPS },
  },
  {
    id: 'community-swap',
    deck: 'community',
    title: 'Thằng Bờm đổi quạt mo',
    description:
      'Viên 1 chọn đối thủ theo vòng ghế. Viên 2 chẵn: đổi đất màu rẻ nhất của hai bên; lẻ: đổi đất màu rẻ nhất của bạn lấy ga/nhà máy gần nhất phía trước của đối thủ. Thiếu tài sản thì đối thủ trả bạn 100Đ.',
    effect: { type: 'swapProperty', penalty: 100 },
  },
];

/** Tiền nhận hoặc trả của thẻ "Kẻ khóc người cười". */
export const FORTUNE_MIRROR_AMOUNT = 40;
