import { useState, type ReactNode } from 'react';
import { PLAYER_NAME_MAX, type Profile } from '@cotiphu/shared';
import { IconPicker, buttonColor } from '../components/IconPicker';
import { Sheet } from '../components/Sheet';
import { TokenIcon } from '../components/TokenIcon';
import { ICON_NAMES, PLAYER_COLORS, colorOf } from '../theme';
import './profile-editor.css';

interface ProfileEditorProps {
  value: Profile;
  onChange: (next: Profile) => void;
  /** Gõ xong tên (rời ô hoặc bấm Xong trên bàn phím). */
  onNameDone?: () => void;
  /** Màu, kí hiệu người khác trong phòng đang dùng (bị khóa). */
  takenColors?: readonly number[];
  takenIcons?: readonly number[];
  /** Dòng nhỏ phía trên ô tên, ví dụ "Người chơi 2 · bạn". */
  label: ReactNode;
  id: string;
  invalid?: boolean;
}

/** Tên, quân và dải 8 màu của chính mình (màn đầu và phòng chờ); bấm quân để mở bảng chọn. */
export function ProfileEditor({
  value,
  onChange,
  onNameDone,
  takenColors = [],
  takenIcons = [],
  label,
  id,
  invalid = false,
}: ProfileEditorProps) {
  const [picking, setPicking] = useState(false);
  const c = colorOf(value.color);
  const who = value.name.trim() || 'bạn';
  return (
    <div
      className="profile"
      style={{ ['--pc' as string]: c.main, ['--pc-soft' as string]: c.soft }}
    >
      <label className="profile-label" htmlFor={id}>
        {label}
      </label>
      <div className="profile-row">
        <button
          type="button"
          className="profile-token"
          aria-label={`Đổi quân của ${who}`}
          onClick={() => setPicking(true)}
        >
          <TokenIcon icon={value.icon} color={value.color} size={40} />
        </button>
        <input
          id={id}
          className="profile-name"
          value={value.name}
          maxLength={PLAYER_NAME_MAX}
          placeholder="Tên của bạn"
          autoComplete="nickname"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="done"
          aria-invalid={invalid}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          onBlur={onNameDone}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
      </div>
      <button
        type="button"
        className="profile-look"
        aria-label={`${c.name}, ${ICON_NAMES[value.icon]}: đổi màu và kí hiệu`}
        onClick={() => setPicking(true)}
      >
        <span className="profile-dots" aria-hidden="true">
          {PLAYER_COLORS.map((pc, k) => (
            <span
              key={pc.name}
              className={k === value.color ? 'is-on' : takenColors.includes(k) ? 'is-taken' : ''}
              style={{ background: pc.main }}
            />
          ))}
        </span>
        <b className="profile-look-name" aria-hidden="true">
          {ICON_NAMES[value.icon]}
        </b>
        <span className="profile-change" aria-hidden="true">
          Đổi
        </span>
      </button>

      {picking && (
        <Sheet
          icon={<TokenIcon icon={value.icon} color={value.color} size={44} />}
          title={`Quân của ${who}`}
          subtitle={
            takenColors.length > 0 ? 'Màu và kí hiệu chưa ai trong phòng dùng' : '8 màu, 20 kí hiệu'
          }
          footer={
            <div className="btn-row">
              <button
                type="button"
                className="btn"
                style={{ background: buttonColor(value.color) }}
                onClick={() => setPicking(false)}
              >
                Xong
              </button>
            </div>
          }
        >
          <IconPicker
            color={value.color}
            icon={value.icon}
            takenColors={takenColors}
            takenIcons={takenIcons}
            onChange={(next) => onChange({ ...value, ...next })}
          />
        </Sheet>
      )}
    </div>
  );
}
