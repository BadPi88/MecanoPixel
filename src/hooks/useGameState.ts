import { useReducer } from 'react';
import { pickPerkChoices, PERKS_EVERY_N_RAMPS, trimActivePerks } from '../data/perks';
import { pickRandomEvent } from '../data/events';
import { pickRelicChoices } from '../data/relics';
import { getShopItem, pickShopOffers } from '../data/shop';
import { BONUS_WORD_COINS } from '../data/run';
import {
  initialGameState,
  type FallingWord,
  type GameAction,
  type GameState,
  type GameStatus,
} from '../types/game';
import { MAX_LIVES } from '../types/perks';
import type { ShopItemId } from '../types/run';
import {
  MAX_LETTER_PROJECTILES,
  POS_EFFECT_COOLDOWN_MS,
  ULTIMATE_BACKSPACE_PENALTY,
  ULTIMATE_CLEAN_WORD_BONUS,
  ULTIMATE_MAX_CHARGE,
} from '../types/combat';
import { wordsPerSecondFromSpawnInterval } from '../utils/intensity';
import { calculateRunCoinsFromScore } from '../utils/metaCoins';
import {
  advanceToNextFloor,
  buildMapPickState,
  finishRoomToCombat,
  getFloorClearCoins,
  getFloorTierOffset,
  shouldCompleteFloor,
} from '../utils/runTransitions';
import { getInitialLives, getRunnerModifiers } from '../utils/runnerModifiers';
import {
  BOSS_BLIND_DURATION_MS,
  BOSS_BLIND_INTERVAL_MS,
  BOSS_CATALOG,
  BOSS_REMAP_TABLE,
  getBossFallSpeed,
  getBossForFloor,
  initBossAttackFromCatalog,
  initBossWords,
} from '../data/bosses';
import { morphDisplayText } from '../utils/wordSpawn';
import { ELITE_COIN_MULT } from '../data/eliteModifiers';
import { getMiniBoss } from '../data/bosses';
import { FLOORS_PER_BIOME } from '../data/biomes';
import { getAscensionInitialLivesPenalty } from '../utils/ascensionModifiers';
import {
  applyRelicOnMiss,
  applyRelicOnSubmit,
  getBossUltimateChargePerChar,
  getShopPriceMult,
  getTrapShieldOnFloorStart,
  getUltimateChargePerChar,
} from '../utils/combatModifiers';
import { getNodeById } from '../data/mapRooms';
import { hasSynergy } from '../utils/synergyEngine';
import { tickEliteFog } from '../utils/eliteModifiers';
import { getBiomeGameplayMod } from '../utils/biomeModifiers';
import { updateFlowStats } from '../utils/flowDifficulty';
import {
  applyBrokenClockSkip,
  applyPerkSelection,
  calculatePerkWordScore,
  consumePerkCharge,
  expirePerks,
  findLowestWord,
  getEffectiveDifficulty,
  hasPerkWithCharge,
  removePerk,
} from '../utils/perkModifiers';
import { calculateMissPenalty } from '../utils/scoring';
import { getDailyChallengeConfig } from '../utils/dailySeed';
import { createWordId } from './useGameStateHelpers';

export { createWordId } from './useGameStateHelpers';

const GROUND_OFFSET = 48;
const TRAP_PENALTY = 40;
const ULTIMATE_CHARGE_PER_CHAR = 1.5;
const ULTIMATE_DEFLECT_BONUS = 5;
const ULTIMATE_FREEZE_MS = 2_000;
const ADJ_TEMPO_BUFF_MS = 8_000;
const VERB_AOE_FACTOR = 0.7;
const CLEAN_WORD_SCORE_MULT = 1.1;
const PROJECTILE_HEIGHT = 24;
const ORACLE_SCORE_BASE = 50;
const ORACLE_SCORE_PER_CHAR = 10;
const ORACLE_CHARGE_REWARD = 35;

function clampCharge(value: number): number {
  return Math.min(ULTIMATE_MAX_CHARGE, Math.max(0, value));
}

function clearBossEncounter(): Partial<GameState> {
  return {
    bossId: null,
    bossWord: null,
    bossWords: [],
    bossPhase: 0,
    activeBossWordIndex: 0,
    bossAttack: null,
    keyRemap: null,
    inputBlindedUntilMs: 0,
  };
}

