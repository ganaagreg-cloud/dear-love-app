type Ctor = typeof AudioContext;

function tone(ctx: AudioContext, t0: number, freq: number, at: number, dur: number, peak: number) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, t0 + at);
  g.gain.setValueAtTime(1e-4, t0 + at);
  g.gain.exponentialRampToValueAtTime(peak, t0 + at + 0.02);
  g.gain.exponentialRampToValueAtTime(1e-4, t0 + at + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(t0 + at); o.stop(t0 + at + dur + 0.05);
}

function getCtor(): Ctor | undefined {
  return window.AudioContext || (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
}

/** Profile-click "ta-dum" */
export function playTaDum(delay = 0) {
  try {
    const C = getCtor(); if (!C) return;
    const ctx = new C(), t = ctx.currentTime;
    tone(ctx, t, 155.56, delay + 0, 0.16, 0.35);  // "ta"  (D#3)
    tone(ctx, t, 103.83, delay + 0.15, 0.55, 0.45); // "dum" (G#2)
    setTimeout(() => { try { ctx.close(); } catch { /* noop */ } }, 1200 + delay * 1000);
  } catch { /* noop */ }
}

/** Finale-overlay "ta-dum" (+0.35s / +0.5s) */
export function playFinaleTaDum() {
  try {
    const C = getCtor(); if (!C) return;
    const ctx = new C(), t = ctx.currentTime;
    tone(ctx, t, 155.56, 0.35, 0.16, 0.35);
    tone(ctx, t, 103.83, 0.5, 0.6, 0.45);
    setTimeout(() => { try { ctx.close(); } catch { /* noop */ } }, 1600);
  } catch { /* noop */ }
}
