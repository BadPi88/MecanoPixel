import { type GameAction, type GameState } from '../../types/game.ts';
import { reduceTypingAction } from './typingReducer.ts';
import { reducePhysicsAction } from './physicsReducer.ts';
import { reduceRewardAction } from './rewardReducer.ts';
import { clampCharge } from './shared.ts';
import { ULTIMATE_MAX_CHARGE } from '../../types/combat.ts';
import { GAME_BALANCE } from '../../config/gameBalance.ts';

export function reduceCombatAction(state: GameState, action: GameAction): GameState | null {
  const typingResult = reduceTypingAction(state, action, (nextState) => reduceCombatAction(nextState, { type: 'SUBMIT' }) ?? nextState);
  if (typingResult !== null) return typingResult;
  const physicsResult = reducePhysicsAction(state, action);
  if (physicsResult !== null) return physicsResult;
  const rewardResult = reduceRewardAction(state, action);
  if (rewardResult !== null) return rewardResult;
  switch (action.type) {
case 'TOGGLE_PAUSE':
      if (state.status === 'playing') return { ...state, status: 'paused' };
      if (state.status === 'paused') return { ...state, status: 'playing' };
      return state;
case 'SPAWN_WORD':
      if (state.status !== 'playing') return state;
      return {
        ...state,
        spawnCount: state.spawnCount + 1,
        words: [...state.words, action.payload],
      };
case 'ULTIMATE_FIRE': {
      if (state.status !== 'playing') return state;
      if (state.ultimateCharge < ULTIMATE_MAX_CHARGE) return state;

      const sorted = [...state.words].sort((a, b) => b.y - a.y);
      const removeCount = Math.ceil(sorted.length / 2);
      const removeIds = new Set(sorted.slice(0, removeCount).map((w) => w.id));

      return {
        ...state,
        words: state.words.filter((w) => !removeIds.has(w.id)),
        letterProjectiles: [],
        frozenUntilMs: Math.max(
          state.frozenUntilMs,
          state.elapsedMs + GAME_BALANCE.typing.ultimateFreezeMs,
        ),
        ultimateCharge: 0,
        ultimatesUsed: state.ultimatesUsed + 1,
      };
    }
case 'HIDE_SPEED_NOTICE':
      return { ...state, showSpeedNotice: false, rampBlockedNotice: false };
case 'CLEAR_POP':
      if (!state.poppingWordId) return state;
      if (state.status === 'oraclePick') {
        return { ...state, poppingWordId: null };
      }
      return {
        ...state,
        poppingWordId: null,
        words: state.words.filter((w) => w.id !== state.poppingWordId),
      };
case 'ORACLE_CHOICE': {
      if (state.status !== 'oraclePick' || !state.oracleRewardWord) return state;
      const word = state.oracleRewardWord;
      const scoreBonus =
        GAME_BALANCE.typing.oracleScoreBase + word.text.length * GAME_BALANCE.typing.oracleScorePerChar;
      const shared: Partial<GameState> = {
        status: 'playing',
        oracleRewardWord: null,
        poppingWordId: null,
        words: state.words.filter((w) => w.id !== word.id),
        wordsTyped: state.wordsTyped + 1,
        defeatedAtMs: [...state.defeatedAtMs, state.elapsedMs],
        completedWordLengths: [...state.completedWordLengths, word.text.length],
        correctChars: state.correctChars + word.text.length,
        input: '',
        activeTargetWordId: null,
        backspacesUsedThisWord: 0,
      };
      if (action.payload === 'score') {
        return {
          ...state,
          ...shared,
          score: state.score + scoreBonus,
          scoreEvents: [...state.scoreEvents, scoreBonus],
        };
      }
      return {
        ...state,
        ...shared,
        ultimateCharge: clampCharge(
          state.ultimateCharge + GAME_BALANCE.typing.oracleChargeReward,
        ),
      };
    }
    default: return null;
  }
}




