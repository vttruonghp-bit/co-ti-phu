import type { Ack } from '@cotiphu/shared';

/** Kết quả bên trong máy chủ: thành công kèm giá trị, hoặc lỗi tiếng Việt gửi lại cho người chơi. */
export type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const done: Result = { ok: true, value: undefined };
export const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/** Đổi sang dạng `Ack` của giao thức (không có `data` khi không có giá trị). */
export function toAck(res: Result<unknown>): Ack<unknown> {
  if (!res.ok) return { ok: false, error: res.error };
  return res.value === undefined ? ({ ok: true } as Ack<unknown>) : { ok: true, data: res.value };
}
