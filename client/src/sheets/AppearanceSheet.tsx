import { useState } from 'react';
import { IconPicker, buttonColor, type Appearance } from '../components/IconPicker';
import { Sheet } from '../components/Sheet';
import { TokenIcon } from '../components/TokenIcon';
import { playerById } from '../game/format';
import { ICON_NAMES, colorOf } from '../theme';
import type { SheetProps } from './types';
import './appearance-sheet.css';

/** Đen vl: đổi màu và kí hiệu (hình 4, trái). */
export function AppearanceSheet({
  game,
  dispatch,
  onClose,
  playerId,
}: SheetProps & { playerId: string }) {
  const me = playerById(game, playerId)!;
  const [pick, setPick] = useState<Appearance>({ color: me.color, icon: me.icon });
  const others = game.players.filter((p) => p.id !== me.id);
  const changed = pick.color !== me.color || pick.icon !== me.icon;
  const c = colorOf(pick.color);

  const save = () => {
    const err = dispatch({ type: 'changeAppearance', playerId: me.id, ...pick });
    if (!err) onClose();
  };

  return (
    <Sheet
      game={game}
      icon={<TokenIcon icon={me.icon} color={me.color} size={44} />}
      title="Đen vl · đổi quân"
      subtitle={`20 hình, 8 màu · quân của ${me.name}`}
      footer={
        <div className="btn-row appearance-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Chung thủy
          </button>
          <button
            type="button"
            className="btn btn-grow appearance-throw"
            style={{ background: buttonColor(pick.color) }}
            disabled={!changed}
            onClick={save}
          >
            Ném mẹ
            <TokenIcon icon={me.icon} color={me.color} size={24} title={ICON_NAMES[me.icon]} />
            con này đi
          </button>
        </div>
      }
    >
      <div className="appearance-now" style={{ background: c.soft, borderColor: c.main }}>
        <TokenIcon icon={pick.icon} color={pick.color} size={36} blink />
        <div className="appearance-now-text">
          <b style={{ color: c.main }}>
            {changed ? 'Đổi thành' : 'Hiện tại'}: {ICON_NAMES[pick.icon]} · {c.name}
          </b>
          <span>Nhấp nháy trong lượt của {me.name}.</span>
        </div>
      </div>
      <IconPicker
        color={pick.color}
        icon={pick.icon}
        takenColors={others.map((p) => p.color)}
        takenIcons={others.map((p) => p.icon)}
        onChange={setPick}
      />
    </Sheet>
  );
}
