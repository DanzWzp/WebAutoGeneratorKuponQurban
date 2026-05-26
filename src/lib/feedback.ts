// Feedback suara (Web Audio API) & getaran untuk halaman scanner.
// Memakai oscillator sehingga tidak butuh file audio eksternal.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  delay = 0
) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0.12;
  osc.connect(gain);
  gain.connect(c.destination);
  const start = c.currentTime + delay;
  osc.start(start);
  // fade out singkat agar tidak "klik"
  gain.gain.setValueAtTime(0.12, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.stop(start + duration);
}

export function beepSuccess() {
  tone(880, 0.12, "sine", 0);
  tone(1318, 0.16, "sine", 0.12); // naik (ding-ding)
}

export function beepError() {
  tone(196, 0.35, "square", 0); // nada rendah panjang
}

export function beepWarning() {
  tone(523, 0.14, "triangle", 0);
  tone(523, 0.14, "triangle", 0.2);
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // sebagian browser memblokir tanpa interaksi user
    }
  }
}
