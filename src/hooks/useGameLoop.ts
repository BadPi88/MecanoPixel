import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import { getRandomWord } from '../data/dictionary';
import { getDifficultyTier } from '../utils/difficulty';
import type { GameAction, GameState } from '../types/game';
import { createWordId } from './useGameState';

const WORD_HEIGHT = 36;
const MIN_X_PADDING = 16;
const MIN_WORD_GAP = 80;

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
    if (state.status !== 'playing') {
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

      const elapsed = stateRef.current.elapsedMs + deltaMs;
      const tier = getDifficultyTier(elapsed);

      if (tier.tier > lastTierRef.current) {
        lastTierRef.current = tier.tier;
        spawnIntervalRef.current = tier.spawnInterval;
        dispatch({ type: 'SPEED_RAMP', payload: { fallSpeed: tier.fallSpeed } });
      }

      dispatch({
        type: 'TICK',
        payload: { deltaMs, fallSpeed: tier.fallSpeed },
      });

      const areaHeight =
        gameAreaRef.current?.clientHeight ?? window.innerHeight - 48;

      stateRef.current.words.forEach((word) => {
        if (word.id === stateRef.current.poppingWordId) return;
        const nextY = word.y + tier.fallSpeed * (deltaMs / 1000);
        if (nextY >= areaHeight - WORD_HEIGHT) {
          dispatch({ type: 'WORD_HIT_GROUND', payload: word.id });
        }
      });

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
      const elapsed = stateRef.current.elapsedMs;
      const tier = getDifficultyTier(elapsed);
      spawnIntervalRef.current = tier.spawnInterval;

      const areaWidth = gameAreaRef.current?.clientWidth ?? window.innerWidth;
      const text = getRandomWord(elapsed);
      const x = findSpawnX(areaWidth, text, stateRef.current.words);

      dispatch({
        type: 'SPAWN_WORD',
        payload: {
          id: createWordId(),
          text,
          x,
          y: -WORD_HEIGHT,
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
