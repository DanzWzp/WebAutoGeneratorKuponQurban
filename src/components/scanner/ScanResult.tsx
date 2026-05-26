"use client";

import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { RedeemResponse } from "@/types";

interface Props {
  result: RedeemResponse;
  onNext: () => void;
}

const config = {
  SUCCESS: {
    bg: "bg-green-600",
    Icon: CheckCircle2,
    heading: "BERHASIL!",
  },
  ALREADY_REDEEMED: {
    bg: "bg-amber-500",
    Icon: AlertTriangle,
    heading: "SUDAH DITUKAR",
  },
  INVALID: {
    bg: "bg-red-600",
    Icon: XCircle,
    heading: "TIDAK VALID",
  },
  WRONG_OWNER: {
    bg: "bg-red-600",
    Icon: XCircle,
    heading: "BUKAN MILIK ANDA",
  },
  ERROR: {
    bg: "bg-red-600",
    Icon: XCircle,
    heading: "GAGAL",
  },
} as const;

export function ScanResult({ result, onNext }: Props) {
  const c = config[result.status] ?? config.ERROR;
  const Icon = c.Icon;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in",
        c.bg
      )}
      role="alert"
    >
      <Icon className="h-20 w-20" strokeWidth={2.2} />
      <p className="mt-4 text-2xl font-extrabold tracking-wide">{c.heading}</p>

      {result.status === "SUCCESS" && result.nama && (
        <div className="mt-6">
          <p className="text-lg font-medium opacity-90">Berikan daging ke:</p>
          <p className="mt-1 text-4xl font-black uppercase leading-tight sm:text-5xl">
            {result.nama}
          </p>
        </div>
      )}

      {result.status === "ALREADY_REDEEMED" && (
        <div className="mt-4 space-y-1">
          {result.nama && (
            <p className="text-2xl font-bold uppercase">{result.nama}</p>
          )}
          <p className="text-base opacity-90">{result.message}</p>
        </div>
      )}

      {(result.status === "INVALID" ||
        result.status === "WRONG_OWNER" ||
        result.status === "ERROR") && (
        <p className="mt-4 max-w-md text-lg opacity-90">{result.message}</p>
      )}

      {result.kodeKupon && (
        <p className="mt-4 font-mono text-sm tracking-widest opacity-80">
          {result.kodeKupon}
        </p>
      )}

      <Button
        onClick={onNext}
        size="lg"
        variant="secondary"
        className="mt-8 bg-white text-black hover:bg-white/90"
      >
        Lanjut Scan Berikutnya
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}
