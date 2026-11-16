import { type GameAction, type GameState, initialGameState } from '../../types/game.ts';
import { getWeeklyChallengeConfig } from '../../utils/weeklySeed.ts';
import { getDailyChallengeConfig } from '../../utils/dailySeed.ts';
import { getInitialLives, getRunnerModifiers } from '../../utils/runnerModifiers.ts';
import { getAscensionInitialLivesPenalty } from '../../utils/ascensionModifiers.ts';
import { getTrapShieldOnFloorStart } from '../../utils/combatModifiers.ts';

export function reduceSessionAction(state: GameState, action: GameAction): GameState | null {
  switch (action.type) {
case 'BEGIN_RUN': {
      const dailyRun = action.payload?.dailyRun ?? false;
      const weeklyRun = action.payload?.weeklyRun ?? false;
      const ascensionLevel = action.payload?.ascensionLevel ?? 0;
      const unlockedRelics = action.payload?.unlockedRelics ?? initialGameState.unlockedRelics;
      const hubUpgrades = action.payload?.hubUpgrades ?? initialGameState.hubUpgrades;
      if (!dailyRun && !weeklyRun) {
        return {
          ...initialGameState,
          status: 'runnerPick',
          ascensionLevel,
          runSeed: action.payload?.rankedRun?.runSeed ?? action.payload?.runSeed ?? 0,
          rankedRun: action.payload?.rankedRun ?? null,
          unlockedRelics,
          hubUpgrades,
          autoSubmit: action.payload?.autoSubmit ?? initialGameState.autoSubmit,
        };
      }
      const challengeKey = action.payload?.challengeKey;
      if (dailyRun === weeklyRun || !challengeKey || !/^\d{4}-\d{2}-\d{2}$/.test(challengeKey)) return state;
      const weeklyChallenge = weeklyRun ? getWeeklyChallengeConfig(challengeKey) : null;
      const challenge = weeklyChallenge ?? getDailyChallengeConfig(challengeKey);
      const runnerId = challenge.runnerId;
      const lives = getInitialLives(runnerId);
      const trapIgnore = getRunnerModifiers(runnerId).trapIgnoreCharges;
      return {
        ...initialGameState,
        status: 'playing',
        startTime: action.payload?.startedAtMs ?? 0,
        lives,
        runnerId,
        trapIgnoreRemaining: trapIgnore,
        selectedGlossary: challenge.glossaryId,
        runSeed: action.payload?.rankedRun?.runSeed ?? action.payload?.runSeed ?? challenge.seed,
        rankedRun: action.payload?.rankedRun ?? null,
        unlockedRelics,
        hubUpgrades,
        autoSubmit: action.payload?.autoSubmit ?? initialGameState.autoSubmit,
        dailyRun,
        weeklyRun,
        endlessMode: weeklyRun,
        challengeWeek: weeklyChallenge?.week ?? null,
        ascensionLevel: weeklyChallenge?.ascensionLevel ?? 0,
      };
    }
case 'SELECT_RUNNER':
      return {
        ...state,
        runnerId: action.payload,
        status: 'glossaryPick',
      };
case 'BACK_TO_RUNNER_PICK':
      if (state.status !== 'glossaryPick') return state;
      return { ...state, status: 'runnerPick' };
case 'SELECT_GLOSSARY': {
      const runnerId = state.runnerId;
      const ascensionLevel = state.dailyRun ? 0 : state.ascensionLevel;
      const livesPenalty = getAscensionInitialLivesPenalty(ascensionLevel);
      const lives = Math.max(
        1,
        getInitialLives(runnerId) - livesPenalty,
      );
      const trapIgnore =
        getRunnerModifiers(runnerId).trapIgnoreCharges +
        getTrapShieldOnFloorStart([]);
      return {
        ...initialGameState,
        status: 'playing',
        startTime: action.startedAtMs ?? 0,
        lives,
        runnerId,
        trapIgnoreRemaining: trapIgnore,
        selectedGlossary: action.payload,
        dailyRun: state.dailyRun,
        ascensionLevel,
        runSeed: state.runSeed,
        rankedRun: state.rankedRun,
        unlockedRelics: state.unlockedRelics,
        hubUpgrades: state.hubUpgrades,
        autoSubmit: state.autoSubmit,
        wordStartedAtMs: 0,
      };
    }
case 'RETRY':
      return { ...initialGameState, status: 'runnerPick', runSeed: action.payload.runSeed };
case 'GO_HOME':
      return { ...initialGameState };
case 'VICTORY_HOME':
      return { ...initialGameState };
    default: return null;
  }
}
