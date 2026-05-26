import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/redeem/undo  { penerimaId }
// Membatalkan redeem (untuk kasus salah scan). Mengembalikan status ke
// AVAILABLE dan menghapus jejak redemption. Hanya pemilik kupon yang boleh.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { penerimaId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const penerimaId =
    typeof body.penerimaId === "string" ? body.penerimaId : null;
  if (!penerimaId) {
    return NextResponse.json(
      { error: "penerimaId wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const penerima = await prisma.penerima.findUnique({
      where: { id: penerimaId },
    });
    if (!penerima || penerima.userId !== user.id) {
      return NextResponse.json(
        { error: "Penerima tidak ditemukan" },
        { status: 404 }
      );
    }
    if (penerima.status !== "REDEEMED") {
      return NextResponse.json(
        { error: "Kupon ini belum ditukar" },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.penerima.update({
        where: { id: penerimaId },
        data: { status: "AVAILABLE", redeemedAt: null, redeemedBy: null },
      }),
      prisma.redemption.deleteMany({ where: { penerimaId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/redeem/undo error:", err);
    return NextResponse.json(
      { error: "Gagal membatalkan redeem" },
      { status: 500 }
    );
  }
}
