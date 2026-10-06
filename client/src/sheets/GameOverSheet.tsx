import type { GameState } from '@cotiphu/shared';
import { Sheet } from '../components/Sheet';

/** Ván kết thúc: người thua và những người thắng. */
export function GameOverSheet({ game, onNewGame }: { game: GameState; onNewGame: () => void }) {
  return (
    <Sheet
      game={game}
      title="Ván kết thúc"
      footer={
        <button className="btn" onClick={onNewGame}>
          Ván mới
        </button>
      }
    >
      <p>Đang làm</p>
    </Sheet>
  );
}
