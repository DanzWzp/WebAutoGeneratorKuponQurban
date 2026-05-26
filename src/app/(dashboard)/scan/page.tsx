"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Keyboard,
  Volume2,
  VolumeX,
  Loader2,
  CheckCircle2,
  Camera,
} from "lucide-react";

import type { RedeemResponse } from "@/types";
import { beepSuccess, beepError, beepWarning, vibrate } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { ScanResult } from "@/components/scanner/ScanResult";
import { ManualInput } from "@/components/scanner/ManualInput";

// Scanner hanya boleh jalan di browser (akses kamera) -> ssr: false.
const BarcodeScanner = dynamic(
  () =>
    import("@/components/scanner/BarcodeScanner").then((m) => m.BarcodeScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
);

interface HistoryItem {
  nama: string;
  kodeKupon: string;
  at: number;
}

export default function ScanPage() {
  const [result, setResult] = useState<RedeemResponse | null>(null);
  const [processing, setProcessing] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [count, setCount] = useState(0);

  const soundRef = useRef(soundOn);
  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard sinkron agar tidak ada dua proses redeem berjalan bersamaan.
  const processingRef = useRef(false);

  const handleNext = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    processingRef.current = false;
    setResult(null);
    setProcessing(false);
  }, []);

  const handleDetected = useCallback(
    async (rawCode: string) => {
      // cegah pemrosesan ganda (sinkron)
      if (processingRef.current) return;
      processingRef.current = true;
      setProcessing(true);

      const kodeKupon = rawCode.trim().toUpperCase();
      try {
        const res = await fetch("/api/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kodeKupon }),
        });
        const data: RedeemResponse = await res.json();
        setResult(data);

        // feedback suara + getar
        if (data.status === "SUCCESS") {
          if (soundRef.current) beepSuccess();
          vibrate(80);
          if (data.nama) {
            setHistory((prev) =>
              [
                { nama: data.nama!, kodeKupon: data.kodeKupon ?? kodeKupon, at: Date.now() },
                ...prev,
              ].slice(0, 5)
            );
            setCount((c) => c + 1);
          }
        } else if (data.status === "ALREADY_REDEEMED") {
          if (soundRef.current) beepWarning();
          vibrate([40, 50, 40]);
        } else {
          if (soundRef.current) beepError();
          vibrate([120, 60, 120]);
        }

        // auto-dismiss
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        dismissTimer.current = setTimeout(handleNext, 2800);
      } catch {
        setResult({
          status: "ERROR",
          message: "Gagal menghubungi server. Periksa koneksi.",
        });
        if (soundRef.current) beepError();
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
        dismissTimer.current = setTimeout(handleNext, 2800);
      }
    },
    [handleNext]
  );

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <h1 className="text-lg font-bold">Scan Kupon Kurban</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundOn((v) => !v)}
          aria-label={soundOn ? "Matikan suara" : "Nyalakan suara"}
          title={soundOn ? "Suara: ON" : "Suara: OFF"}
        >
          {soundOn ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Counter */}
      <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-2 text-sm font-medium text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        {count} kupon ditukar (sesi ini)
      </div>

      {/* Scanner */}
      <BarcodeScanner onDetected={handleDetected} paused={processing} />

      {/* Aksi */}
      <div className="grid grid-cols-1 gap-2">
        <Button variant="outline" onClick={() => setManualOpen(true)}>
          <Keyboard className="mr-2 h-4 w-4" />
          Input Manual
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Camera className="h-3.5 w-3.5" />
        Arahkan kamera ke barcode pada kupon. Verifikasi berjalan otomatis.
      </p>

      {/* Riwayat scan sesi ini */}
      <div className="rounded-lg border bg-background p-4">
        <h2 className="mb-2 text-sm font-semibold">Scan Terakhir</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada kupon yang ditukar di sesi ini.
          </p>
        ) : (
          <ul className="divide-y">
            {history.map((h, i) => (
              <li
                key={`${h.kodeKupon}-${i}`}
                className="flex items-center justify-between py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{h.nama}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {h.kodeKupon}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(h.at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Overlay hasil */}
      {result && <ScanResult result={result} onNext={handleNext} />}

      {/* Dialog input manual */}
      <ManualInput
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSubmit={handleDetected}
      />
    </div>
  );
}
