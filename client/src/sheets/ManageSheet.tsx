import { useEffect, useMemo, useState } from 'react';
import { BOARD, type GameState, type ManageOp, type Pending } from '@cotiphu/shared';
import { Sheet } from '../components/Sheet';
import { TokenIcon } from '../components/TokenIcon';
import {
  buildDraft,
  canConfirm,
  pressMinus,
  pressPlus,
  type AssetDraft,
  type AssetState,
  type Draft,
  type DraftMove,
} from '../game/draft';
import { SHORT_NAMES, levelText, money, playerById, rentText, signed } from '../game/format';
import type { SheetProps } from './types';
import './manage-sheet.css';

export type ManageMode = 'manage' | 'debt' | 'view';

type PayPending = Extract<Pending, { type: 'pay' }>;

interface ManageSheetProps extends SheetProps {
  mode: ManageMode;
  playerId: string;
  /** Xử lý nợ không đóng được; nút này tạm ẩn màn để xem bàn cờ. */
  onShowBoard?: () => void;
}

/** Tên ngắn cho thẻ tài sản: đất màu dùng tên ngắn của bàn cờ, ga và nhà máy giữ tên đủ. */
const assetName = (tile: number): string =>
  BOARD[tile]!.kind === 'property' ? SHORT_NAMES[tile]! : BOARD[tile]!.name;

function stateText(tile: number, st: AssetState): string {
  if (!st.owned) return 'Đã bán';
  if (st.mortgaged) return 'Đang cắm';
  return BOARD[tile]!.kind === 'property' ? levelText(st.level) : 'Hoạt động';
}

const MOVE_VERB: Record<DraftMove['kind'], string> = {
  downgrade: 'Hạ',
  mortgage: 'Cắm',
  sell: 'Bán',
  redeem: 'Chuộc',
  undo: 'Hoàn',
};

const MOVE_HELP: Record<DraftMove['kind'], string> = {
  downgrade: 'Hạ 1 cấp',
  mortgage: 'Cắm',
  sell: 'Bán cho Ngân hàng',
  redeem: 'Chuộc',
  undo: 'Hoàn lại bước vừa làm ở',
};

/** Tiền sau dự thảo có thể âm: dùng dấu trừ thật như phần còn lại của giao diện. */
const cashText = (n: number): string => (n < 0 ? signed(n) : money(n));

/** Tên người nhận khoản nợ ("Ngân hàng" hoặc tên người chơi). */
const creditorText = (game: GameState, pd: PayPending): string =>
  pd.creditors
    .map((c) => (c.playerId === null ? 'Ngân hàng' : (playerById(game, c.playerId)?.name ?? '')))
    .join(', ');

