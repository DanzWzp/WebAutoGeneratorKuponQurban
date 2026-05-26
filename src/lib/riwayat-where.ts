import { Prisma } from "@prisma/client";

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
