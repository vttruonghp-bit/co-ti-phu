import { useEffect, useState } from 'react';
import { MAX_PLAYERS, MIN_PLAYERS, type Profile, type RoomView, type Seat } from '@cotiphu/shared';
import type { Appearance } from '../components/IconPicker';
import { TokenIcon } from '../components/TokenIcon';
import { ProfileEditor } from '../online/ProfileEditor';
import { canShare, copyRoomLink, shareRoom } from '../online/share';
import { cleanName, inviteLink, loadProfile, saveProfile } from '../online/storage';
import { ICON_NAMES, colorOf } from '../theme';
import './setup-screen.css';
import './lobby-screen.css';

const COUNTS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i);

interface LobbyScreenProps {
  room: RoomView;
  meId: string;
  onProfile: (profile: Profile) => Promise<string | null>;
  onCapacity: (capacity: number) => Promise<string | null>;
  onStart: () => Promise<string | null>;
  onLeave: () => Promise<string | null>;
}

/** Phòng chờ (hình 5, bản online): mã phòng, các ghế, hồ sơ của mình, nút của chủ phòng. */
export function LobbyScreen({
  room,
  meId,
  onProfile,
  onCapacity,
  onStart,
  onLeave,
}: LobbyScreenProps) {
  const { code, capacity, seats } = room;
  const me = seats.find((s) => s.id === meId);
  const others = seats.filter((s) => s.id !== meId);
  const isHost = me?.isHost ?? false;
  const full = seats.length >= capacity;

  // Tên đang gõ (chưa gửi); null thì hiện tên trên máy chủ.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  // Màu, kí hiệu vừa chọn, hiện ngay trong lúc chờ máy chủ.
  const [look, setLook] = useState<Appearance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  // Màu hoặc kí hiệu đã chọn ở màn đầu bị người khác dùng trước: máy chủ đổi sang cái còn trống.
  const [swapped, setSwapped] = useState(() => {
    const want = loadProfile();
    return me !== undefined && (want.color !== me.color || want.icon !== me.icon);
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!confirmLeave) return;
    const t = setTimeout(() => setConfirmLeave(false), 4000);
    return () => clearTimeout(t);
  }, [confirmLeave]);

  if (!me) return null;
  const value: Profile = {
    name: nameDraft ?? me.name,
    color: look?.color ?? me.color,
    icon: look?.icon ?? me.icon,
  };

  const sendProfile = async (p: Profile) => {
    setError(null);
    const err = await onProfile(p);
    if (err) setError(err);
    else saveProfile(p);
    return err;
  };

  const change = (next: Profile) => {
    setSwapped(false);
    if (next.name !== value.name) {
      setNameDraft(next.name);
      return;
    }
    if (next.color === me.color && next.icon === me.icon) return;
    setLook({ color: next.color, icon: next.icon });
    void sendProfile({ ...next, name: me.name }).then(() => setLook(null));
  };

  const nameDone = async () => {
    if (nameDraft === null) return;
    const name = cleanName(nameDraft);
    if (!name) {
      setNameDraft(null);
      setError('Tên không được để trống.');
      return;
    }
    if (name !== me.name) await sendProfile({ name, color: me.color, icon: me.icon });
    setNameDraft(null);
  };

  const run = async (task: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    const err = await task();
    setBusy(false);
    if (err) setError(err);
  };

  const leave = () => {
    // Chủ phòng rời phòng chờ thì phòng đóng: hỏi lại một lần khi đã có người khác.
    if (isHost && others.length > 0 && !confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    void run(onLeave);
  };

  const share = async () => {
    const r = await shareRoom(code);
    if (r === 'copied') setToast('Đã chép link mời');
    else if (r === 'failed') setToast('Không chép được, hãy gửi mã phòng');
  };
  const copy = async () => {
    setToast((await copyRoomLink(code)) ? 'Đã chép link mời' : 'Không chép được, hãy gửi mã phòng');
  };

  const takenColors = others.map((s) => s.color);
  const takenIcons = others.map((s) => s.icon);
  const missing = capacity - seats.length;
  const seatNumber = (s: Seat) => seats.indexOf(s) + 1;

  return (
    <main className="phone setup-screen lobby-screen">
      <header className="app-header">
        <h1 className="app-title">CỜ TỶ PHÚ</h1>
        <span className="app-turn">
          Phòng chờ · {seats.length}/{capacity} người
        </span>
      </header>

      <section className="setup-card">
        <div className="setup-body lobby-body">
          <div className="lobby-code">
            <div className="lobby-code-main">
              <span className="eyebrow">Mã phòng</span>
              <b className="lobby-code-text" aria-label={`Mã phòng ${[...code].join(' ')}`}>
                {code}
              </b>
              <span className="lobby-link">{inviteLink(code).replace(/^https?:\/\//, '')}</span>
            </div>
            <div className="lobby-share">
              {canShare() && (
                <button type="button" className="btn btn-teal btn-small" onClick={share}>
                  Chia sẻ
                </button>
              )}
              <button type="button" className="btn btn-outline btn-small" onClick={copy}>
                Chép link
              </button>
            </div>
          </div>

          {isHost && (
            <>
              <p className="eyebrow setup-label" id="lobby-count-label">
                Chọn số người
              </p>
              <div className="setup-count" role="radiogroup" aria-labelledby="lobby-count-label">
                {COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={n === capacity}
                    className={`setup-count-btn${n === capacity ? ' is-on' : ''}`}
                    disabled={n < seats.length || busy}
                    onClick={() => n !== capacity && void run(() => onCapacity(n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="setup-players-head">
            <span className="eyebrow">
              {seats.length}/{capacity} người chơi
            </span>
            <span className="muted">Màu và kí hiệu không trùng nhau</span>
          </div>
          <div className="lobby-seats">
            <ProfileEditor
              id="lobby-name"
              label={
                <>
                  {isHost ? '★ Chủ phòng' : `Người chơi ${seatNumber(me)}`} · bạn
                  <ConnDot on />
                </>
              }
              value={value}
              onChange={change}
              onNameDone={() => void nameDone()}
              takenColors={takenColors}
              takenIcons={takenIcons}
              invalid={nameDraft !== null && !nameDraft.trim()}
            />
            {swapped && (
              <p className="box box-amber lobby-swapped" role="status">
                Màu hoặc kí hiệu bạn chọn đã có người dùng nên được đổi. Bấm quân để chọn lại.
              </p>
            )}
            <div className="lobby-grid">
              {others.map((s) => (
                <SeatCard key={s.id} seat={s} number={seatNumber(s)} />
              ))}
              {Array.from({ length: Math.max(0, missing) }, (_, k) => (
                <div key={`empty-${k}`} className="lobby-seat is-empty">
                  <span className="lobby-seat-label">Người chơi {seats.length + k + 1}</span>
                  <span className="lobby-wait">Đang chờ…</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="setup-footer">
          {error && (
            <p className="box box-red setup-error" role="alert">
              {error}
            </p>
          )}
          {confirmLeave && (
            <p className="lobby-confirm" role="status">
              Chủ phòng rời đi thì phòng đóng, mọi người phải vào phòng khác.
            </p>
          )}
          <div className="btn-row">
            <button
              type="button"
              className={`btn ${confirmLeave ? 'btn-red' : 'btn-outline'}`}
              disabled={busy}
              onClick={leave}
            >
              {confirmLeave ? 'Đóng phòng' : 'Rời phòng'}
            </button>
            {isHost ? (
              <button
                type="button"
                className="btn btn-grow btn-teal"
                disabled={!full || busy}
                onClick={() => void run(onStart)}
              >
                {full ? `Bắt đầu ván ${capacity} người` : `Chờ đủ ${capacity} người…`}
              </button>
            ) : (
              <button type="button" className="btn btn-grow" disabled>
                {full ? 'Chờ chủ phòng…' : `Chờ đủ ${capacity} người…`}
              </button>
            )}
          </div>
        </div>
      </section>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}

/** Chấm xanh: đang mở trang; xám: mất kết nối. */
function ConnDot({ on }: { on: boolean }) {
  return (
    <span
      className={`lobby-dot${on ? ' is-on' : ''}`}
      role="img"
      aria-label={on ? 'đang kết nối' : 'mất kết nối'}
    />
  );
}

/** Ghế của người khác: chỉ xem. */
function SeatCard({ seat, number }: { seat: Seat; number: number }) {
  const c = colorOf(seat.color);
  return (
    <div
      className={`lobby-seat${seat.connected ? '' : ' is-away'}`}
      style={{ ['--pc' as string]: c.main, ['--pc-soft' as string]: c.soft }}
    >
      <span className="lobby-seat-label">
        {seat.isHost ? '★ Chủ phòng' : `Người chơi ${number}`}
        <ConnDot on={seat.connected} />
      </span>
      <span className="lobby-seat-row">
        <TokenIcon icon={seat.icon} color={seat.color} size={28} />
        <span className="lobby-seat-text">
          <b title={seat.name}>{seat.name}</b>
          <span>{seat.connected ? ICON_NAMES[seat.icon] : 'Mất kết nối'}</span>
        </span>
      </span>
    </div>
  );
}
