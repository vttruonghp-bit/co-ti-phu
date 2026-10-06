import { Sheet } from '../components/Sheet';
import type { SheetProps } from './types';

/** Đầu hàng có bước xác nhận cuối (hình 4, phải). */
export function SurrenderSheet({ game, onClose }: SheetProps & { playerId: string }) {
  return (
    <Sheet
      game={game}
      title="Đầu hàng"
      footer={
        <button className="btn" onClick={onClose}>
          Ở lại
        </button>
      }
    >
      <p>Đang làm</p>
    </Sheet>
  );
}