/** Ụp/Mở (mode manage), Xử lý nợ (mode debt) hoặc chỉ xem tài sản (mode view). Hình 2, bên phải. */
export function ManageSheet({
  game,
  dispatch,
  onClose,
  mode,
  playerId,
  onShowBoard,
}: ManageSheetProps) {
  const p = playerById(game, playerId)!;
  const [ops, setOps] = useState<ManageOp[]>([]);
  const [settling, setSettling] = useState(false);
  const draft = useMemo(
    () =>
      buildDraft(game, playerId, mode === 'view' ? [] : ops, mode === 'debt' ? 'debt' : 'manage'),
    [game, playerId, ops, mode],
  );
  const pd = game.pending;
  const debt = mode === 'debt' && pd.type === 'pay' && pd.playerId === playerId ? pd : null;

  // Thanh lý xong thì trả ngay ở lần vẽ kế tiếp, khi ván đã có số tiền mới.
  useEffect(() => {
    if (!settling) return;
    setSettling(false);
    if (debt && p.cash >= debt.total && dispatch({ type: 'pay', playerId }) === null) onClose();
  }, [settling, debt, p.cash, dispatch, playerId, onClose]);

  const confirm = () => {
    if (dispatch({ type: 'manage', playerId, ops: draft.ops }) === null) onClose();
  };

  const settle = () => {
    if (draft.ops.length === 0) {
      if (dispatch({ type: 'pay', playerId }) === null) onClose();
      return;
    }
    if (dispatch({ type: 'manage', playerId, ops: draft.ops }) !== null) return;
    setOps([]);
    setSettling(true);
  };

  const offTurn = game.players[game.current]?.id !== playerId;
  const title = mode === 'debt' ? 'Xử lý nợ' : mode === 'manage' ? 'Ụp / Mở' : 'Tài sản';
  const subtitle =
    mode === 'debt'
      ? `${p.name} thiếu tiền${offTurn ? ' (ngoài lượt)' : ''} · bấm − để thanh lý`
      : mode === 'manage'
        ? `${p.name} · bấm − / + để tạo dự thảo`
        : `${p.name} · chỉ xem, Ụp/Mở ở đầu lượt`;

  return (
    <Sheet
      game={game}
      icon={<TokenIcon icon={p.icon} color={p.color} size={44} blink />}
      title={title}
      subtitle={subtitle}
      label={`${title} của ${p.name}`}
      footer={
        <Footer
          mode={mode}
          draft={draft}
          debt={debt}
          onClose={onClose}
          onShowBoard={onShowBoard}
          onConfirm={confirm}
          onSettle={settle}
        />
      }
    >
      <div className="manage-body">
        {debt ? (
          <DebtBox game={game} debt={debt} draft={draft} />
        ) : (
          <CashBox draft={draft} view={mode === 'view'} />
        )}

        {draft.assets.length === 0 ? (
          <p className="manage-empty muted">{p.name} chưa có tài sản nào.</p>
        ) : (
          <ul className="manage-assets" aria-label="Tài sản">
            {draft.assets.map((a) => (
              <AssetCard
                key={a.tile}
                game={game}
                asset={a}
                view={mode === 'view'}
                onMinus={() => setOps(pressMinus(draft, a.tile))}
                onPlus={() => setOps(pressPlus(draft, a.tile))}
              />
            ))}
          </ul>
        )}

        {mode !== 'view' && <DraftSummary draft={draft} debt={debt} onReset={() => setOps([])} />}
      </div>
    </Sheet>
  );
}

function CashBox({ draft, view }: { draft: Draft; view: boolean }) {
  const delta = draft.cashAfter - draft.cash;
  return (
    <div className="manage-cash box box-teal">
      <div>
        <span className="eyebrow">Tiền hiện có</span>
        <b className="money-big">{money(draft.cash)}</b>
      </div>
      {!view && (
        <div className="right">
          <span className="eyebrow">Sau dự thảo</span>
          <b
            className={`money-big ${draft.cashAfter < 0 || delta < 0 ? 'down' : delta > 0 ? 'up' : ''}`}
          >
            {cashText(draft.cashAfter)}
          </b>
        </div>
      )}
      {view && (
        <div className="right">
          <span className="eyebrow">Tài sản</span>
          <b className="money-big">{draft.assets.length}</b>
        </div>
      )}
    </div>
  );
}

function DebtBox({ game, debt, draft }: { game: GameState; debt: PayPending; draft: Draft }) {
  const missing = debt.total - draft.cashAfter;
  const to = creditorText(game, debt);
  return (
    <div className="manage-debt box box-red">
      <span className="eyebrow">Khoản bắt buộc phải trả</span>
      <div className="manage-debt-main">
        <b className="manage-debt-total">{money(debt.total)}</b>
        <span className="manage-debt-label">
          {debt.label ?? 'Khoản phải trả'}
          {to && ` · cho ${to}`}
        </span>
      </div>
      <dl className="manage-debt-side">
        <div>
          <dt>Hiện có</dt>
          <dd>{money(draft.cash)}</dd>
        </div>
        <div>
          <dt>Sau dự thảo</dt>
          <dd className={draft.cashAfter > draft.cash ? 'up' : undefined}>
            {money(draft.cashAfter)}
          </dd>
        </div>
        <div>
          {missing > 0 ? (
            <>
              <dt>Còn thiếu</dt>
              <dd className="down">{money(missing)}</dd>
            </>
          ) : (
            <>
              <dt>Còn lại sau trả</dt>
              <dd className="up">{money(-missing)}</dd>
            </>
          )}
        </div>
      </dl>
    </div>
  );
}

