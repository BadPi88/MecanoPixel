import type { CombatElement, GlossaryId } from '../types/combat';

export interface GlossaryDefinition {
  id: GlossaryId;
  name: string;
  description: string;
  element: CombatElement;
  metaCost: number;
  defaultUnlocked: boolean;
}

export const GLOSSARY_CATALOG: Record<GlossaryId, GlossaryDefinition> = {
  general: {
    id: 'general',
    name: 'GENERAL',
    description: 'Vocabulario cotidiano. Sin elemento.',
    element: 'none',
    metaCost: 0,
    defaultUnlocked: true,
  },
  medico: {
    id: 'medico',
    name: 'MEDICO',
    description: 'Veneno: palabras de 7+ letras dan +30% score',
    element: 'poison',
    metaCost: 400,
    defaultUnlocked: false,
  },
  tecnico: {
    id: 'tecnico',
    name: 'TECNICO',
    description: 'Electrico: +1 ultimate extra por palabra',
    element: 'electric',
    metaCost: 600,
    defaultUnlocked: false,
  },
};

/** Palabras tematicas (sin tildes, solo a-z). Se mezclan con el pool general. */
export const GLOSSARY_WORDS: Record<Exclude<GlossaryId, 'general'>, string[]> = {
  medico: [
    'vena', 'oido', 'tos', 'piel', 'gripe', 'fiebre', 'sutura', 'craneo',
    'femur', 'pulmon', 'higado', 'rinon', 'plasma', 'celula', 'tejido',
    'nervio', 'tendon', 'codo', 'torax', 'pelvis', 'arteria', 'columna',
    'globulo', 'insulina', 'vacuna', 'jarabe', 'gasa', 'bisturi', 'camilla',
    'doctor', 'cirugia', 'receta', 'sintoma', 'virus', 'bacteria', 'antidoto',
    'veneno', 'toxina', 'dosis', 'pastilla', 'capsula', 'anestesia',
    'diagnostico', 'tratamiento', 'quirofano', 'hospital', 'urgencia',
    'paciente', 'historial', 'radiografia', 'esqueleto', 'musculo',
    'corazon', 'cerebro', 'estomago', 'garganta', 'hormona', 'glandula',
  ],
  tecnico: [
    'bit', 'byte', 'chip', 'datos', 'cable', 'red', 'nube', 'codigo',
    'bucle', 'clase', 'objeto', 'array', 'pixel', 'puerto', 'kernel',
    'driver', 'script', 'servidor', 'cliente', 'consola', 'comando',
    'archivo', 'carpeta', 'memoria', 'disco', 'teclado', 'monitor',
    'raton', 'sistema', 'ventana', 'proceso', 'hilo', 'cache', 'buffer',
    'stack', 'cola', 'lista', 'nodo', 'grafo', 'hash', 'token', 'parser',
    'compilar', 'depurar', 'ejecutar', 'iterar', 'declarar', 'importar',
    'exportar', 'conectar', 'circuito', 'voltaje', 'sensor', 'antena',
    'binario', 'logico', 'digital', 'virtual', 'remoto', 'firmware',
  ],
};

/** Proporcion de palabras del glosario tematico frente al pool general. */
export const GLOSSARY_MIX_RATIO = 0.6;
