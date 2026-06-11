import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import type { GameAction, GameState } from '../types/game';
import { getDifficultyTier } from '../utils/difficulty';
import {
  getEffectiveDifficulty,
  hasPerkWithCharge,
  type CombatExtras,
} from '../utils/perkModifiers';
import { getFloorTierOffset } from '../utils/runTransitions';
import { getRunnerModifiers } from '../utils/runnerModifiers';
import {
  getRelicFallSpeedMult,
  getSpawnConstraints,
} from '../utils/combatModifiers';
import { applyEliteSpawnConstraints } from '../utils/eliteModifiers';
import { getBiomeSpeedMult } from '../utils/biomeModifiers';
import { getEliteSpawnMult } from '../utils/eliteModifiers';
import { shouldSkipTrapsOnFloor } from '../utils/hubModifiers';
import {
  decorateSpawn,
  getOracleRateMult,
  getSpawnRatesForFloor,
  getWordTextForKind,
  rollWordKind,
} from '../utils/wordSpawn';
import {
  getBossFallSpeed,
  getBossProjectileIntervalMult,
} from '../data/bosses';
import { getAscensionBossAttackMult } from '../utils/ascensionModifiers';
import { createWordId } from './useGameStateHelpers';

const WORD_HEIGHT = 36;
const MIN_X_PADDING = 16;
const MIN_WORD_GAP = 80;
const BOSS_WORD_HEIGHT = 40;
const PROJECTILE_CHARS = ['q', 'x', 'j', 'z', 'k', 'w', 'b', 'v'];
const PROJECTILE_MIN_INTERVAL = 8_000;
const PROJECTILE_MAX_INTERVAL = 12_000;

function randomX(areaWidth: number, wordWidth: number): number {
  const maxX = Math.max(MIN_X_PADDING, areaWidth - wordWidth - MIN_X_PADDING);
  return MIN_X_PADDING + Math.random() * (maxX - MIN_X_PADDING);
}

function estimateWordWidth(text: string): number {
  return text.length * 12 + 24;
}

function findSpawnX(
  areaWidth: number,
  text: string,
  existingWords: { x: number; text: string }[],
): number {
  const wordWidth = estimateWordWidth(text);

  for (let attempt = 0; attempt < 12; attempt++) {
    const x = randomX(areaWidth, wordWidth);
    const overlaps = existingWords.some((w) => {
      const wWidth = estimateWordWidth(w.text);
      return Math.abs(w.x - x) < MIN_WORD_GAP + (wWidth + wordWidth) / 4;
    });
    if (!overlaps) return x;
  }

  return randomX(areaWidth, wordWidth);
}

function getCombatExtras(state: GameState): CombatExtras {
  return {
    tempoBuffUntilMs: state.tempoBuffUntilMs,
    flowSpawnMult: state.flowStats.spawnMult,
    flowSpeedMult: state.flowStats.speedMult,
    relicFallMult: getRelicFallSpeedMult(state.activeRelics),
    biomeSpeedMult: getBiomeSpeedMult(state.biomeId),
    eliteSpawnMult: getEliteSpawnMult(state.eliteModifierId),
  };
}

