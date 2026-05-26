"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Html5Qrcode, CameraDevice } from "html5-qrcode";
import { Loader2, SwitchCamera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onDetected: (code: string) => void;
  /** Saat true, hasil deteksi diabaikan (mis. sedang menampilkan hasil). */
  paused: boolean;
}

const REGION_ID = "scanner-region";

export function BarcodeScanner({ onDetected, paused }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const pausedRef = useRef(paused);
  const onDetectedRef = useRef(onDetected);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [camIndex, setCamIndex] = useState(0);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const startCamera = useCallback(async (cameraId: string) => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    setStarting(true);
    setError(null);
    try {
      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 280, height: 150 }, aspectRatio: 1.4 },
        (decodedText) => {
          if (pausedRef.current) return;
          // Hindari pemicu ganda untuk kode yang sama dalam 1,2 detik.
          const now = Date.now();
          const last = lastCodeRef.current;
          if (last && last.code === decodedText && now - last.at < 1200) return;
          lastCodeRef.current = { code: decodedText, at: now };
          onDetectedRef.current(decodedText);
        },
        () => {
          // error per-frame (tidak ada kode terdeteksi) — abaikan
        }
      );
      setStarting(false);
    } catch {
      setError(
        "Gagal memulai kamera. Pastikan izin kamera diberikan dan situs diakses via HTTPS."
      );
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const mod = await import("html5-qrcode");
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = mod;
        const scanner = new Html5Qrcode(REGION_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;
        if (!devices || devices.length === 0) {
          setError("Tidak ada kamera yang terdeteksi pada perangkat ini.");
          setStarting(false);
          return;
        }
        setCameras(devices);
        // Pilih kamera belakang bila ada.
        let idx = devices.findIndex((d) =>
          /back|rear|environment|belakang/i.test(d.label)
        );
        if (idx < 0) idx = devices.length - 1;
        setCamIndex(idx);
        await startCamera(devices[idx].id);
      } catch {
        if (mounted) {
          setError(
            "Tidak bisa mengakses kamera. Pastikan izin kamera diberikan dan situs diakses via HTTPS atau localhost."
          );
          setStarting(false);
        }
      }
    })();

    return () => {
      mounted = false;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [startCamera]);

  const switchCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || cameras.length < 2) return;
    const next = (camIndex + 1) % cameras.length;
    try {
      await scanner.stop();
    } catch {
      // abaikan
    }
    setCamIndex(next);
    await startCamera(cameras[next].id);
  }, [cameras, camIndex, startCamera]);

  return (
    <div className="relative w-full">
      <div
        id={REGION_ID}
        className="mx-auto w-full overflow-hidden rounded-xl bg-black [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        style={{ minHeight: 280 }}
      />

      {/* Overlay viewfinder */}
      {!error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[150px] w-[280px] rounded-lg border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
      )}

      {/* State: starting */}
      {starting && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Menyiapkan kamera...</p>
        </div>
      )}

      {/* State: error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-neutral-900 p-6 text-center text-white">
          <CameraOff className="h-8 w-8" />
          <p className="text-sm">{error}</p>
          <p className="text-xs text-white/60">
            Gunakan tombol &quot;Input Manual&quot; untuk mengetik kode.
          </p>
        </div>
      )}

      {/* Tombol ganti kamera */}
      {cameras.length > 1 && !error && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={switchCamera}
          className="absolute right-3 top-3 z-10 opacity-90"
          aria-label="Ganti kamera"
        >
          <SwitchCamera className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
