import { useRef, useState, type ReactNode } from 'react';
import {
  BOARD,
  BOARD_SIZE,
  CHANCE_CARDS,
  COMMUNITY_CARDS,
  type GameState,
  type Pending,
  type PlayerState,
} from '@cotiphu/shared';
import { Dice } from '../components/Dice';
import { Sheet, SheetGlyph } from '../components/Sheet';
import { TileGrid, arrivalAt, tileNumber } from '../components/TileGrid';
import { SHORT_NAMES, levelText, money, playerById, tileName } from '../game/format';
import type { SheetProps } from './types';
import './move-sheets.css';

type ChoosePending = Extract<Pending, { type: 'chooseTile' }>;

const HIGHWAY_CARD = COMMUNITY_CARDS.find((c) => c.effect.type === 'highway')!;
const GAMBLE_CARD = CHANCE_CARDS.find((c) => c.effect.type === 'buildingGamble')!;

/** Kết quả viên xúc xắc Cao tốc, gộp các mặt cùng số bước: 1 → 10, 2 → 20, 3 → 30, 4·5·6 → 0. */
const HIGHWAY_OUTCOMES = (() => {
  const e = HIGHWAY_CARD.effect;
  if (e.type !== 'highway') throw new Error('Thiếu thẻ Mở đường cao tốc');
  const bySteps = new Map<number, number[]>();
  for (const d of [1, 2, 3, 4, 5, 6] as const) {
    const steps = e.stepsByDie[d];
    bySteps.set(steps, [...(bySteps.get(steps) ?? []), d]);
  }
  return [...bySteps].map(([steps, dice]) => ({ steps, dice }));
})();

/** Mặt xúc xắc ở góc các ô đích 10, 20, 30 bước (4·5·6 là chính ô đang chọn). */
function highwayMarks(tile: number): Map<number, ReactNode> {
  return new Map(
    HIGHWAY_OUTCOMES.filter((o) => o.steps > 0).map((o) => [
      (tile + o.steps) % BOARD_SIZE,
      <Dice values={o.dice} color="var(--blue)" size={14} />,
    ]),
  );
}

/** Chọn ô cho thẻ Mở đường cao tốc (hình 3, trên trái) hoặc Canh bạc xây dựng. */
export function ChooseTileSheet(props: SheetProps) {
  const pd = props.game.pending;
  if (pd.type !== 'chooseTile') return null;
  const key = `${pd.playerId}-${pd.purpose}-${props.game.turnNumber}-${pd.options.join('.')}`;
  return <TileChooser key={key} {...props} pd={pd} />;
}

function TileChooser({ game, dispatch, pd }: SheetProps & { pd: ChoosePending }) {
  const p = playerById(game, pd.playerId)!;
  const [tile, setTile] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const highway = pd.purpose === 'highway';
  const up = pd.purpose === 'gambleUp';
  const confirm = () => tile !== null && dispatch({ type: 'chooseTile', playerId: p.id, tile });

  const footer = highway ? (
    <div className="move-footer">
      <HighwayPreview game={game} p={p} tile={tile} />
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-outline"
          disabled={tile === null}
          onClick={() => {
            setTile(null);
            gridRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }}
        >
          Đổi đất
        </button>
        <button
          type="button"
          className="btn btn-blue btn-grow"
          disabled={tile === null}
          onClick={confirm}
        >
          {tile === null ? 'Chọn 1 ô đất' : `Sục từ ${SHORT_NAMES[tile]}`}
        </button>
      </div>
    </div>
  ) : (
    <div className="move-footer">
      <GamblePreview game={game} tile={tile} up={up} />
      <button
        type="button"
        className={`btn ${up ? 'btn-teal' : 'btn-red'}`}
        disabled={tile === null}
        onClick={confirm}
      >
        {tile === null
          ? 'Chọn 1 ô đất'
          : up
            ? `Nâng ${SHORT_NAMES[tile]} miễn phí`
            : `Hạ 1 cấp ${SHORT_NAMES[tile]}`}
      </button>
    </div>
  );

  return (
    <Sheet
      game={game}
      icon={
        highway ? (
          <SheetGlyph color="var(--red)">
            <RoadGlyph />
          </SheetGlyph>
        ) : (
          <SheetGlyph color="var(--orange)">
            <GambleGlyph up={up} />
          </SheetGlyph>
        )
      }
      title={highway ? 'Khí Vận · Cao tốc' : 'Canh bạc xây dựng'}
      subtitle={
        highway
          ? `Chọn đất · ${p.name} tự sục một viên`
          : up
            ? `Cơ Hội · ${p.name} được nâng miễn phí 1 cấp`
            : `Cơ Hội · ${p.name} phải hạ 1 cấp`
      }
      label={highway ? 'Chọn ô cho Mở đường cao tốc' : 'Chọn ô cho Canh bạc xây dựng'}
      footer={footer}
    >
      {highway ? (
        <div className="move-banner is-community">
          <b className="move-banner-title">{HIGHWAY_CARD.title}</b>
          <p>{HIGHWAY_CARD.description}</p>
        </div>
      ) : (
        <GambleCompare game={game} p={p} up={up} />
      )}

      <div className="move-grid-head" ref={gridRef}>
        <h3 className="eyebrow">
          Chọn 1 trong {pd.options.length} {highway ? 'ô đất' : 'đất hợp lệ'}
        </h3>
        <span className="move-pill">{pd.options.length} ô đất</span>
      </div>
      <TileGrid
        game={game}
        player={p}
        enabled={(i) => pd.options.includes(i)}
        selected={tile}
        onSelect={setTile}
        marks={highway && tile !== null ? highwayMarks(tile) : undefined}
      />
      <p className="move-note muted">
        {highway
          ? 'Kể cả đất đang cắm, của ai cũng được. Chỉ đi khi bấm xác nhận.'
          : `${GAMBLE_CARD.title} đếm cả đất đang cắm, trung bình chưa làm tròn. Cấp nhà chỉ đổi khi bấm xác nhận.`}
      </p>
    </Sheet>
  );
}

