import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";
import type { RiwayatItem } from "@/types";

export const dynamic = "force-dynamic";

/** Bangun filter where untuk redemption milik user yang login. */
export function buildRiwayatWhere(
  userId: string,
  searchParams: URLSearchParams
): Prisma.RedemptionWhereInput {
  const search = (searchParams.get("search") || "").trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.RedemptionWhereInput = {
    penerima: { userId },
  };

  if (search) {
    where.penerima = {
      userId,
      OR: [
        { nama: { contains: search, mode: "insensitive" } },
        { kodeKupon: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  if (from || to) {
    where.scannedAt = {};
    if (from) where.scannedAt.gte = new Date(from);
    if (to) {
      // sertakan sepanjang hari "to"
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.scannedAt.lte = toDate;
    }
  }

  return where;
}

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
