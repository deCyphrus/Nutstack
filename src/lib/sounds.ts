// ============================================================
// Lightweight synthesized sound effects.
//
// These are generated on the fly with the Web Audio API — short
// oscillator "blips" shaped with a volume envelope — rather than
// loaded audio files. That keeps the bundle small and means there's
// nothing to fetch or fail to load; every browser that runs this game
// already has what it needs.
//
// The AudioContext is created lazily (browsers require it to happen
// after a user gesture like a click, which is exactly when these are
// called from), and every exported function takes an `enabled` flag
// so call sites don't need their own if-checks.
// ============================================================

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freqHz: number, startOffset: number, duration: number, type: OscillatorType, peakGain: number) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freqHz;
  const t0 = c.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Soft tick when a nut/bolt is picked up (selected).
export function playPickup(enabled: boolean) {
  if (!enabled) return;
  tone(880, 0, 0.05, 'triangle', 0.06);
}

// Low double-thud when a nut lands on a bolt.
export function playPlace(enabled: boolean) {
  if (!enabled) return;
  tone(200, 0, 0.09, 'sine', 0.16);
  tone(95, 0.01, 0.14, 'sine', 0.12);
}

// Bright ascending three-note chime when a bolt fully locks.
export function playLock(enabled: boolean) {
  if (!enabled) return;
  tone(523.25, 0, 0.14, 'triangle', 0.11);
  tone(659.25, 0.08, 0.14, 'triangle', 0.11);
  tone(783.99, 0.16, 0.24, 'triangle', 0.13);
}

// Short low buzz for an invalid move.
export function playError(enabled: boolean) {
  if (!enabled) return;
  tone(130, 0, 0.16, 'sawtooth', 0.09);
}
