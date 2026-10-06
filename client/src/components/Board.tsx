import type { ReactNode } from 'react';
import { BOARD, HOTEL_LEVEL, gridPosition, type GameState, type Tile } from '@cotiphu/shared';
import { SHORT_NAMES, playerById } from '../game/format';
import { colorOf } from '../theme';
import { TokenIcon } from './TokenIcon';
import './board.css';

interface BoardProps {
  game: GameState;
  /** Ô đang được làm nổi (thường là ô người tới lượt đang đứng). */
  focus?: number | null;
  onTileClick?: (index: number) => void;
  /** Nội dung ô trung tâm 9×9. */
  children?: ReactNode;
}

function cornerSide(tile: Tile): string {
  const { row, col } = gridPosition(tile.index);
  if (row === 10) return 'bottom';
  if (row === 0) return 'top';
  if (col === 0) return 'left';
  return 'right';
}

/** Dải trên ô đất: 5 đoạn (4 nhà + khách sạn), tô đậm theo màu chủ đến cấp hiện tại. */
function LevelStrip({ level, color }: { level: number; color: string | null }) {
  return (
    <span className="strip" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((k) => (
        <span
          key={k}
          className="strip-seg"
          style={
            color
              ? { background: color, opacity: level >= k ? 1 : 0.28 }
              : { background: '#d9dee7' }
          }
        />
      ))}
    </span>
  );
}

export function Board({ game, focus, onTileClick, children }: BoardProps) {
  return (
    <div className="board" role="grid" aria-label="Bàn cờ">
      {BOARD.map((tile) => {
        const { row, col } = gridPosition(tile.index);
        const st = game.tiles[tile.index];
        const owner = playerById(game, st?.owner);
        const ownerColor = owner ? colorOf(owner.color) : null;
        const here = game.players.filter((p) => p.status === 'active' && p.position === tile.index);
        const hotel = tile.kind === 'property' && st?.level === HOTEL_LEVEL;
        const classes = [
          'tile',
          `tile-${tile.kind}`,
          tile.index % 10 === 0 ? 'tile-corner' : '',
          hotel ? 'tile-hotel' : '',
          st?.mortgaged ? 'tile-mortgaged' : '',
          focus === tile.index ? 'tile-focus' : '',
          `side-${cornerSide(tile)}`,
        ]
          .filter(Boolean)
          .join(' ');
        const style: Record<string, string | number> = { gridRow: row + 1, gridColumn: col + 1 };
        if (ownerColor) {
          style['--owner'] = ownerColor.main;
          style['--owner-soft'] = ownerColor.soft;
        }
        const label = [
          tile.name,
          owner ? `chủ ${owner.name}` : null,
          st?.mortgaged ? 'đang cắm' : null,
        ]
          .filter(Boolean)
          .join(', ');
        return (
          <button
            type="button"
            key={tile.index}
            className={classes}
            style={style}
            onClick={onTileClick ? () => onTileClick(tile.index) : undefined}
            aria-label={label}
          >
            {tile.kind === 'property' && (
              <LevelStrip level={st?.level ?? 0} color={ownerColor?.main ?? null} />
            )}
            {(tile.kind === 'station' || tile.kind === 'utility') && (
              <span
                className="strip strip-solid"
                aria-hidden="true"
                style={{ background: ownerColor?.main ?? 'transparent' }}
              />
            )}
            <span className="tile-name">{SHORT_NAMES[tile.index]}</span>
            {hotel && <span className="sparkle" aria-hidden="true" />}
            {here.length > 0 && (
              <span className="tokens">
                {here.map((p) => (
                  <TokenIcon
                    key={p.id}
                    icon={p.icon}
                    color={p.color}
                    size={13}
                    blink={game.players[game.current]?.id === p.id}
                  />
                ))}
              </span>
            )}
          </button>
        );
      })}
      <div className="board-center">{children}</div>
    </div>
  );
}
