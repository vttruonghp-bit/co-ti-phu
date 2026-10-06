import type { GameState, PublicGameState } from '@cotiphu/shared';

/**
 * Màn ván dùng GameState như khi chơi chung một máy. Máy chủ chỉ gửi số lá còn lại của mỗi
 * bộ thẻ (không ai biết thứ tự), nên điền chỗ trống đúng số lá; giao diện không đọc thứ tự thẻ.
 */
export function toGameState(s: PublicGameState): GameState {
  const deck = (n: number) => Array<string>(n).fill('');
  return { ...s, decks: { chance: deck(s.decks.chance), community: deck(s.decks.community) } };
}
