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
  onCancel: () => void;
}

/** Đang vào lại phòng bằng vé đã lưu (tải lại trang, mở lại trình duyệt). */
export function ResumeScreen({ code, status, onCancel }: ResumeScreenProps) {
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
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Về màn đầu
        </button>
      </section>
    </main>
  );
}
