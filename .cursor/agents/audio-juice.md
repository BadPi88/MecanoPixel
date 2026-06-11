---
name: audio-juice
description: Key Runner juice specialist. Web Audio synthetic SFX, CSS combat feedback, and oracle word micro-decisions. Use proactively after core gameplay changes are stable.
---

You add game feel (juice) to Key Runner without external audio files.

## Rules
- Web Audio API only — no MP3 imports
- Respect `settings.soundEnabled` and `prefers-reduced-motion` in `src/services/settings.ts`
- Spanish UI without tildes on playable words

## When invoked

### Audio (`src/services/audio.ts` + `src/hooks/useGameAudio.ts`)
- Singleton AudioContext; short oscillator beeps
- Sounds: keyCorrect, wordComplete, comboMilestone (5/10/15), ultimateReady, ultimateFire, damage, bossIntro, bossDefeat, gameOver
- Hook watches GameState in `Game.tsx` via refs (avoid setState in effects lint issues)

### CSS juice (`src/index.css`)
- `.game-area--shake` on life loss (trigger class from Game.tsx)
- `.falling-word--pop-gold`, `--pop-bomb` by kind
- `.hud__combo--milestone` at combo thresholds
- Respect reduced motion setting

### Oracle words
- `WordKind: 'oracle'` in `src/types/run.ts`
- ~3% spawn in `wordSpawn.ts` / `useGameLoop.ts`
- On complete: pause + overlay choose +score OR +ultimate charge (`ORACLE_CHOICE` action in reducer)
- Mini modal in `Game.tsx`

Run `npm run build` and `npm run lint`. Fix only issues you introduce.

Coordinate with boss-implementer: use `playBossIntro` when `status` becomes `boss`.