/** Partial de estado al entrar en shop/event/boss tras un piso o reliquia. */
function enterBossFight(
  state: GameState,
  boss = getBossForFloor(
    state.floor,
    state.ascensionLevel,
    state.runSeed,
  ),
): Partial<GameState> {
    const tierOffset = getFloorTierOffset(state);
    const bossWords = initBossWords(
      boss,
      state.elapsedMs,
      tierOffset,
      createWordId,
    );
    const bossAttack = initBossAttackFromCatalog(boss, state.elapsedMs);
    return {
      status: 'boss',
      reachedBoss: true,
      bossId: boss.id,
      bossWords,
      bossWord: bossWords[0] ?? null,
      bossPhase: 0,
      activeBossWordIndex: 0,
      bossAttack,
      keyRemap: bossAttack.remap ? { ...BOSS_REMAP_TABLE } : null,
      pendingEvent: null,
      bossSkippedPending: false,
      bossSkipMetaMult: 1,
    };
}

function enterPostFloor(
  state: GameState,
  nextStatus: GameStatus,
): Partial<GameState> {
  if (nextStatus === 'boss') {
    return enterBossFight(state);
  }
  if (nextStatus === 'event') {
    return { status: 'event', pendingEvent: pickRandomEvent(state) };
  }
  if (nextStatus === 'shop') {
    return {
      status: 'shop',
      pendingEvent: null,
      shopOffers: pickShopOffers(state.floor, state.runCoins + state.score),
    };
  }
  return { status: nextStatus, pendingEvent: null, shopOffers: [] };
}

/** Completa el piso actual: monedas, limpieza y pantalla de mapa. */
function completeFloor(state: GameState): GameState {
  const coins = scaleRunCoins(getFloorClearCoins(state), state);
  let lives = state.lives;
  let floorsSinceBloodContract = state.floorsSinceBloodContract + 1;

  if (
    state.activeRelics.includes('contrato_sangriento') &&
    floorsSinceBloodContract >= 3
  ) {
    floorsSinceBloodContract = 0;
    if (lives > 1) lives -= 1;
  }

  const base: GameState = {
    ...state,
    lives,
    floorsSinceBloodContract,
    runCoins: state.runCoins + coins,
    nextFloorCoinMult: 1,
    words: [],
    letterProjectiles: [],
    input: '',
    rampsThisFloor: 0,
    showSpeedNotice: false,
    backspacesUsedThisWord: 0,
  };

  if (base.pendingMiniBoss) {
    return {
      ...base,
      pendingMiniBoss: false,
      ...enterBossFight(base, getMiniBoss()),
    };
  }

  return { ...base, ...buildMapPickState(base) };
}

function applyRoomFromMap(state: GameState, roomId: string): GameState {
  const room = state.mapRoomOptions.find((option) => option.id === roomId);
  if (!room) return state;

  const cleared: Partial<GameState> = {
    mapRoomOptions: [],
    actMapNodeId: room.nodeId,
  };

  const isActEnd = state.floor % FLOORS_PER_BIOME === 0;
  const skippedBoss =
    isActEnd && room.type !== 'boss' && !state.bossSkippedPending;

  const skipPenalty: Partial<GameState> = skippedBoss
    ? {
        bossSkippedPending: true,
        bossSkipMetaMult: 0.7,
        difficultyTierOffset: state.difficultyTierOffset + 1,
      }
    : room.type === 'boss'
      ? { bossSkippedPending: false, bossSkipMetaMult: 1 }
      : {};

  switch (room.type) {
    case 'shop':
      return {
        ...state,
        ...cleared,
        ...skipPenalty,
        status: 'shop',
        pendingEvent: null,
        shopOffers: pickShopOffers(state.floor, state.runSeed + state.floor),
      };
    case 'event':
      return {
        ...state,
        ...cleared,
        ...skipPenalty,
        status: 'event',
        pendingEvent: pickRandomEvent(state),
      };
    case 'treasure': {
      const choices = pickRelicChoices(
        state.activeRelics,
        3,
        state.relicRerollPending,
      );
      if (choices.length === 0) {
        return {
          ...state,
          ...cleared,
          ...skipPenalty,
          ...finishRoomToCombat(state, applyNextFloorStartModifiers(state)),
          runCoins: state.runCoins + 25,
        };
      }
      return {
        ...state,
        ...cleared,
        ...skipPenalty,
        status: 'relicPick',
        pendingRelicChoice: choices,
        postRelicStatus: null,
        postRelicAdvance: true,
        relicRerollPending: false,
      };
    }
    case 'rest': {
      const healed =
        state.lives < MAX_LIVES ? { lives: state.lives + 1 } : {};
      return {
        ...state,
        ...cleared,
        ...skipPenalty,
        ...healed,
        ...finishRoomToCombat(state, applyNextFloorStartModifiers(state)),
      };
    }
    case 'elite': {
      const node = state.actMap
        ? getNodeById(state.actMap, room.nodeId)
        : undefined;
      return {
        ...state,
        ...cleared,
        ...skipPenalty,
        eliteTierBonus: 1,
        eliteModifierId: node?.eliteModifier ?? room.eliteModifier ?? 'fog',
        eliteCoinMult: ELITE_COIN_MULT,
        ...finishRoomToCombat(state, applyNextFloorStartModifiers(state)),
      };
    }
    case 'boss':
      return {
        ...state,
        ...cleared,
        ...skipPenalty,
        ...enterPostFloor(state, 'boss'),
      };
    default:
      return state;
  }
}

