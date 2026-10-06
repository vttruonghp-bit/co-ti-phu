import { useState, type ReactNode } from 'react';
import { METRO_FEE_PERCENT, METRO_INDEX, type GameState } from '@cotiphu/shared';
import { Sheet, SheetGlyph } from '../components/Sheet';
import { TileGrid, arrivalAt, tileNumber } from '../components/TileGrid';
import { money, playerById, tileName } from '../game/format';
import type { SheetProps } from './types';
import './move-sheets.css';

/** Phí Metro: một nửa tiền mặt hiện có, làm tròn xuống (luật mục 5). */
const metroFee = (cash: number): number => Math.floor((cash * METRO_FEE_PERCENT) / 100);

/** `extra`: nút Đầu hàng / Đen vl của màn chính, vì màn này che chúng. */
type MoveSheetProps = SheetProps & { extra?: ReactNode };

/** Màn Metro ở ô 10 (hình 2, trên trái): ở lại, hoặc trả nửa tiền mặt để đi tới ô bất kỳ. */
export function MetroSheet(props: MoveSheetProps) {
  const pd = props.game.pending;
  if (pd.type !== 'metro') return null;
  // Mỗi lần tới Metro là một lựa chọn mới: bỏ ô đã chọn của lần trước.
  return (
    <MetroChooser key={`${pd.playerId}-${props.game.turnNumber}`} {...props} id={pd.playerId} />
  );
}

function MetroChooser({ game, dispatch, id, extra }: MoveSheetProps & { id: string }) {
  const p = playerById(game, id)!;
  const [dest, setDest] = useState<number | null>(null);
  const fee = metroFee(p.cash);

  return (
    <Sheet
      game={game}
      icon={
        <SheetGlyph color="var(--blue)">
          <MetroGlyph />
        </SheetGlyph>
      }
      title="Metro · ô 10"
      subtitle={`${p.name} đang tham quan · không ở tù`}
      label={`Metro của ${p.name}`}
      footer={
        <div className="move-footer">
          <MetroPreview game={game} id={id} dest={dest} fee={fee} />
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => void dispatch({ type: 'metro', playerId: id, destination: null })}
            >
              Ở lại
            </button>
            <button
              type="button"
              className="btn btn-blue btn-grow"
              disabled={dest === null}
              onClick={() => {
                if (dest !== null)
                  void dispatch({ type: 'metro', playerId: id, destination: dest });
              }}
            >
              {dest === null ? 'Chọn ô đích' : `Đi Metro · ${money(fee)}`}
            </button>
          </div>
        </div>
      }
    >
      <div className="move-cash box box-blue">
        <div>
          <span className="eyebrow">Tiền mặt lúc đến</span>
          <b className="money-big">{money(p.cash)}</b>
        </div>
        <div className="right">
          <span className="eyebrow">Phí Metro</span>
          <b className="money-big move-fee">{money(fee)}</b>
        </div>
      </div>

      <div className="move-grid-head">
        <h3 className="eyebrow">Chọn ô đích</h3>
        <span className="move-pill">39 ô hợp lệ</span>
      </div>
      <TileGrid
        game={game}
        player={p}
        enabled={(i) => i !== METRO_INDEX}
        selected={dest}
        onSelect={setDest}
      />
      <p className="move-note muted">
        Ô 10 có quân {p.name} đang đứng. Chỉ chuyển quân và trừ tiền khi bấm “Đi Metro”.
      </p>
      {extra}
    </Sheet>
  );
}

interface MetroPreviewProps {
  game: GameState;
  id: string;
  dest: number | null;
  fee: number;
}

/** Xem trước ô đích ngay trên nút: ô đó là gì, của ai, phải trả gì, tiền còn lại. */
function MetroPreview({ game, id, dest, fee }: MetroPreviewProps) {
  const p = playerById(game, id)!;
  if (dest === null) {
    return (
      <div className="move-preview is-empty" aria-live="polite">
        <span>
          <b>Ở lại:</b> không mất gì.
        </span>
        <span>
          <b>Đi Metro:</b> trả ½ tiền mặt ({money(fee)}) rồi chạm ô đích. Không nhận 200Đ.
        </span>
      </div>
    );
  }
  const after = p.cash - fee;
  const arrival = arrivalAt(game, p, dest, after);
  return (
    <div className="move-preview" aria-live="polite">
      <span className="move-preview-route">
        Metro 10 <span aria-hidden="true">→</span>{' '}
        <b>
          {tileNumber(dest)} {tileName(dest)}
        </b>
      </span>
      <span className={`move-preview-effect ${arrival.tone}`}>{arrival.text}</span>
      <span className="move-preview-money">
        {money(p.cash)} − {money(fee)} phí = <b>{money(after)}</b>
      </span>
    </div>
  );
}

function MetroGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="5" y="3" width="14" height="14" rx="3.5" />
      <path d="M5 10h14" />
      <circle cx="9" cy="13.6" r="0.9" fill="currentColor" />
      <circle cx="15" cy="13.6" r="0.9" fill="currentColor" />
      <path d="M8.5 17 6 21M15.5 17l2.5 4" strokeLinecap="round" />
    </svg>
  );
}
