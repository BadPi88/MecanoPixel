import { type GameAction, type GameState } from '../../types/game.ts';
import { applyPerkSelection, calculatePerkWordScore, consumePerkCharge, hasPerkWithCharge } from '../../utils/perkModifiers.ts';
import { applyPosEffect, clampCharge, clearBossEncounter, randomFor, scaleRunCoins } from './shared.ts';
import { hasSynergy } from '../../utils/synergyEngine.ts';
import { advanceToNextFloor, buildMapPickState } from '../../utils/runTransitions.ts';
import { getRunnerModifiers } from '../../utils/runnerModifiers.ts';
import { applyRelicOnMiss, applyRelicOnSubmit } from '../../utils/combatModifiers.ts';
import { calculateMissPenalty } from '../../utils/scoring.ts';
import { BOSS_CATALOG } from '../../data/bosses.ts';
import { pickPerkChoices } from '../../data/perks.ts';
import { MAX_LIVES } from '../../types/perks.ts';
import { BONUS_WORD_COINS } from '../../data/run.ts';
import { calculateRunCoinsFromScore } from '../../utils/metaCoins.ts';
import { GAME_BALANCE } from '../../config/gameBalance.ts';
import { ULTIMATE_CLEAN_WORD_BONUS } from '../../types/combat.ts';

