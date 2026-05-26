import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { RedeemResponse } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/redeem/check?kode=K7XQ9M2A
// Mengecek status kode TANPA menukar. Berguna untuk preview / debugging.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const kodeKupon = (searchParams.get("kode") || "")
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!kodeKupon) {
    return NextResponse.json(
      { status: "INVALID", message: "Kode kosong" },
      { status: 400 }
    );
  }

  const penerima = await prisma.penerima.findUnique({ where: { kodeKupon } });

  if (!penerima) {
    return NextResponse.json<RedeemResponse>(
      { status: "INVALID", message: "Kupon tidak valid atau palsu!", kodeKupon },
      { status: 404 }
    );
  }
  if (penerima.userId !== user.id) {
    return NextResponse.json<RedeemResponse>(
      {
        status: "WRONG_OWNER",
        message: "Kupon ini bukan milik panitia ini.",
        kodeKupon,
      },
      { status: 403 }
    );
  }
  if (penerima.status === "REDEEMED") {
    return NextResponse.json<RedeemResponse>(
      {
        status: "ALREADY_REDEEMED",
        message: `Sudah ditukar pada ${formatDateTime(penerima.redeemedAt)}.`,
        nama: penerima.nama,
        kodeKupon: penerima.kodeKupon,
        redeemedAt: penerima.redeemedAt
          ? penerima.redeemedAt.toISOString()
          : null,
      },
      { status: 200 }
    );
  }

  return NextResponse.json<RedeemResponse>({
    status: "SUCCESS",
    message: "Kupon valid dan belum ditukar.",
    nama: penerima.nama,
    kodeKupon: penerima.kodeKupon,
  });
}
