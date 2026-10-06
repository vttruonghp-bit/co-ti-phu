import { Sheet } from '../components/Sheet';
import type { SheetProps } from './types';

/** Màn Metro ở ô 10 (hình 2, trên trái). */
export function MetroSheet({ game, dispatch }: SheetProps) {
  const id = 'playerId' in game.pending ? game.pending.playerId : '';
  return (
    <Sheet
      game={game}
      title="Metro · ô 10"
      footer={
        <button
          className="btn"
          onClick={() => dispatch({ type: 'metro', playerId: id, destination: null })}
        >
          Ở lại
        </button>
      }
    >
      <p>Đang làm</p>
    </Sheet>
  );
}
