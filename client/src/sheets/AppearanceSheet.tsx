import { Sheet } from '../components/Sheet';
import type { SheetProps } from './types';

/** Đen vl: đổi màu và kí hiệu (hình 4, trái). */
export function AppearanceSheet({ game, onClose }: SheetProps & { playerId: string }) {
  return (
    <Sheet
      game={game}
      title="Đen vl · đổi quân"
      footer={
        <button className="btn" onClick={onClose}>
          Chung thủy
        </button>
      }
    >
      <p>Đang làm</p>
    </Sheet>
  );
}
