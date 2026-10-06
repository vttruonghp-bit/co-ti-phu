import type { Action, GameEvent, GameState, NewPlayer } from '@cotiphu/shared';

/** Mọi màn phụ trong ván nhận chung các thứ này. */
export interface SheetProps {
  game: GameState;
  /** Trạng thái ngay trước thao tác cuối (null ở đầu ván). */
  previous: GameState | null;
  /** Gửi thao tác cho bộ luật; trả thông báo lỗi hoặc null nếu thành công. */
  dispatch: (action: Action) => string | null;
  /** Đóng màn phụ (khi màn đó cho phép đóng). */
  onClose: () => void;
}

export type CardEvent = Extract<GameEvent, { type: 'card' }>;
export type HighwayEvent = Extract<GameEvent, { type: 'highway' }>;

export interface SetupScreenProps {
  /** Bắt đầu ván; trả thông báo lỗi nếu người chơi không hợp lệ. */
  onStart: (players: NewPlayer[]) => string | null;
}
