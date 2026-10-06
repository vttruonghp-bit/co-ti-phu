import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import {
  BOARD,
  HOTEL_LEVEL,
  STATION_RENTS,
  UTILITY_MULTIPLIERS,
  maxLiquidationValue,
  redeemCost,
  type GameState,
  type PlayerState,
} from '@cotiphu/shared';
import { SHORT_NAMES, levelText, money, playerById } from '../game/format';
import { colorOf } from '../theme';
import { TokenIcon } from './TokenIcon';
import './tile-grid.css';

interface TileGridProps {
  /** Ván đang chơi: hiện màu chủ, cấp nhà và đất đang cắm trên từng ô. */
  game?: GameState;
  /** Người đang chọn: đánh dấu ô người đó đang đứng. */
  player?: PlayerState;
  /** Ô nào bấm chọn được. */
  enabled: (index: number) => boolean;
  selected: number | null;
  onSelect: (index: number) => void;
  /** Dấu nhỏ ở góc một số ô, ví dụ mặt xúc xắc dẫn tới ô đó (Cao tốc). */
  marks?: ReadonlyMap<number, ReactNode>;
  /** Ẩn hẳn các ô không chọn được thay vì làm mờ (màn Cao tốc, Metro luôn hiện đủ 40 ô). */
  hideDisabled?: boolean;
}

/** "05" cho ô số 5. */
export const tileNumber = (i: number): string => String(i).padStart(2, '0');

/** Dải trên ô: 5 đoạn cấp nhà theo màu chủ (đất màu) hoặc một dải liền (ga, nhà máy). */
function Strip({ kind, level, color }: { kind: string; level: number; color: string | null }) {
  if (kind === 'station' || kind === 'utility') {
    return (
      <span
        className="tile-grid-strip"
        aria-hidden="true"
        style={{ background: color ?? 'transparent' }}
      />
    );
  }
  return (
    <span className="tile-grid-strip is-levels" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((k) => (
        <span
          key={k}
          style={
            color
              ? { background: color, opacity: level >= k ? 1 : 0.25 }
              : { background: '#dde2ea' }
          }
        />
      ))}
    </span>
  );
}

