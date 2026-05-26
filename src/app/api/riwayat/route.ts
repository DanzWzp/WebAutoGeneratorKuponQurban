import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";
import { buildRiwayatWhere } from "@/lib/riwayat-where";
import type { RiwayatItem } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/riwayat?search=&from=&to=&page=1&pageSize=20
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, Number(searchParams.get("pageSize")) || 20)
  );

  const where = buildRiwayatWhere(user.id, searchParams);

  try {
    const [rows, total] = await prisma.$transaction([
      prisma.redemption.findMany({
        where,
        orderBy: { scannedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { penerima: { select: { nama: true, kodeKupon: true } } },
      }),
      prisma.redemption.count({ where }),
    ]);

    const data: RiwayatItem[] = rows.map((r) => ({
      id: r.id,
      penerimaId: r.penerimaId,
      nama: r.penerima.nama,
      kodeKupon: r.penerima.kodeKupon,
      scannedAt: r.scannedAt.toISOString(),
      // Untuk MVP akun-tunggal, panitia = user yang login.
      redeemedBy: r.redeemedBy === user.id ? user.email ?? user.id : r.redeemedBy,
    }));

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    console.error("GET /api/riwayat error:", err);
    return NextResponse.json(
      { error: "Gagal memuat riwayat" },
      { status: 500 }
    );
  }
}
