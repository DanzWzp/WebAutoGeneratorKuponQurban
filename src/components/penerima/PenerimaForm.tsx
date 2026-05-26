"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { penerimaSchema, type PenerimaInput } from "@/lib/validations";
import type { PenerimaDTO } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Jika ada -> mode edit; jika null/undefined -> mode tambah. */
  penerima?: PenerimaDTO | null;
  onSaved: () => void;
}

export function PenerimaForm({ open, onOpenChange, penerima, onSaved }: Props) {
  const isEdit = Boolean(penerima);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PenerimaInput>({
    resolver: zodResolver(penerimaSchema),
    defaultValues: { nama: "", alamat: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        nama: penerima?.nama ?? "",
        alamat: penerima?.alamat ?? "",
      });
    }
  }, [open, penerima, reset]);

  async function onSubmit(values: PenerimaInput) {
    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/penerima/${penerima!.id}` : "/api/penerima",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan");
      }
      toast.success(isEdit ? "Penerima diperbarui" : "Penerima ditambahkan");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error("Gagal menyimpan", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Penerima" : "Tambah Penerima"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui data penerima kupon."
              : "Tambahkan satu penerima. Kode kupon unik dibuat otomatis."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Penerima</Label>
            <Input
              id="nama"
              placeholder="cth. Ahmad Sudrajat"
              autoFocus
              {...register("nama")}
            />
            {errors.nama && (
              <p className="text-sm text-destructive">{errors.nama.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat (opsional)</Label>
            <Input
              id="alamat"
              placeholder="cth. RT 03 / RW 01"
              {...register("alamat")}
            />
            {errors.alamat && (
              <p className="text-sm text-destructive">
                {errors.alamat.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
