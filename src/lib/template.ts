import fs from "node:fs";
import path from "node:path";

/**
 * Jika file template kupon tersedia di public/, baca sebagai data URL beserta
 * rasio (lebar/tinggi) gambarnya agar kupon di PDF tidak gepeng.
 * Jika tidak ada, kembalikan null dan komponen PDF memakai desain vektor bawaan.
 *
 * Letakkan file Anda di: public/template-kupon.jpg (atau .png)
 */
export interface TemplateInfo {
  dataUrl: string;
  ratio: number; // lebar / tinggi
}

let cached: TemplateInfo | null | undefined;

/** Baca dimensi (lebar x tinggi) dari buffer JPEG/PNG. */
function readImageSize(buf: Buffer): { w: number; h: number } | null {
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // JPEG: cari marker SOF
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 8) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      const isSOF =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      if (isSOF) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }
  return null;
}

export function getTemplate(): TemplateInfo | null {
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
        const size = readImageSize(buf);
        cached = {
          dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
          ratio: size && size.h > 0 ? size.w / size.h : 3.1,
        };
        return cached;
      }
    } catch {
      // abaikan, lanjut ke kandidat berikutnya
    }
  }

  cached = null;
  return cached;
}
