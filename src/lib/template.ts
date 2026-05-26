import fs from "node:fs";
import path from "node:path";

/**
 * Jika file template kupon tersedia di public/, baca sebagai data URL agar
 * bisa dipakai sebagai background di react-pdf. Jika tidak ada, kembalikan null
 * dan komponen PDF akan memakai desain vektor bawaan (tetap rapi & presisi).
 *
 * Letakkan file Anda di: public/template-kupon.jpg (atau .png)
 */
let cached: string | null | undefined;

export function getTemplateDataUrl(): string | null {
  if (cached !== undefined) return cached;

  const candidates = [
    { file: "template-kupon.jpg", mime: "image/jpeg" },
    { file: "template-kupon.jpeg", mime: "image/jpeg" },
    { file: "template-kupon.png", mime: "image/png" },
  ];

  for (const { file, mime } of candidates) {
    try {
      const p = path.join(process.cwd(), "public", file);
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        cached = `data:${mime};base64,${buf.toString("base64")}`;
        return cached;
      }
    } catch {
      // abaikan, lanjut ke kandidat berikutnya
    }
  }

  cached = null;
  return cached;
}
