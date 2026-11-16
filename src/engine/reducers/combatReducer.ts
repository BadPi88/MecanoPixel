import { type GameAction, type GameState } from '../../types/game.ts';
import { applyPerkSelection, calculatePerkWordScore, consumePerkCharge, expirePerks, findLowestWord, getEffectiveDifficulty, hasPerkWithCharge } from '../../utils/perkModifiers.ts';
import { tickEliteFog } from '../../utils/eliteModifiers.ts';
import { getBiomeGameplayMod } from '../../utils/biomeModifiers.ts';
import { morphDisplayText } from '../../utils/wordSpawn.ts';
import { applyPosEffect, clampCharge, clearBossEncounter, randomFor, scaleRunCoins } from './shared.ts';
import { hasSynergy } from '../../utils/synergyEngine.ts';
import { advanceToNextFloor, buildMapPickState, getFloorTierOffset } from '../../utils/runTransitions.ts';
import { updateFlowStats } from '../../utils/flowDifficulty.ts';
import { wordsPerSecondFromSpawnInterval } from '../../utils/intensity.ts';
import { MAX_LETTER_PROJECTILES, ULTIMATE_CLEAN_WORD_BONUS, ULTIMATE_MAX_CHARGE } from '../../types/combat.ts';
import { getRunnerModifiers } from '../../utils/runnerModifiers.ts';
import { applyRelicOnMiss, applyRelicOnSubmit, getBackspaceChargePenalty, getBossUltimateChargePerChar, getUltimateChargePerChar } from '../../utils/combatModifiers.ts';
import { calculateMissPenalty } from '../../utils/scoring.ts';
import { BOSS_CATALOG } from '../../data/bosses.ts';
import { pickPerkChoices } from '../../data/perks.ts';
import { MAX_LIVES } from '../../types/perks.ts';
import { BONUS_WORD_COINS } from '../../data/run.ts';
import { calculateRunCoinsFromScore } from '../../utils/metaCoins.ts';
import { GAME_BALANCE } from '../../config/gameBalance.ts';

export function reduceCombatAction(state: GameState, action: GameAction): GameState | null {
  switch (action.type) {
case 'TOGGLE_PAUSE':
      if (state.status === 'playing') return { ...state, status: 'paused' };
      if (state.status === 'paused') return { ...state, status: 'playing' };
      return state;
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
case 'SPAWN_WORD':
      if (state.status !== 'playing') return state;
      return {
        ...state,
        spawnCount: state.spawnCount + 1,
        words: [...state.words, action.payload],
      };
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
      const matchesSomething =
        state.status === 'boss'
          ? state.bossWord?.text.startsWith(newInput) ?? false
          : state.words.some(
              (w) => w.kind !== 'trap' && w.text.startsWith(newInput),
            );

      if (matchesSomething) {
        const chargeMult =
          getUltimateChargePerChar(state.activeRelics) *
          getRunnerModifiers(state.runnerId).ultimateChargeMult;
        return {
          ...state,
          input: newInput,
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
      }

      return {
        ...state,
        input: newInput,
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
        precisionStreak: 0,
        ultimateCharge: clampCharge(
          state.ultimateCharge - getBackspaceChargePenalty(state.activeRelics),
        ),
        backspacesUsedThisWord: state.backspacesUsedThisWord + 1,
        mistakes: state.mistakes + 1,
        flowStats: {
          ...state.flowStats,
          windowErrors: state.flowStats.windowErrors + 1,
        },
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
        const isDual = bossDef?.dualWords && state.bossWords.length > 1;
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
          backspacesUsedThisWord: 0,
          wordsTyped: state.wordsTyped + 1,
          defeatedAtMs: [...state.defeatedAtMs, state.elapsedMs],
          completedWordLengths: [...state.completedWordLengths, trimmed.length],
          correctChars: state.correctChars + trimmed.length,
          ...advanceToNextFloor(state),
        };
        return { ...afterBoss, ...buildMapPickState(afterBoss) };
      }

      const matchIndex = state.words.findIndex((w) => w.text === trimmed);

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
            backspacesUsedThisWord: 0,
            trapIgnoreRemaining: state.trapIgnoreRemaining - 1,
            words: state.words.filter((w) => w.id !== matched.id),
          };
        }
        const penaltyScore = Math.max(0, state.score - GAME_BALANCE.typing.trapPenalty);
        return {
          ...state,
          input: '',
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
      if (cleanWord) points = Math.round(points * GAME_BALANCE.typing.cleanWordScoreMultiplier);

      let combo = state.combo + 1;
      if (
        state.activeRelics.includes('maldicion_prisa') &&
        state.elapsedMs - state.wordStartedAtMs > 4_000
      ) {
        combo = 0;
      }

      const runCoinGain = calculateRunCoinsFromScore(points);
      const runCoins =
        state.runCoins +
        scaleRunCoins(
          Math.round(runCoinGain * getRunnerModifiers(state.runnerId).runCoinsMult),
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
