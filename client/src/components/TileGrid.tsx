import { BOARD } from '@cotiphu/shared';
import { numbered } from '../game/format';
import './tile-grid.css';

interface TileGridProps {
  /** Ô nào bấm chọn được. */
  enabled: (index: number) => boolean;
  selected: number | null;
  onSelect: (index: number) => void;
  /** Ẩn hẳn các ô không chọn được (Metro bỏ ô 10) thay vì làm mờ. */
  hideDisabled?: boolean;
}

/** Lưới đủ 40 ô (5 cột) để chọn ô đích: dùng cho Metro, Cao tốc, Canh bạc. */
export function TileGrid({ enabled, selected, onSelect, hideDisabled = false }: TileGridProps) {
  return (
    <div className="tile-grid" role="listbox" aria-label="Chọn ô">
      {BOARD.map((t) => {
        const ok = enabled(t.index);
        if (!ok && hideDisabled) return null;
        return (
          <button
            key={t.index}
            type="button"
            role="option"
            aria-selected={selected === t.index}
            disabled={!ok}
            className={`tile-grid-item kind-${t.kind}${selected === t.index ? ' is-selected' : ''}`}
            onClick={() => onSelect(t.index)}
          >
            {numbered(t.index)}
          </button>
        );
      })}
    </div>
  );
}
