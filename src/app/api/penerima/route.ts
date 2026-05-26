import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";
import { penerimaSchema } from "@/lib/validations";
import { generateKodeKupon } from "@/lib/kode-generator";
import { toPenerimaDTO, type StatistikPenerima } from "@/types";

export const dynamic = "force-dynamic";

// GET /api/penerima?page=1&pageSize=10&search=&status=ALL
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize")) || 10)
  );
  const search = (searchParams.get("search") || "").trim();
  const statusParam = searchParams.get("status") || "ALL";

  const where: Prisma.PenerimaWhereInput = { userId: user.id };
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { kodeKupon: { contains: search, mode: "insensitive" } },
    ];
  }
  if (statusParam === "AVAILABLE" || statusParam === "REDEEMED") {
    where.status = statusParam;
  }

  try {
    const [data, total, totalAll, redeemedAll] = await prisma.$transaction([
      prisma.penerima.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.penerima.count({ where }),
      prisma.penerima.count({ where: { userId: user.id } }),
      prisma.penerima.count({
        where: { userId: user.id, status: "REDEEMED" },
      }),
    ]);

    const stats: StatistikPenerima = {
      total: totalAll,
      redeemed: redeemedAll,
      available: totalAll - redeemedAll,
      progress: totalAll === 0 ? 0 : Math.round((redeemedAll / totalAll) * 100),
    };

    return NextResponse.json({
      data: data.map(toPenerimaDTO),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      stats,
    });
  } catch (err) {
    console.error("GET /api/penerima error:", err);
    return NextResponse.json(
      { error: "Gagal memuat data penerima" },
      { status: 500 }
    );
  }
}

// POST /api/penerima  { nama, alamat? }
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

  const parsed = penerimaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Data tidak valid" },
      { status: 400 }
    );
  }

  try {
    // Generate kode unik, ulangi jika (sangat jarang) terjadi tabrakan.
    let kodeKupon = generateKodeKupon();
    let exists = await prisma.penerima.findUnique({ where: { kodeKupon } });
    while (exists) {
      kodeKupon = generateKodeKupon();
      exists = await prisma.penerima.findUnique({ where: { kodeKupon } });
    }

    const penerima = await prisma.penerima.create({
      data: {
        nama: parsed.data.nama,
        alamat: parsed.data.alamat || null,
        kodeKupon,
        userId: user.id,
      },
    });

    return NextResponse.json(toPenerimaDTO(penerima), { status: 201 });
  } catch (err) {
    console.error("POST /api/penerima error:", err);
    return NextResponse.json(
      { error: "Gagal menambah penerima" },
      { status: 500 }
    );
  }
}
