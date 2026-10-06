/** Nguồn ngẫu nhiên cho bộ luật. Máy chủ dùng bản có hạt giống; test dùng bản kịch bản. */
export interface Rng {
  /** Số nguyên ngẫu nhiên trong [min, max]. */
  int(min: number, max: number): number;
}

/** Gieo 1 viên xúc xắc. */
export const rollDie = (rng: Rng): number => rng.int(1, 6);

/** Bộ sinh số mulberry32, đủ tốt cho game và tái lập được từ hạt giống. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { int: (min, max) => min + Math.floor(next() * (max - min + 1)) };
}

/**
 * Nguồn ngẫu nhiên theo kịch bản cho test: trả lần lượt các số đã cho,
 * hết kịch bản thì dùng `fallback` (mặc định báo lỗi để test không âm thầm sai).
 */
export function scriptedRng(values: number[], fallback?: Rng): Rng & { remaining(): number } {
  const queue = [...values];
  return {
    int(min, max) {
      const v = queue.shift();
      if (v === undefined) {
        if (fallback) return fallback.int(min, max);
        throw new Error(`Kịch bản ngẫu nhiên đã hết (cần số trong [${min}, ${max}])`);
      }
      if (v < min || v > max) throw new Error(`Số kịch bản ${v} nằm ngoài [${min}, ${max}]`);
      return v;
    },
    remaining: () => queue.length,
  };
}

/** Xáo mảng (Fisher–Yates), trả mảng mới. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
