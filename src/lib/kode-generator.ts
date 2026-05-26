import { customAlphabet } from "nanoid";

// Alphabet tanpa karakter ambigu (tanpa 0/O, 1/I/L) agar mudah dibaca manusia
// dan tidak salah ketik saat input manual.
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateId = customAlphabet(alphabet, 8);

/**
 * Generate kode kupon unik 8 karakter alfanumerik.
 * 32 karakter ^ 8 ≈ 1.1 x 10^12 kombinasi -> praktis tidak bisa ditebak.
 */
export function generateKodeKupon(): string {
  return generateId();
}

/**
 * Generate sejumlah `count` kode kupon yang dijamin unik di dalam batch ini.
 * Berguna untuk bulk create agar tidak ada tabrakan di satu request.
 */
export function generateUniqueKodeBatch(count: number): string[] {
  const set = new Set<string>();
  while (set.size < count) {
    set.add(generateKodeKupon());
  }
  return Array.from(set);
}
