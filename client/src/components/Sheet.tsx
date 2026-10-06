import { useEffect, type ReactNode } from 'react';
import type { GameState } from '@cotiphu/shared';
import { money } from '../game/format';
import { colorOf } from '../theme';
import './sheet.css';

interface SheetProps {
  /** Ván đang chơi, để hiện "Lượt X · tiền" ở đầu màn. Bỏ trống ở màn tạo ván. */
  game?: GameState | null;
  /** Biểu tượng tròn bên trái tiêu đề (TokenIcon hoặc SheetGlyph). */
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  /** Các nút cuối màn (thường là `.btn-row`). */
  footer?: ReactNode;
  children: ReactNode;
  /** Nhãn cho trình đọc màn hình. */
  label?: string;
  /** Thay "Lượt X" ở đầu màn bằng người khác, ví dụ "Linh rút" khi lượt đã sang người sau. */
  who?: { playerId: string; text: string };
}

/** Màn phụ phủ toàn bộ khung điện thoại, giống các hình mẫu trong bản 3.2. */
export function Sheet({ game, icon, title, subtitle, footer, children, label, who }: SheetProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  const shown = who && game?.players.find((p) => p.id === who.playerId);
  const cur = shown ?? (game ? game.players[game.current] : null);
  const curText = shown ? who!.text : `Lượt ${cur?.name}`;
  return (
    <div className="sheet-backdrop">
      <section className="sheet" role="dialog" aria-modal="true" aria-label={label ?? title}>
        <header className="app-header">
          <h1 className="app-title">CỜ TỶ PHÚ</h1>
          {cur && game?.pending.type !== 'ended' && (
            <span className="app-turn" style={{ color: colorOf(cur.color).main }}>
              {curText} · {money(cur.cash)}
            </span>
          )}
        </header>
        <div className="sheet-card">
          <div className="sheet-head">
            {icon && <span className="sheet-icon">{icon}</span>}
            <div>
              <h2 className="sheet-title">{title}</h2>
              {subtitle && <p className="sheet-subtitle">{subtitle}</p>}
            </div>
          </div>
          <div className="sheet-body">{children}</div>
          {footer && <div className="sheet-footer">{footer}</div>}
        </div>
      </section>
    </div>
  );
}

/** Biểu tượng tròn cho tiêu đề màn phụ khi không gắn với một người chơi. */
export function SheetGlyph({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span className="sheet-glyph" style={{ color, ['--glow' as string]: color }}>
      {children}
    </span>
  );
}