interface AssetCardProps {
  game: GameState;
  asset: AssetDraft;
  view: boolean;
  onMinus: () => void;
  onPlus: () => void;
}

/** Mỗi tài sản đúng 2 dòng: tên + cấp nhà; nút −/+ kèm số tiền (chỉ xem: tiền thuê). */
function AssetCard({ game, asset: a, view, onMinus, onPlus }: AssetCardProps) {
  const name = assetName(a.tile);
  const changed = a.steps.length > 0;
  const kind = BOARD[a.tile]!.kind;
  const cls = [
    'manage-asset',
    `kind-${kind}`,
    changed && 'is-changed',
    a.now.mortgaged && 'is-mortgaged',
    !a.now.owned && 'is-sold',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <li className={cls}>
      <div className="manage-asset-head">
        <b className="manage-asset-name">{name}</b>
        <span className="manage-asset-state">{stateText(a.tile, a.now)}</span>
      </div>
      {view ? (
        <div className="manage-asset-rent">
          {a.now.mortgaged ? (
            <span className="muted">Không thu tiền thuê</span>
          ) : (
            <>
              <span className="muted">Thuê</span> <b>{rentText(game, a.tile)}</b>
            </>
          )}
        </div>
      ) : (
        <div className="manage-asset-btns">
          <StepButton sign="−" move={a.minus} name={name} onClick={onMinus} />
          <StepButton sign="+" move={a.plus} name={name} onClick={onPlus} />
        </div>
      )}
    </li>
  );
}

interface StepButtonProps {
  sign: '−' | '+';
  move: DraftMove | null;
  name: string;
  onClick: () => void;
}

function StepButton({ sign, move, name, onClick }: StepButtonProps) {
  const side = sign === '−' ? 'is-minus' : 'is-plus';
  if (!move) {
    return (
      <button
        type="button"
        className={`manage-step ${side}`}
        disabled
        aria-label={`${sign} ${name}`}
      >
        <span className="manage-step-verb">{sign}</span>
      </button>
    );
  }
  const help = `${MOVE_HELP[move.kind]} ${name}, ${move.amount >= 0 ? 'nhận' : 'trả'} ${money(Math.abs(move.amount))}`;
  return (
    <button type="button" className={`manage-step ${side}`} onClick={onClick} aria-label={help}>
      <span className="manage-step-verb">
        {sign} {MOVE_VERB[move.kind]}
      </span>
      <span className={`manage-step-amount ${move.amount >= 0 ? 'up' : 'down'}`}>
        {signed(move.amount)}
      </span>
    </button>
  );
}

interface DraftSummaryProps {
  draft: Draft;
  debt: PayPending | null;
  onReset: () => void;
}

