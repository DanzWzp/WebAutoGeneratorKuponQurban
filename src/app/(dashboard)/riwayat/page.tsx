"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Loader2,
  History,
} from "lucide-react";
import { toast } from "sonner";

import type { RiwayatItem } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 20;

export default function RiwayatPage() {
  const [data, setData] = useState<RiwayatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [undoTarget, setUndoTarget] = useState<RiwayatItem | null>(null);
  const [undoing, setUndoing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, from, to]);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params;
  }, [debouncedSearch, from, to]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      const res = await fetch(`/api/riwayat?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat riwayat");
      const json = await res.json();
      setData(json.data);
      setTotalPages(json.totalPages);
      setTotal(json.total);
    } catch (err) {
      toast.error("Gagal memuat riwayat", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [buildParams, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function exportCsv() {
    const params = buildParams();
    const url = `/api/riwayat/export?${params.toString()}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Mengunduh CSV...");
  }

  async function confirmUndo() {
    if (!undoTarget) return;
    setUndoing(true);
    try {
      const res = await fetch("/api/redeem/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ penerimaId: undoTarget.penerimaId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membatalkan");
      toast.success("Redeem dibatalkan", {
        description: `${undoTarget.nama} kembali ke status "Belum Diambil".`,
      });
      setUndoTarget(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal membatalkan", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUndoing(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <History className="h-6 w-6" />
            Riwayat Pengambilan
          </h1>
          <p className="text-sm text-muted-foreground">
            Catatan semua kupon yang sudah ditukar (audit trail).
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={total === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="cari" className="text-xs">
            Cari
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="cari"
              placeholder="Nama atau kode kupon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="from" className="text-xs">
            Dari Tanggal
          </Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to" className="text-xs">
            Sampai Tanggal
          </Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
        {(from || to || search) && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setFrom("");
              setTo("");
            }}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Tabel */}
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">No</TableHead>
              <TableHead>Nama Penerima</TableHead>
              <TableHead>Kode Kupon</TableHead>
              <TableHead>Waktu Tukar</TableHead>
              <TableHead>Dikonfirmasi Oleh</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Belum ada riwayat pengambilan.
                </TableCell>
              </TableRow>
            ) : (
              data.map((r, idx) => (
                <TableRow key={r.id}>
                  <TableCell className="text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{r.nama}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {r.kodeKupon}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateTime(r.scannedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.redeemedBy}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Batalkan redeem"
                      onClick={() => setUndoTarget(r)}
                    >
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} transaksi · Halaman {page} dari {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Konfirmasi undo */}
      <AlertDialog
        open={Boolean(undoTarget)}
        onOpenChange={(o) => !o && setUndoTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan redeem?</AlertDialogTitle>
            <AlertDialogDescription>
              Kupon <strong>{undoTarget?.nama}</strong> ({undoTarget?.kodeKupon})
              akan dikembalikan ke status &quot;Belum Diambil&quot; dan catatan
              redeem dihapus. Gunakan ini hanya untuk koreksi salah scan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={undoing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmUndo();
              }}
              disabled={undoing}
            >
              {undoing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
