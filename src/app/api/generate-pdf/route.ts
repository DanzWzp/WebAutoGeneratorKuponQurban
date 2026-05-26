import { createElement } from "react";
import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";
import { generateBarcodeDataUrl } from "@/lib/barcode";
import { getTemplate } from "@/lib/template";
import { KuponPDF, type KuponPenerima } from "@/components/kupon/KuponPDF";

/** Bersihkan nama untuk dipakai di nama file (hilangkan karakter tidak aman). */
function slugForFile(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40) || "kupon"
  );
}

// PDF + barcode butuh Node runtime (bukan Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/generate-pdf  { ids?: string[] }
// ids kosong / tidak ada -> generate untuk SEMUA penerima milik user.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let ids: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.ids)) {
      ids = body.ids.filter((x: unknown): x is string => typeof x === "string");
    }
  } catch {
    // body kosong -> generate semua
  }

  try {
    const penerimaList = await prisma.penerima.findMany({
      where: {
        userId: user.id,
        ...(ids.length > 0 ? { id: { in: ids } } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    if (penerimaList.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada penerima untuk dicetak" },
        { status: 400 }
      );
    }

    // Generate barcode untuk setiap penerima secara paralel.
    const enriched: KuponPenerima[] = await Promise.all(
      penerimaList.map(async (p) => ({
        id: p.id,
        nama: p.nama,
        kodeKupon: p.kodeKupon,
        barcodeDataUrl: await generateBarcodeDataUrl(p.kodeKupon),
      }))
    );

    const template = getTemplate();

    const element = createElement(KuponPDF, {
      penerimaList: enriched,
      templateDataUrl: template?.dataUrl ?? null,
      templateRatio: template?.ratio ?? null,
    }) as Parameters<typeof renderToBuffer>[0];

    const buffer = await renderToBuffer(element);

    // Nama file: sertakan nama penerima bila hanya 1 kupon, jika tidak pakai tanggal.
    const today = new Date().toISOString().split("T")[0];
    const filename =
      penerimaList.length === 1
        ? `kupon-${slugForFile(penerimaList[0].nama)}-${penerimaList[0].kodeKupon}.pdf`
        : `kupon-kurban-${today}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("POST /api/generate-pdf error:", err);
    return NextResponse.json(
      { error: "Gagal membuat PDF kupon" },
      { status: 500 }
    );
  }
}
