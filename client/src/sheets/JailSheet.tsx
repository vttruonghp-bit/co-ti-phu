import { Sheet } from '../components/Sheet';
import type { SheetProps } from './types';

/** Màn đang ở tù (hình 2, dưới trái). `onOpenManage` mở Ụp/Mở ở đầu lượt. */
export function JailSheet({ game, dispatch }: SheetProps & { onOpenManage: () => void }) {
  const id = 'playerId' in game.pending ? game.pending.playerId : '';
  return (
    <Sheet
      game={game}
      title="Đang ở tù · ô 10"
      footer={
        <button className="btn" onClick={() => dispatch({ type: 'roll', playerId: id })}>
          Thử đổ đôi
        </button>
      }
    >
      <p>Đang làm</p>
    </Sheet>
  );
}
