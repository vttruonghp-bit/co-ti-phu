import { describe, expect, it } from 'vitest';
import {
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  createGame,
  seededRng,
  type PublicGameState,
} from '@cotiphu/shared';
import { cleanCode, cleanName } from '../src/online/storage';
import { toGameState } from '../src/online/view';

// Phần thuần của chơi online phía trình duyệt: mã phòng người dùng gõ, tên, trạng thái ván công khai.

describe('cleanCode', () => {
  it('đổi chữ hoa, bỏ kí tự không có trong bảng mã và khoảng trắng', () => {
    expect(cleanCode(' k7m 2qx ')).toBe('K7M2QX');
    expect(cleanCode('ab-cd.ef')).toBe('ABCDEF');
  });

  it('bỏ các kí tự dễ nhầm (0, O, 1, I, L) vì bảng mã không có', () => {
    expect(cleanCode('O0I1L')).toBe('');
  });

  it(`cắt còn ${ROOM_CODE_LENGTH} kí tự`, () => {
    expect(cleanCode('ABCDEFGHJK')).toHaveLength(ROOM_CODE_LENGTH);
  });

  it('giữ nguyên mã hợp lệ', () => {
    const code = ROOM_CODE_ALPHABET.slice(0, ROOM_CODE_LENGTH);
    expect(cleanCode(code)).toBe(code);
  });
});

describe('cleanName', () => {
  it('bỏ khoảng trắng thừa và cắt tên quá dài', () => {
    expect(cleanName('  Nguyễn   Văn  ')).toBe('Nguyễn Văn');
    expect(cleanName('Một cái tên rất dài').length).toBeLessThanOrEqual(12);
  });
});

describe('toGameState', () => {
  const game = createGame(
    [
      { id: 'p1', name: 'Linh', color: 0, icon: 0 },
      { id: 'p2', name: 'Minh', color: 1, icon: 1 },
    ],
    seededRng(7),
  );
  const pub: PublicGameState = {
    ...game,
    decks: { chance: game.decks.chance.length, community: game.decks.community.length },
  };

  it('giữ số lá mỗi bộ thẻ nhưng không có thứ tự thẻ', () => {
    const s = toGameState(pub);
    expect(s.decks.chance).toHaveLength(game.decks.chance.length);
    expect(s.decks.community).toHaveLength(game.decks.community.length);
    expect(s.decks.chance.every((c) => c === '')).toBe(true);
  });

  it('các phần khác giữ nguyên', () => {
    const { decks: _a, ...rest } = toGameState(pub);
    const { decks: _b, ...want } = game;
    expect(rest).toEqual(want);
  });
});
