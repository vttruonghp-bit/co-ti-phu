import { DEFAULT_PLAYERS } from '../theme';
import type { SetupScreenProps } from '../sheets/types';

/** Tạo ván mới (hình 5). */
export function SetupScreen({ onStart }: SetupScreenProps) {
  return (
    <main className="phone">
      <button
        className="btn"
        onClick={() =>
          onStart(DEFAULT_PLAYERS.slice(0, 2).map((p, i) => ({ id: `p${i + 1}`, ...p })))
        }
      >
        Bắt đầu ván 2 người
      </button>
    </main>
  );
}
