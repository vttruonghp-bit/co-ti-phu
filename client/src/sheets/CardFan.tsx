import { useState } from 'react';
import type { DeckKind } from '@cotiphu/shared';
import { Sheet } from '../components/Sheet';
import './card-fan.css';

const NAME: Record<DeckKind, string> = { chance: 'Cơ Hội', community: 'Khí Vận' };
const BACK: Record<DeckKind, string> = {
  chance: '/assets/the-co-hoi.png',
  community: '/assets/the-khi-van.png',
};

/** Quạt bài úp: người chơi chạm 1 lá. Chỉ để xem; lá thật do bộ luật rút sẵn. */
export function CardFan({
  deck,
  count,
  onPick,
}: {
  deck: DeckKind;
  count: number;
  onPick: () => void;
}) {
  const shown = Math.min(count, 9);
  const [chosen, setChosen] = useState<number | null>(null);
  const pick = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
    setTimeout(onPick, 450);
  };
  return (
    <Sheet
      title={`Rút thẻ ${NAME[deck]} (${count} lá)`}
      footer={
        <div className="btn-row">
          <button
            type="button"
            className={`btn btn-grow ${deck === 'chance' ? 'btn-orange' : 'btn-blue'}`}
            onClick={() => pick(Math.floor(shown / 2))}
          >
            Rút thẻ
          </button>
        </div>
      }
    >
      <div className="fan">
        {Array.from({ length: shown }, (_, i) => {
          const mid = (shown - 1) / 2;
          const angle = shown > 1 ? (i - mid) * (60 / (shown - 1)) : 0;
          return (
            <button
              type="button"
              key={i}
              className={`fan-card${chosen === i ? ' is-chosen' : ''}`}
              style={{ ['--a' as string]: `${angle}deg` }}
              onClick={() => pick(i)}
              aria-label={`Lá ${i + 1}`}
            >
              <img src={BACK[deck]} alt="" />
            </button>
          );
        })}
      </div>
      <p className="fan-hint">Chọn 1 lá bài để rút · còn {count} lá</p>
    </Sheet>
  );
}
