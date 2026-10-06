import { useEffect, useState, type ReactNode } from 'react';
import {
  BOARD,
  HOTEL_LEVEL,
  LOG_VISIBLE_ENTRIES,
  UTILITY_MULTIPLIERS,
  redeemCost,
  type Action,
  type GameState,
  type PlayerState,
} from '@cotiphu/shared';
import { Board } from '../components/Board';
import { Dice } from '../components/Dice';
import { TurnLine } from '../components/Sheet';
import { TokenIcon } from '../components/TokenIcon';
import {
  assetCount,
  levelText,
  money,
  playerById,
  rentText,
  signed,
  tileName,
} from '../game/format';
import { debtorOf } from '../game/draft';
import { HOT_SEAT, PlayModeContext, type PlayMode } from '../online/mode';
import { AppearanceSheet } from '../sheets/AppearanceSheet';
import { CardSheet } from '../sheets/CardSheet';
import { ChooseTileSheet } from '../sheets/ChooseTileSheet';
import { GameOverSheet } from '../sheets/GameOverSheet';
import { JailSheet } from '../sheets/JailSheet';
import { ManageSheet, type ManageMode } from '../sheets/ManageSheet';
import { MetroSheet } from '../sheets/MetroSheet';
import { SurrenderSheet } from '../sheets/SurrenderSheet';
import type { CardEvent, HighwayEvent } from '../sheets/types';
import { colorOf } from '../theme';
import './game-screen.css';

/** Ván đang hiện. `actions` đổi mỗi khi có thao tác mới (về ô đang đứng, hiện thẻ vừa rút). */
export interface GameView {
  game: GameState;
  /** Trạng thái ngay trước thao tác cuối (để hiện "trước → sau"). */
  previous: GameState | null;
  actions: number;
}

interface GameScreenProps {
  view: GameView;
  /** Trả thông báo lỗi, hoặc null khi đã áp dụng (online: khi máy chủ đã nhận). */
  dispatch: (action: Action) => Promise<string | null> | string | null;
  onNewGame: () => void;
  /** Mặc định chơi chung một máy. */
  mode?: PlayMode;
  /** Chơi chung một máy: về màn đầu, ván vẫn giữ để chơi tiếp. */
  onHome?: () => void;
}

/** 'board': tạm ẩn Xử lý nợ để xem bàn cờ (nút chính "Xử lý nợ" mở lại). */
type Manual = null | 'manage' | 'appearance' | 'surrender' | 'board';

/**
 * Một lần rút thẻ hoặc gieo Cao tốc cần hiện, kèm ván lúc đó: online, ván có thể đã đi tiếp
 * trong khi máy này chưa bấm Tiếp tục.
 */
interface Reveal {
  game: GameState;
  previous: GameState | null;
  event: CardEvent | HighwayEvent;
}

/** Giữ tối đa chừng này lần rút chưa xem (khi người khác đi nhanh hơn). */
const MAX_REVEALS = 6;

const revealsOf = ({ game, previous }: GameView): Reveal[] =>
  game.events
    .filter((e): e is CardEvent | HighwayEvent => e.type === 'card' || e.type === 'highway')
    .map((event) => ({ game, previous, event }));

/** Người ván đang chờ (người phải bấm nút tiếp theo); khi ván kết thúc là người giữ lượt cuối. */
function waitingPlayer(s: GameState): PlayerState {
  const pd = s.pending;
  const id = 'playerId' in pd ? pd.playerId : s.players[s.current]!.id;
  return s.players.find((p) => p.id === id)!;
}

/** Ụp/Mở đầy đủ chỉ ở đầu lượt của mình (trước khi đổ); lúc khác chỉ xem. */
function canManage(s: GameState, p: PlayerState): boolean {
  return (
    s.players[s.current]!.id === p.id &&
    !s.rolled &&
    (s.pending.type === 'roll' || s.pending.type === 'jail')
  );
}

