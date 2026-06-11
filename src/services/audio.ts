import { loadSettings } from './settings';

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function canPlay(): boolean {
  return loadSettings().soundEnabled;
}

function resumeIfNeeded(ctx: AudioContext): void {
  if (ctx.state === 'suspended') {
    void ctx.resume();
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
  resumeIfNeeded(ctx);

  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function playSequence(tones: ToneOptions[]): void {
  tones.forEach((tone) => playTone(tone));
}

export function playKeyCorrect(): void {
  playTone({ frequency: 520, duration: 0.04, volume: 0.04 });
}

export function playWordComplete(): void {
  playSequence([
    { frequency: 660, duration: 0.06, volume: 0.06 },
    { frequency: 880, duration: 0.08, delay: 0.05, volume: 0.05 },
  ]);
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