/** Ô chọn và 4 kết quả viên xúc xắc: đi 10, 20, 30 bước hoặc đứng tại ô chọn. */
function HighwayPreview({
  game,
  p,
  tile,
}: {
  game: GameState;
  p: PlayerState;
  tile: number | null;
}) {
  if (tile === null) {
    return (
      <div className="move-preview is-empty" aria-live="polite">
        <span className="eyebrow">Sục 1 xúc xắc</span>
        <span className="muted">Chạm một ô đất để xem trước 4 kết quả. Không nhận 200Đ.</span>
      </div>
    );
  }
  return (
    <div className="move-preview" aria-live="polite">
      <span className="move-preview-route">
        Từ{' '}
        <b>
          {tileNumber(tile)} {tileName(tile)}
        </b>
        , sục 1 viên:
      </span>
      <ul className="move-outcomes">
        {HIGHWAY_OUTCOMES.map(({ steps, dice }) => {
          const to = (tile + steps) % BOARD_SIZE;
          const arrival = arrivalAt(game, p, to);
          return (
            <li key={steps}>
              <Dice values={dice} color="var(--blue)" size={15} />
              <b className="move-outcome-to">
                {steps === 0 ? 'Đứng tại' : '→'} {tileNumber(to)} {SHORT_NAMES[to]}
              </b>
              <span className={`move-outcome-effect ${arrival.tone}`}>{arrival.short}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** So số đất màu với trung bình (lấy từ thẻ vừa rút, nếu không có thì tính lại). */
function GambleCompare({ game, p, up }: { game: GameState; p: PlayerState; up: boolean }) {
  const ev = [...game.events]
    .reverse()
    .find((e) => e.type === 'card' && e.playerId === p.id && e.detail?.kind === 'gamble');
  const detail = ev?.type === 'card' && ev.detail?.kind === 'gamble' ? ev.detail : null;
  const props = (id: string) =>
    game.tiles.filter((t, i) => t?.owner === id && BOARD[i]!.kind === 'property').length;
  const actives = game.players.filter((x) => x.status === 'active');
  const mine = detail?.mine ?? props(p.id);
  const average = detail?.average ?? actives.reduce((a, x) => a + props(x.id), 0) / actives.length;
  const avgText = average.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  return (
    <div className="move-cash move-gamble box box-amber">
      <div>
        <span className="eyebrow">Đất màu của {p.name}</span>
        <b className="money-big">{mine}</b>
      </div>
      <div className="right">
        <span className="eyebrow">Trung bình cả bàn</span>
        <b className="money-big">{avgText}</b>
      </div>
      <p className="move-cash-note">
        {up ? (
          <>
            <b>Ít hơn trung bình:</b> nâng miễn phí 1 cấp ở một đất của bạn đang hoạt động, chưa có
            khách sạn.
          </>
        ) : (
          <>
            <b>Nhiều hơn trung bình:</b> hạ 1 cấp một đất có công trình của bạn, không hoàn tiền.
          </>
        )}
      </p>
    </div>
  );
}

/** Cấp nhà và tiền thuê trước → sau của ô đang chọn. */
function GamblePreview({ game, tile, up }: { game: GameState; tile: number | null; up: boolean }) {
  if (tile === null) {
    return (
      <div className="move-preview is-empty" aria-live="polite">
        <span className="eyebrow">Xem trước</span>
        <span className="muted">Chạm một ô sáng trên lưới để chọn đất.</span>
      </div>
    );
  }
  const t = BOARD[tile]!;
  const level = game.tiles[tile]?.level ?? 0;
  const next = up ? level + 1 : level - 1;
  const rents = t.kind === 'property' ? t.rents : null;
  return (
    <div className="move-preview" aria-live="polite">
      <span className="move-preview-route">
        <b>
          {tileNumber(tile)} {t.name}
        </b>
        : {levelText(level)} <span aria-hidden="true">→</span>{' '}
        <b className={up ? 'up' : 'down'}>{levelText(next)}</b>
      </span>
      {rents && (
        <span className="move-preview-money">
          Tiền thuê {money(rents[level]!)} <span aria-hidden="true">→</span>{' '}
          <b className={up ? 'up' : 'down'}>{money(rents[next]!)}</b>
          {up ? ' · không mất tiền' : ' · không hoàn tiền'}
        </span>
      )}
    </div>
  );
}

function RoadGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M8.5 3 4 21M15.5 3 20 21" strokeLinecap="round" />
      <path d="M12 4v2.5M12 10v3M12 16.5V20" strokeLinecap="round" />
    </svg>
  );
}

function GambleGlyph({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3.5 11 12 3.5l8.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9.5V20h12V9.5" strokeLinejoin="round" />
      <path
        d={up ? 'M12 17.5v-6M9.3 14l2.7-2.7 2.7 2.7' : 'M12 11.5v6M9.3 15l2.7 2.7 2.7-2.7'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