/** In đậm tên người chơi trong một dòng chữ. */
function withName(text: string, name: string): ReactNode {
  const i = text.indexOf(name);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <b>{name}</b>
      {text.slice(i + name.length)}
    </>
  );
}

interface MainAction {
  label: string;
  tone: string;
  run: () => void;
}

export function GameScreen({
  view,
  dispatch,
  onNewGame,
  mode = HOT_SEAT,
  onHome,
}: GameScreenProps) {
  const { game, previous, actions } = view;
  const online = mode.kind === 'online' ? mode : null;
  const [manual, setManual] = useState<Manual>(null);
  const [viewTile, setViewTile] = useState<number | null>(null);
  const [reveals, setReveals] = useState(() => revealsOf(view));
  const [error, setError] = useState<string | null>(null);

  const cur = game.players[game.current]!;
  const waiter = waitingPlayer(game);
  // Người cầm máy này: online là chính mình; chơi chung một máy là người ván đang chờ.
  const me = (online && playerById(game, online.meId)) || waiter;
  // Ván đang chờ người cầm máy này (chơi chung một máy thì luôn đúng).
  const myMove = !online || waiter.id === me.id;
  const accent = colorOf(waiter.color);
  const meColor = colorOf(me.color);
  const pd = game.pending;
  const offline = new Set(online?.seats.filter((s) => !s.connected).map((s) => s.id));

  // Mỗi thao tác mới: về xem ô đang đứng, xếp các lá thẻ vừa rút vào hàng chờ xem. Đặt lại ngay
  // trong lần vẽ này (không đợi effect) để không lóe màn cũ hay hiện nhầm lá thẻ trong một khung hình.
  const [seenAt, setSeenAt] = useState(actions);
  if (seenAt !== actions) {
    setSeenAt(actions);
    setViewTile(null);
    setReveals((r) => [...r, ...revealsOf(view)].slice(-MAX_REVEALS));
  }
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 3500);
    return () => clearTimeout(t);
  }, [error]);
  // Online: rung nhẹ khi tới lượt mình (máy nào hỗ trợ).
  const myTurnNow = online !== null && myMove && pd.type !== 'ended';
  useEffect(() => {
    if (myTurnNow) navigator.vibrate?.(60);
  }, [myTurnNow]);

  // Online: số thao tác đang chờ máy chủ; nút chính mờ đi trong lúc chờ để khỏi bấm lại.
  const [busy, setBusy] = useState(0);
  const send = async (a: Action) => {
    if (online) setBusy((n) => n + 1);
    try {
      const err = await dispatch(a);
      if (err) setError(err);
      return err;
    } finally {
      if (online) setBusy((n) => n - 1);
    }
  };

  const lastRoll = [...game.events].reverse().find((e) => e.type === 'roll');
  // Khoản đang chờ trả tính theo xúc xắc gieo mới (thẻ 10 × xúc xắc, nhà máy khi đến bằng Metro…):
  // ô giữa hiện chính xúc xắc đó thay cho lần đổ để đi.
  const formula = payFormula(game, waiter);
  const dice = formula
    ? formula.dice
    : lastRoll?.type === 'roll'
      ? lastRoll.dice
      : (game.lastDice ?? null);
  // Xúc xắc mang màu người gieo: lần đổ trong thao tác này, không thì người giữ lượt
  // (lastDice bị xóa khi sang lượt mới nên luôn là của người giữ lượt).
  const roller = formula
    ? waiter
    : lastRoll?.type === 'roll'
      ? playerById(game, lastRoll.playerId)
      : cur;
  const rollerColor = colorOf((roller ?? cur).color).main;

  const sheetProps = {
    game,
    previous,
    dispatch: send,
    onClose: () => setManual(null),
  };

  // Đầu hàng / Đen vl (cho người cầm máy): cũng đặt trong các màn Metro, tù, chọn ô vì các màn
  // này che màn chính.
  const danger = (
    <div className="btn-row danger-row">
      <button type="button" className="btn btn-surrender" onClick={() => setManual('surrender')}>
        ⚠ ĐẦU HÀNG
      </button>
      <button type="button" className="btn btn-denvl" onClick={() => setManual('appearance')}>
        ĐEN VL
      </button>
    </div>
  );

  // Màn phụ: thẻ vừa rút trước, rồi tới việc ván đang chờ, rồi các màn người chơi tự mở.
  // Online chỉ người đang nợ thấy Xử lý nợ, và chỉ người ván đang chờ thấy Metro, tù, chọn ô.
  const debtor = debtorOf(game, previous);
  const myDebt = debtor !== null && (!online || debtor === me.id) ? debtor : null;
  const reveal = reveals[0];
  let sheet: ReactNode = null;
  // Thẻ làm phá sản vẫn hiện trước, rồi mới tới màn kết thúc.
  if (reveal) {
    sheet = (
      <CardSheet
        {...sheetProps}
        game={reveal.game}
        previous={reveal.previous}
        event={reveal.event}
        onContinue={() => setReveals((r) => r.slice(1))}
      />
    );
  } else if (pd.type === 'ended') {
    sheet = <GameOverSheet game={game} onNewGame={onNewGame} />;
  } else if (manual === 'appearance') {
    sheet = <AppearanceSheet {...sheetProps} playerId={me.id} />;
  } else if (manual === 'surrender') {
    sheet = <SurrenderSheet {...sheetProps} playerId={me.id} />;
  } else if (manual === 'manage' || (myDebt && manual !== 'board')) {
    // Xử lý nợ là của người đang nợ (có thể không phải người giữ lượt), không đóng được.
    const manageMode: ManageMode = myDebt ? 'debt' : canManage(game, me) ? 'manage' : 'view';
    // Mỗi người nợ một màn mới (dự thảo và chỗ cuộn bắt đầu lại).
    sheet = (
      <ManageSheet
        {...sheetProps}
        key={myDebt ?? me.id}
        mode={manageMode}
        playerId={myDebt ?? me.id}
        onShowBoard={() => setManual('board')}
      />
    );
  } else if (myMove && pd.type === 'metro') {
    sheet = <MetroSheet {...sheetProps} extra={danger} />;
  } else if (myMove && (pd.type === 'jail' || pd.type === 'jailRelease')) {
    sheet = <JailSheet {...sheetProps} onOpenManage={() => setManual('manage')} extra={danger} />;
  } else if (myMove && pd.type === 'chooseTile') {
    sheet = <ChooseTileSheet {...sheetProps} extra={danger} />;
  }

  const main = ((): MainAction | null => {
    if (!myMove) return null;
    const id = me.id;
    switch (pd.type) {
      case 'roll':
        return { label: 'Sục', tone: '', run: () => send({ type: 'roll', playerId: id }) };
      case 'buy': {
        const t = BOARD[pd.tile]!;
        const price = 'price' in t ? t.price : 0;
        return {
          label: `Mua · ${money(price)}`,
          tone: 'btn-teal',
          run: () => send({ type: 'buy', playerId: id }),
        };
      }
      case 'upgrade': {
        const t = BOARD[pd.tile]!;
        const st = game.tiles[pd.tile]!;
        const price = 'price' in t ? t.price : 0;
        const build = t.kind === 'property' ? t.upgradeCost : 0;
        const label =
          pd.mode === 'build'
            ? `Nâng lên ${levelText(st.level + 1)} · ${money(build)}`
            : pd.mode === 'redeemBuild'
              ? `Chuộc + xây 1 nhà · ${money(redeemCost(price) + build)}`
              : `Chuộc · ${money(redeemCost(price))}`;
        return { label, tone: 'btn-teal', run: () => send({ type: 'upgrade', playerId: id }) };
      }
      case 'pay':
        if (me.cash < pd.total) {
          return { label: 'Xử lý nợ', tone: 'btn-red', run: () => setManual('manage') };
        }
        return pd.reason === 'tax'
          ? {
              label: `Là nó · ${money(pd.total)}`,
              tone: 'btn-red',
              run: () => send({ type: 'pay', playerId: id }),
            }
          : {
              label: `Trả tiền · ${money(pd.total)}`,
              tone: '',
              run: () => send({ type: 'pay', playerId: id }),
            };
      default:
        return null;
    }
  })();

  const secondary: MainAction =
    myMove && pd.type === 'buy'
      ? {
          label: 'Không mua',
          tone: 'btn-outline',
          run: () => send({ type: 'declineBuy', playerId: me.id }),
        }
      : myMove && pd.type === 'upgrade'
        ? {
            label: 'Bỏ qua',
            tone: 'btn-outline',
            run: () => send({ type: 'skipUpgrade', playerId: me.id }),
          }
        : { label: 'Ụp / Mở', tone: 'btn-outline', run: () => setManual('manage') };

  const accentStyle = {
    ['--accent' as string]: accent.main,
    ['--accent-soft' as string]: accent.soft,
  };
  const playing = pd.type !== 'ended';
  // Online, khi ván chờ người khác: dòng "Đang chờ Minh …" thay cho "Chuyển máy cho …".
  const othersText = online && !myMove ? waitingOther(game, waiter) : null;

  return (
    <PlayModeContext.Provider value={mode}>
      <main className="phone game-screen" style={accentStyle}>
        {/* Khi màn phụ đang mở, màn chính phía sau không bấm hay đọc tới được. */}
        <div className="game-main" inert={sheet !== null}>
          <header className="app-header">
            <span className="app-brand">
              {onHome && (
                <button type="button" className="app-home" onClick={onHome} aria-label="Về màn đầu">
                  <span aria-hidden="true">‹</span>
                </button>
              )}
              <h1 className="app-title">CỜ TỶ PHÚ</h1>
            </span>
            <TurnLine game={game} />
          </header>

          {!online && me.id !== cur.id && playing && (
            <p className="handoff" style={{ background: meColor.soft, color: meColor.main }}>
              Chuyển máy cho <b>{me.name}</b>: {waitingText(game, me)}
            </p>
          )}
          {othersText && playing && (
            <p
              className="handoff is-waiting"
              role="status"
              style={{ background: accent.soft, color: accent.main }}
            >
              <TokenIcon icon={waiter.icon} color={waiter.color} size={20} />
              <span>
                {withName(othersText, waiter.name)}
                {offline.has(waiter.id) && <span className="handoff-away"> · mất kết nối</span>}
              </span>
            </p>
          )}
          {online && myMove && me.id !== cur.id && playing && (
            <p className="handoff" style={{ background: meColor.soft, color: meColor.main }}>
              Ván đang chờ <b>bạn</b> (ngoài lượt của {cur.name}).
            </p>
          )}

          <PlayersBar game={game} meId={online?.meId ?? null} offline={offline} />

          <Board
            game={game}
            focus={viewTile ?? waiter.position}
            onTileClick={(i) => setViewTile((v) => (v === i ? null : i))}
          >
            <CenterPanel
              game={game}
              me={waiter}
              mine={online !== null && waiter.id === me.id}
              away={offline.has(waiter.id)}
              tile={viewTile ?? waiter.position}
              viewing={viewTile !== null}
              dice={dice}
              diceColor={rollerColor}
              rollKey={actions}
              formula={formula}
            />
          </Board>

          <div className="btn-row action-bar">
            {main ? (
              <button
                type="button"
                className={`btn btn-grow ${main.tone}`}
                disabled={busy > 0}
                aria-busy={busy > 0}
                onClick={main.run}
              >
                {main.label}
              </button>
            ) : (
              <button type="button" className="btn btn-grow" disabled>
                {othersText ? `Chờ ${waiter.name}…` : waitingText(game, me)}
              </button>
            )}
            <button
              type="button"
              className={`btn ${secondary.tone}`}
              disabled={busy > 0 && myMove && (pd.type === 'buy' || pd.type === 'upgrade')}
              onClick={secondary.run}
            >
              {secondary.label}
            </button>
          </div>

          <LogPanel game={game} />

          {danger}
          <p className="hint hint-center">Đầu hàng cần xác nhận · Đen vl mở bảng đổi kí hiệu.</p>
        </div>

        {sheet}
        {error && (
          <div className="toast" role="alert">
            {error}
          </div>
        )}
      </main>
    </PlayModeContext.Provider>
  );
}

