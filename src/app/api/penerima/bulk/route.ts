import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";
import { bulkPenerimaSchema } from "@/lib/validations";
import { generateUniqueKodeBatch } from "@/lib/kode-generator";

export const dynamic = "force-dynamic";

// POST /api/penerima/bulk  { names: "Ahmad\nBudi\nCitra" }
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

  const parsed = bulkPenerimaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Data tidak valid" },
      { status: 400 }
    );
  }

  const names = parsed.data.names
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.slice(0, 100));

  if (names.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada nama yang valid" },
      { status: 400 }
    );
  }
  if (names.length > 1000) {
    return NextResponse.json(
      { error: "Maksimal 1000 nama per sekali input" },
      { status: 400 }
    );
  }

  try {
    // Generate kode unik dalam batch, lalu pastikan tidak bentrok dengan DB.
    let kodes = generateUniqueKodeBatch(names.length);
    let collisions = await prisma.penerima.findMany({
      where: { kodeKupon: { in: kodes } },
      select: { kodeKupon: true },
    });
    // Sangat jarang; ulangi sampai tidak ada bentrokan dengan DB.
    let guard = 0;
    while (collisions.length > 0 && guard < 5) {
      kodes = generateUniqueKodeBatch(names.length);
      collisions = await prisma.penerima.findMany({
        where: { kodeKupon: { in: kodes } },
        select: { kodeKupon: true },
      });
      guard++;
    }

    const result = await prisma.penerima.createMany({
      data: names.map((nama, i) => ({
        nama,
        kodeKupon: kodes[i],
        userId: user.id,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json(
      { count: result.count, total: names.length },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/penerima/bulk error:", err);
    return NextResponse.json(
      { error: "Gagal menambah penerima secara massal" },
      { status: 500 }
    );
  }
}

// DELETE /api/penerima/bulk  { ids: string[] }  -> hapus banyak (hanya AVAILABLE)
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((x): x is string => typeof x === "string")
    : [];

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada item yang dipilih" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.penerima.deleteMany({
      where: {
        id: { in: ids },
        userId: user.id,
        status: "AVAILABLE", // kupon yang sudah ditukar tidak dihapus
      },
    });

    return NextResponse.json({
      deleted: result.count,
      skipped: ids.length - result.count,
    });
  } catch (err) {
    console.error("DELETE /api/penerima/bulk error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus penerima" },
      { status: 500 }
    );
  }
}
