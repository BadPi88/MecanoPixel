import { useEffect, useRef } from 'react';
import type { GameState } from '../types/game';
import { ULTIMATE_MAX_CHARGE } from '../types/combat';
import {
  playBossDefeat,
  playBossIntro,
  playComboMilestone,
  playDamage,
  playGameOver,
  playKeyCorrect,
  playUltimateFire,
  playUltimateReady,
  playWordComplete,
  playBossTelegraph,
  playIndexadoraDefeat,
  playIndexadoraIntro,
  playIndexadoraPhase,
} from '../services/audio';

const COMBO_MILESTONES = [5, 10, 15] as const;

function isComboMilestone(combo: number): combo is (typeof COMBO_MILESTONES)[number] {
  return (COMBO_MILESTONES as readonly number[]).includes(combo);
}

function inputMatchesWord(
  input: string,
  status: GameState['status'],
  bossWord: GameState['bossWord'],
  words: GameState['words'],
): boolean {
  if (!input) return false;
  if (status === 'boss') {
    return bossWord?.text.startsWith(input) ?? false;
  }
  return words.some((w) => w.kind !== 'trap' && w.text.startsWith(input));
}

export function useGameAudio(state: GameState): void {
  const prevRef = useRef({
    status: state.status,
    combo: state.combo,
    lives: state.lives,
    poppingWordId: state.poppingWordId,
    ultimateCharge: state.ultimateCharge,
    ultimatesUsed: state.ultimatesUsed,
    input: state.input,
    bossId: state.bossId,
    bossPhase: state.bossPhase,
    bossTelegraphX: state.bossTelegraphX,
  });

  useEffect(() => {
    const prev = prevRef.current;

    if (
      state.input.length > prev.input.length &&
      inputMatchesWord(
        state.input,
        state.status,
        state.bossWord,
        state.words,
      )
    ) {
      playKeyCorrect();
    }

    if (state.poppingWordId && state.poppingWordId !== prev.poppingWordId) {
      playWordComplete();
    }

    if (
      state.combo > prev.combo &&
      isComboMilestone(state.combo)
    ) {
      playComboMilestone(state.combo);
    }

    if (
      prev.ultimateCharge < ULTIMATE_MAX_CHARGE &&
      state.ultimateCharge >= ULTIMATE_MAX_CHARGE
    ) {
      playUltimateReady();
    }

    if (
      prev.ultimateCharge >= ULTIMATE_MAX_CHARGE &&
      state.ultimateCharge < ULTIMATE_MAX_CHARGE &&
      state.ultimatesUsed > prev.ultimatesUsed
    ) {
      playUltimateFire();
    }

    if (state.lives < prev.lives) {
      playDamage();
    }

    if (prev.status !== 'boss' && state.status === 'boss') {
      if (state.bossId === 'indexadora') playIndexadoraIntro();
      else playBossIntro();
    }

    if (
      state.status === 'boss' &&
      state.bossId === 'indexadora' &&
      state.bossPhase > prev.bossPhase
    ) {
      playIndexadoraPhase();
    }

    if (
      state.bossTelegraphX !== null &&
      state.bossTelegraphX !== prev.bossTelegraphX
    ) {
      playBossTelegraph();
    }

    if (
      prev.status === 'boss' &&
      state.status !== 'boss' &&
      state.status !== 'gameOver'
    ) {
      if (prev.bossId === 'indexadora') playIndexadoraDefeat();
      else playBossDefeat();
    }

    if (prev.status !== 'gameOver' && state.status === 'gameOver') {
      playGameOver();
    }

    prevRef.current = {
      status: state.status,
      combo: state.combo,
      lives: state.lives,
      poppingWordId: state.poppingWordId,
      ultimateCharge: state.ultimateCharge,
      ultimatesUsed: state.ultimatesUsed,
      input: state.input,
      bossId: state.bossId,
      bossPhase: state.bossPhase,
      bossTelegraphX: state.bossTelegraphX,
    };
  }, [
    state.status,
    state.combo,
    state.lives,
    state.poppingWordId,
    state.ultimateCharge,
    state.ultimatesUsed,
    state.input,
    state.bossId,
    state.bossPhase,
    state.bossTelegraphX,
    state.bossWord,
    state.words,
  ]);
}
