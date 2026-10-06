import { useState } from 'react';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROOM_CODE_LENGTH,
  type GameState,
  type Profile,
} from '@cotiphu/shared';
import { TokenIcon } from '../components/TokenIcon';
import { money } from '../game/format';
import { ProfileEditor } from '../online/ProfileEditor';
import {
  cleanCode,
  cleanName,
  loadCapacity,
  loadProfile,
  saveCapacity,
  saveProfile,
} from '../online/storage';
import './setup-screen.css';
import './home-screen.css';

const COUNTS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i);

type Tab = 'create' | 'join';

interface HomeScreenProps {
  /** Mã phòng trong đường dẫn mời (?phong=), mở sẵn phần Vào phòng. */
  inviteCode: string | null;
  /** Lời nhắn từ lần trước: phòng đã đóng, không vào lại được… */
  notice: string | null;
  onDismissNotice: () => void;
  onCreate: (capacity: number, profile: Profile) => Promise<string | null>;
  onJoin: (code: string, profile: Profile) => Promise<string | null>;
  /** Ván chơi chung một máy đang dở trên máy này. */
  hotSeatGame: GameState | null;
  onHotSeat: () => void;
}

/** Màn đầu: tạo phòng online, vào phòng bằng mã, hoặc chơi chung một máy. */
export function HomeScreen({
  inviteCode,
  notice,
  onDismissNotice,
  onCreate,
  onJoin,
  hotSeatGame,
  onHotSeat,
}: HomeScreenProps) {
  const [profile, setProfile] = useState(loadProfile);
  const [tab, setTab] = useState<Tab>(inviteCode ? 'join' : 'create');
  const [capacity, setCapacity] = useState(loadCapacity);
  const [code, setCode] = useState(inviteCode ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameMissing, setNameMissing] = useState(false);

  const change = (next: Profile) => {
    setProfile(next);
    saveProfile(next);
    setError(null);
    if (next.name.trim()) setNameMissing(false);
  };

  /** Kiểm tra tên rồi gửi yêu cầu tạo hoặc vào phòng. */
  const go = async (run: (p: Profile) => Promise<string | null>) => {
    const p = { ...profile, name: cleanName(profile.name) };
    if (!p.name) {
      setNameMissing(true);
      document.getElementById('home-name')?.focus();
      return setError('Nhập tên của bạn trước đã.');
    }
    saveProfile(p);
    setProfile(p);
    setBusy(true);
    setError(null);
    onDismissNotice();
    const err = await run(p);
    setBusy(false);
    if (err) setError(err);
  };

  const create = () => {
    saveCapacity(capacity);
    void go((p) => onCreate(capacity, p));
  };
  const codeReady = code.length === ROOM_CODE_LENGTH;
  const join = () => {
    if (codeReady) void go((p) => onJoin(code, p));
  };

  const pickTab = (t: Tab) => {
    setTab(t);
    setError(null);
  };

  const hotCur = hotSeatGame?.players[hotSeatGame.current];

  return (
    <main className="phone home-screen">
      <header className="app-header">
        <h1 className="app-title">CỜ TỶ PHÚ</h1>
        <span className="app-turn muted">Mỗi người một điện thoại</span>
      </header>

      {notice && (
        <div className="box box-red home-notice" role="alert">
          <span>{notice}</span>
          <button type="button" aria-label="Đóng thông báo" onClick={onDismissNotice}>
            ✕
          </button>
        </div>
      )}

      <section className="home-card">
        <div className="setup-head home-head">
          <TokenIcon icon={18} color={0} size={44} title="Cờ tỷ phú" />
          <div>
            <h2 className="setup-title">
              {inviteCode ? `Vào phòng ${inviteCode}` : 'Chơi online'}
            </h2>
            <p className="setup-subtitle">
              {inviteCode
                ? 'Bạn được mời. Chọn tên, màu, kí hiệu rồi vào.'
                : 'Tạo phòng rồi gửi mã cho bạn bè'}
            </p>
          </div>
        </div>

        <ProfileEditor
          id="home-name"
          label="Bạn là"
          value={profile}
          onChange={change}
          invalid={nameMissing}
        />

        <div className="home-tabs" role="tablist" aria-label="Tạo hoặc vào phòng">
          <button
            type="button"
            role="tab"
            id="home-tab-create"
            aria-selected={tab === 'create'}
            aria-controls="home-panel"
            className={tab === 'create' ? 'is-on' : ''}
            onClick={() => pickTab('create')}
          >
            Tạo phòng
          </button>
          <button
            type="button"
            role="tab"
            id="home-tab-join"
            aria-selected={tab === 'join'}
            aria-controls="home-panel"
            className={tab === 'join' ? 'is-on' : ''}
            onClick={() => pickTab('join')}
          >
            Vào phòng
          </button>
        </div>

        <div
          className="home-panel"
          id="home-panel"
          role="tabpanel"
          aria-labelledby={`home-tab-${tab}`}
        >
          {tab === 'create' ? (
            <>
              <p className="eyebrow setup-label" id="home-count-label">
                Chọn số người
              </p>
              <div className="setup-count" role="radiogroup" aria-labelledby="home-count-label">
                {COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={n === capacity}
                    className={`setup-count-btn${n === capacity ? ' is-on' : ''}`}
                    onClick={() => setCapacity(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-teal home-go"
                disabled={busy}
                onClick={create}
              >
                {busy ? 'Đang tạo phòng…' : `Tạo phòng ${capacity} người`}
              </button>
            </>
          ) : (
            <>
              <label className="eyebrow setup-label" htmlFor="home-code">
                Mã phòng · {ROOM_CODE_LENGTH} kí tự
              </label>
              <input
                id="home-code"
                className="home-code"
                value={code}
                placeholder="VD: K7M2QX"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                onChange={(e) => {
                  setCode(cleanCode(e.target.value));
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') join();
                }}
              />
              <button
                type="button"
                className="btn btn-blue home-go"
                disabled={busy || !codeReady}
                onClick={join}
              >
                {busy ? 'Đang vào phòng…' : codeReady ? `Vào phòng ${code}` : 'Nhập đủ mã phòng'}
              </button>
            </>
          )}
          {error && (
            <p className="box box-red home-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>

      <div className="home-or" aria-hidden="true">
        <span>hoặc</span>
      </div>
      <button type="button" className="btn btn-outline home-hotseat" onClick={onHotSeat}>
        {hotCur ? (
          <>
            <span>Tiếp tục ván chơi chung</span>
            <span className="home-hotseat-sub">
              Lượt {hotCur.name} · {money(hotCur.cash)}
            </span>
          </>
        ) : (
          <>
            <span>Chơi chung một máy</span>
            <span className="home-hotseat-sub">Chuyền tay một điện thoại</span>
          </>
        )}
      </button>
    </main>
  );
}
