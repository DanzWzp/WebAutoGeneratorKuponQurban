import { type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";
import { buildRiwayatWhere } from "@/app/api/riwayat/route";

export const dynamic = "force-dynamic";

/** Escape sebuah nilai untuk CSV (bungkus tanda kutip, escape kutip ganda). */
function csvCell(value: string): string {
  const v = value ?? "";
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

// GET /api/riwayat/export?search=&from=&to=  -> file CSV
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const where = buildRiwayatWhere(user.id, searchParams);

  const rows = await prisma.redemption.findMany({
    where,
    orderBy: { scannedAt: "desc" },
    include: { penerima: { select: { nama: true, kodeKupon: true } } },
  });

  const header = [
    "No",
    "Nama Penerima",
    "Kode Kupon",
    "Waktu Tukar",
    "Dikonfirmasi Oleh",
  ];

  const lines = [header.map(csvCell).join(",")];
  rows.forEach((r, i) => {
    const dikonfirmasi =
      r.redeemedBy === user.id ? user.email ?? user.id : r.redeemedBy;
    lines.push(
      [
        String(i + 1),
        r.penerima.nama,
        r.penerima.kodeKupon,
        r.scannedAt.toISOString(),
        dikonfirmasi,
      ]
        .map(csvCell)
        .join(",")
    );
  });

  // BOM agar Excel membaca UTF-8 dengan benar.
  const csv = "﻿" + lines.join("\r\n");
  const filename = `riwayat-kupon-${new Date().toISOString().split("T")[0]}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
