import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";
import { penerimaSchema } from "@/lib/validations";
import { toPenerimaDTO } from "@/types";

export const dynamic = "force-dynamic";

// PUT /api/penerima/[id]  { nama, alamat? }
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const existing = await prisma.penerima.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Penerima tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.penerima.update({
      where: { id: params.id },
      data: {
        nama: parsed.data.nama,
        alamat: parsed.data.alamat || null,
      },
    });

    return NextResponse.json(toPenerimaDTO(updated));
  } catch (err) {
    console.error("PUT /api/penerima/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui penerima" },
      { status: 500 }
    );
  }
}

// DELETE /api/penerima/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.penerima.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Penerima tidak ditemukan" },
        { status: 404 }
      );
    }

    // Kupon yang sudah ditukar tidak boleh dihapus (jejak audit harus utuh).
    if (existing.status === "REDEEMED") {
      return NextResponse.json(
        { error: "Kupon yang sudah ditukar tidak bisa dihapus" },
        { status: 409 }
      );
    }

    await prisma.penerima.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/penerima/[id] error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus penerima" },
      { status: 500 }
    );
  }
}
