import { Sheet } from '../components/Sheet';
import type { SheetProps } from './types';

/** Chọn ô cho thẻ Mở đường cao tốc (hình 3, trên trái) hoặc Canh bạc xây dựng. */
export function ChooseTileSheet({ game, dispatch }: SheetProps) {
  const pd = game.pending;
  if (pd.type !== 'chooseTile') return null;
  return (
    <Sheet
      game={game}
      title="Chọn ô"
      footer={
        <button
          className="btn"
          onClick={() =>
            dispatch({ type: 'chooseTile', playerId: pd.playerId, tile: pd.options[0]! })
          }
        >
          Chọn ô đầu
        </button>
      }
    >
      <p>Đang làm</p>
    </Sheet>
  );
}
