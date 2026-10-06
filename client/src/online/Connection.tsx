import { useState } from 'react';
import type { ConnStatus } from './useOnline';
import './connection.css';

/** Dải nhỏ trên cùng khi đang rớt mạng (máy tự nối lại và vào lại ghế). */
export function ConnectionBanner({ status }: { status: ConnStatus }) {
  if (status !== 'offline') return null;
  return (
    <div className="conn-banner" role="status">
      <span className="conn-spin" aria-hidden="true" />
      Mất kết nối · đang nối lại…
    </div>
  );
}

interface ResumeScreenProps {
  code: string;
  status: ConnStatus;
  /** Bỏ ghế (bỏ vé đã lưu) rồi về màn đầu. */
  onAbandon: () => Promise<void>;
}

/** Đang vào lại phòng bằng vé đã lưu (tải lại trang, mở lại trình duyệt). */
export function ResumeScreen({ code, status, onAbandon }: ResumeScreenProps) {
  // Bỏ vé là mất ghế hẳn (giữa ván thì mọi người phải chờ lượt mình): hỏi lại trước.
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const abandon = () => {
    setBusy(true);
    void onAbandon();
  };
  return (
    <main className="phone resume-screen">
      <header className="app-header">
        <h1 className="app-title">CỜ TỶ PHÚ</h1>
        <span className="app-turn muted">Phòng {code}</span>
      </header>
      <section className="resume-card" aria-live="polite">
        <span className="conn-spin is-big" aria-hidden="true" />
        <h2>Đang vào phòng {code}…</h2>
        <p className="muted">
          {status === 'offline'
            ? 'Chưa kết nối được máy chủ. Máy sẽ tự thử lại.'
            : 'Giữ nguyên ghế, tên và quân của bạn.'}
        </p>
        {asking ? (
          <>
            <p className="resume-warn" role="alert">
              Bỏ ghế ở phòng {code}? Bạn sẽ không vào lại được.
            </p>
            <div className="btn-row resume-actions">
              <button
                type="button"
                className="btn btn-outline"
                disabled={busy}
                onClick={() => setAsking(false)}
              >
                Chờ tiếp
              </button>
              <button type="button" className="btn btn-red" disabled={busy} onClick={abandon}>
                {busy ? 'Đang rời…' : 'Bỏ ghế'}
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="btn btn-outline" onClick={() => setAsking(true)}>
            Về màn đầu
          </button>
        )}
      </section>
    </main>
  );
}