/** Online: việc người khác đang làm, hiện trên máy những người đang chờ. */
export function waitingOther(s: GameState, p: PlayerState): string {
  const pd = s.pending;
  const n = p.name;
  switch (pd.type) {
    case 'roll':
      return `Đang chờ ${n} đổ xúc xắc…`;
    case 'jail':
      return `Đang chờ ${n} chọn cách ra tù…`;
    case 'jailRelease':
      return `Đang chờ ${n} trả 50Đ hoặc dùng thẻ ra tù…`;
    case 'buy':
      return `Đang chờ ${n} quyết định mua ${tileName(pd.tile)}…`;
    case 'upgrade':
      return pd.mode === 'build'
        ? `Đang chờ ${n} quyết định nâng cấp ${tileName(pd.tile)}…`
        : `Đang chờ ${n} quyết định chuộc ${tileName(pd.tile)}…`;
    case 'metro':
      return `Đang chờ ${n} chọn ở lại hay đi Metro…`;
    case 'pay':
      if (p.cash < pd.total) return `${n} thiếu tiền, đang xử lý nợ ${money(pd.total)}…`;
      return pd.reason === 'tax'
        ? `Đang chờ ${n} nộp ${money(pd.total)}…`
        : `Đang chờ ${n} trả ${money(pd.total)}…`;
    case 'chooseTile':
      return pd.purpose === 'highway'
        ? `Đang chờ ${n} chọn ô mở cao tốc…`
        : `Đang chờ ${n} chọn đất cho Canh bạc xây dựng…`;
    case 'ended':
      return 'Ván đã kết thúc';
  }
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Dòng mô tả ván đang chờ ai làm gì. */
export function waitingText(s: GameState, me: PlayerState): string {
  const pd = s.pending;
  switch (pd.type) {
    case 'roll':
      return `Chờ ${me.name} nhấn “Sục”`;
    case 'jail':
      return `${me.name} đang ở tù: thử đổ đôi, trả 50Đ hoặc dùng thẻ`;
    case 'jailRelease':
      return `${me.name} phải trả 50Đ hoặc dùng thẻ ra tù`;
    case 'buy':
      return `Chờ ${me.name} quyết định mua ${tileName(pd.tile)}`;
    case 'upgrade':
      return `Chờ ${me.name} quyết định ở ${tileName(pd.tile)}`;
    case 'metro':
      return `Chờ ${me.name} chọn ở lại hay đi Metro`;
    case 'pay':
      if (me.cash < pd.total) return `${me.name} thiếu tiền, đang xử lý nợ ${money(pd.total)}`;
      return pd.reason === 'tax' ? `Chờ ${me.name} nhấn “Là nó”` : `Chờ ${me.name} nhấn “Trả tiền”`;
    case 'chooseTile':
      return `Chờ ${me.name} chọn ô`;
    case 'ended':
      return 'Ván đã kết thúc';
  }
}

interface PlayersBarProps {
  game: GameState;
  /** Online: người cầm máy này (viền đậm màu của mình). */
  meId: string | null;
  /** Online: những người đang mất kết nối (chấm xám trên quân). */
  offline: ReadonlySet<string>;
}

function PlayersBar({ game, meId, offline }: PlayersBarProps) {
  const cur = game.players[game.current]!;
  const others = game.players.filter((p) => p.id !== cur.id);
  return (
    <section className="players" aria-label="Người chờ lượt">
      <p className="eyebrow">Người chờ lượt</p>
      <div className={`players-grid${others.length <= 2 ? ' is-wide' : ''}`}>
        {others.map((p) => {
          const c = colorOf(p.color);
          const mine = p.id === meId;
          const away = offline.has(p.id);
          return (
            <div
              key={p.id}
              className={`player-chip${p.status !== 'active' ? ' is-out' : ''}${mine ? ' is-me' : ''}`}
              style={{
                borderColor: mine ? c.main : `color-mix(in srgb, ${c.main} 35%, #dfe5ee)`,
              }}
            >
              <span className="player-chip-token">
                <TokenIcon icon={p.icon} color={p.color} size={18} />
                {away && <span className="offline-dot" />}
              </span>
              <span className="player-chip-text">
                <span className="player-chip-top">
                  <b title={p.name}>{p.name}</b>
                  <span>{money(p.cash)}</span>
                </span>
                {/* "đất" như hình mẫu (gồm cả ga, nhà máy) để vừa 3 cột ở màn 360px */}
                <span className="player-chip-sub">
                  {away
                    ? 'mất kết nối'
                    : `${assetCount(game, p.id)} đất · ${p.heldCards.length} thẻ`}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface CenterPanelProps {
  game: GameState;
  /** Người ván đang chờ. */
  me: PlayerState;
  /** Online: người đó là chính người cầm máy này. */
  mine: boolean;
  /** Online: người đó đang mất kết nối. */
  away: boolean;
  tile: number;
  viewing: boolean;
  dice: readonly number[] | null;
  diceColor: string;
  rollKey: number;
  formula: PayFormula | null;
}

interface PayFormula {
  /** Nhãn thay cho "Tiền thuê". */
  label: string;
  /** "10 × (3 + 4) = 70Đ". */
  text: string;
  dice: [number, number];
}

/** Dòng nhật ký có xúc xắc: khoản 10 × xúc xắc của thẻ, nhà máy gieo mới, đổ để đi, thử đôi. */
const CARD_DICE = /^Gieo (\d) \+ (\d), trả (\d+) × \d+$/;
const UTILITY_DICE = /^Gieo (\d) \+ (\d) để tính tiền /;
const MOVE_DICE = /^(?:Đổ|Thử đổ đôi trong tù:) (\d) \+ (\d)/;

/**
 * Khoản đang chờ trả ở ô đang đứng mà tính theo xúc xắc: 10 × xúc xắc của thẻ Đất/Ga gần nhất,
 * hoặc tiền nhà máy (đến bằng Metro, thẻ… thì bộ luật gieo 2 viên mới). Xúc xắc lấy ở dòng nhật ký
 * có xúc xắc gần nhất của người đó trong lượt này; không khớp số tiền thì thôi.
 */
function payFormula(game: GameState, me: PlayerState): PayFormula | null {
  const pd = game.pending;
  if (pd.type !== 'pay' || pd.playerId !== me.id) return null;
  const card = pd.reason === 'card';
  const t = BOARD[me.position]!;
  if (!card && !(pd.reason === 'rent' && t.kind === 'utility')) return null;
  for (let i = game.log.length - 1; i >= 0; i--) {
    const e = game.log[i]!;
    if (e.turn !== game.turnNumber) return null;
    if (e.playerId !== me.id) continue;
    const m = CARD_DICE.exec(e.text) ?? UTILITY_DICE.exec(e.text) ?? MOVE_DICE.exec(e.text);
    if (!m) continue;
    const dice: [number, number] = [Number(m[1]), Number(m[2])];
    const sum = dice[0] + dice[1];
    let mult: number;
    if (card) {
      if (m[3] === undefined) return null;
      mult = Number(m[3]);
    } else {
      const owner = game.tiles[me.position]?.owner;
      const active = game.tiles.filter(
        (x, k) => x !== null && x.owner === owner && !x.mortgaged && BOARD[k]!.kind === 'utility',
      ).length;
      mult = UTILITY_MULTIPLIERS[active] ?? 0;
    }
    if (mult * sum !== pd.total) return null;
    return {
      label: card ? 'Theo thẻ' : 'Tiền thuê',
      text: `${mult} × (${dice[0]} + ${dice[1]}) = ${money(pd.total)}`,
      dice,
    };
  }
  return null;
}

function tileDescription(game: GameState, i: number): string {
  const t = BOARD[i]!;
  const st = game.tiles[i];
  switch (t.kind) {
    case 'property':
    case 'station':
    case 'utility': {
      const owner = playerById(game, st?.owner);
      return owner ? `Chủ sở hữu: ${owner.name}` : `Chưa có chủ · giá ${money(t.price)}`;
    }
    case 'tax':
      return `Nộp ${money(t.amount)} cho Ngân hàng`;
    case 'chance':
      return 'Rút 1 thẻ Cơ Hội';
    case 'community':
      return 'Rút 1 thẻ Khí Vận';
    case 'go':
      return 'Qua hoặc dừng: nhận 200Đ';
    case 'jail':
      return 'Đi Metro (khi không bị giam) hoặc ở tù';
    case 'goToJail':
      return 'Vào tù, không nhận 200Đ';
    case 'parking':
      return 'Nghỉ chân, không có gì';
  }
}

/** Tiền người đang chờ sẽ còn nếu làm việc đang chờ (mua, nâng, trả). */
function cashAfter(game: GameState, me: PlayerState): number | null {
  const pd = game.pending;
  if (pd.type === 'pay' && pd.playerId === me.id) {
    const back = pd.creditors.find((c) => c.playerId === me.id)?.amount ?? 0;
    return me.cash - pd.total + back;
  }
  if (pd.type === 'buy') {
    const t = BOARD[pd.tile]!;
    return 'price' in t ? me.cash - t.price : null;
  }
  if (pd.type === 'upgrade') {
    const t = BOARD[pd.tile]!;
    const price = 'price' in t ? t.price : 0;
    const build = t.kind === 'property' ? t.upgradeCost : 0;
    const cost =
      pd.mode === 'build'
        ? build
        : pd.mode === 'redeemBuild'
          ? redeemCost(price) + build
          : redeemCost(price);
    return me.cash - cost;
  }
  return null;
}

/** Cấp nhà như hình mẫu: "2 / 4 nhà". */
function levelLabel(level: number): string {
  return level > 0 && level < HOTEL_LEVEL ? `${level} / 4 nhà` : levelText(level);
}

function CenterPanel({
  game,
  me,
  mine,
  away,
  tile,
  viewing,
  dice,
  diceColor,
  rollKey,
  formula,
}: CenterPanelProps) {
  const t = BOARD[tile]!;
  // Online, người ván đang chờ là chính mình: gọi là "bạn" trong các dòng chữ.
  const you = mine ? { ...me, name: 'bạn' } : me;
  // Cách tính khoản đang chờ trả chỉ hiện ở ô đang đứng.
  const pay = viewing ? null : formula;
  const st = game.tiles[tile];
  const owner = playerById(game, st?.owner);
  const after = viewing ? null : cashAfter(game, me);
  const isTurn = game.players[game.current]?.id === me.id;
  const [rolling, setRolling] = useState(false);
  useEffect(() => {
    if (!game.events.some((e) => e.type === 'roll')) return;
    setRolling(true);
    const timer = setTimeout(() => setRolling(false), 650);
    return () => clearTimeout(timer);
  }, [rollKey, game.events]);

  return (
    <div className="center">
      <div className="center-turn">
        <span className="player-chip-token">
          <TokenIcon icon={me.icon} color={me.color} size={30} blink />
          {away && <span className="offline-dot" />}
        </span>
        <div className="center-turn-main">
          <span className="center-turn-label">
            {mine
              ? isTurn
                ? 'Lượt của bạn'
                : 'Ván đang chờ bạn'
              : isTurn
                ? `Lượt của ${me.name}`
                : `Đang chờ ${me.name}`}
            {away && ' · mất kết nối'}
          </span>
          <span className="center-turn-cash">{money(me.cash)}</span>
        </div>
        <div className="center-turn-side">
          <span>{assetCount(game, me.id)} tài sản</span>
          <span>{me.heldCards.length} thẻ</span>
        </div>
      </div>

      <div className="center-tile">
        <div className="center-tile-head">
          <span className="eyebrow">
            {viewing ? 'Ô đang xem · chạm lại để đóng' : 'Ô đang đứng'}
          </span>
          {dice && !viewing && (
            <Dice values={dice} color={diceColor} size={24} rolling={rolling} key={rollKey} />
          )}
        </div>
        <h2 className="center-tile-name">{t.name}</h2>
        <p
          className="center-tile-owner"
          style={owner ? { color: colorOf(owner.color).main } : undefined}
        >
          {tileDescription(game, tile)}
          {st?.mortgaged ? ' · đang cắm' : ''}
        </p>
        {owner && (
          <div className="center-info">
            <div>
              <span className="eyebrow">{t.kind === 'property' ? 'Cấp nhà' : 'Loại'}</span>
              <b>
                {t.kind === 'property'
                  ? levelLabel(st!.level)
                  : t.kind === 'station'
                    ? 'Ga tàu'
                    : 'Nhà máy'}
              </b>
            </div>
            <div className="right">
              <span className="eyebrow">{pay?.label ?? 'Tiền thuê'}</span>
              <b>{pay?.text ?? rentText(game, tile)}</b>
            </div>
          </div>
        )}
        <div className="center-foot">
          {after !== null && (
            <div className="center-after">
              <span>Tiền của {you.name} sau giao dịch</span>
              <b>
                {money(me.cash)} <span aria-hidden="true">→</span>{' '}
                <span className={after < me.cash ? 'down' : 'up'}>
                  {after < 0 ? `thiếu ${money(-after)}` : money(after)}
                </span>
              </b>
            </div>
          )}
          <p className="center-wait">
            {mine ? capitalize(waitingText(game, you)) : waitingText(game, me)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Dòng nhật ký không đổi tiền nhưng người chơi cần thấy, kèm nhãn ở cột tiền: dùng hoặc mất thẻ
 * miễn, Thằng Bờm đổi đất, xúc xắc gieo mới để tính khoản phải trả.
 */
const LOG_NOTES: readonly [RegExp, string][] = [
  [/^Dùng (thẻ Miễn thuế nhà đất|quyền Người thủ đô)/, 'miễn'],
  [/hết hiệu lực$/, 'mất thẻ'],
  [/^Đổi .+ lấy /, '⇄'],
  [/^Gieo \d \+ \d(, trả | để tính tiền )/, ''],
];

const noteOf = (text: string): string | undefined => LOG_NOTES.find(([re]) => re.test(text))?.[1];

function LogPanel({ game }: { game: GameState }) {
  const rows = game.log
    .filter((e) => (e.amount !== undefined && e.amount !== 0) || noteOf(e.text) !== undefined)
    .slice(-LOG_VISIBLE_ENTRIES)
    .reverse();
  return (
    <section className="log" aria-label="Lịch sử giao dịch">
      <div className="log-head">
        <h2>Lịch sử giao dịch</h2>
        <span className="muted">{LOG_VISIBLE_ENTRIES} gần nhất · toàn bàn</span>
      </div>
      {rows.length === 0 && <p className="muted log-empty">Chưa có giao dịch nào.</p>}
      <ol>
        {rows.map((e, i) => {
          const p = playerById(game, e.playerId);
          const c = p ? colorOf(p.color) : null;
          return (
            <li key={`${e.turn}-${i}`} style={c ? { background: c.soft } : undefined}>
              {p && <TokenIcon icon={p.icon} color={p.color} size={18} />}
              <b style={c ? { color: c.main } : undefined}>{p?.name ?? 'Ngân hàng'}</b>
              <span className="log-text">{e.text}</span>
              {e.amount ? (
                <span className={`log-amount ${e.amount > 0 ? 'up' : 'down'}`}>
                  {signed(e.amount)}
                </span>
              ) : (
                <span className="log-amount is-note">{noteOf(e.text)}</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
