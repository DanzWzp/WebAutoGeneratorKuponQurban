import type { Penerima as PrismaPenerima, StatusKupon } from "@prisma/client";

export type { StatusKupon };

/** Penerima dengan field tanggal sebagai string (hasil JSON serialize dari API). */
export interface PenerimaDTO {
  id: string;
  nama: string;
  kodeKupon: string;
  alamat: string | null;
  status: StatusKupon;
  redeemedAt: string | null;
  redeemedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PenerimaListResponse {
  data: PenerimaDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StatistikPenerima {
  total: number;
  redeemed: number;
  available: number;
  progress: number; // persentase 0-100
}

/** Status hasil scan / redeem kupon. */
export type RedeemStatus =
  | "SUCCESS"
  | "INVALID"
  | "WRONG_OWNER"
  | "ALREADY_REDEEMED"
  | "ERROR";

export interface RedeemResponse {
  status: RedeemStatus;
  message: string;
  nama?: string;
  kodeKupon?: string;
  redeemedAt?: string | null;
}

export interface RiwayatItem {
  id: string;
  nama: string;
  kodeKupon: string;
  scannedAt: string;
  redeemedBy: string;
}

/** Helper untuk konversi Prisma model -> DTO yang aman diserialisasi. */
export function toPenerimaDTO(p: PrismaPenerima): PenerimaDTO {
  return {
    id: p.id,
    nama: p.nama,
    kodeKupon: p.kodeKupon,
    alamat: p.alamat,
    status: p.status,
    redeemedAt: p.redeemedAt ? p.redeemedAt.toISOString() : null,
    redeemedBy: p.redeemedBy,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