/** Lưới đủ 40 ô (5 cột) để chọn ô đích: dùng cho Metro, Cao tốc, Canh bạc. */
export function TileGrid({
  game,
  player,
  enabled,
  selected,
  onSelect,
  marks,
  hideDisabled = false,
}: TileGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Phần xem trước dưới màn có thể cao lên sau khi chọn: giữ ô vừa chọn trong tầm nhìn.
  useEffect(() => {
    if (selected === null) return;
    const el = ref.current?.querySelector<HTMLElement>(`[data-tile="${selected}"]`);
    const frame = requestAnimationFrame(() => el?.scrollIntoView?.({ block: 'nearest' }));
    return () => cancelAnimationFrame(frame);
  }, [selected]);

  return (
    <div className="tile-grid" role="listbox" aria-label="Chọn ô" ref={ref}>
      {BOARD.map((t) => {
        const ok = enabled(t.index);
        if (!ok && hideDisabled) return null;
        const st = game?.tiles[t.index];
        const owner = game ? playerById(game, st?.owner) : undefined;
        const ownerColor = owner ? colorOf(owner.color).main : null;
        const here = player?.position === t.index;
        const mark = marks?.get(t.index);
        const ownable = t.kind === 'property' || t.kind === 'station' || t.kind === 'utility';
        const cls = [
          'tile-grid-item',
          `kind-${t.kind}`,
          t.index % 10 === 0 && 'is-corner',
          st?.mortgaged && 'is-mortgaged',
          st?.level === HOTEL_LEVEL && 'is-hotel',
          here && 'is-here',
          mark && 'is-marked',
          selected === t.index && 'is-selected',
        ]
          .filter(Boolean)
          .join(' ');
        const label = [
          `${tileNumber(t.index)} ${t.name}`,
          owner ? `chủ ${owner.name}` : ownable ? 'chưa có chủ' : null,
          t.kind === 'property' && owner ? levelText(st!.level) : null,
          st?.mortgaged ? 'đang cắm' : null,
          here ? `${player!.name} đang đứng ở đây` : null,
        ]
          .filter(Boolean)
          .join(', ');
        return (
          <button
            key={t.index}
            type="button"
            role="option"
            data-tile={t.index}
            aria-selected={selected === t.index}
            aria-label={label}
            disabled={!ok}
            className={cls}
            style={ownerColor ? ({ '--owner': ownerColor } as CSSProperties) : undefined}
            onClick={() => onSelect(t.index)}
          >
            {ownable && <Strip kind={t.kind} level={st?.level ?? 0} color={ownerColor} />}
            <span className="tile-grid-top">
              <span className="tile-grid-num">{tileNumber(t.index)}</span>
              {mark && <span className="tile-grid-mark">{mark}</span>}
              {here && player && !mark && (
                <TokenIcon icon={player.icon} color={player.color} size={15} />
              )}
            </span>
            <span className="tile-grid-name">{SHORT_NAMES[t.index]}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface Arrival {
  /** Điều xảy ra ở ô đến, một câu. */
  text: string;
  /** Bản rút gọn cho chỗ hẹp (bảng kết quả Cao tốc). */
  short: string;
  /** 'down' khi phải trả tiền, 'warn' khi thiếu tiền phải Xử lý nợ hoặc sẽ phá sản. */
  tone: '' | 'down' | 'warn';
}

const plain = (text: string, short: string): Arrival => ({ text, short, tone: '' });

/**
 * Điều xảy ra khi `p` đến ô `i` bằng cách nhảy thẳng (Metro, Cao tốc, ra tù) với `cash` tiền mặt,
 * theo đúng luật xử lý ô (shared/src/engine/landing.ts).
 */
export function arrivalAt(game: GameState, p: PlayerState, i: number, cash = p.cash): Arrival {
  const t = BOARD[i]!;
  const must = (text: string, short: string, amount: number): Arrival => {
    if (cash >= amount) return { text, short, tone: 'down' };
    const broke = cash + maxLiquidationValue(game, p.id) < amount;
    return broke
      ? { text: `${text} · không đủ trả, sẽ phá sản`, short: `${short} · phá sản`, tone: 'warn' }
      : {
          text: `${text} · thiếu tiền, phải Xử lý nợ`,
          short: `${short} · thiếu tiền`,
          tone: 'warn',
        };
  };
  const hasCard = (kind: string) => p.heldCards.some((c) => c.kind === kind);
  switch (t.kind) {
    case 'go':
      return plain('Ô Bắt Đầu · đi thẳng tới không nhận 200Đ', 'Không nhận 200Đ');
    case 'parking':
      return plain('Nghỉ chân, không có gì', 'Không có gì');
    case 'jail':
      return plain('Metro: chọn đi tiếp hoặc ở lại', 'Chọn Metro');
    case 'goToJail':
      return { text: 'Vào tù ngay, không nhận 200Đ', short: 'Vào tù', tone: 'down' };
    case 'chance':
      return plain('Rút 1 thẻ Cơ Hội', 'Rút Cơ Hội');
    case 'community':
      return plain('Rút 1 thẻ Khí Vận', 'Rút Khí Vận');
    case 'tax':
      return hasCard('taxWaiver')
        ? plain('Miễn thuế nhờ quyền Người thủ đô', 'Miễn thuế')
        : must(`Nộp ${money(t.amount)} thuế`, `Thuế ${money(t.amount)}`, t.amount);
  }

  const st = game.tiles[i]!;
  const owner = playerById(game, st.owner);
  if (!owner) {
    return cash >= t.price
      ? plain(`Chưa có chủ · được mua ${money(t.price)}`, `Mua được ${money(t.price)}`)
      : plain(`Chưa có chủ · giá ${money(t.price)}, không đủ tiền mua`, `Giá ${money(t.price)}`);
  }

  if (owner.id === p.id) {
    const redeem = redeemCost(t.price);
    if (t.kind !== 'property') {
      return st.mortgaged && cash >= redeem
        ? plain(`Của bạn, đang cắm · được chuộc ${money(redeem)}`, 'Của bạn · chuộc')
        : plain(st.mortgaged ? 'Của bạn, đang cắm' : 'Của bạn', 'Của bạn');
    }
    const justBought = st.boughtTurn === game.turnNumber;
    if (st.mortgaged) {
      if (!justBought && cash >= redeem + t.upgradeCost) {
        return plain(
          `Đất của bạn, đang cắm · chuộc + xây 1 nhà ${money(redeem + t.upgradeCost)}`,
          'Của bạn · chuộc',
        );
      }
      return cash >= redeem
        ? plain(`Đất của bạn, đang cắm · được chuộc ${money(redeem)}`, 'Của bạn · chuộc')
        : plain('Đất của bạn, đang cắm · không đủ tiền chuộc', 'Của bạn · cắm');
    }
    if (st.level >= HOTEL_LEVEL) return plain('Đất của bạn · đã có khách sạn', 'Của bạn');
    if (justBought) return plain('Đất của bạn · vừa mua, lượt này chưa nâng', 'Của bạn');
    return cash >= t.upgradeCost
      ? plain(
          `Đất của bạn · ${levelText(st.level)}, được nâng ${money(t.upgradeCost)}`,
          'Của bạn · nâng',
        )
      : plain(`Đất của bạn · ${levelText(st.level)}, không đủ tiền nâng`, 'Của bạn');
  }

  if (st.mortgaged) {
    return plain(`Của ${owner.name}, đang cắm · không trả tiền`, `${owner.name} · đang cắm`);
  }
  const active = (kind: string) =>
    game.tiles.filter((x, k) => x?.owner === owner.id && !x.mortgaged && BOARD[k]!.kind === kind)
      .length;
  if (t.kind === 'property') {
    if (hasCard('rentWaiver')) {
      return plain(
        `Của ${owner.name} · dùng thẻ Miễn thuế nhà đất, không trả`,
        `${owner.name} · miễn thuê`,
      );
    }
    const rent = t.rents[st.level]!;
    return must(
      `Của ${owner.name} · ${levelText(st.level)}, thuê ${money(rent)}`,
      `${owner.name} · thuê ${money(rent)}`,
      rent,
    );
  }
  if (t.kind === 'station') {
    const rent = STATION_RENTS[active('station')] ?? 0;
    return must(
      `Ga của ${owner.name} · thuê ${money(rent)}`,
      `${owner.name} · thuê ${money(rent)}`,
      rent,
    );
  }
  const mult = UTILITY_MULTIPLIERS[active('utility')] ?? 0;
  return {
    text: `Của ${owner.name} · trả ${mult} × tổng 2 viên gieo mới`,
    short: `${owner.name} · ${mult} × xúc xắc`,
    tone: 'down',
  };
}
