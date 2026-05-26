import { PenerimaTable } from "@/components/penerima/PenerimaTable";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/supabase/server";
import { toPenerimaDTO, type StatistikPenerima } from "@/types";

export const metadata = {
  title: "Dashboard · Kupon Kurban",
};

const PAGE_SIZE = 10;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Render data halaman pertama langsung di server agar tampil instan
  // (tanpa skeleton + waterfall fetch di klien).
  let initialData = undefined;
  if (user) {
    try {
      const [rows, total, totalAll, redeemedAll] = await prisma.$transaction([
        prisma.penerima.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: PAGE_SIZE,
        }),
        prisma.penerima.count({ where: { userId: user.id } }),
        prisma.penerima.count({ where: { userId: user.id } }),
        prisma.penerima.count({
          where: { userId: user.id, status: "REDEEMED" },
        }),
      ]);

      const stats: StatistikPenerima = {
        total: totalAll,
        redeemed: redeemedAll,
        available: totalAll - redeemedAll,
        progress:
          totalAll === 0 ? 0 : Math.round((redeemedAll / totalAll) * 100),
      };

      initialData = {
        data: rows.map(toPenerimaDTO),
        total,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        stats,
      };
    } catch {
      // Jika DB belum siap, biarkan klien yang fetch (fallback).
      initialData = undefined;
    }
  }

  return <PenerimaTable initialData={initialData} />;
}