export function useGameLoop(
  state: GameState,
  dispatch: Dispatch<GameAction>,
  gameAreaRef: React.RefObject<HTMLDivElement | null>,
) {
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const lastTierRef = useRef(0);
  const spawnIntervalRef = useRef(2500);

  useEffect(() => {
    if (state.status !== 'playing' && state.status !== 'perkPick') {
      return;
    }

    let animationId = 0;
    let lastFrame = 0;

    const tick = (timestamp: number) => {
      if (lastFrame === 0) {
        lastFrame = timestamp;
      }

      const deltaMs = timestamp - lastFrame;
      lastFrame = timestamp;

      const current = stateRef.current;
      if (current.status !== 'playing') {
        animationId = requestAnimationFrame(tick);
        return;
      }

      const elapsed = current.elapsedMs + deltaMs;
      const tierOffset = getFloorTierOffset(current);
      const rawTier = getDifficultyTier(elapsed, tierOffset).tier;

      if (rawTier > lastTierRef.current) {
        lastTierRef.current = rawTier;
        if (hasPerkWithCharge(current.activePerks, 'broken_clock')) {
          dispatch({ type: 'BROKEN_CLOCK_SKIP' });
        } else {
          const effective = getEffectiveDifficulty(
            current.elapsedMs,
            tierOffset,
            current.activePerks,
            current.frozenUntilMs,
            current.runnerId,
            getCombatExtras(current),
          );
          spawnIntervalRef.current = effective.spawnInterval;
          dispatch({
            type: 'SPEED_RAMP',
            payload: { fallSpeed: effective.fallSpeed },
          });
        }
      }

      const effective = getEffectiveDifficulty(
        elapsed,
        tierOffset,
        current.activePerks,
        current.frozenUntilMs,
        current.runnerId,
        getCombatExtras(current),
      );

      const areaHeight =
        gameAreaRef.current?.clientHeight ?? window.innerHeight - 48;

      dispatch({
        type: 'TICK',
        payload: { deltaMs, fallSpeed: effective.fallSpeed, groundHeight: areaHeight },
      });

      if (!effective.modifiers.frozen) {
        current.words.forEach((word) => {
          if (word.id === current.poppingWordId) return;
          const nextY = word.y + effective.fallSpeed * (deltaMs / 1000);
          if (nextY >= areaHeight - WORD_HEIGHT) {
            dispatch({ type: 'WORD_HIT_GROUND', payload: word.id });
          }
        });
      }

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationId);
  }, [state.status, dispatch, gameAreaRef]);

  useEffect(() => {
    if (state.status !== 'boss') return;

    let animationId = 0;
    let lastFrame = 0;

    const tick = (timestamp: number) => {
      if (lastFrame === 0) lastFrame = timestamp;
      const deltaMs = timestamp - lastFrame;
      lastFrame = timestamp;

      const current = stateRef.current;
      if (current.status !== 'boss' || current.bossWords.length === 0) {
        animationId = requestAnimationFrame(tick);
        return;
      }

      dispatch({ type: 'BOSS_TICK', payload: { deltaMs } });

      const areaHeight =
        gameAreaRef.current?.clientHeight ?? window.innerHeight - 48;
      const fallSpeed = getBossFallSpeed(current.bossId);
      const deltaSec = deltaMs / 1000;
      const anyHitsGround = current.bossWords.some(
        (w) => w.y + fallSpeed * deltaSec >= areaHeight - BOSS_WORD_HEIGHT,
      );
      if (anyHitsGround) {
        dispatch({ type: 'BOSS_FAIL' });
        return;
      }

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [state.status, dispatch, gameAreaRef]);

  useEffect(() => {
    if (state.status !== 'playing') {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleSpawn = () => {
      const current = stateRef.current;
      if (current.status !== 'playing') return;

      if (
        current.wordDroughtUntilMs > 0 &&
        current.elapsedMs < current.wordDroughtUntilMs &&
        current.words.length >= 2
      ) {
        timeoutId = setTimeout(scheduleSpawn, 500);
        return;
      }

      const tierOffset = getFloorTierOffset(current);
      const effective = getEffectiveDifficulty(
        current.elapsedMs,
        tierOffset,
        current.activePerks,
        current.frozenUntilMs,
        current.runnerId,
        getCombatExtras(current),
      );
      const constraints = applyEliteSpawnConstraints(
        getSpawnConstraints(current.activeRelics),
        current.eliteModifierId,
      );
      spawnIntervalRef.current =
        effective.spawnInterval * constraints.spawnIntervalMult;

      const rates = getSpawnRatesForFloor(
        current.floor,
        shouldSkipTrapsOnFloor(current),
        current.activeRelics,
        current.biomeId,
        current.ascensionLevel,
      );
      rates.bonus += getRunnerModifiers(current.runnerId).bonusChanceBonus;
      const chaosMode = current.chaosRollRemaining > 0;
      const kind = rollWordKind(
        rates,
        getOracleRateMult(current.biomeId),
        chaosMode,
      );
      const text = getWordTextForKind(
        kind,
        current.elapsedMs,
        tierOffset,
        current.selectedGlossary,
        current.activeRelics,
      );
      const devoratexto = current.bossId === 'devoratexto';
      const decoration = decorateSpawn(
        kind,
        text,
        current.floor,
        current.elapsedMs,
        current.activeRelics,
        current.biomeId,
        devoratexto,
      );
      const areaWidth = gameAreaRef.current?.clientWidth ?? window.innerWidth;
      const x = findSpawnX(areaWidth, text, current.words);

      dispatch({
        type: 'SPAWN_WORD',
        payload: {
          id: createWordId(),
          text,
          x,
          y: -WORD_HEIGHT,
          kind,
          pos: decoration.pos,
          displayText: decoration.displayText,
          modifiers: decoration.modifiers,
          morphAtMs: decoration.morphAtMs,
        },
      });

      timeoutId = setTimeout(scheduleSpawn, spawnIntervalRef.current);
    };

    timeoutId = setTimeout(scheduleSpawn, spawnIntervalRef.current);

    return () => clearTimeout(timeoutId);
  }, [state.status, dispatch, gameAreaRef]);

  useEffect(() => {
    const projectilesActive =
      (state.status === 'playing' && state.floor >= 2) ||
      (state.status === 'boss' && state.bossAttack?.projectiles);
    if (!projectilesActive) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleProjectile = () => {
      const current = stateRef.current;
      const stillActive =
        (current.status === 'playing' && current.floor >= 2) ||
        (current.status === 'boss' && current.bossAttack?.projectiles);
      if (!stillActive) return;

      const areaWidth = gameAreaRef.current?.clientWidth ?? window.innerWidth;
      const char =
        PROJECTILE_CHARS[Math.floor(Math.random() * PROJECTILE_CHARS.length)];

      dispatch({
        type: 'SPAWN_PROJECTILE',
        payload: {
          id: createWordId(),
          char,
          x: MIN_X_PADDING + Math.random() * (areaWidth - MIN_X_PADDING * 2),
          y: -24,
          vy: 60 + Math.random() * 30,
        },
      });

      let intervalMult =
        current.status === 'boss'
          ? getBossProjectileIntervalMult(current.bossId)
          : 1;
      if (current.status === 'boss') {
        intervalMult *= getAscensionBossAttackMult(current.ascensionLevel);
      }
      const baseInterval =
        PROJECTILE_MIN_INTERVAL +
        Math.random() * (PROJECTILE_MAX_INTERVAL - PROJECTILE_MIN_INTERVAL);

      timeoutId = setTimeout(
        scheduleProjectile,
        baseInterval * intervalMult,
      );
    };

    timeoutId = setTimeout(scheduleProjectile, PROJECTILE_MIN_INTERVAL);

    return () => clearTimeout(timeoutId);
  }, [state.status, state.bossAttack?.projectiles, dispatch, gameAreaRef]);
}
