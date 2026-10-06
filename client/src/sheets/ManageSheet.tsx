import { Sheet } from '../components/Sheet';
import type { SheetProps } from './types';

export type ManageMode = 'manage' | 'debt' | 'view';

/** Ụp/Mở (mode manage), Xử lý nợ (mode debt) hoặc chỉ xem tài sản (mode view). Hình 2, bên phải. */
export function ManageSheet({
  game,
  onClose,
}: SheetProps & { mode: ManageMode; playerId: string }) {
  return (
    <Sheet
      game={game}
      title="Ụp / Mở"
      footer={
        <button className="btn" onClick={onClose}>
          Đóng
        </button>
      }
    >
      <p>Đang làm</p>
    </Sheet>
  );
}
