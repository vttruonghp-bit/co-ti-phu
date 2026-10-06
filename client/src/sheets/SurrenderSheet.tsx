import { useEffect, useState } from 'react';
import type { GameState } from '@cotiphu/shared';
import { Sheet, SheetGlyph } from '../components/Sheet';
import { TokenIcon } from '../components/TokenIcon';
import { money, playerById } from '../game/format';
import { colorOf } from '../theme';
import type { SheetProps } from './types';
import './surrender-sheet.css';

/** Chờ một chút mới cho bấm bước cuối, để chạm hai lần liền không lỡ đầu hàng. */
const FINAL_DELAY_MS = 700;

/**
 * Lý do bộ luật sẽ từ chối đầu hàng (chép đúng điều kiện 'surrender' trong
 * shared/src/engine/game.ts), hoặc null nếu được.
 */
function surrenderBlock(game: GameState, playerId: string): string | null {
  const p = playerById(game, playerId);
  if (!p || p.status !== 'active') return 'Người chơi này không còn trong ván.';
  const pd = game.pending;
  if (pd.type === 'ended') return 'Ván đã kết thúc.';
  if (pd.type === 'pay') {
    const payer = playerById(game, pd.playerId)!;
    const what = pd.label ? ` (${pd.label})` : '';
    return payer.cash < pd.total
      ? `${payer.name} đang xử lý nợ ${money(pd.total)}${what}. Trả xong mới đầu hàng được.`
      : `${payer.name} đang phải trả ${money(pd.total)}${what}. Trả xong mới đầu hàng được.`;
  }
  if (pd.type === 'jailRelease') {
    const who = playerById(game, pd.playerId)!;
    return `${who.name} đang phải trả 50Đ hoặc dùng thẻ ra tù. Xong bước đó mới đầu hàng được.`;
  }
  if (game.queue.some((x) => x.type === 'pay' && x.playerId === p.id)) {
    return `${p.name} còn khoản phải trả đang chờ tới lượt. Trả xong mới đầu hàng được.`;
  }
  return null;
}

/** Đầu hàng có bước xác nhận cuối (hình 4, phải): giao diện đỏ đen. */
export function SurrenderSheet({
  game,
  dispatch,
  onClose,
  playerId,
}: SheetProps & { playerId: string }) {
  const p = playerById(game, playerId)!;
  const c = colorOf(p.color);
  const [final, setFinal] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = surrenderBlock(game, playerId);
  const others = game.players.filter((x) => x.id !== p.id && x.status === 'active');

  useEffect(() => {
    if (!final) return;
    setReady(false);
    const t = setTimeout(() => setReady(true), FINAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [final]);

  const confirm = () => setError(dispatch({ type: 'surrender', playerId: p.id }));

  return (
    <Sheet
      game={game}
      icon={
        <SheetGlyph color="var(--red)">
          <FlagGlyph />
        </SheetGlyph>
      }
      title="Đầu hàng"
      subtitle={`${p.name} · xác nhận để chấm dứt ván ngay`}
      label={`Đầu hàng của ${p.name}`}
      footer={
        <div className="surrender-footer">
          {final && !blocked && (
            <p className="surrender-final-hint" aria-live="polite">
              Bước cuối: bấm “Chắc chắn đầu hàng” để kết thúc ván.
            </p>
          )}
          <div className="btn-row">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Thôi
            </button>
            {final ? (
              <button
                type="button"
                className="btn btn-grow surrender-final"
                disabled={!!blocked || !ready}
                onClick={confirm}
              >
                Chắc chắn đầu hàng
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-red btn-grow"
                disabled={!!blocked}
                onClick={() => setFinal(true)}
              >
                Đầu hàng
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className={`surrender-warn${final ? ' is-final' : ''}`}>
        <span className="surrender-warn-kicker">
          <span aria-hidden="true">⚠</span> {final ? 'Bước cuối' : 'Cảnh báo'}
        </span>
        <strong className="surrender-warn-title">{final ? 'CHẮC CHẮN CHƯA?' : 'ĐẦU HÀNG?'}</strong>
        <span className="surrender-warn-text">Quyết định này không hoàn tác.</span>
      </div>

      <h3 className="eyebrow surrender-eyebrow">Kết quả khi xác nhận</h3>
      <div className="surrender-loser">
        <div className="surrender-loser-head">
          <TokenIcon icon={p.icon} color={p.color} size={38} />
          <div className="surrender-loser-text">
            <b style={{ color: c.main }}>{p.name}</b>
            <strong>THUA CUỘC</strong>
          </div>
        </div>
        <p>Ván kết thúc ngay. {others.length} người còn lại được tính là thắng.</p>
      </div>

      <section className="surrender-others" aria-label="Người còn lại">
        <span className="eyebrow">Người còn lại</span>
        <ul>
          {others.map((o) => {
            const oc = colorOf(o.color);
            return (
              <li key={o.id} style={{ background: oc.soft }}>
                <TokenIcon icon={o.icon} color={o.color} size={26} />
                <b>{o.name}</b>
              </li>
            );
          })}
        </ul>
      </section>

      {blocked ? (
        <p className="surrender-blocked" role="status">
          <b>Chưa đầu hàng được.</b> {blocked}
        </p>
      ) : (
        <p className="surrender-note">
          Các hiệu ứng và thao tác đang chờ bị hủy. Chỉ đầu hàng được khi không có khoản bắt buộc
          đang chờ.
        </p>
      )}
      {error && (
        <p className="surrender-blocked" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}

function FlagGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 21V3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M6 4.2c3.2-1.6 5.6 1.4 9 .2 1.6-.5 2.9-.4 3.9.1v8.6c-1-.5-2.3-.6-3.9-.1-3.4 1.2-5.8-1.8-9-.2z"
        fill="currentColor"
      />
    </svg>
  );
}
