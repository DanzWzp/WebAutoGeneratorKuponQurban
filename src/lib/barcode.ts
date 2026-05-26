import { toBuffer } from "bwip-js/node";

/**
 * Generate barcode CODE128 sebagai PNG dataURL.
 * Dipakai di react-pdf via <Image src={dataUrl} />.
 *
 * Catatan: fungsi ini HANYA boleh dipanggil di server (Node runtime),
 * karena bwip-js/node memakai API Node.
 */
export async function generateBarcodeDataUrl(text: string): Promise<string> {
  const png = await toBuffer({
    bcid: "code128", // tipe barcode
    text, // teks yang di-encode (kode kupon)
    scale: 3, // faktor skala -> resolusi tinggi agar tajam saat dicetak
    height: 10, // tinggi bar (mm)
    includetext: false, // teks human-readable kita render terpisah di PDF
    backgroundcolor: "FFFFFF",
    paddingwidth: 2,
    paddingheight: 2,
  });
  return `data:image/png;base64,${png.toString("base64")}`;
}
