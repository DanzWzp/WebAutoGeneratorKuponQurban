/**
 * Minta server membuat PDF kupon lalu trigger download di browser.
 * Nama file diambil dari header Content-Disposition (sudah berisi nama
 * penerima bila hanya 1 kupon).
 * @param ids daftar id penerima; kosong/undefined = semua penerima.
 */
export async function downloadKuponPdf(ids?: string[]): Promise<void> {
  const res = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: ids ?? [] }),
  });

  if (!res.ok) {
    let msg = "Gagal membuat PDF";
    try {
      const d = await res.json();
      msg = d.error || msg;
    } catch {
      // response bukan JSON
    }
    throw new Error(msg);
  }

  // Ambil nama file dari header server, fallback ke nama berbasis tanggal.
  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename =
    match?.[1] ||
    `kupon-kurban-${new Date().toISOString().split("T")[0]}.pdf`;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