/** Dự thảo đang áp dụng: mỗi tài sản đã đổi một dòng, rồi tiền trước → sau. */
function DraftSummary({ draft, debt, onReset }: DraftSummaryProps) {
  const changed = draft.assets.filter((a) => a.steps.length > 0);
  // Giữ thứ tự bấm: tài sản nào bấm trước thì đứng trước.
  const order = (a: AssetDraft) => draft.steps.indexOf(a.steps[0]!);
  changed.sort((x, y) => order(x) - order(y));

  return (
    <section className="manage-summary" aria-live="polite">
      <div className="manage-summary-head">
        <span className="eyebrow">{debt ? 'Dự thảo thanh lý' : 'Dự thảo đang áp dụng'}</span>
        {changed.length > 0 && (
          <button type="button" className="manage-reset" onClick={onReset}>
            Làm lại
          </button>
        )}
      </div>
      {changed.length === 0 ? (
        <p className="manage-summary-empty muted">
          {debt
            ? `Chưa có thay đổi. Bấm − đến khi đủ ${money(debt.total)}.`
            : 'Chưa có thay đổi. Bấm − để hạ cấp, cắm hoặc bán; + để hoàn lại hoặc chuộc.'}
        </p>
      ) : (
        <ol className="manage-summary-list">
          {changed.map((a) => (
            <li key={a.tile}>
              <span>
                <b>{assetName(a.tile)}</b> {stateText(a.tile, a.start)} → {stateText(a.tile, a.now)}
              </span>
              <b className={a.amount >= 0 ? 'up' : 'down'}>{signed(a.amount)}</b>
            </li>
          ))}
        </ol>
      )}
      <p className="manage-summary-note muted">
        {debt
          ? `Chỉ trả được khi đủ toàn bộ ${money(debt.total)}.`
          : 'Tiền và quyền sở hữu chỉ đổi khi xác nhận.'}
      </p>
    </section>
  );
}

interface FooterProps {
  mode: ManageMode;
  draft: Draft;
  debt: PayPending | null;
  onClose: () => void;
  onShowBoard?: () => void;
  onConfirm: () => void;
  onSettle: () => void;
}

/** Dòng tiền luôn hiện ở chân màn, kể cả khi danh sách tài sản đã cuộn qua hộp tiền ở trên. */
function FooterCash({ draft, debt }: { draft: Draft; debt: PayPending | null }) {
  const delta = draft.cashAfter - draft.cash;
  const missing = debt ? debt.total - draft.cashAfter : -draft.cashAfter;
  return (
    <p className="manage-footer-cash" aria-live="polite">
      <span>
        <span className="muted">Tiền</span> {money(draft.cash)} →{' '}
        <b className={draft.cashAfter < 0 || delta < 0 ? 'down' : delta > 0 ? 'up' : undefined}>
          {cashText(draft.cashAfter)}
        </b>
      </span>
      {missing > 0 ? (
        <b className="down">Còn thiếu {money(missing)}</b>
      ) : debt ? (
        <b className="up">Còn lại sau trả {money(-missing)}</b>
      ) : null}
    </p>
  );
}

function Footer({ mode, draft, debt, onClose, onShowBoard, onConfirm, onSettle }: FooterProps) {
  if (mode === 'view') {
    return (
      <button type="button" className="btn btn-outline manage-close-only" onClick={onClose}>
        Đóng
      </button>
    );
  }
  if (mode === 'debt') {
    const ready = debt !== null && draft.cashAfter >= debt.total;
    return (
      <>
        <FooterCash draft={draft} debt={debt} />
        <div className="btn-row">
          {onShowBoard && (
            <button type="button" className="btn btn-outline manage-peek" onClick={onShowBoard}>
              Xem bàn cờ
            </button>
          )}
          <button
            type="button"
            className="btn btn-grow btn-red"
            disabled={!ready}
            onClick={onSettle}
          >
            {draft.ops.length === 0 && ready ? 'Trả' : 'Thanh lý & trả'}{' '}
            {debt ? money(debt.total) : ''}
          </button>
        </div>
      </>
    );
  }
  const delta = draft.cashAfter - draft.cash;
  return (
    <>
      <FooterCash draft={draft} debt={null} />
      <div className="btn-row">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Đóng
        </button>
        <button
          type="button"
          className="btn btn-grow btn-teal"
          disabled={!canConfirm(draft)}
          onClick={onConfirm}
        >
          Xác nhận{draft.ops.length > 0 ? ` · ${signed(delta)}` : ''}
        </button>
      </div>
    </>
  );
}
