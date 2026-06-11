/** Categoria gramatical de una palabra (efectos de combate al escribirla). */
export type WordPOS = 'verb' | 'adj' | 'noun';

/** Reliquias que definen builds dentro de una run. */
export type RelicId =
  | 'reliquia_ignea'
  | 'diccionario_erudito'
  | 'teclado_cortocircuitado'
  | 'tinta_toxica'
  | 'afinacion_vocales'
  | 'sello_maldito'
  | 'espejo_roto';

/** Modificadores visuales/mentales de palabras enemigas. */
export type WordModifier = 'anagram' | 'shifting' | 'vowelless';

/** Elemento de dano asociado a glosarios/reliquias. */
export type CombatElement = 'fire' | 'poison' | 'electric' | 'none';

/** Diccionarios tematicos desbloqueables. */
export type GlossaryId = 'general' | 'medico' | 'tecnico';

/** Proyectil de letra suelta que cae; se desvia tecleando la letra. */
export interface LetterProjectile {
  id: string;
  char: string;
  x: number;
  y: number;
  vy: number;
}

/** Estadisticas de flow para dificultad adaptativa. */
export interface FlowStats {
  emaWpm: number;
  emaErrorRate: number;
  /** Multiplicador sobre spawnInterval (mas bajo = mas palabras). */
  spawnMult: number;
  /** Multiplicador sobre fallSpeed. */
  speedMult: number;
  windowChars: number;
  windowErrors: number;
  lastUpdateMs: number;
}

export const INITIAL_FLOW_STATS: FlowStats = {
  emaWpm: 0,
  emaErrorRate: 0.1,
  spawnMult: 1,
  speedMult: 1,
  windowChars: 0,
  windowErrors: 0,
  lastUpdateMs: 0,
};

/** Villanos unicos de jefe (no son runners). */
export type BossId = 'archivista' | 'saboteador' | 'perforador' | 'tiranotipo';

/** Ataques de interfaz del jefe segun catalogo. */
export interface BossAttackState {
  bossId: BossId;
  blind: boolean;
  remap: boolean;
  projectiles: boolean;
  startedAtMs: number;
  nextBlindAtMs: number;
  remapUntilMs: number;
}

export const MAX_ACTIVE_RELICS = 4;
export const ULTIMATE_MAX_CHARGE = 100;
export const ULTIMATE_BACKSPACE_PENALTY = 15;
export const ULTIMATE_CLEAN_WORD_BONUS = 5;
export const POS_EFFECT_COOLDOWN_MS = 10_000;
export const MAX_LETTER_PROJECTILES = 5;
