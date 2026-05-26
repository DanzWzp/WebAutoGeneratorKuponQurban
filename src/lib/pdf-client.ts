/**
 * Minta server membuat PDF kupon lalu trigger download di browser.
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

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kupon-kurban-${new Date().toISOString().split("T")[0]}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
