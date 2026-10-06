import { inviteLink } from './storage';

/** Kết quả mời bạn: đã mở bảng chia sẻ, đã chép link, hoặc không làm được (hiện link để tự chép). */
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

/** Máy có bảng chia sẻ của hệ điều hành (điện thoại, chỉ chạy trên https hoặc localhost). */
export const canShare = (): boolean => typeof navigator.share === 'function';

/** Mở bảng chia sẻ link mời (Zalo, Messenger…); không có thì chép link. */
export async function shareRoom(code: string): Promise<ShareResult> {
  const url = inviteLink(code);
  if (canShare()) {
    try {
      await navigator.share({ title: 'Cờ tỷ phú', text: `Vào phòng ${code} chơi Cờ tỷ phú`, url });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    }
  }
  return (await copyText(url)) ? 'copied' : 'failed';
}

/** Chép link mời. */
export const copyRoomLink = async (code: string): Promise<boolean> => copyText(inviteLink(code));

/** Chép chữ vào bộ nhớ tạm; trang http trong mạng LAN không có clipboard API nên dùng cách cũ. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Thử cách cũ bên dưới.
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