function applyNextFloorStartModifiers(state: GameState): Partial<GameState> {
  const partial: Partial<GameState> = {
    nextFloorCoinMult: 1,
    shopOffers: [],
    trapIgnoreRemaining:
      state.trapIgnoreRemaining +
      getTrapShieldOnFloorStart(state.activeRelics),
    wordStartedAtMs: state.elapsedMs,
  };
  if (state.freezeNextFloorMs > 0) {
    partial.frozenUntilMs = state.elapsedMs + state.freezeNextFloorMs;
    partial.freezeNextFloorMs = 0;
  }
  return partial;
}

function scaleRunCoins(amount: number, state: GameState): number {
  return Math.round(amount * state.nextFloorCoinMult);
}

function applyShopItem(state: GameState, itemId: ShopItemId): GameState | null {
  const item = getShopItem(itemId);
  if (!item) return null;
  const price = Math.round(item.price * getShopPriceMult(state.activeRelics));
  if (state.runCoins < price) return null;
  if (!state.shopOffers.includes(itemId)) return null;

  let next: GameState = {
    ...state,
    runCoins: state.runCoins - price,
  };

  switch (itemId) {
    case 'heal':
      if (next.lives >= MAX_LIVES) return null;
      next.lives += 1;
      break;
    case 'random_perk': {
      const choices = pickPerkChoices(
        next.activePerks,
        1,
        next.floor,
        next.ascensionLevel,
      );
      if (choices.length === 0) return null;
      const perkPartial = applyPerkSelection(next, choices[0]);
      next = { ...next, ...perkPartial, perksHistory: [...next.perksHistory, choices[0]] };
      break;
    }
    case 'purge_all':
      next.words = [];
      break;
    case 'double_buff':
      next.activePerks = trimActivePerks([
        ...next.activePerks.filter((p) => p.id !== 'double_score'),
        { id: 'double_score', expiresAtMs: next.elapsedMs + 20_000 },
      ]);
      break;
    case 'reroll_relic':
      next.relicRerollPending = true;
      break;
    case 'run_shield':
      next.trapIgnoreRemaining += 3;
      break;
    case 'freeze_floor':
      next.freezeNextFloorMs = 3_000;
      break;
    case 'coin_boost':
      next.nextFloorCoinMult = 1.5;
      break;
    case 'tier_calm':
      next.difficultyTierOffset = Math.max(0, next.difficultyTierOffset - 1);
      break;
    case 'speed_trade':
      next.runCoins += 80;
      next.difficultyTierOffset += 1;
      break;
    default:
      return null;
  }

  return next;
}

