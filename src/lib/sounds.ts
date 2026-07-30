// ============================================================
// Lightweight synthesized sound effects.
//
// These are generated on the fly with the Web Audio API — short
// oscillator "blips" shaped with a volume envelope — rather than
// loaded audio files. That keeps the bundle small and means there's
// nothing to fetch or fail to load; every browser that runs this game
// already has what it needs.
//
// The AudioContext is managed resilience-first: handles tab blur/focus,
// mobile app suspend/resume, iOS background interrupt, and automatically
// recreates closed contexts.
// ============================================================

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;

    if (ctx && ctx.state === 'closed') {
      ctx = null;
    }

    if (!ctx) {
      ctx = new AC();
    }

    if (ctx.state === 'suspended' || (ctx.state as string) === 'interrupted') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    ctx = null;
    return null;
  }
}

// Global auto-unlock and recovery listener for tab focus / app reopen / user gestures
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      if (ctx && ctx.state === 'closed') {
        ctx = null;
      }
      const c = getCtx();
      if (c && (c.state === 'suspended' || (c.state as string) === 'interrupted')) {
        c.resume().then(() => {
          // Play a silent 1-frame buffer to reliably unlock iOS AudioContext
          try {
            const buffer = c.createBuffer(1, 1, 22050);
            const source = c.createBufferSource();
            source.buffer = buffer;
            source.connect(c.destination);
            source.start(0);
          } catch {
            // Ignore unlock errors
          }
        }).catch(() => {});
      }
    } catch {
      ctx = null;
    }
  };

  ['pointerdown', 'touchstart', 'click', 'focus', 'pageshow'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { capture: true, passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      unlockAudio();
    }
  });
}

function tone(freqHz: number, startOffset: number, duration: number, type: OscillatorType, peakGain: number) {
  try {
    const c = getCtx();
    if (!c || c.state === 'closed') return;

    if (c.state === 'suspended' || (c.state as string) === 'interrupted') {
      c.resume().then(() => {
        playTone(c, freqHz, startOffset, duration, type, peakGain);
      }).catch(() => {});
    } else {
      playTone(c, freqHz, startOffset, duration, type, peakGain);
    }
  } catch {
    ctx = null;
  }
}

function playTone(c: AudioContext, freqHz: number, startOffset: number, duration: number, type: OscillatorType, peakGain: number) {
  try {
    if (c.state === 'closed') return;
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
  } catch {
    if (c === ctx) ctx = null;
  }
}

// Soft tick when a nut/bolt is picked up (selected).
export function playPickup(enabled: boolean) {
  if (!enabled) return;
  tone(880, 0, 0.05, 'triangle', 0.06);
}

// Low double-thud when a nut lands on a bolt.
// `stackHeightRatio` ranges from 0.0 (bottom of bolt) to 1.0 (top of bolt)
export function playPlace(enabled: boolean, stackHeightRatio: number = 0) {
  if (!enabled) return;
  const clampedRatio = Math.min(Math.max(stackHeightRatio, 0), 1);
  // Pitch rises slightly as nuts stack higher on the bolt (1.0x at bottom up to 1.35x at top)
  const mult = 1 + (clampedRatio * 0.35);

  tone(200 * mult, 0, 0.09, 'sine', 0.16);
  tone(95 * mult, 0.01, 0.14, 'sine', 0.12);
}

// Bright ascending chime when a bolt fully locks.
// `stepIndex` (0, 1, 2...) raises the pitch for each consecutive bolt completed in the level.
// Uses a smooth major scale progression that never caps out no matter how many bolts exist.
const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];

