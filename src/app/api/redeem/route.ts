import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";
import { redeemSchema } from "@/lib/validations";
import { formatDateTime } from "@/lib/utils";
import type { RedeemResponse } from "@/types";

export const dynamic = "force-dynamic";

// POST /api/redeem  { kodeKupon: "K7XQ9M2A" }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = redeemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "INVALID", message: "Kode kupon tidak valid" },
      { status: 400 }
    );
  }

  // Normalisasi: kode disimpan uppercase, hilangkan spasi.
  const kodeKupon = parsed.data.kodeKupon.toUpperCase().replace(/\s+/g, "");

  try {
    const penerima = await prisma.penerima.findUnique({
      where: { kodeKupon },
    });

    // 1) Kode tidak ditemukan -> palsu / salah ketik
    if (!penerima) {
      return NextResponse.json<RedeemResponse>(
        {
          status: "INVALID",
          message: "Kupon tidak valid atau palsu!",
          kodeKupon,
        },
        { status: 404 }
      );
    }

    // 2) Kupon milik panitia lain
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

    // 3) Sudah pernah ditukar
    if (penerima.status === "REDEEMED") {
      return NextResponse.json<RedeemResponse>(
        {
          status: "ALREADY_REDEEMED",
          message: `Kupon sudah ditukar pada ${formatDateTime(
            penerima.redeemedAt
          )}.`,
          nama: penerima.nama,
          kodeKupon: penerima.kodeKupon,
          redeemedAt: penerima.redeemedAt
            ? penerima.redeemedAt.toISOString()
            : null,
        },
        { status: 409 }
      );
    }

    // 4) Valid & belum digunakan -> redeem.
    // updateMany dengan kondisi status: AVAILABLE membuat operasi atomik:
    // bila dua panitia scan kupon yang sama bersamaan, hanya satu yang sukses.
    const updateResult = await prisma.penerima.updateMany({
      where: { id: penerima.id, status: "AVAILABLE" },
      data: {
        status: "REDEEMED",
        redeemedAt: new Date(),
        redeemedBy: user.id,
      },
    });

    if (updateResult.count === 0) {
      // Race: kupon baru saja ditukar oleh proses lain.
      const fresh = await prisma.penerima.findUnique({
        where: { id: penerima.id },
      });
      return NextResponse.json<RedeemResponse>(
        {
          status: "ALREADY_REDEEMED",
          message: `Kupon sudah ditukar pada ${formatDateTime(
            fresh?.redeemedAt
          )}.`,
          nama: fresh?.nama,
          kodeKupon: fresh?.kodeKupon,
          redeemedAt: fresh?.redeemedAt
            ? fresh.redeemedAt.toISOString()
            : null,
        },
        { status: 409 }
      );
    }

    // Catat audit trail.
    await prisma.redemption.create({
      data: {
        penerimaId: penerima.id,
        redeemedBy: user.id,
        userAgent: req.headers.get("user-agent") || undefined,
        ipAddress:
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          undefined,
      },
    });

    return NextResponse.json<RedeemResponse>({
      status: "SUCCESS",
      message: "Berhasil! Berikan daging ke penerima.",
      nama: penerima.nama,
      kodeKupon: penerima.kodeKupon,
    });
  } catch (err) {
    console.error("POST /api/redeem error:", err);
    return NextResponse.json<RedeemResponse>(
      { status: "ERROR", message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
