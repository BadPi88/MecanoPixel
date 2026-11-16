import type { GameAction, GameState } from '../../types/game.ts';
import { GAME_BALANCE } from '../../config/gameBalance.ts';
import { getEffectiveDifficulty, expirePerks, hasPerkWithCharge, consumePerkCharge, findLowestWord } from '../../utils/perkModifiers.ts';
import { tickEliteFog } from '../../utils/eliteModifiers.ts';
import { getBiomeGameplayMod } from '../../utils/biomeModifiers.ts';
import { morphDisplayText } from '../../utils/wordSpawn.ts';
import { randomFor } from './shared.ts';
import { hasSynergy } from '../../utils/synergyEngine.ts';
import { getFloorTierOffset } from '../../utils/runTransitions.ts';
import { updateFlowStats } from '../../utils/flowDifficulty.ts';
import { wordsPerSecondFromSpawnInterval } from '../../utils/intensity.ts';
import { MAX_LETTER_PROJECTILES } from '../../types/combat.ts';

export function reducePhysicsAction(state: GameState, action: GameAction): GameState | null {
  switch (action.type) {
case 'TICK': {
      if (state.status !== 'playing') return state;

      const { deltaMs, fallSpeed, groundHeight } = action.payload;
      const deltaSec = deltaMs / 1000;
      const newElapsed = state.elapsedMs + deltaMs;
      const newDifficultyElapsed =
        state.difficultyElapsedMs + deltaMs * state.flowStats.progressionRate;
      let activePerks = expirePerks(state.activePerks, newElapsed);
      const frozen = newElapsed < state.frozenUntilMs;

      const fogTick = tickEliteFog(
        { ...state, elapsedMs: newElapsed },
        newElapsed,
      );
      const inputBlindedUntilMs =
        fogTick?.inputBlindedUntilMs ?? state.inputBlindedUntilMs;
      const eliteFogLastAtMs =
        fogTick?.eliteFogLastAtMs ?? state.eliteFogLastAtMs;

      const fabricaMod = getBiomeGameplayMod(state.biomeId);
      let keyRemap = state.keyRemap;
      let fabricaRemapNextAtMs = state.fabricaRemapNextAtMs;
      if (fabricaMod.fabricaRemap) {
        if (state.fabricaRemapNextAtMs === 0) {
          fabricaRemapNextAtMs = newElapsed + 20_000;
        } else if (!keyRemap && newElapsed >= state.fabricaRemapNextAtMs && state.input.length === 0) {
          keyRemap = { a: 's', s: 'a' };
          fabricaRemapNextAtMs = newElapsed + 5_000;
        } else if (!keyRemap && newElapsed >= state.fabricaRemapNextAtMs) {
          fabricaRemapNextAtMs = newElapsed + 750;
        } else if (keyRemap && newElapsed >= state.fabricaRemapNextAtMs) {
          if (state.input.length > 0) {
            fabricaRemapNextAtMs = newElapsed + 750;
          } else {
            keyRemap = null;
            fabricaRemapNextAtMs = newElapsed + 20_000;
          }
        }
      }

      let updatedWords = state.words.map((word) => {
        if (word.id === state.poppingWordId) return word;
        let next = word;
        if (!frozen) {
          next = { ...next, y: next.y + fallSpeed * deltaSec };
        }
        if (
          next.modifiers?.includes('shifting') &&
          next.morphAtMs !== undefined &&
          newElapsed >= next.morphAtMs
        ) {
          if (next.text.startsWith(state.input) && state.input.length > 0) {
            return { ...next, morphAtMs: newElapsed + 750 };
          }
          next = {
            ...next,
            displayText: morphDisplayText(
              next.text,
              randomFor(state, 0x502 ^ Math.floor(next.morphAtMs ?? 0)),
            ),
            morphAtMs: newElapsed + 3_000,
          };
        }
        return next;
      });

      // Sinergia radar + purga: elimina la palabra mas baja cada 60 s
      let lastPurgeFreeAtMs = state.lastPurgeFreeAtMs;
      if (
        hasSynergy(state, 'radar_purga') &&
        newElapsed - lastPurgeFreeAtMs >= 60_000 &&
        updatedWords.length > 0
      ) {
        const lowest = findLowestWord(updatedWords);
        if (lowest) {
          updatedWords = updatedWords.filter((w) => w.id !== lowest.id);
          lastPurgeFreeAtMs = newElapsed;
        }
      }

      // Proyectiles de letra: mover y resolver impactos contra el suelo
      let lives = state.lives;
      let combo = state.combo;
      let deathCause = state.deathCause;
      const surviving: typeof state.letterProjectiles = [];
      for (const proj of state.letterProjectiles) {
        const newY = frozen ? proj.y : proj.y + proj.vy * deltaSec;
        if (newY >= groundHeight - GAME_BALANCE.typing.projectileHeight) {
          if (hasPerkWithCharge(activePerks, 'shield')) {
            activePerks = consumePerkCharge(activePerks, 'shield');
          } else {
            lives -= 1;
            combo = 0;
            if (lives <= 0) deathCause = 'projectile';
          }
        } else {
          surviving.push({ ...proj, y: newY });
        }
      }

      const effective = getEffectiveDifficulty(
        newElapsed,
        getFloorTierOffset(state),
        activePerks,
        state.frozenUntilMs,
        state.runnerId,
        { difficultyElapsedMs: newDifficultyElapsed },
      );

      return {
        ...state,
        lastGroundHeight: groundHeight,
        elapsedMs: newElapsed,
        difficultyElapsedMs: newDifficultyElapsed,
        words: updatedWords,
        activePerks,
        lives,
        combo,
        deathCause,
        letterProjectiles: surviving,
        lastPurgeFreeAtMs,
        inputBlindedUntilMs,
        eliteFogLastAtMs,
        keyRemap,
        fabricaRemapNextAtMs,
        flowStats: updateFlowStats(state.flowStats, newElapsed),
        status: lives <= 0 ? 'gameOver' : state.status,
        maxWordsPerSecond: Math.max(
          state.maxWordsPerSecond,
          wordsPerSecondFromSpawnInterval(effective.spawnInterval),
        ),
      };
    }

    case 'SPAWN_PROJECTILE': {
      const inBossWithProjectiles =
        state.status === 'boss' && state.bossAttack?.projectiles;
      if (state.status !== 'playing' && !inBossWithProjectiles) return state;
      if (state.letterProjectiles.length >= MAX_LETTER_PROJECTILES) return state;
      return {
        ...state,
        projectileCount: state.projectileCount + 1,
        letterProjectiles: [...state.letterProjectiles, action.payload],
        bossTelegraphX:
          state.status === 'boss' && state.bossId === 'indexadora'
            ? null
            : state.bossTelegraphX,
        bossTelegraphUntilMs:
          state.status === 'boss' && state.bossId === 'indexadora'
            ? 0
            : state.bossTelegraphUntilMs,
      };
    }
case 'WORD_HIT_GROUND': {
      if (state.status !== 'playing') return state;
      if (state.poppingWordId === action.payload) return state;
      const word = state.words.find((w) => w.id === action.payload);
      if (!word) return state;

      if (word.kind === 'trap' || word.kind === 'bonus') {
        return {
          ...state,
          words: state.words.filter((w) => w.id !== action.payload),
        };
      }

      if (hasPerkWithCharge(state.activePerks, 'shield')) {
        return {
          ...state,
          combo: 0,
          words: state.words.filter((w) => w.id !== action.payload),
          activePerks: consumePerkCharge(state.activePerks, 'shield'),
        };
      }

      const lifeLoss = word.kind === 'bomb' ? 2 : 1;
      const newLives = state.lives - lifeLoss;

      if (
        newLives <= 0 &&
        hasPerkWithCharge(state.activePerks, 'phoenix') &&
        !state.phoenixUsed
      ) {
        return {
          ...state,
          lives: 1,
          phoenixUsed: true,
          activePerks: consumePerkCharge(state.activePerks, 'phoenix'),
          combo: 0,
          words: state.words.filter((w) => w.id !== action.payload),
        };
      }

      let words = state.words.filter((w) => w.id !== action.payload);

      if (hasPerkWithCharge(state.activePerks, 'safety_net') && newLives > 0) {
        words = words.map((w) => ({ ...w, y: Math.max(0, w.y - 80) }));
      }

      let activePerks = state.activePerks;
      if (hasPerkWithCharge(activePerks, 'safety_net')) {
        activePerks = consumePerkCharge(activePerks, 'safety_net');
      }

      return {
        ...state,
        lives: newLives,
        combo: 0,
        precisionStreak: 0,
        words,
        activePerks,
        deathCause: word.kind === 'bomb' ? 'bomb' : 'ground',
        status: newLives <= 0 ? 'gameOver' : state.status,
      };
    }
default: return null;
  }
}


