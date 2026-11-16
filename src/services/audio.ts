import { loadSettings } from './settings';

let audioCtx: AudioContext | null = null;
let masterCompressor: DynamicsCompressorNode | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AudioContextConstructor = window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return null;
      audioCtx = new AudioContextConstructor();
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(12, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(8, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.18, audioCtx.currentTime);
      masterCompressor.connect(audioCtx.destination);
    } catch {
      audioCtx = null;
      masterCompressor = null;
      return null;
    }
  }
  return audioCtx;
}

function canPlay(): boolean {
  return loadSettings().soundEnabled;
}

function resumeIfNeeded(ctx: AudioContext): void {
  if (ctx.state === 'suspended') {
    try { void ctx.resume().catch(() => {}); } catch { /* Autoplay bloqueado por el navegador. */ }
  }
}

interface ToneOptions {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
}

function playTone({
  frequency,
  duration,
  type = 'square',
  volume = 0.07,
  delay = 0,
}: ToneOptions): void {
  if (!canPlay()) return;

  const ctx = getContext();
  if (!ctx) return;
  resumeIfNeeded(ctx);

  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gain);
  gain.connect(masterCompressor ?? ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
  osc.addEventListener('ended', () => {
    osc.disconnect();
    gain.disconnect();
  }, { once: true });
}

function playSequence(tones: ToneOptions[]): void {
  tones.forEach((tone) => playTone(tone));
}

const PENTATONIC = [0, 2, 4, 7, 9] as const;

export function playKeyCorrect(inputLength = 0): void {
  const semitones = PENTATONIC[inputLength % PENTATONIC.length]! + Math.floor(inputLength / PENTATONIC.length) * 12;
  playTone({ frequency: 440 * 2 ** (semitones / 12), duration: 0.035, volume: 0.035 });
}

export function playWordComplete(): void {
  playSequence([
    { frequency: 523.25, duration: 0.09, type: 'triangle', volume: 0.055 },
    { frequency: 659.25, duration: 0.11, delay: 0.025, type: 'triangle', volume: 0.05 },
    { frequency: 783.99, duration: 0.14, delay: 0.05, type: 'triangle', volume: 0.045 },
  ]);
}

export function playKeyError(): void {
  playTone({ frequency: 105, duration: 0.075, type: 'triangle', volume: 0.06 });
}

export function playComboMilestone(level: number): void {
  const base = 440 + level * 40;
  playSequence([
    { frequency: base, duration: 0.07, volume: 0.07 },
    { frequency: base * 1.25, duration: 0.09, delay: 0.06, volume: 0.06 },
    { frequency: base * 1.5, duration: 0.11, delay: 0.12, volume: 0.05 },
  ]);
}

export function playUltimateReady(): void {
  playSequence([
    { frequency: 330, duration: 0.08, type: 'triangle', volume: 0.08 },
    { frequency: 440, duration: 0.08, type: 'triangle', delay: 0.08, volume: 0.08 },
    { frequency: 554, duration: 0.12, type: 'triangle', delay: 0.16, volume: 0.09 },
  ]);
}

export function playUltimateFire(): void {
  playSequence([
    { frequency: 220, duration: 0.1, type: 'sawtooth', volume: 0.06 },
    { frequency: 165, duration: 0.15, type: 'sawtooth', delay: 0.08, volume: 0.05 },
    { frequency: 110, duration: 0.2, type: 'sawtooth', delay: 0.18, volume: 0.04 },
  ]);
}

export function playDamage(): void {
  playSequence([
    { frequency: 180, duration: 0.12, type: 'sawtooth', volume: 0.08 },
    { frequency: 120, duration: 0.18, type: 'sawtooth', delay: 0.06, volume: 0.06 },
  ]);
}

export function playBossIntro(): void {
  playSequence([
    { frequency: 110, duration: 0.2, type: 'triangle', volume: 0.09 },
    { frequency: 87, duration: 0.25, type: 'triangle', delay: 0.15, volume: 0.08 },
    { frequency: 73, duration: 0.35, type: 'triangle', delay: 0.35, volume: 0.07 },
  ]);
}

export function playIndexadoraIntro(): void {
  playSequence([
    { frequency: 196, duration: 0.12, type: 'triangle', volume: 0.07 },
    { frequency: 392, duration: 0.18, delay: 0.13, volume: 0.06 },
    { frequency: 587, duration: 0.24, delay: 0.31, type: 'triangle', volume: 0.05 },
  ]);
}

export function playBossTelegraph(): void {
  playSequence([
    { frequency: 740, duration: 0.055, type: 'square', volume: 0.045 },
    { frequency: 494, duration: 0.09, delay: 0.07, type: 'triangle', volume: 0.055 },
  ]);
}

export function playIndexadoraPhase(): void {
  playSequence([
    { frequency: 262, duration: 0.08, volume: 0.065 },
    { frequency: 392, duration: 0.09, delay: 0.08, volume: 0.06 },
    { frequency: 784, duration: 0.17, delay: 0.18, type: 'triangle', volume: 0.07 },
  ]);
}

export function playIndexadoraDefeat(): void {
  playSequence([
    { frequency: 659, duration: 0.08, volume: 0.06 },
    { frequency: 523, duration: 0.1, delay: 0.1, volume: 0.055 },
    { frequency: 392, duration: 0.16, delay: 0.22, type: 'triangle', volume: 0.065 },
    { frequency: 196, duration: 0.22, delay: 0.4, type: 'triangle', volume: 0.05 },
  ]);
}

export function playBossDefeat(): void {
  playSequence([
    { frequency: 523, duration: 0.1, volume: 0.07 },
    { frequency: 659, duration: 0.1, delay: 0.1, volume: 0.07 },
    { frequency: 784, duration: 0.15, delay: 0.2, volume: 0.08 },
    { frequency: 1047, duration: 0.2, delay: 0.32, volume: 0.06 },
  ]);
}

export function playGameOver(): void {
  playSequence([
    { frequency: 392, duration: 0.15, type: 'triangle', volume: 0.07 },
    { frequency: 330, duration: 0.15, type: 'triangle', delay: 0.14, volume: 0.07 },
    { frequency: 262, duration: 0.15, type: 'triangle', delay: 0.28, volume: 0.07 },
    { frequency: 196, duration: 0.35, type: 'triangle', delay: 0.42, volume: 0.08 },
  ]);
}
