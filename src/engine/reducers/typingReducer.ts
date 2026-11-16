import type { GameAction, GameState } from '../../types/game.ts';
import { clampCharge } from './shared.ts';
import { getRunnerModifiers } from '../../utils/runnerModifiers.ts';
import { getBossUltimateChargePerChar, getUltimateChargePerChar } from '../../utils/combatModifiers.ts';
import { GAME_BALANCE } from '../../config/gameBalance.ts';
import { hasSynergy } from '../../utils/synergyEngine.ts';

export function reduceTypingAction(state: GameState, action: GameAction, submit: (state: GameState) => GameState): GameState | null {
  switch (action.type) {
case 'CYCLE_TARGET': {
      if (state.status !== 'playing' || state.words.length < 2) return state;
      const candidates = state.words
        .filter((word) => word.kind !== 'trap' && word.text.startsWith(state.input))
        .sort((a, b) => b.y - a.y || a.id.localeCompare(b.id));
      if (candidates.length < 2) return state;
      const currentIndex = candidates.findIndex((word) => word.id === state.activeTargetWordId);
      const next = candidates[(currentIndex + 1) % candidates.length]!;
      return { ...state, activeTargetWordId: next.id };
    }
case 'TYPE_CHAR': {
      if (state.status !== 'playing' && state.status !== 'boss') return state;
      const char = action.payload.toLowerCase();

      // Desviar proyectil: con el input vacio, teclear su letra lo destruye
      if (state.input === '') {
        const projIndex = state.letterProjectiles.findIndex(
          (p) => p.char === char,
        );
        if (projIndex !== -1) {
          return {
            ...state,
            letterProjectiles: state.letterProjectiles.filter(
              (_, i) => i !== projIndex,
            ),
            deflectedLetters: state.deflectedLetters + 1,
            precisionStreak: state.precisionStreak + 1,
            ultimateCharge: clampCharge(
              state.ultimateCharge +
                GAME_BALANCE.typing.ultimateDeflectBonus *
                  getRunnerModifiers(state.runnerId).ultimateChargeMult,
            ),
          };
        }
      }

      const newInput = state.input + char;
      let targetId = state.activeTargetWordId;
      let target = targetId ? state.words.find((word) => word.id === targetId) : undefined;
      if (state.status === 'boss') {
        target = state.bossWord ?? undefined;
      } else if (!target || !target.text.startsWith(newInput)) {
        target = state.words
          .filter((word) => word.kind !== 'trap' && word.text.startsWith(newInput))
          .sort((a, b) => b.y - a.y || a.id.localeCompare(b.id))[0];
        targetId = target?.id ?? null;
      }
      const matchesSomething = Boolean(target?.text.startsWith(newInput));

      if (matchesSomething) {
        const chargeMult =
          getUltimateChargePerChar(state.activeRelics) *
          getRunnerModifiers(state.runnerId).ultimateChargeMult *
          (hasSynergy(state, 'ritmo_circuito') ? 1.1 : 1);
        const nextState: GameState = {
          ...state,
          input: newInput,
          activeTargetWordId: state.status === 'boss' ? null : targetId,
          correctKeyPresses: state.correctKeyPresses + 1,
          wordStartedAtMs:
            state.input === '' ? state.elapsedMs : state.wordStartedAtMs,
          precisionStreak: state.precisionStreak + 1,
          ultimateCharge: clampCharge(
            state.ultimateCharge +
              (GAME_BALANCE.typing.ultimateChargePerChar +
                getBossUltimateChargePerChar(
                  state.selectedGlossary,
                  state.status,
                  state.activeRelics,
                )) *
                chargeMult,
          ),
          flowStats: {
            ...state.flowStats,
            windowChars: state.flowStats.windowChars + 1,
          },
        };
        if (state.autoSubmit && target && newInput === target.text) {
          return submit(nextState);
        }
        return nextState;
      }

      // Una tecla que no encaja no ensucia el buffer ni castiga la carga: se
      // puede seguir escribiendo inmediatamente o fijar otro prefijo valido.
      if (state.input.length > 0) {
        const alternate = state.words
          .filter((word) => word.kind !== 'trap' && word.text.startsWith(newInput))
          .sort((a, b) => b.y - a.y || a.id.localeCompare(b.id))[0];
        if (alternate) return { ...state, input: newInput, activeTargetWordId: alternate.id };
        return {
          ...state,
          mistakes: state.mistakes + 1,
          mistakesByChar: { ...state.mistakesByChar, [char]: (state.mistakesByChar[char] ?? 0) + 1 },
          flowStats: { ...state.flowStats, windowErrors: state.flowStats.windowErrors + 1 },
        };
      }
      return {
        ...state,
        input: '',
        activeTargetWordId: null,
        precisionStreak: 0,
        mistakes: state.mistakes + 1,
        mistakesByChar: {
          ...state.mistakesByChar,
          [char]: (state.mistakesByChar[char] ?? 0) + 1,
        },
        flowStats: {
          ...state.flowStats,
          windowErrors: state.flowStats.windowErrors + 1,
        },
      };
    }
case 'BACKSPACE':
      if (state.status !== 'playing' && state.status !== 'boss') return state;
      if (!state.input) return state;
      return {
        ...state,
        input: state.input.slice(0, -1),
        activeTargetWordId: state.input.length <= 1 ? null : state.activeTargetWordId,
        precisionStreak: 0,
        ultimateCharge: state.ultimateCharge,
        backspacesUsedThisWord: state.backspacesUsedThisWord + 1,
        mistakes: state.mistakes + 1,
        flowStats: {
          ...state.flowStats,
          windowErrors: state.flowStats.windowErrors + 1,
        },
      };

    default: return null;
  }
}

