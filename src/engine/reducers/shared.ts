import { pickPerkChoices, trimActivePerks } from '../../data/perks.ts';
import { pickRandomEvent } from '../../data/events.ts';
import { pickRelicChoices } from '../../data/relics.ts';
import { getShopItem, pickShopOffers } from '../../data/shop.ts';
import {
  type FallingWord,
  type GameAction,
  type GameState,
  type GameStatus,
} from '../../types/game.ts';
import { MAX_LIVES } from '../../types/perks.ts';
import type { ShopItemId } from '../../types/run.ts';
import {
  POS_EFFECT_COOLDOWN_MS,
  ULTIMATE_MAX_CHARGE,
} from '../../types/combat.ts';
import {
  buildMapPickState,
  finishRoomToCombat,
  getFloorClearCoins,
  getFloorTierOffset,
} from '../../utils/runTransitions.ts';
import {
  BOSS_CATALOG,
  BOSS_REMAP_TABLE,
  getBossForFloor,
  initBossAttackFromCatalog,
  initBossWords,
} from '../../data/bosses.ts';
import { ELITE_COIN_MULT } from '../../data/eliteModifiers.ts';
import { getMiniBoss } from '../../data/bosses.ts';
import { FLOORS_PER_BIOME } from '../../data/biomes.ts';
import {
  getShopPriceMult,
  getTrapShieldOnFloorStart,
} from '../../utils/combatModifiers.ts';
import { getNodeById } from '../../data/mapRooms.ts';
import {
  applyPerkSelection,
} from '../../utils/perkModifiers.ts';
import { createWordId } from '../gameIds.ts';
import { createSeededRandom } from './rng.ts';
import { GAME_BALANCE } from '../../config/gameBalance.ts';



export { createWordId } from '../gameIds.ts';

export function randomFor(state: GameState, channel: number): () => number {
  return createSeededRandom(
    (state.runSeed ^ Math.imul(state.floor + 1, 0x9e3779b9) ^ Math.imul(state.wordsTyped + 1, 0x85ebca6b) ^ channel) >>> 0,
  );
}

export function clampCharge(value: number): number {
  return Math.min(ULTIMATE_MAX_CHARGE, Math.max(0, value));
}

export function clearBossEncounter(): Partial<GameState> {
  return {
    bossId: null,
    bossWord: null,
    bossWords: [],
    bossPhase: 0,
    activeBossWordIndex: 0,
    bossAttack: null,
    bossTelegraphX: null,
    bossTelegraphUntilMs: 0,
    keyRemap: null,
    inputBlindedUntilMs: 0,
  };
}

/** Partial de estado al entrar en shop/event/boss tras un piso o reliquia. */
function enterBossFight(
  state: GameState,
  boss = state.endlessMode && state.floor === 15
    ? BOSS_CATALOG.indexadora
    : getBossForFloor(state.floor, state.ascensionLevel, state.runSeed),
): Partial<GameState> {
    const tierOffset = getFloorTierOffset(state);
    const bossWords = initBossWords(
      boss,
      state.difficultyElapsedMs,
      tierOffset,
      createWordId,
      state.floor,
      randomFor(state, 0x501),
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
      bossTelegraphX: null,
      bossTelegraphUntilMs: 0,
      keyRemap: bossAttack.remap ? { ...BOSS_REMAP_TABLE } : null,
      pendingEvent: null,
      bossSkippedPending: false,
      bossSkipMetaMult: 1,
    };
}

export function enterPostFloor(
  state: GameState,
  nextStatus: GameStatus,
): Partial<GameState> {
  if (nextStatus === 'boss') {
    return enterBossFight(state);
  }
  if (nextStatus === 'event') {
    return { status: 'event', pendingEvent: pickRandomEvent(state, randomFor(state, 0x101)) };
  }
  if (nextStatus === 'shop') {
    return {
      status: 'shop',
      pendingEvent: null,
      shopOffers: pickShopOffers(state.floor, state.runSeed ^ state.floor),
    };
  }
  return { status: nextStatus, pendingEvent: null, shopOffers: [] };
}

/** Completa el piso actual: monedas, limpieza y pantalla de mapa. */
export function completeFloor(state: GameState): GameState {
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

export function applyRoomFromMap(state: GameState, roomId: string): GameState {
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
        pendingEvent: pickRandomEvent(state, randomFor(state, 0x102)),
      };
    case 'treasure': {
      const choices = pickRelicChoices(
        state.activeRelics,
        3,
        state.relicRerollPending,
        randomFor(state, 0x201),
        state.unlockedRelics,
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

export function applyNextFloorStartModifiers(state: GameState): Partial<GameState> {
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

export function scaleRunCoins(amount: number, state: GameState): number {
  return Math.round(amount * state.nextFloorCoinMult);
}

export function applyShopItem(state: GameState, itemId: ShopItemId): GameState | null {
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
        randomFor(next, 0x301),
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

export function applyEventChoice(state: GameState, choice: 'A' | 'B'): GameState {
  const event = state.pendingEvent ?? pickRandomEvent(state, randomFor(state, 0x103));
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
          randomFor(next, 0x302),
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
export function applyPosEffect(state: GameState, word: FallingWord): Partial<GameState> {
  if (!word.pos) return {};
  if (state.elapsedMs - state.lastPosEffectAtMs < POS_EFFECT_COOLDOWN_MS) {
    return {};
  }

  switch (word.pos) {
    case 'verb':
      return {
        lastPosEffectAtMs: state.elapsedMs,
        words: state.words.map((w) =>
          w.id === word.id ? w : { ...w, y: w.y * GAME_BALANCE.typing.verbAoeFactor },
        ),
      };
    case 'adj':
      return {
        lastPosEffectAtMs: state.elapsedMs,
        tempoBuffUntilMs: state.elapsedMs + GAME_BALANCE.typing.adjacentTempoBuffMs,
      };
    case 'noun': {
      const shield = state.activePerks.find((p) => p.id === 'shield');
      const activePerks = shield
        ? state.activePerks.map((p) =>
            p.id === 'shield'
              ? { ...p, charges: Math.min((p.charges ?? 0) + 1, GAME_BALANCE.shieldChargeHardCap) }
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