export function reduceRewardAction(state: GameState, action: GameAction): GameState | null {
  switch (action.type) {
case 'SUBMIT': {
      if ((state.status !== 'playing' && state.status !== 'boss') || !state.input)
        return state;

      const trimmed = state.input.trim().toLowerCase();
      const cleanWord = state.backspacesUsedThisWord === 0;

      if (state.status === 'boss' && state.bossWord) {
        if (trimmed !== state.bossWord.text) {
          const penaltyScore = Math.max(0, state.score - calculateMissPenalty());
          return {
            ...state,
            input: '',
            activeTargetWordId: null,
            combo: 0,
            precisionStreak: 0,
            backspacesUsedThisWord: 0,
            score: penaltyScore,
            scoreEvents: penaltyScore === state.score ? state.scoreEvents : [...state.scoreEvents, penaltyScore - state.score],
            mistakes: state.mistakes + 1,
            flowStats: {
              ...state.flowStats,
              windowErrors: state.flowStats.windowErrors + 2,
            },
          };
        }

        const bossDef = state.bossId ? BOSS_CATALOG[state.bossId] : null;
        const isDual = state.bossWords.length > 1;
        const nextPhase = state.bossPhase + 1;
        const hasMoreWords = isDual && nextPhase < state.bossWords.length;

        if (hasMoreWords) {
          const nextIdx = state.activeBossWordIndex + 1;
          return {
            ...state,
            bossPhase: nextPhase,
            activeBossWordIndex: nextIdx,
            bossWord: state.bossWords[nextIdx] ?? null,
            input: '',
            activeTargetWordId: null,
            backspacesUsedThisWord: 0,
            wordsTyped: state.wordsTyped + 1,
            defeatedAtMs: [...state.defeatedAtMs, state.elapsedMs],
            completedWordLengths: [...state.completedWordLengths, trimmed.length],
            correctChars: state.correctChars + trimmed.length,
            combo: state.combo + 1,
          };
        }

        const rareChoices = pickPerkChoices(
          state.activePerks,
          1,
          state.floor,
          state.ascensionLevel,
          randomFor(state, 0x401),
        );
        const rare = rareChoices[0];
        const perkPartial = rare ? applyPerkSelection(state, rare) : {};
        const runnerMult = getRunnerModifiers(state.runnerId).runCoinsMult;
        const baseCoins = Math.round(100 * runnerMult);
        const bonusCoins = bossDef
          ? Math.round(bossDef.bonusCoins * runnerMult)
          : 0;
        const lifeReward =
          state.lives < MAX_LIVES ? { lives: state.lives + 1 } : {};

        const isVictory =
          bossDef?.id === 'tiranotipo' &&
          state.floor >= 12 &&
          !state.endlessMode &&
          !state.dailyRun;

        if (isVictory) {
          return {
            ...state,
            ...perkPartial,
            ...lifeReward,
            ...clearBossEncounter(),
            runCoins: state.runCoins + baseCoins + bonusCoins,
            perksHistory: rare ? [...state.perksHistory, rare] : state.perksHistory,
            input: '',
            activeTargetWordId: null,
            backspacesUsedThisWord: 0,
            wordsTyped: state.wordsTyped + 1,
            defeatedAtMs: [...state.defeatedAtMs, state.elapsedMs],
            completedWordLengths: [...state.completedWordLengths, trimmed.length],
            correctChars: state.correctChars + trimmed.length,
            status: 'victory',
          };
        }

        const afterBoss: GameState = {
          ...state,
          ...perkPartial,
          ...lifeReward,
          ...clearBossEncounter(),
          runCoins: state.runCoins + baseCoins + bonusCoins,
          perksHistory: rare ? [...state.perksHistory, rare] : state.perksHistory,
          input: '',
          activeTargetWordId: null,
          backspacesUsedThisWord: 0,
          wordsTyped: state.wordsTyped + 1,
          defeatedAtMs: [...state.defeatedAtMs, state.elapsedMs],
          completedWordLengths: [...state.completedWordLengths, trimmed.length],
          correctChars: state.correctChars + trimmed.length,
          ...advanceToNextFloor(state),
        };
        return { ...afterBoss, ...buildMapPickState(afterBoss) };
      }

      const lockedIndex = state.activeTargetWordId
        ? state.words.findIndex((word) => word.id === state.activeTargetWordId && word.text === trimmed)
        : -1;
      const matchIndex = lockedIndex >= 0
        ? lockedIndex
        : state.words.findIndex((w) => w.text === trimmed);

      if (matchIndex === -1) {
        const penaltyScore = Math.max(0, state.score - calculateMissPenalty());
        let activePerks = state.activePerks;
        let combo = 0;
        if (hasPerkWithCharge(activePerks, 'combo_safe')) {
          activePerks = consumePerkCharge(activePerks, 'combo_safe');
          combo = state.combo;
        }

        let next: GameState = {
          ...state,
          input: '',
          activeTargetWordId: null,
          combo,
          activePerks,
          precisionStreak: 0,
          backspacesUsedThisWord: 0,
          score: penaltyScore,
          scoreEvents: penaltyScore === state.score ? state.scoreEvents : [...state.scoreEvents, penaltyScore - state.score],
          flowStats: {
            ...state.flowStats,
            windowErrors: state.flowStats.windowErrors + 2,
          },
        };

        // Tinta Toxica: el fallo explota, limpia pantalla y cuesta 1 vida
        const missResult = applyRelicOnMiss(state);
        if (missResult.purgeAll) {
          const keepCombo = hasSynergy(state, 'tinta_segura');
          const lives = missResult.loseLife ? next.lives - 1 : next.lives;
          next = {
            ...next,
            words: [],
            letterProjectiles: [],
            lives,
            combo: keepCombo ? state.combo : next.combo,
            status: lives <= 0 ? 'gameOver' : next.status,
            deathCause: lives <= 0 ? 'toxic' : next.deathCause,
          };
        }

        return next;
      }

      const matched = state.words[matchIndex];

      if (matched.kind === 'trap') {
        if (state.trapIgnoreRemaining > 0) {
          return {
            ...state,
            input: '',
            activeTargetWordId: null,
            backspacesUsedThisWord: 0,
            trapIgnoreRemaining: state.trapIgnoreRemaining - 1,
            words: state.words.filter((w) => w.id !== matched.id),
          };
        }
        const penaltyScore = Math.max(0, state.score - GAME_BALANCE.typing.trapPenalty);
        return {
          ...state,
          input: '',
          activeTargetWordId: null,
          combo: 0,
          precisionStreak: 0,
          backspacesUsedThisWord: 0,
          score: penaltyScore,
          scoreEvents: penaltyScore === state.score ? state.scoreEvents : [...state.scoreEvents, penaltyScore - state.score],
          words: state.words.filter((w) => w.id !== matched.id),
          activePerks: state.activePerks,
        };
      }

      const groundHeight = state.lastGroundHeight;

      if (matched.kind === 'oracle') {
        return {
          ...state,
          words: state.words.filter((word) => word.id !== matched.id),
          input: '',
          activeTargetWordId: null,
          backspacesUsedThisWord: 0,
          poppingWordId: matched.id,
          status: 'oraclePick',
          oracleRewardWord: matched,
          combo: state.combo + 1,
        };
      }

      if (matched.kind === 'bonus') {
        let coins = Math.round(
          BONUS_WORD_COINS * getRunnerModifiers(state.runnerId).runCoinsMult,
        );
        if (state.activeRelics.includes('moneda_ardiente')) coins += 8;
        if (hasSynergy(state, 'mercader_dorado')) coins *= 2;
        return {
          ...state,
          input: '',
          activeTargetWordId: null,
          backspacesUsedThisWord: 0,
          wordStartedAtMs: state.elapsedMs,
          runCoins: state.runCoins + coins,
          words: state.words.filter((w) => w.id !== matched.id),
          poppingWordId: matched.id,
        };
      }

      const topThird = groundHeight / 3;
      const inTop = matched.y < topThird;
      const snipePerk = hasPerkWithCharge(state.activePerks, 'snipe');
      const useSnipe = Boolean(snipePerk && inTop);
      let activePerks = state.activePerks;
      if (useSnipe) activePerks = consumePerkCharge(activePerks, 'snipe');

      const comboOverride = hasSynergy(state, 'vocal_codificada')
        ? { from: 2, value: 2 }
        : null;

      let points = calculatePerkWordScore(
        matched.text.length,
        state.combo,
        matched.y,
        groundHeight,
        activePerks,
        state.elapsedMs,
        useSnipe,
        state.runnerId,
        comboOverride,
      );
      if (matched.kind === 'bomb') points *= 2;

      // Reliquias y glosario
      const relicResult = applyRelicOnSubmit(
        state,
        matched,
        points,
        hasSynergy(state, 'fuego_electrico'),
        randomFor(state, 0x601),
      );
      let scoreMult = relicResult.scoreMult;
      if (
        hasSynergy(state, 'caos_maldito') &&
        state.activeRelics.includes('dados_caoticos')
      ) {
        scoreMult = Math.max(scoreMult, 1);
      }
      points = Math.round(points * scoreMult) + relicResult.aoeBonus;
      if (hasSynergy(state, 'ritmo_circuito')) points = Math.round(points * 1.12);
      if (hasSynergy(state, 'glosa_pirotecnica') && /[áéíóúü]/i.test(matched.text)) {
        points = Math.round(points * 1.2);
      }
      if (cleanWord) points = Math.round(points * GAME_BALANCE.typing.cleanWordScoreMultiplier);

      let combo = state.combo + 1;
      if (
        state.activeRelics.includes('maldicion_prisa') &&
        state.elapsedMs - state.wordStartedAtMs > 4_000
      ) {
        combo = 0;
      }

      const runCoinGain = calculateRunCoinsFromScore(points);
      const synergyCoinMult = hasSynergy(state, 'mercado_medico') ? 1.25 : 1;
      const runCoins =
        state.runCoins +
        scaleRunCoins(
          Math.round(runCoinGain * getRunnerModifiers(state.runnerId).runCoinsMult * synergyCoinMult),
          state,
        ) +
        relicResult.bonusRunCoins;

      const burnSet = new Set(relicResult.burnWordIds);
      const wordsAfter = state.words.map((w) =>
        burnSet.has(w.id) ? { ...w, burning: true } : w,
      );

      const posPartial = applyPosEffect(
        { ...state, words: wordsAfter },
        matched,
      );

      return {
        ...state,
        words: wordsAfter,
        ...posPartial,
        input: '',
        activeTargetWordId: null,
        combo,
        score: state.score + points,
        scoreEvents: points === 0 ? state.scoreEvents : [...state.scoreEvents, points],
        runCoins,
        correctChars: state.correctChars + matched.text.length,
        wordsTyped: state.wordsTyped + 1,
        defeatedAtMs: [...state.defeatedAtMs, state.elapsedMs],
        completedWordLengths: [...state.completedWordLengths, matched.text.length],
        poppingWordId: matched.id,
        activePerks: posPartial.activePerks ?? activePerks,
        backspacesUsedThisWord: 0,
        wordStartedAtMs: state.elapsedMs,
        chaosRollRemaining: Math.max(0, state.chaosRollRemaining - 1),
        ultimateCharge: clampCharge(
          state.ultimateCharge +
            ((cleanWord ? ULTIMATE_CLEAN_WORD_BONUS : 0) +
              relicResult.extraUltimateCharge) *
              getRunnerModifiers(state.runnerId).ultimateChargeMult,
        ),
      };
    }

    default: return null;
  }
}

