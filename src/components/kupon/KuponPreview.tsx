"use client";

import { BarcodeImage } from "@/components/kupon/BarcodeImage";

/**
 * Pratinjau visual kupon di layar (HTML/CSS) — pendekatan untuk membayangkan
 * hasil cetak. Layout PDF final dibuat di KuponPDF.tsx (react-pdf).
 * Rasio mendekati kupon cetak (~5.7:1).
 */
export function KuponPreview({
  nama,
  kodeKupon,
}: {
  nama: string;
  kodeKupon: string;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-md border-2 border-dashed border-slate-400 bg-white">
      <div className="flex h-[110px] w-full">
        {/* Panel kiri: sapi */}
        <div className="flex w-[19%] flex-col items-center justify-center bg-amber-50 border-r border-dashed border-slate-300">
          <span className="text-3xl leading-none">🐮</span>
          <span className="mt-1 text-[10px] font-bold tracking-widest text-amber-800">
            KURBAN
          </span>
        </div>

        {/* Tengah */}
        <div className="relative flex flex-1 flex-col px-3 py-2">
          <div className="flex items-start justify-between">
            <div className="max-w-[55%]">
              <p className="text-[11px] font-bold leading-tight text-slate-900">
                KUPON PENGAMBILAN DAGING KURBAN
              </p>
              <p className="mt-0.5 text-[9px] leading-tight text-slate-500">
                Tunjukkan kupon ini saat pengambilan daging.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <BarcodeImage value={kodeKupon} className="h-8 w-[140px]" />
              <span className="mt-0.5 font-mono text-[11px] font-bold tracking-widest text-slate-900">
                {kodeKupon}
              </span>
            </div>
          </div>

          {/* Field nama (pill) */}
          <div className="mt-auto flex items-center">
            <div className="flex flex-1 items-center gap-2 rounded-full border-2 border-black px-3 py-1">
              <span className="text-[10px] font-bold">NAMA PENERIMA :</span>
              <span className="flex-1 border-b border-black pb-0.5 text-[12px] font-bold uppercase">
                {nama}
              </span>
            </div>
            <div className="-ml-4 h-[24px] w-[36px] rounded-full bg-black" />
          </div>
        </div>

        {/* Stub kanan */}
        <div className="relative flex w-[12%] items-center justify-center bg-neutral-900">
          <div className="absolute top-2 h-5 w-2.5 rounded-full border border-white" />
          <span
            className="text-[11px] font-bold italic text-yellow-400"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Ayo, Ambil Daging!
          </span>
        </div>
      </div>
    </div>
  );
}
