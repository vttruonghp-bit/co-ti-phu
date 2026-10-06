/** Tình huống kiểm thử từng ô / từng lá thẻ (mở `/?scenario=test-community-...`). */
import type { GameState } from '@cotiphu/shared';

export const TEST_COMMUNITY_SCENARIOS: Record<string, () => GameState> = {};
