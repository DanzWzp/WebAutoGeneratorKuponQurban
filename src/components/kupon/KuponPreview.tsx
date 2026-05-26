"use client";

import { BarcodeImage } from "@/components/kupon/BarcodeImage";

/**
 * Pratinjau visual kupon di layar (HTML/CSS) — perkiraan hasil cetak.
 * Tata letak PDF final dibuat di KuponPDF.tsx (react-pdf), dan bila ada
 * public/template-kupon.jpg, PDF memakai gambar itu sebagai latar.
 * Rasio mendekati template (~3:1).
 */
export function KuponPreview({
  nama,
  kodeKupon,
}: {
  nama: string;
  kodeKupon: string;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-md border-2 border-dashed border-slate-400 bg-white">
      <div className="flex aspect-[3.1/1] w-full">
        {/* Panel kiri: sapi */}
        <div className="flex w-[25%] flex-col items-center justify-center border-r border-dashed border-slate-300 bg-amber-50">
          <span className="text-4xl leading-none">🐮</span>
          <span className="mt-1 text-[11px] font-bold tracking-widest text-amber-800">
            KURBAN
          </span>
        </div>

        {/* Tengah */}
        <div className="relative flex flex-1 flex-col px-4 py-3">
          <p className="text-[13px] font-bold leading-tight text-slate-900">
            KUPON PENGAMBILAN DAGING KURBAN
          </p>
          <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
            Tunjukkan kupon ini saat pengambilan daging kurban.
          </p>

          <div className="mt-2 flex flex-col items-center self-end">
            <BarcodeImage value={kodeKupon} className="h-9 w-[150px]" />
            <span className="mt-0.5 font-mono text-[12px] font-bold tracking-widest text-slate-900">
              {kodeKupon}
            </span>
          </div>

          {/* Field nama (pill) */}
          <div className="mt-auto flex items-center">
            <div className="flex flex-1 items-center gap-2 rounded-full border-2 border-black px-3 py-1.5">
              <span className="whitespace-nowrap text-[11px] font-bold">
                NAMA PENERIMA :
              </span>
              <span className="flex-1 truncate border-b border-black pb-0.5 text-[13px] font-bold uppercase">
                {nama}
              </span>
            </div>
            <div className="-ml-5 h-[26px] w-[42px] rounded-full bg-black" />
          </div>
        </div>

        {/* Stub kanan */}
        <div className="relative flex w-[14%] items-center justify-center bg-neutral-900">
          <div className="absolute top-3 h-6 w-3 rounded-full border border-white" />
          <span
            className="whitespace-nowrap text-[12px] font-bold italic text-yellow-400"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Ayo, Ambil Daging!
          </span>
        </div>
      </div>
    </div>
  );
}
