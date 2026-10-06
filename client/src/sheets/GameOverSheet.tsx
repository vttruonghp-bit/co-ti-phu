import {
  BOARD,
  HOTEL_LEVEL,
  getCard,
  maxLiquidationValue,
  type GameState,
  type PlayerState,
} from '@cotiphu/shared';
import { Sheet, SheetGlyph } from '../components/Sheet';
import { TokenIcon } from '../components/TokenIcon';
import { assetCount, money, numbered, playerById } from '../game/format';
import { colorOf } from '../theme';
import './game-over-sheet.css';

interface Standing {
  p: PlayerState;
  /** Giá trị tài sản: tiền Ngân hàng trả nếu hạ hết nhà rồi bán hết ô. */
  assets: number;
  total: number;
}

/** Người thua đứng cuối; người thắng xếp theo tiền mặt + giá trị tài sản. */
function standings(game: GameState): Standing[] {
  const rows = game.players.map((p) => {
    const assets = maxLiquidationValue(game, p.id);
    return { p, assets, total: p.cash + assets };
  });
  const lost = (s: Standing) => (s.p.id === game.loserId ? 1 : 0);
  return rows.sort((a, b) => lost(a) - lost(b) || b.total - a.total);
}

/** Vì sao người thua thua: dòng chính và vài chi tiết lấy từ nhật ký, diễn biến cuối. */
function loseReason(game: GameState, loser: PlayerState): { main: string; details: string[] } {
  if (loser.status === 'surrendered') {
    return { main: 'Đầu hàng', details: [`Tự đầu hàng ở lượt ${game.turnNumber}.`] };
  }
  const details: string[] = [];
  const debt = [...game.log]
    .reverse()
    .find((e) => e.playerId === loser.id && e.text.startsWith('Không đủ khả năng trả'));
  if (debt) details.push(`${debt.text}, kể cả khi hạ hết nhà và bán hết tài sản.`);
  for (const e of game.events) {
    if (e.type === 'card') {
      const c = getCard(e.cardId);
      const who = playerById(game, e.playerId)?.name ?? '';
      details.push(`${who} rút thẻ ${c.deck === 'chance' ? 'Cơ Hội' : 'Khí Vận'}: ${c.title}.`);
    }
  }
  const lastMove = [...game.events]
    .reverse()
    .find((e) => e.type === 'move' && e.playerId === loser.id);
  if (lastMove?.type === 'move') {
    const owner = playerById(game, game.tiles[lastMove.to]?.owner);
    const of = owner && owner.id !== loser.id ? ` của ${owner.name}` : '';
    details.push(`Ô cuối: ${numbered(lastMove.to)}${of}.`);
  }
  return { main: 'Phá sản', details };
}

/** Ván kết thúc: người thua và những người thắng. */
export function GameOverSheet({ game, onNewGame }: { game: GameState; onNewGame: () => void }) {
  const loser = playerById(game, game.loserId);
  const winners = game.players.filter((p) => p.id !== game.loserId);
  const rows = standings(game);
  const reason = loser ? loseReason(game, loser) : null;
  const owned = game.tiles.filter((t) => t?.owner).length;
  const ownable = game.tiles.filter((t) => t).length;
  let houses = 0;
  let hotels = 0;
  game.tiles.forEach((t, i) => {
    if (!t?.owner || BOARD[i]!.kind !== 'property') return;
    if (t.level === HOTEL_LEVEL) hotels += 1;
    else houses += t.level;
  });

  return (
    <Sheet
      game={game}
      icon={
        <SheetGlyph color="#d39b12">
          <CupGlyph />
        </SheetGlyph>
      }
      title="Ván kết thúc"
      subtitle={
        loser
          ? `${loser.name} ${loser.status === 'surrendered' ? 'đầu hàng' : 'phá sản'} · ${winners.length} người thắng`
          : `${winners.length} người thắng`
      }
      footer={
        <button type="button" className="btn btn-teal over-new" onClick={onNewGame}>
          Ván mới
        </button>
      }
    >
      {loser && reason && (
        <section className="over-loser" aria-label="Người thua">
          <div className="over-loser-head">
            <TokenIcon icon={loser.icon} color={loser.color} size={40} />
            <div className="over-loser-text">
              <span className="over-loser-name">
                <b>{loser.name}</b>
                <span className="over-loser-tag">{reason.main}</span>
              </span>
              <strong>THUA CUỘC</strong>
            </div>
          </div>
          {reason.details.length > 0 && (
            <ul className="over-loser-why">
              {reason.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="over-winners" aria-label="Người thắng">
        <span className="eyebrow">{winners.length} người thắng</span>
        <ul>
          {winners.map((p) => (
            <li key={p.id} style={{ background: colorOf(p.color).soft }}>
              <TokenIcon icon={p.icon} color={p.color} size={26} />
              <b>{p.name}</b>
            </li>
          ))}
        </ul>
      </section>

      <section className="over-rank" aria-label="Xếp hạng cuối">
        <div className="over-rank-head">
          <h3 className="eyebrow">Xếp hạng cuối</h3>
          <span className="muted">tiền mặt + tài sản</span>
        </div>
        <ol>
          {rows.map((r, i) => {
            const c = colorOf(r.p.color);
            const lost = r.p.id === game.loserId;
            return (
              <li key={r.p.id} className={lost ? 'is-lost' : undefined}>
                <span className="over-rank-num">{lost ? '✕' : i + 1}</span>
                <TokenIcon icon={r.p.icon} color={r.p.color} size={28} />
                <span className="over-rank-main">
                  <b style={{ color: c.main }}>{r.p.name}</b>
                  <span className="over-rank-sub">
                    {money(r.p.cash)} tiền · {assetCount(game, r.p.id)} ô ({money(r.assets)})
                  </span>
                </span>
                <b className="over-rank-total">{money(r.total)}</b>
              </li>
            );
          })}
        </ol>
        <p className="over-rank-note">
          Tài sản tính theo tiền Ngân hàng trả nếu hạ hết nhà rồi bán hết ô.
        </p>
      </section>

      <section className="over-stats" aria-label="Thống kê">
        <div>
          <b>{game.turnNumber}</b>
          <span>lượt đã chơi</span>
        </div>
        <div>
          <b>
            {owned}/{ownable}
          </b>
          <span>ô có chủ</span>
        </div>
        <div>
          <b>
            {houses} · {hotels}
          </b>
          <span>nhà · khách sạn</span>
        </div>
      </section>
    </Sheet>
  );
}

function CupGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M7 3.5h10v5.2a5 5 0 0 1-10 0z" />
      <path
        d="M7 5.5H4.2v1.4A3.3 3.3 0 0 0 7.6 10M17 5.5h2.8v1.4a3.3 3.3 0 0 1-3.4 3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M10.6 13.4h2.8l.5 3.6h-3.8z" />
      <rect x="7.5" y="17" width="9" height="3.5" rx="1" />
    </svg>
  );
}
