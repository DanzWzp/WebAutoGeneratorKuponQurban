import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  });

export const penerimaSchema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi").max(100, "Nama terlalu panjang"),
  alamat: z.string().trim().max(255, "Alamat terlalu panjang").optional().or(z.literal("")),
});

export const bulkPenerimaSchema = z.object({
  // Satu nama per baris; minimal 1 nama valid
  names: z
    .string()
    .min(1, "Masukkan minimal satu nama")
    .refine(
      (val) => val.split("\n").map((s) => s.trim()).filter(Boolean).length > 0,
      "Masukkan minimal satu nama yang valid"
    ),
});

export const redeemSchema = z.object({
  kodeKupon: z
    .string()
    .trim()
    .min(1, "Kode kupon wajib diisi")
    .max(32, "Kode kupon tidak valid"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PenerimaInput = z.infer<typeof penerimaSchema>;
export type BulkPenerimaInput = z.infer<typeof bulkPenerimaSchema>;
export type RedeemInput = z.infer<typeof redeemSchema>;
