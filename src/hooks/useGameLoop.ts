import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import type { GameAction, GameState } from '../types/game';
import { getDifficultyTier } from '../utils/difficulty';
import { getEffectiveDifficulty, hasPerkWithCharge } from '../utils/perkModifiers';
import { getFloorTierOffset } from '../utils/runTransitions';
import {
  getSpawnRatesForFloor,
  getWordTextForKind,
  rollWordKind,
} from '../utils/wordSpawn';
import { createWordId } from './useGameState';

const WORD_HEIGHT = 36;
const MIN_X_PADDING = 16;
const MIN_WORD_GAP = 80;
const BOSS_WORD_HEIGHT = 40;

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

export function useGameLoop(
  state: GameState,
  dispatch: Dispatch<GameAction>,
  gameAreaRef: React.RefObject<HTMLDivElement | null>,
) {
  const stateRef = useRef(state);
  stateRef.current = state;

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
      );

      dispatch({
        type: 'TICK',
        payload: { deltaMs, fallSpeed: effective.fallSpeed },
      });

      if (!effective.modifiers.frozen) {
        const areaHeight =
          gameAreaRef.current?.clientHeight ?? window.innerHeight - 48;

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
      if (current.status !== 'boss' || !current.bossWord) {
        animationId = requestAnimationFrame(tick);
        return;
      }

      dispatch({ type: 'BOSS_TICK', payload: { deltaMs } });

      const areaHeight =
        gameAreaRef.current?.clientHeight ?? window.innerHeight - 48;
      const nextY = current.bossWord.y + 25 * (deltaMs / 1000);
      if (nextY >= areaHeight - BOSS_WORD_HEIGHT) {
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

      const tierOffset = getFloorTierOffset(current);
      const effective = getEffectiveDifficulty(
        current.elapsedMs,
        tierOffset,
        current.activePerks,
        current.frozenUntilMs,
        current.runnerId,
      );
      spawnIntervalRef.current = effective.spawnInterval;

      const rates = getSpawnRatesForFloor(
        current.floor,
        current.noTrapsNextFloor,
      );
      const kind = rollWordKind(rates);
      const text = getWordTextForKind(kind, current.elapsedMs, tierOffset);
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
        },
      });

      timeoutId = setTimeout(scheduleSpawn, spawnIntervalRef.current);
    };

    timeoutId = setTimeout(scheduleSpawn, spawnIntervalRef.current);

    return () => clearTimeout(timeoutId);
  }, [state.status, dispatch, gameAreaRef]);

  useEffect(() => {
    if (!state.showSpeedNotice) return;

    const timer = setTimeout(() => {
      dispatch({ type: 'HIDE_SPEED_NOTICE' });
    }, 2000);

    return () => clearTimeout(timer);
  }, [state.showSpeedNotice, dispatch]);

  useEffect(() => {
    if (state.status === 'idle' || state.status === 'gameOver') {
      lastTierRef.current = 0;
      spawnIntervalRef.current = 2500;
    }
  }, [state.status]);
}
