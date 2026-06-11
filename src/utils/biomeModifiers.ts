import type { BiomeId } from '../data/biomes';
import type { SpawnRates } from './wordSpawn';

export interface BiomeGameplayMod {
  anagramRateMult: number;
  bombRateMult: number;
  oracleRateMult: number;
  speedMult: number;
  bonusScoreMult: number;
  fabricaRemap: boolean;
  tronoMiniBossChance: number;
}

const BIOME_MODS: Record<BiomeId, BiomeGameplayMod> = {
  scriptorium: {
    anagramRateMult: 1.5,
    bombRateMult: 0.5,
    oracleRateMult: 1,
    speedMult: 1,
    bonusScoreMult: 1,
    fabricaRemap: false,
    tronoMiniBossChance: 0,
  },
  fabrica: {
    anagramRateMult: 1,
    bombRateMult: 1.4,
    oracleRateMult: 1,
    speedMult: 1,
    bonusScoreMult: 1,
    fabricaRemap: true,
    tronoMiniBossChance: 0,
  },
  abismo: {
    anagramRateMult: 1,
    bombRateMult: 1,
    oracleRateMult: 2,
    speedMult: 1.1,
    bonusScoreMult: 1,
    fabricaRemap: false,
    tronoMiniBossChance: 0,
  },
  trono: {
    anagramRateMult: 1,
    bombRateMult: 1,
    oracleRateMult: 1,
    speedMult: 1,
    bonusScoreMult: 2,
    fabricaRemap: false,
    tronoMiniBossChance: 0.15,
  },
};

export function getBiomeGameplayMod(biomeId: BiomeId): BiomeGameplayMod {
  return BIOME_MODS[biomeId];
}

export function getBiomeModifierLabel(biomeId: BiomeId): string {
  switch (biomeId) {
    case 'scriptorium':
      return '+anagramas, -bombas';
    case 'fabrica':
      return '+bombas, remap leve';
    case 'abismo':
      return '+oraculos, caida +10%';
    case 'trono':
      return 'bonus x2, mini-jefes';
    default:
      return '';
  }
}

export function applyBiomeToSpawnRates(
  rates: SpawnRates,
  biomeId: BiomeId,
): SpawnRates {
  const mod = getBiomeGameplayMod(biomeId);
  return {
    trap: rates.trap,
    bomb: Math.min(rates.bomb * mod.bombRateMult, 0.2),
    bonus: rates.bonus,
  };
}

export function getBiomeAnagramRateMult(biomeId: BiomeId): number {
  return getBiomeGameplayMod(biomeId).anagramRateMult;
}

export function getBiomeOracleRateMult(biomeId: BiomeId): number {
  return getBiomeGameplayMod(biomeId).oracleRateMult;
}

export function getBiomeSpeedMult(biomeId: BiomeId): number {
  return getBiomeGameplayMod(biomeId).speedMult;
}

export function getBiomeBonusScoreMult(biomeId: BiomeId): number {
  return getBiomeGameplayMod(biomeId).bonusScoreMult;
}