export function playLock(enabled: boolean, stepIndex: number = 0) {
  if (!enabled) return;
  const oct = Math.floor(stepIndex / MAJOR_SCALE_STEPS.length);
  const semitones = oct * 12 + MAJOR_SCALE_STEPS[stepIndex % MAJOR_SCALE_STEPS.length];
  const mult = Math.pow(2, semitones / 12);

  const f1 = 523.25 * mult; // C5 * mult
  const f2 = 659.25 * mult; // E5 * mult
  const f3 = 783.99 * mult; // G5 * mult
  const f4 = 1046.50 * mult; // C6 * mult

  // Warm base tri-chime
  tone(f1, 0, 0.14, 'triangle', 0.12);
  tone(f2, 0.07, 0.14, 'triangle', 0.12);
  tone(f3, 0.14, 0.22, 'triangle', 0.14);

  // High sparkle on subsequent bolts
  if (stepIndex >= 1) {
    tone(f4, 0.20, 0.28, 'sine', 0.11);
  }
  if (stepIndex >= 3) {
    tone(f4 * 1.25, 0.25, 0.32, 'sine', 0.09); // E6 sparkle
  }
}

// Satisfying, joyful fanfare when a level is completed.
export function playLevelComplete(enabled: boolean) {
  if (!enabled) return;
  // Ascending major fanfare with sub-bass warmth and bright crown chime
  tone(261.63, 0.00, 0.45, 'sine', 0.15);     // C4 bass warmth
  tone(523.25, 0.00, 0.18, 'triangle', 0.13); // C5
  tone(659.25, 0.07, 0.18, 'triangle', 0.13); // E5
  tone(783.99, 0.14, 0.22, 'triangle', 0.15); // G5
  tone(1046.50, 0.21, 0.32, 'triangle', 0.16); // C6
  tone(1318.51, 0.28, 0.45, 'sine', 0.16);     // E6
  tone(1567.98, 0.35, 0.55, 'sine', 0.12);     // G6 top bell
}

// Grand, ultra-satisfying milestone fanfare when completing a 10-level section!
export function playSectionComplete(enabled: boolean) {
  if (!enabled) return;
  // Phase 1: Fast celebratory roll
  tone(392.00, 0.00, 0.12, 'triangle', 0.12); // G4
  tone(523.25, 0.05, 0.12, 'triangle', 0.13); // C5
  tone(659.25, 0.10, 0.12, 'triangle', 0.14); // E5
  tone(783.99, 0.15, 0.15, 'triangle', 0.15); // G5
  tone(880.00, 0.20, 0.12, 'triangle', 0.15); // A5
  tone(987.77, 0.25, 0.12, 'triangle', 0.16); // B5
  tone(1046.50, 0.30, 0.18, 'triangle', 0.18); // C6
  tone(1318.51, 0.35, 0.20, 'triangle', 0.18); // E6

  // Phase 2: Grand multi-octave triumphant victory chord starting at 0.44s
  const chordOffset = 0.44;
  tone(130.81, chordOffset, 1.10, 'sine', 0.22);       // C3 deep sub bass
  tone(261.63, chordOffset, 0.95, 'sine', 0.18);       // C4 mid bass
  tone(392.00, chordOffset, 0.85, 'triangle', 0.14);   // G4
  tone(523.25, chordOffset + 0.02, 0.85, 'triangle', 0.16); // C5
  tone(659.25, chordOffset + 0.04, 0.85, 'triangle', 0.16); // E5
  tone(783.99, chordOffset + 0.06, 0.85, 'triangle', 0.16); // G5
  tone(1046.50, chordOffset + 0.08, 0.95, 'sine', 0.18);     // C6
  tone(1318.51, chordOffset + 0.10, 1.10, 'sine', 0.18);     // E6
  tone(1567.98, chordOffset + 0.12, 1.10, 'sine', 0.15);     // G6
  tone(2093.00, chordOffset + 0.16, 0.80, 'sine', 0.12);     // C7 glittering sparkle
}

// Gentle, soft double-tap for an invalid move.
export function playError(enabled: boolean) {
  if (!enabled) return;
  tone(170, 0.00, 0.08, 'sine', 0.07);
  tone(135, 0.05, 0.11, 'sine', 0.05);
}
