/** Tình huống kiểm thử từng ô / từng lá thẻ (mở `/?scenario=test-tiles-...`). */
import type { GameState } from '@cotiphu/shared';

export const TEST_TILES_SCENARIOS: Record<string, () => GameState> = {};
