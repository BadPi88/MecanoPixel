import type { GameState } from '../types/game';
import { MAX_LIVES } from '../types/perks';
import type { EventEffect, EventId } from '../types/run';

export interface EventDefinition {
  id: EventId;
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  effectA: EventEffect;
  effectB: EventEffect;
  weight: number;
  canAppear: (state: GameState) => boolean;
}

export const EVENT_CATALOG: EventDefinition[] = [
  {
    id: 'speed_for_coins',
    title: 'MERCADER AMBULANTE',
    description: 'Un vendedor ofrece acelerar tu ritmo o pagarte en monedas.',
    optionA: 'Subir ritmo ya',
    optionB: '150 run coins',
    effectA: 'speed_ramp',
    effectB: 'coins_150',
    weight: 10,
    canAppear: () => true,
  },
  {
    id: 'life_for_perk',
    title: 'PACTO OSCURO',
    description: 'Una voz susurra un trato: sangre a cambio de poder.',
    optionA: 'Perder 1 vida',
    optionB: 'Rechazar',
    effectA: 'lose_life_rare_perk',
    effectB: 'nothing',
    weight: 8,
    canAppear: (s) => s.lives > 1,
  },
  {
    id: 'no_traps',
    title: 'OASIS',
    description: 'Un claro seguro entre pisos. Puedes descansar o cobrar.',
    optionA: 'Sin trampas proximo piso',
    optionB: '80 run coins',
    effectA: 'no_traps_next',
    effectB: 'coins_80',
    weight: 10,
    canAppear: () => true,
  },
  {
    id: 'nothing',
    title: 'CAMINO VACIO',
    description: 'Solo polvo y eco. Alguien dejo monedas olvidadas.',
    optionA: '50 run coins',
    optionB: 'Seguir',
    effectA: 'coins_50',
    effectB: 'nothing',
    weight: 12,
    canAppear: () => true,
  },
  {
    id: 'duplicar_ritmo',
    title: 'RELOJ ACELERADO',
    description: 'Las agujas giran mas rapido. El premio crece con el riesgo.',
    optionA: '+ritmo y 100 coins',
    optionB: '50 run coins',
    effectA: 'tier_up_coins_100',
    effectB: 'coins_50',
    weight: 6,
    canAppear: (s) => s.floor >= 2,
  },
  {
    id: 'curandero',
    title: 'CURANDERO ITINERANTE',
    description: 'Vendas y hierbas. Cura a cambio de tu bolsa o sigue herido.',
    optionA: '+1 vida',
    optionB: 'Perder mitad de coins',
    effectA: 'heal_one',
    effectB: 'lose_coins_half',
    weight: 7,
    canAppear: (s) => s.lives < MAX_LIVES,
  },
  {
    id: 'escudo_trampas',
    title: 'GUARDIAN DE TRAMPAS',
    description: 'Te ensena a esquivar falsas palabras antes del siguiente piso.',
    optionA: '3 cargas anti-trampa',
    optionB: '60 run coins',
    effectA: 'trap_shield_3',
    effectB: 'coins_60',
    weight: 8,
    canAppear: () => true,
  },
  {
    id: 'perk_maldito',
    title: 'PERGAMINO MALDITO',
    description: 'Runas corruptas prometen poder... con un precio oculto.',
    optionA: 'Perk maldito (reloj roto)',
    optionB: '120 run coins',
    effectA: 'curse_perk',
    effectB: 'coins_120',
    weight: 5,
    canAppear: (s) => s.activePerks.length < 4,
  },
  {
    id: 'biblioteca',
    title: 'BIBLIOTECA OLVIDADA',
    description: 'Tomos polvorientos alivian el ritmo o puedes saquear monedas.',
    optionA: 'Bajar 1 nivel de ritmo',
    optionB: '100 run coins',
    effectA: 'tier_down',
    effectB: 'coins_100',
    weight: 6,
    canAppear: (s) => s.difficultyTierOffset > 0 || s.floor > 1,
  },
  {
    id: 'mercader_oscuro',
    title: 'MERCADER OSCURO',
    description: 'Monedas brillantes a cambio de un poco de sangre.',
    optionA: '200 coins (1 vida)',
    optionB: 'Rechazar',
    effectA: 'coins_200_lose_life',
    effectB: 'nothing',
    weight: 4,
    canAppear: (s) => s.floor >= 3 && s.lives > 1,
  },
  {
    id: 'combo_ofrenda',
    title: 'ALTAR DEL COMBO',
    description: 'Tu racha impresiona al altar. Ofrece recompensa o oro.',
    optionA: 'Racha dorada gratis',
    optionB: '80 run coins',
    effectA: 'combo_buff',
    effectB: 'coins_80',
    weight: 5,
    canAppear: (s) => s.combo >= 3,
  },
  {
    id: 'reliquia_espejismo',
    title: 'ESPEJISMO RELIQUIARIO',
    description: 'Un brillo falso. Monedas seguras o seguir de largo.',
    optionA: '150 run coins',
    optionB: 'Seguir',
    effectA: 'coins_150',
    effectB: 'nothing',
    weight: 4,
    canAppear: (s) => s.activeRelics.length > 0,
  },
];

export function pickRandomEvent(state: GameState): EventDefinition {
  const eligible = EVENT_CATALOG.filter((e) => e.canAppear(state));
  const pool = eligible.length > 0 ? eligible : EVENT_CATALOG;
  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const event of pool) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return pool[pool.length - 1];
}
