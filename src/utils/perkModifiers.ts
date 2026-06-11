import type { ActivePerk, PerkId } from '../types/perks';
import { MAX_LIVES } from '../types/perks';
import { PERK_CATALOG, trimActivePerks } from '../data/perks';
import type { FallingWord, GameState } from '../types/game';
import { getDifficultyTier } from './difficulty';
import { calculateWordScore } from './scoring';
import { getRunnerModifiers } from './runnerModifiers';
import type { RunnerId } from '../types/run';

export interface PerkModifiers {
  fallSpeedMult: number;
  spawnIntervalMult: number;
  scoreMult: number;
  snipeActive: boolean;
  radarActive: boolean;
  frozen: boolean;
}

export function getModifiers(
  activePerks: ActivePerk[],
  elapsedMs: number,
  frozenUntilMs: number,
): PerkModifiers {
  const frozen = elapsedMs < frozenUntilMs;
  let fallSpeedMult = 1;
  let spawnIntervalMult = 1;
  let scoreMult = 1;
  let snipeActive = false;
  let radarActive = false;

  if (frozen) {
    fallSpeedMult = 0;
  }

  for (const perk of activePerks) {
    if (perk.expiresAtMs !== undefined && perk.expiresAtMs <= elapsedMs) {
      continue;
    }

    switch (perk.id) {
      case 'breath':
        fallSpeedMult *= 0.7;
        spawnIntervalMult *= 1.25;
        break;
      case 'double_score':
        scoreMult *= 2;
        break;
      case 'golden_streak':
        break;
      case 'snipe':
        if ((perk.charges ?? 0) > 0) snipeActive = true;
        break;
      case 'radar':
        radarActive = true;
        break;
      default:
        break;
    }
  }

  return {
    fallSpeedMult,
    spawnIntervalMult,
    scoreMult,
    snipeActive,
    radarActive,
    frozen,
  };
}

export function countDefensePerks(activePerks: ActivePerk[]): number {
  return activePerks.filter((p) => {
    const def = PERK_CATALOG[p.id];
    return def?.category === 'defense';
  }).length;
}

/** Capas extra de dificultad: buff de tempo (POS adjetivo) y flow adaptativo. */
export interface CombatExtras {
  tempoBuffUntilMs?: number;
  flowSpawnMult?: number;
  flowSpeedMult?: number;
}

const ADJ_TEMPO_BUFF_MULT = 0.8;

export function getEffectiveDifficulty(
  elapsedMs: number,
  difficultyTierOffset: number,
  activePerks: ActivePerk[],
  frozenUntilMs: number,
  runnerId: RunnerId | null = null,
  extras: CombatExtras = {},
) {
  const tier = getDifficultyTier(elapsedMs, difficultyTierOffset);
  const mods = getModifiers(activePerks, elapsedMs, frozenUntilMs);
  const runner = getRunnerModifiers(runnerId);

  let fallSpeed = tier.fallSpeed * mods.fallSpeedMult * runner.fallSpeedMult;
  let spawnInterval = tier.spawnInterval * mods.spawnIntervalMult;

  if (
    extras.tempoBuffUntilMs !== undefined &&
    elapsedMs < extras.tempoBuffUntilMs &&
    !mods.frozen
  ) {
    fallSpeed *= ADJ_TEMPO_BUFF_MULT;
  }

  if (extras.flowSpeedMult !== undefined && !mods.frozen) {
    fallSpeed *= extras.flowSpeedMult;
  }
  if (extras.flowSpawnMult !== undefined) {
    spawnInterval *= extras.flowSpawnMult;
  }

  return {
    ...tier,
    fallSpeed,
    spawnInterval,
    modifiers: mods,
  };
}

export function expirePerks(activePerks: ActivePerk[], elapsedMs: number): ActivePerk[] {
  return activePerks.filter((p) => {
    if (p.expiresAtMs !== undefined && p.expiresAtMs <= elapsedMs) return false;
    if (p.charges !== undefined && p.charges <= 0) return false;
    return true;
  });
}

export function hasPerkWithCharge(
  activePerks: ActivePerk[],
  id: PerkId,
): ActivePerk | undefined {
  return activePerks.find((p) => p.id === id && (p.charges ?? 0) > 0);
}

export function consumePerkCharge(
  activePerks: ActivePerk[],
  id: PerkId,
): ActivePerk[] {
  return activePerks
    .map((p) => {
      if (p.id !== id) return p;
      const charges = (p.charges ?? 1) - 1;
      if (charges <= 0) return null;
      return { ...p, charges };
    })
    .filter((p): p is ActivePerk => p !== null);
}

