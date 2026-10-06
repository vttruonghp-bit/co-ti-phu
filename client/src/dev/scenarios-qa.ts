/** Tình huống cho chơi thử tự động: bàn cuối ván, ai cũng ít tiền để mau có người phá sản. */
import type { GameState } from '@cotiphu/shared';
import { autoplay, fresh } from './helpers';

/** Tự chơi `steps` thao tác, dừng ở đầu một lượt rồi cho mọi người còn `cash` tiền mặt. */
function endgame(n: number, steps: number, seed: number, cash: number): GameState {
  let s = autoplay(fresh(n), steps, seed);
  for (let k = 0; k < 40 && s.pending.type !== 'roll'; k++) s = autoplay(s, 1, seed + 100 + k);
  if (s.pending.type === 'ended') return fresh(n);
  s.players.forEach((p) => (p.cash = cash));
  return s;
}

export const QA_SCENARIOS: Record<string, () => GameState> = {
  'qa-endgame-2': () => endgame(2, 160, 3, 90),
  'qa-endgame-4': () => endgame(4, 200, 5, 70),
  'qa-endgame-6': () => endgame(6, 220, 7, 60),
};
