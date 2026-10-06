/**
 * Giao thức Socket.IO giữa trình duyệt và máy chủ khi chơi online (Bước 3).
 * Máy chủ là trọng tài duy nhất: trình duyệt chỉ gửi yêu cầu, máy chủ kiểm tra luật,
 * đổ xúc xắc, rút thẻ rồi gửi trạng thái mới cho cả phòng.
 */
import type { Action, GameState } from './engine/types';

/** Mã phòng: 6 kí tự dễ đọc (không có 0/O, 1/I/L). */
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const PLAYER_NAME_MAX = 12;

/** Một ghế trong phòng. `id` trùng với mã người chơi trong GameState khi ván bắt đầu. */
export interface Seat {
  id: string;
  name: string;
  color: number;
  icon: number;
  /** Người này đang mở trang (có kết nối). */
  connected: boolean;
  isHost: boolean;
}

export type RoomPhase = 'lobby' | 'playing' | 'ended';

/**
 * Trạng thái ván gửi cho trình duyệt: giống GameState nhưng giấu thứ tự bộ thẻ
 * (chỉ còn số lá) để không ai biết trước lá sắp rút.
 */
export type PublicGameState = Omit<GameState, 'decks'> & {
  decks: Record<keyof GameState['decks'], number>;
};

export interface RoomView {
  code: string;
  phase: RoomPhase;
  /** Số người chủ phòng chọn (2–6). Ván bắt đầu khi đủ số ghế này. */
  capacity: number;
  seats: Seat[];
  /** null khi còn ở phòng chờ. */
  game: PublicGameState | null;
  /** Trạng thái ngay trước thao tác cuối (để hiện "trước → sau"), null nếu chưa có. */
  previous: PublicGameState | null;
  /** Số thao tác đã áp dụng; tăng mỗi lần trạng thái đổi. */
  version: number;
}

/** Thông tin để vào lại đúng ghế khi tải lại trang hoặc rớt mạng; lưu trong trình duyệt. */
export interface SeatTicket {
  code: string;
  playerId: string;
  /** Bí mật riêng của ghế, chỉ người ngồi ghế đó biết. */
  token: string;
}

export interface Profile {
  name: string;
  color: number;
  icon: number;
}

/** Kết quả mọi yêu cầu: thành công kèm dữ liệu, hoặc thông báo lỗi tiếng Việt. */
export type Ack<T = void> =
  ([T] extends [void] ? { ok: true } : { ok: true; data: T }) | { ok: false; error: string };

export interface ClientToServerEvents {
  /** Chủ phòng tạo phòng, chọn số người và hồ sơ của mình. */
  'room:create': (
    req: { capacity: number; profile: Profile },
    ack: (res: Ack<SeatTicket>) => void,
  ) => void;
  /** Vào phòng bằng mã. */
  'room:join': (
    req: { code: string; profile: Profile },
    ack: (res: Ack<SeatTicket>) => void,
  ) => void;
  /** Vào lại ghế cũ bằng vé đã lưu. */
  'room:resume': (ticket: SeatTicket, ack: (res: Ack<SeatTicket>) => void) => void;
  /** Đổi tên, màu, biểu tượng khi còn ở phòng chờ. */
  'room:profile': (profile: Profile, ack: (res: Ack) => void) => void;
  /** Chủ phòng đổi số người (không nhỏ hơn số người đang có). */
  'room:capacity': (capacity: number, ack: (res: Ack) => void) => void;
  /** Chủ phòng bắt đầu ván khi đủ người. */
  'room:start': (ack: (res: Ack) => void) => void;
  /** Rời phòng chờ (trong ván thì dùng Đầu hàng). */
  'room:leave': (ack: (res: Ack) => void) => void;
  /** Gửi một thao tác trong ván; `playerId` phải là của chính ghế này, không được gửi 'timeout'. */
  'game:action': (action: Action, ack: (res: Ack) => void) => void;
}

export interface ServerToClientEvents {
  /** Trạng thái phòng mới (gửi cho cả phòng mỗi khi có thay đổi). */
  'room:state': (room: RoomView) => void;
  /** Phòng bị đóng (ví dụ chủ phòng rời phòng chờ). */
  'room:closed': (reason: string) => void;
}
