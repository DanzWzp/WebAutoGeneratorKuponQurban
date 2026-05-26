"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Users,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

import type { PenerimaDTO, StatistikPenerima } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { downloadKuponPdf } from "@/lib/pdf-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { StatsCards } from "@/components/penerima/StatsCards";
import { StatusBadge } from "@/components/penerima/StatusBadge";
import { PenerimaForm } from "@/components/penerima/PenerimaForm";
import { BulkInputDialog } from "@/components/penerima/BulkInputDialog";

const PAGE_SIZE = 10;
const EMPTY_STATS: StatistikPenerima = {
  total: 0,
  redeemed: 0,
  available: 0,
  progress: 0,
};

export interface PenerimaInitialData {
  data: PenerimaDTO[];
  total: number;
  totalPages: number;
  stats: StatistikPenerima;
}

export function PenerimaTable({
  initialData,
}: {
  initialData?: PenerimaInitialData;
}) {
  const [data, setData] = useState<PenerimaDTO[]>(initialData?.data ?? []);
  const [stats, setStats] = useState<StatistikPenerima>(
    initialData?.stats ?? EMPTY_STATS
  );
  const [loading, setLoading] = useState(!initialData);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages ?? 1);
  const [total, setTotal] = useState(initialData?.total ?? 0);

  // Lewati fetch pertama bila data awal sudah dirender server (filter default).
  const skipInitialFetch = useRef(Boolean(initialData));

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "REDEEMED">("ALL");

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PenerimaDTO | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PenerimaDTO | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset ke halaman 1 saat filter/pencarian berubah
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        status: statusFilter,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/penerima?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat data");
      const json = await res.json();
      setData(json.data);
      setStats(json.stats ?? EMPTY_STATS);
      setTotalPages(json.totalPages);
      setTotal(json.total);
    } catch (err) {
      toast.error("Gagal memuat data penerima", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => {
    // Data awal sudah dari server -> jangan fetch ulang saat mount.
    if (skipInitialFetch.current) {
      skipInitialFetch.current = false;
      return;
    }
    fetchData();
  }, [fetchData]);

  function refresh() {
    setSelected(new Set());
    fetchData();
  }

  // --- seleksi ---
  const allOnPageSelected =
    data.length > 0 && data.every((p) => selected.has(p.id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        data.forEach((p) => next.delete(p.id));
      } else {
        data.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  // --- aksi ---
  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: PenerimaDTO) {
    setEditing(p);
    setFormOpen(true);
  }

  async function confirmDeleteSingle() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/penerima/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus");
      toast.success("Penerima dihapus");
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error("Gagal menghapus", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  async function confirmBulkDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/penerima/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus");
      toast.success(`${json.deleted} penerima dihapus`, {
        description:
          json.skipped > 0
            ? `${json.skipped} dilewati (sudah ditukar tidak bisa dihapus).`
            : undefined,
      });
      setBulkDeleteOpen(false);
      refresh();
    } catch (err) {
      toast.error("Gagal menghapus", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownload(ids?: string[]) {
    setPdfLoading(true);
    const tId = toast.loading("Membuat PDF kupon...");
    try {
      await downloadKuponPdf(ids);
      toast.success("PDF berhasil dibuat", { id: tId });
    } catch (err) {
      toast.error("Gagal membuat PDF", {
        id: tId,
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Statistik */}
      <StatsCards stats={stats} />

      {/* Header + aksi */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Penerima Kupon
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar penerima daging kurban.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Tambah Banyak
          </Button>
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Penerima
          </Button>
        </div>
      </div>

      {/* Toolbar: search + filter + generate all */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau kode kupon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-full sm:w-[190px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="AVAILABLE">Belum Diambil</SelectItem>
            <SelectItem value="REDEEMED">Sudah Diambil</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="secondary"
          onClick={() => handleDownload(undefined)}
          disabled={pdfLoading || stats.total === 0}
        >
          {pdfLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Printer className="mr-2 h-4 w-4" />
          )}
          Generate PDF Semua
        </Button>
      </div>

      {/* Tabel */}
      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allOnPageSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Pilih semua"
                />
              </TableHead>
              <TableHead className="w-10">No</TableHead>
              <TableHead>Nama Penerima</TableHead>
              <TableHead>Kode Kupon</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Waktu Diambil</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-10 text-center text-muted-foreground"
                >
                  {debouncedSearch || statusFilter !== "ALL"
                    ? "Tidak ada penerima yang cocok dengan filter."
                    : "Belum ada penerima. Klik \"Tambah Penerima\" untuk memulai."}
                </TableCell>
              </TableRow>
            ) : (
              data.map((p, idx) => (
                <TableRow
                  key={p.id}
                  data-state={selected.has(p.id) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleOne(p.id)}
                      aria-label={`Pilih ${p.nama}`}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{p.nama}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {p.kodeKupon}
                    </code>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.status === "REDEEMED" ? formatDateTime(p.redeemedAt) : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(p.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDownload([p.id])}
                        >
                          <FileDown className="mr-2 h-4 w-4" />
                          Cetak Kupon
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={p.status === "REDEEMED"}
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
          {total} penerima · Halaman {page} dari {totalPages}
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

      {/* Sticky bar saat ada seleksi */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <span className="text-sm font-medium">
              {selected.size} penerima dipilih
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelected(new Set())}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownload(selectedIds)}
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="mr-2 h-4 w-4" />
                )}
                Generate PDF Kupon
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <PenerimaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        penerima={editing}
        onSaved={refresh}
      />
      <BulkInputDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onSaved={refresh}
      />

      {/* Konfirmasi hapus tunggal */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus penerima?</AlertDialogTitle>
            <AlertDialogDescription>
              Penerima <strong>{deleteTarget?.nama}</strong> (kode{" "}
              {deleteTarget?.kodeKupon}) akan dihapus permanen. Tindakan ini
              tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteSingle();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Konfirmasi hapus massal */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selected.size} penerima?</AlertDialogTitle>
            <AlertDialogDescription>
              Kupon yang sudah ditukar akan otomatis dilewati (tidak dihapus).
              Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmBulkDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