export function removePerk(activePerks: ActivePerk[], id: PerkId): ActivePerk[] {
  return activePerks.filter((p) => p.id !== id);
}

export function calculatePerkWordScore(
  wordLength: number,
  combo: number,
  yPosition: number,
  groundHeight: number,
  activePerks: ActivePerk[],
  elapsedMs: number,
  snipeConsumed: boolean,
  runnerId: RunnerId | null = null,
  comboOverride: { from: number; value: number } | null = null,
): number {
  const runner = getRunnerModifiers(runnerId);
  const topThird = groundHeight / 3;
  const inTop = yPosition < topThird;

  let base = calculateWordScore(wordLength, combo, yPosition, groundHeight);

  if (snipeConsumed && inTop) {
    const withoutSnipeBonus = wordLength * 10 * (1 + combo * 0.1);
    base = Math.round(withoutSnipeBonus * 3);
  }

  let scoreMult = 1;
  if (wordLength <= 5) scoreMult *= runner.shortWordScoreMult;
  const comboFrom = comboOverride?.from ?? runner.comboMultFrom;
  const comboValue = comboOverride?.value ?? runner.comboMultValue;
  if (combo >= comboFrom) scoreMult *= comboValue;

  for (const perk of activePerks) {
    if (perk.expiresAtMs !== undefined && perk.expiresAtMs <= elapsedMs) continue;
    if (perk.id === 'double_score') scoreMult *= 2;
    if (perk.id === 'golden_streak' && combo >= 5) scoreMult *= 1.5;
  }

  return Math.round(base * scoreMult);
}

export function findLowestWord(words: FallingWord[]): FallingWord | null {
  if (words.length === 0) return null;
  return words.reduce((lowest, w) => (w.y > lowest.y ? w : lowest));
}

export function applyPerkSelection(
  state: GameState,
  perkId: PerkId,
): Partial<GameState> {
  const elapsed = state.elapsedMs;
  let activePerks = [...state.activePerks];
  let lives = state.lives;
  let words = [...state.words];
  let frozenUntilMs = state.frozenUntilMs;
  const difficultyTierOffset = state.difficultyTierOffset;

  const addPerk = (perk: ActivePerk) => {
    activePerks = trimActivePerks([
      ...activePerks.filter((p) => p.id !== perk.id),
      perk,
    ]);
  };

  switch (perkId) {
    case 'shield': {
      const defenseCount = countDefensePerks(activePerks);
      const charges = defenseCount >= 1 ? 2 : 1;
      addPerk({ id: 'shield', charges });
      break;
    }
    case 'extra_life':
      lives = Math.min(lives + 1, MAX_LIVES);
      break;
    case 'combo_safe':
      addPerk({ id: 'combo_safe', charges: 1 });
      break;
    case 'safety_net':
      addPerk({ id: 'safety_net', charges: 1 });
      break;
    case 'double_score':
      addPerk({ id: 'double_score', expiresAtMs: elapsed + 15_000 });
      break;
    case 'golden_streak':
      addPerk({ id: 'golden_streak' });
      break;
    case 'snipe':
      addPerk({ id: 'snipe', charges: 1 });
      break;
    case 'breath':
      addPerk({ id: 'breath', expiresAtMs: elapsed + 20_000 });
      break;
    case 'freeze':
      frozenUntilMs = Math.max(frozenUntilMs, elapsed + 4_000);
      break;
    case 'broken_clock':
      addPerk({ id: 'broken_clock', charges: 1 });
      break;
    case 'purge': {
      const lowest = findLowestWord(words);
      if (lowest) words = words.filter((w) => w.id !== lowest.id);
      break;
    }
    case 'radar':
      addPerk({ id: 'radar', expiresAtMs: elapsed + 25_000 });
      break;
    default:
      break;
  }

  return {
    activePerks,
    lives,
    words,
    frozenUntilMs,
    difficultyTierOffset,
    pendingPerkChoice: null,
    status: 'playing',
  };
}

export function applyBrokenClockSkip(state: GameState): Partial<GameState> {
  return {
    difficultyTierOffset: state.difficultyTierOffset + 1,
    activePerks: consumePerkCharge(state.activePerks, 'broken_clock'),
    showSpeedNotice: true,
    rampBlockedNotice: true,
  };
}