function applyEventChoice(state: GameState, choice: 'A' | 'B'): GameState {
  const event = state.pendingEvent ?? pickRandomEvent(state);
  const effect = choice === 'A' ? event.effectA : event.effectB;
  let next: GameState = { ...state };

  switch (effect) {
    case 'speed_ramp':
      next.difficultyTierOffset = Math.max(0, next.difficultyTierOffset - 1);
      break;
    case 'coins_150':
      next.runCoins += 150;
      break;
    case 'coins_120':
      next.runCoins += 120;
      break;
    case 'coins_100':
      next.runCoins += 100;
      break;
    case 'coins_80':
      next.runCoins += 80;
      break;
    case 'coins_60':
      next.runCoins += 60;
      break;
    case 'coins_50':
      next.runCoins += 50;
      break;
    case 'coins_200':
      next.runCoins += 200;
      break;
    case 'coins_200_lose_life':
      next.runCoins += 200;
      if (next.lives > 1) {
        next.lives -= 1;
      }
      break;
    case 'tier_up':
      next.difficultyTierOffset += 1;
      break;
    case 'tier_up_coins_100':
      next.difficultyTierOffset += 1;
      next.runCoins += 100;
      break;
    case 'tier_down':
      next.difficultyTierOffset = Math.max(0, next.difficultyTierOffset - 1);
      break;
    case 'heal_one':
      if (next.lives < MAX_LIVES) next.lives += 1;
      break;
    case 'trap_shield_3':
      next.trapIgnoreRemaining += 3;
      break;
    case 'curse_perk': {
      const cursed = applyPerkSelection(next, 'broken_clock');
      next = {
        ...next,
        ...cursed,
        perksHistory: [...next.perksHistory, 'broken_clock'],
      };
      break;
    }
    case 'combo_buff':
      next.activePerks = trimActivePerks([
        ...next.activePerks.filter((p) => p.id !== 'golden_streak'),
        { id: 'golden_streak' },
      ]);
      break;
    case 'lose_coins_half':
      next.runCoins = Math.floor(next.runCoins / 2);
      break;
    case 'lose_life':
      if (next.lives > 1) next.lives -= 1;
      break;
    case 'lose_life_rare_perk': {
      if (next.lives > 1) {
        next.lives -= 1;
        const rare = pickPerkChoices(
          next.activePerks,
          1,
          next.floor,
          next.ascensionLevel,
        );
        if (rare[0]) {
          const p = applyPerkSelection(next, rare[0]);
          next = { ...next, ...p, perksHistory: [...next.perksHistory, rare[0]] };
        }
        if (next.lives <= 0) {
          next.status = 'gameOver';
          next.deathCause = 'event';
        }
      }
      break;
    }
    case 'no_traps_next':
      next.noTrapsNextFloor = true;
      break;
    case 'nothing':
    default:
      break;
  }

  if (next.status === 'gameOver') {
    return { ...next, pendingEvent: null };
  }

  return {
    ...next,
    ...finishRoomToCombat(next, applyNextFloorStartModifiers(next)),
    noTrapsNextFloor: effect === 'no_traps_next' ? true : next.noTrapsNextFloor,
    pendingEvent: null,
  };
}

