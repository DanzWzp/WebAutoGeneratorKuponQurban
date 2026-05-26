"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Printer, Loader2, ArrowLeft, FileText, Info } from "lucide-react";
import { toast } from "sonner";

import type { PenerimaDTO, StatistikPenerima } from "@/types";
import { downloadKuponPdf } from "@/lib/pdf-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Pratinjau memakai bwip-js (berat) -> muat hanya saat dibutuhkan, di klien.
const KuponPreview = dynamic(
  () => import("@/components/kupon/KuponPreview").then((m) => m.KuponPreview),
  {
    ssr: false,
    loading: () => <Skeleton className="mx-auto h-24 w-full max-w-2xl" />,
  }
);

export default function GeneratePage() {
  const [stats, setStats] = useState<StatistikPenerima | null>(null);
  const [samples, setSamples] = useState<PenerimaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/penerima?page=1&pageSize=2");
        if (!res.ok) throw new Error();
        const json = await res.json();
        setStats(json.stats);
        setSamples(json.data);
      } catch {
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const COUPONS_PER_PAGE = 4;
  const total = stats?.total ?? 0;
  const pages = Math.ceil(total / COUPONS_PER_PAGE);

  async function handleDownload() {
    setPdfLoading(true);
    const tId = toast.loading("Membuat PDF kupon...");
    try {
      await downloadKuponPdf(undefined);
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
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Generate PDF Kupon</h1>
        <p className="text-sm text-muted-foreground">
          Cetak semua kupon (8 kupon per halaman A4). Untuk mencetak sebagian,
          pilih penerima di Dashboard lalu klik &quot;Generate PDF Kupon&quot;.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Ringkasan
          </CardTitle>
          <CardDescription>
            Informasi PDF yang akan dihasilkan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <div className="flex items-start gap-2 rounded-md bg-muted/60 p-3 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Akan menghasilkan <strong>{pages}</strong> halaman A4 untuk{" "}
                <strong>{total}</strong> penerima
                {total > 0 ? ` (${COUPONS_PER_PAGE} kupon per halaman).` : "."}
              </p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleDownload}
            disabled={pdfLoading || loading || total === 0}
          >
            {pdfLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Printer className="mr-2 h-5 w-5" />
            )}
            Download PDF Semua Kupon
          </Button>
          {total === 0 && !loading && (
            <p className="text-sm text-muted-foreground">
              Belum ada penerima. Tambahkan penerima di Dashboard terlebih
              dahulu.
            </p>
          )}
        </CardContent>
      </Card>

      {!loading && samples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pratinjau Kupon</CardTitle>
            <CardDescription>
              Tampilan perkiraan di layar. Tata letak akhir mengikuti file PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {samples.map((p) => (
              <KuponPreview key={p.id} nama={p.nama} kodeKupon={p.kodeKupon} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
