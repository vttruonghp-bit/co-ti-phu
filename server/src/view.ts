/**
 * Những gì trình duyệt được thấy. Dựng từng trường một (không sao chép cả đối tượng)
 * để vé, socket hay thứ tự bộ thẻ không bao giờ lọt ra ngoài.
 */
import type { GameState, PublicGameState, RoomView, Seat } from '@cotiphu/shared';
import type { Room } from './rooms';

/** Giấu thứ tự bộ thẻ, chỉ còn số lá. */
export function publicGame(game: GameState): PublicGameState {
  const { decks, ...rest } = game;
  return {
    ...rest,
    decks: { chance: decks.chance.length, community: decks.community.length },
  };
}

export function roomView(room: Room): RoomView {
  const seats: Seat[] = room.seats.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    icon: s.icon,
    connected: s.socketId !== null,
    isHost: s.id === room.hostId,
  }));
  return {
    code: room.code,
    phase: room.phase,
    capacity: room.capacity,
    seats,
    game: room.game && publicGame(room.game),
    previous: room.previous && publicGame(room.previous),
    version: room.version,
  };
}
