import { getCard } from '@cotiphu/shared';
import { Sheet } from '../components/Sheet';
import type { CardEvent, HighwayEvent, SheetProps } from './types';

/** Lá thẻ vừa rút và kết quả của nó (hình 3). */
export function CardSheet({
  game,
  event,
  onContinue,
}: SheetProps & { event: CardEvent | HighwayEvent; onContinue: () => void }) {
  if (event.type === 'highway') {
    return (
      <Sheet
        game={game}
        title="Mở đường cao tốc"
        footer={
          <button className="btn" onClick={onContinue}>
            Tiếp tục
          </button>
        }
      >
        <p>
          Đổ ra {event.die}, đi tới ô {event.to}.
        </p>
      </Sheet>
    );
  }
  const card = getCard(event.cardId);
  return (
    <Sheet
      game={game}
      title={card.title}
      footer={
        <button className="btn" onClick={onContinue}>
          Tiếp tục
        </button>
      }
    >
      <p>{card.description}</p>
    </Sheet>
  );
}