/** Efecto de combate segun la categoria gramatical de la palabra escrita. */
function applyPosEffect(state: GameState, word: FallingWord): Partial<GameState> {
  if (!word.pos) return {};
  if (state.elapsedMs - state.lastPosEffectAtMs < POS_EFFECT_COOLDOWN_MS) {
    return {};
  }

  switch (word.pos) {
    case 'verb':
      return {
        lastPosEffectAtMs: state.elapsedMs,
        words: state.words.map((w) =>
          w.id === word.id ? w : { ...w, y: w.y * VERB_AOE_FACTOR },
        ),
      };
    case 'adj':
      return {
        lastPosEffectAtMs: state.elapsedMs,
        tempoBuffUntilMs: state.elapsedMs + ADJ_TEMPO_BUFF_MS,
      };
    case 'noun': {
      const shield = state.activePerks.find((p) => p.id === 'shield');
      const activePerks = shield
        ? state.activePerks.map((p) =>
            p.id === 'shield'
              ? { ...p, charges: Math.min((p.charges ?? 0) + 1, 2) }
              : p,
          )
        : trimActivePerks([...state.activePerks, { id: 'shield' as const, charges: 1 }]);
      return {
        lastPosEffectAtMs: state.elapsedMs,
        activePerks,
      };
    }
    default:
      return {};
  }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'BEGIN_RUN': {
      const dailyRun = action.payload?.dailyRun ?? false;
      const ascensionLevel = action.payload?.ascensionLevel ?? 0;
      if (!dailyRun) {
        return {
          ...initialGameState,
          status: 'runnerPick',
          ascensionLevel,
        };
      }
      const challenge = getDailyChallengeConfig();
      const runnerId = challenge.runnerId;
      const lives = getInitialLives(runnerId);
      const trapIgnore = getRunnerModifiers(runnerId).trapIgnoreCharges;
      return {
        ...initialGameState,
        status: 'playing',
        startTime: Date.now(),
        lives,
        runnerId,
        trapIgnoreRemaining: trapIgnore,
        selectedGlossary: challenge.glossaryId,
        dailyRun: true,
      };
    }

    case 'SELECT_RUNNER':
      return {
        ...state,
        runnerId: action.payload,
        status: 'glossaryPick',
      };

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
        startTime: Date.now(),
        lives,
        runnerId,
        trapIgnoreRemaining: trapIgnore,
        selectedGlossary: action.payload,
        dailyRun: state.dailyRun,
        ascensionLevel,
        runSeed: (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0,
        wordStartedAtMs: 0,
      };
    }

    case 'RETRY':
      return { ...initialGameState, status: 'runnerPick' };

    case 'GO_HOME':
      return { ...initialGameState };

    case 'TOGGLE_PAUSE':
      if (state.status === 'playing') return { ...state, status: 'paused' };
      if (state.status === 'paused') return { ...state, status: 'playing' };
      return state;

    case 'TICK': {
      if (state.status !== 'playing') return state;

      const { deltaMs, fallSpeed, groundHeight } = action.payload;
      const deltaSec = deltaMs / 1000;
      const newElapsed = state.elapsedMs + deltaMs;
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
        } else if (!keyRemap && newElapsed >= state.fabricaRemapNextAtMs) {
          keyRemap = { a: 's', s: 'a' };
          fabricaRemapNextAtMs = newElapsed + 5_000;
        } else if (keyRemap && newElapsed >= state.fabricaRemapNextAtMs) {
          keyRemap = null;
          fabricaRemapNextAtMs = newElapsed + 20_000;
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
          next = {
            ...next,
            displayText: morphDisplayText(next.text),
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
        if (newY >= groundHeight - PROJECTILE_HEIGHT) {
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
      );

      return {
        ...state,
        elapsedMs: newElapsed,
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

    case 'BOSS_TICK': {
      if (state.status !== 'boss' || state.bossWords.length === 0) return state;
      const deltaSec = action.payload.deltaMs / 1000;
      const fallSpeed = getBossFallSpeed(state.bossId);
      const bossWords = state.bossWords.map((w) => ({
        ...w,
        y: w.y + fallSpeed * deltaSec,
      }));
      const activeIdx = state.activeBossWordIndex;
      const bossWord = bossWords[activeIdx] ?? bossWords[0] ?? null;
      const newElapsed = state.elapsedMs + action.payload.deltaMs;

      let inputBlindedUntilMs = state.inputBlindedUntilMs;
      let bossAttack = state.bossAttack;
      let keyRemap = state.keyRemap;

      if (bossAttack) {
        if (bossAttack.blind && newElapsed >= bossAttack.nextBlindAtMs) {
          inputBlindedUntilMs = newElapsed + BOSS_BLIND_DURATION_MS;
          bossAttack = {
            ...bossAttack,
            nextBlindAtMs: bossAttack.nextBlindAtMs + BOSS_BLIND_INTERVAL_MS,
          };
        }
        if (keyRemap && newElapsed >= bossAttack.remapUntilMs) {
          keyRemap = null;
        }
      }

      // Proyectiles tambien caen durante el jefe (pisos 9+)
      const deltaSecProj = deltaSec;
      let lives = state.lives;
      const surviving: typeof state.letterProjectiles = [];
      for (const proj of state.letterProjectiles) {
        const newY = proj.y + proj.vy * deltaSecProj;
        if (newY >= 600 - PROJECTILE_HEIGHT) {
          lives -= 1;
        } else {
          surviving.push({ ...proj, y: newY });
        }
      }

      if (lives <= 0) {
        return {
          ...state,
          lives: 0,
          status: 'gameOver',
          deathCause: 'projectile',
          ...clearBossEncounter(),
          letterProjectiles: [],
        };
      }

      return {
        ...state,
        bossWords,
        bossWord,
        elapsedMs: newElapsed,
        inputBlindedUntilMs,
        bossAttack,
        keyRemap,
        lives,
        letterProjectiles: surviving,
      };
    }

    case 'SPAWN_WORD':
      if (state.status !== 'playing') return state;
      return { ...state, words: [...state.words, action.payload] };

    case 'SPAWN_PROJECTILE': {
      const inBossWithProjectiles =
        state.status === 'boss' && state.bossAttack?.projectiles;
      if (state.status !== 'playing' && !inBossWithProjectiles) return state;
      if (state.letterProjectiles.length >= MAX_LETTER_PROJECTILES) return state;
      return {
        ...state,
        letterProjectiles: [...state.letterProjectiles, action.payload],
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
                ULTIMATE_DEFLECT_BONUS *
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
          wordStartedAtMs:
            state.input === '' ? state.elapsedMs : state.wordStartedAtMs,
          precisionStreak: state.precisionStreak + 1,
          ultimateCharge: clampCharge(
            state.ultimateCharge +
              (ULTIMATE_CHARGE_PER_CHAR +
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
          state.ultimateCharge - ULTIMATE_BACKSPACE_PENALTY,
        ),
        backspacesUsedThisWord: state.backspacesUsedThisWord + 1,
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
          state.elapsedMs + ULTIMATE_FREEZE_MS,
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
          return {
            ...state,
            input: '',
            combo: 0,
            precisionStreak: 0,
            backspacesUsedThisWord: 0,
            score: Math.max(0, state.score - calculateMissPenalty()),
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
            correctChars: state.correctChars + trimmed.length,
            combo: state.combo + 1,
          };
        }

        const rareChoices = pickPerkChoices(
          state.activePerks,
          1,
          state.floor,
          state.ascensionLevel,
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
          correctChars: state.correctChars + trimmed.length,
          ...advanceToNextFloor(state),
        };
        return { ...afterBoss, ...buildMapPickState(afterBoss) };
      }

      const matchIndex = state.words.findIndex((w) => w.text === trimmed);

      if (matchIndex === -1) {
        let activePerks = state.activePerks;
        let combo = 0;
        if (hasPerkWithCharge(activePerks, 'combo_safe')) {
          activePerks = consumePerkCharge(activePerks, 'combo_safe');
          combo = state.combo;
        } else {
          activePerks = removePerk(activePerks, 'golden_streak');
        }

        let next: GameState = {
          ...state,
          input: '',
          combo,
          activePerks,
          precisionStreak: 0,
          backspacesUsedThisWord: 0,
          score: Math.max(0, state.score - calculateMissPenalty()),
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
        return {
          ...state,
          input: '',
          combo: 0,
          precisionStreak: 0,
          backspacesUsedThisWord: 0,
          score: Math.max(0, state.score - TRAP_PENALTY),
          words: state.words.filter((w) => w.id !== matched.id),
          activePerks: removePerk(state.activePerks, 'golden_streak'),
        };
      }

      const groundHeight =
        typeof window !== 'undefined' ? window.innerHeight - GROUND_OFFSET : 600;

      if (matched.kind === 'oracle') {
        return {
          ...state,
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
      );
      let scoreMult = relicResult.scoreMult;
      if (
        hasSynergy(state, 'caos_maldito') &&
        state.activeRelics.includes('dados_caoticos')
      ) {
        scoreMult = Math.max(scoreMult, 1);
      }
      points = Math.round(points * scoreMult) + relicResult.aoeBonus;
      if (cleanWord) points = Math.round(points * CLEAN_WORD_SCORE_MULT);

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
        runCoins,
        correctChars: state.correctChars + matched.text.length,
        wordsTyped: state.wordsTyped + 1,
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
      activePerks = removePerk(activePerks, 'golden_streak');

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

    case 'SPEED_RAMP': {
      const effective = getEffectiveDifficulty(
        state.elapsedMs,
        getFloorTierOffset(state),
        state.activePerks,
        state.frozenUntilMs,
        state.runnerId,
      );
      const rampsThisFloor = state.rampsThisFloor + 1;
      const rampCount = state.rampCount + 1;
      const offerPerk = rampCount >= PERKS_EVERY_N_RAMPS;

      const next: GameState = {
        ...state,
        maxWordsPerSecond: Math.max(
          state.maxWordsPerSecond,
          wordsPerSecondFromSpawnInterval(effective.spawnInterval),
        ),
        showSpeedNotice: true,
        rampBlockedNotice: false,
        rampsThisFloor,
        rampCount: offerPerk ? 0 : rampCount,
        status: offerPerk ? 'perkPick' : 'playing',
        pendingPerkChoice: offerPerk
          ? pickPerkChoices(
              state.activePerks,
              3,
              state.floor,
              state.ascensionLevel,
            )
          : null,
      };

      if (!offerPerk && shouldCompleteFloor(next)) {
        return completeFloor(next);
      }

      return next;
    }

    case 'BROKEN_CLOCK_SKIP':
      return { ...state, ...applyBrokenClockSkip(state) };

    case 'SELECT_PERK': {
      const partial = applyPerkSelection(state, action.payload);
      const next: GameState = {
        ...state,
        ...partial,
        perksHistory: [...state.perksHistory, action.payload],
        status: 'playing',
        pendingPerkChoice: null,
      };
      if (shouldCompleteFloor(next)) {
        return completeFloor(next);
      }
      return next;
    }

    case 'SELECT_RELIC': {
      if (state.status !== 'relicPick') return state;
      const relicId = action.payload;
      const nextStatus = state.postRelicStatus ?? 'playing';
      const withRelic: GameState = {
        ...state,
        activeRelics: state.activeRelics.includes(relicId)
          ? state.activeRelics
          : [...state.activeRelics, relicId],
        relicsHistory: [...state.relicsHistory, relicId],
        pendingRelicChoice: null,
        postRelicStatus: null,
        postRelicAdvance: false,
      };
      if (state.postRelicAdvance) {
        return {
          ...withRelic,
          ...finishRoomToCombat(withRelic, applyNextFloorStartModifiers(state)),
        };
      }
      return { ...withRelic, ...enterPostFloor(withRelic, nextStatus) };
    }

    case 'BOSS_FAIL':
      return {
        ...state,
        status: 'gameOver',
        deathCause: 'boss',
        ...clearBossEncounter(),
        input: '',
      };

    case 'SHOP_BUY': {
      const result = applyShopItem(state, action.payload);
      if (!result) return state;
      return result;
    }

    case 'SHOP_LEAVE':
      return {
        ...state,
        ...finishRoomToCombat(state, applyNextFloorStartModifiers(state)),
      };

    case 'PICK_ROOM':
      if (state.status !== 'mapPick') return state;
      return applyRoomFromMap(state, action.payload);

    case 'EVENT_CHOICE':
      return applyEventChoice(state, action.payload);

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

    case 'TOGGLE_BUILD_OVERLAY':
      return { ...state, showBuildOverlay: !state.showBuildOverlay };

    case 'CONTINUE_ENDLESS': {
      if (state.status !== 'victory') return state;
      const continued: GameState = {
        ...state,
        endlessMode: true,
        status: 'mapPick',
        ...buildMapPickState({ ...state, endlessMode: true, floor: state.floor }),
      };
      return continued;
    }

    case 'VICTORY_HOME':
      return { ...initialGameState };

    case 'ORACLE_CHOICE': {
      if (state.status !== 'oraclePick' || !state.oracleRewardWord) return state;
      const word = state.oracleRewardWord;
      const scoreBonus =
        ORACLE_SCORE_BASE + word.text.length * ORACLE_SCORE_PER_CHAR;
      const shared: Partial<GameState> = {
        status: 'playing',
        oracleRewardWord: null,
        poppingWordId: null,
        words: state.words.filter((w) => w.id !== word.id),
        wordsTyped: state.wordsTyped + 1,
        correctChars: state.correctChars + word.text.length,
        input: '',
        backspacesUsedThisWord: 0,
      };
      if (action.payload === 'score') {
        return { ...state, ...shared, score: state.score + scoreBonus };
      }
      return {
        ...state,
        ...shared,
        ultimateCharge: clampCharge(
          state.ultimateCharge + ORACLE_CHARGE_REWARD,
        ),
      };
    }

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  return { state, dispatch };
}

export function findPartialMatch(
  words: FallingWord[],
  input: string,
): FallingWord | null {
  if (!input) return null;
  const lower = input.toLowerCase();
  return words.find(
    (w) => w.kind !== 'trap' && w.text.startsWith(lower),
  ) ?? null;
}
