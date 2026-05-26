"use client";

import { useEffect, useRef } from "react";
import { toCanvas } from "bwip-js";

/**
 * Render barcode CODE128 ke <canvas> di browser (untuk preview di layar).
 * Untuk PDF, barcode dibuat di server (lihat src/lib/barcode.ts).
 */
export function BarcodeImage({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      toCanvas(ref.current, {
        bcid: "code128",
        text: value,
        scale: 2,
        height: 9,
        includetext: false,
        backgroundcolor: "FFFFFF",
      });
    } catch {
      // abaikan error render preview
    }
  }, [value]);

  return <canvas ref={ref} className={className} />;
}
