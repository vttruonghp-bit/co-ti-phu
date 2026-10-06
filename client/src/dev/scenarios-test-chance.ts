/** Tình huống kiểm thử từng ô / từng lá thẻ (mở `/?scenario=test-chance-...`). */
import type { GameState } from '@cotiphu/shared';

export const TEST_CHANCE_SCENARIOS: Record<string, () => GameState> = {};
