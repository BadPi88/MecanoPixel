import type { EventId } from '../types/run';

export interface EventDefinition {
  id: EventId;
  title: string;
  optionA: string;
  optionB: string;
  effectA: string;
  effectB: string;
}

export const EVENT_CATALOG: EventDefinition[] = [
  {
    id: 'speed_for_coins',
    title: 'MERCADER AMBULANTE',
    optionA: 'Subir ritmo ya',
    optionB: '150 run coins',
    effectA: 'speed_ramp',
    effectB: 'coins_150',
  },
  {
    id: 'life_for_perk',
    title: 'PACTO OSCURO',
    optionA: 'Perder 1 vida',
    optionB: 'Nada',
    effectA: 'lose_life_rare_perk',
    effectB: 'nothing',
  },
  {
    id: 'no_traps',
    title: 'OASIS',
    optionA: 'Sin trampas proximo piso',
    optionB: '80 run coins',
    effectA: 'no_traps_next',
    effectB: 'coins_80',
  },
  {
    id: 'nothing',
    title: 'CAMINO VACIO',
    optionA: '50 run coins',
    optionB: 'Seguir',
    effectA: 'coins_50',
    effectB: 'nothing',
  },
];

export function pickRandomEvent(): EventDefinition {
  return EVENT_CATALOG[Math.floor(Math.random() * EVENT_CATALOG.length)];
}
