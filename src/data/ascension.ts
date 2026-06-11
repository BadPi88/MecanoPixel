export const MAX_ASCENSION = 5;

export interface AscensionLevelDef {
  level: number;
  label: string;
  description: string;
}

export const ASCENSION_LEVELS: AscensionLevelDef[] = [
  { level: 0, label: 'NORMAL', description: 'Sin modificadores' },
  { level: 1, label: 'ASC I', description: '+15% trampas' },
  { level: 2, label: 'ASC II', description: '-1 vida inicial' },
  { level: 3, label: 'ASC III', description: 'Jefes mas agresivos; jefes secretos' },
  { level: 4, label: 'ASC IV', description: '+1 tier permanente en la run' },
  { level: 5, label: 'ASC V', description: '+25% meta coins al terminar' },
];
