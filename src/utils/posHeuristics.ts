import type { WordPOS } from '../types/combat';

/**
 * Etiquetado manual de palabras frecuentes del diccionario nucleo.
 * El resto se resuelve por heuristica de sufijos del espanol.
 */
const MANUAL_POS: Record<string, WordPOS> = {
  // Verbos
  dar: 'verb', ser: 'verb', oir: 'verb', leer: 'verb', mirar: 'verb',
  nacer: 'verb', nadar: 'verb', odiar: 'verb', pagar: 'verb', parar: 'verb',
  pasar: 'verb', pesar: 'verb', poner: 'verb', posar: 'verb', robar: 'verb',
  rodar: 'verb', saber: 'verb', sacar: 'verb', salir: 'verb', secar: 'verb',
  soler: 'verb', sonar: 'verb', sumar: 'verb', latir: 'verb', fumar: 'verb',
  mover: 'verb', corre: 'verb', habla: 'verb', quedo: 'verb', vaya: 'verb',
  van: 'verb', vas: 'verb', ten: 'verb', hay: 'verb',
  // Adjetivos
  azul: 'adj', fiel: 'adj', gran: 'adj', leal: 'adj', raro: 'adj',
  real: 'adj', rojo: 'adj', sano: 'adj', vago: 'adj', vano: 'adj',
  vivo: 'adj', bueno: 'adj', digno: 'adj', dulce: 'adj', ebrio: 'adj',
  enano: 'adj', falso: 'adj', feroz: 'adj', flaco: 'adj', joven: 'adj',
  justo: 'adj', largo: 'adj', legal: 'adj', lento: 'adj', mayor: 'adj',
  mejor: 'adj', menor: 'adj', mucho: 'adj', noble: 'adj', nuevo: 'adj',
  pobre: 'adj', rapaz: 'adj', ronco: 'adj', rubio: 'adj', sabio: 'adj',
  sagaz: 'adj', santo: 'adj', serio: 'adj', suave: 'adj', igual: 'adj',
  ideal: 'adj', solar: 'adj', moral: 'adj', medio: 'adj', loco: 'adj',
  mal: 'adj', vil: 'adj', tal: 'adj', muy: 'adj',
  // Sustantivos comunes que la heuristica fallaria
  sol: 'noun', mar: 'noun', luz: 'noun', pan: 'noun', rey: 'noun',
  ley: 'noun', mes: 'noun', dia: 'noun', rio: 'noun', pie: 'noun',
  ojo: 'noun', ala: 'noun', ave: 'noun', voz: 'noun', paz: 'noun',
  amor: 'noun', arte: 'noun', boca: 'noun', casa: 'noun', cine: 'noun',
  dato: 'noun', dedo: 'noun', flor: 'noun', gato: 'noun', hada: 'noun',
  hoja: 'noun', hora: 'noun', idea: 'noun', isla: 'noun', jefe: 'noun',
  lago: 'noun', lobo: 'noun', luna: 'noun', mago: 'noun', mano: 'noun',
  mapa: 'noun', mesa: 'noun', miel: 'noun', muro: 'noun', nave: 'noun',
  nido: 'noun', nota: 'noun', obra: 'noun', onda: 'noun', palo: 'noun',
  pelo: 'noun', pena: 'noun', pera: 'noun', peso: 'noun', pico: 'noun',
  piel: 'noun', pino: 'noun', plan: 'noun', polo: 'noun', pozo: 'noun',
  rama: 'noun', rana: 'noun', rayo: 'noun', risa: 'noun', roca: 'noun',
  rosa: 'noun', ruta: 'noun', sala: 'noun', seda: 'noun', sopa: 'noun',
  taco: 'noun', tela: 'noun', tema: 'noun', tiza: 'noun', toro: 'noun',
  tren: 'noun', tubo: 'noun', vaca: 'noun', vaso: 'noun', vela: 'noun',
  vena: 'noun', vida: 'noun', vino: 'noun', zona: 'noun', zumo: 'noun',
  agua: 'noun', actor: 'noun', amigo: 'noun', angel: 'noun', arbol: 'noun',
  arena: 'noun', astro: 'noun', bahia: 'noun', banco: 'noun', barco: 'noun',
  brazo: 'noun', cable: 'noun', calor: 'noun', campo: 'noun', canto: 'noun',
  carne: 'noun', carta: 'noun', cebra: 'noun', cerdo: 'noun', cerro: 'noun',
  cielo: 'noun', cinta: 'noun', clase: 'noun', clima: 'noun', color: 'noun',
  costa: 'noun', crema: 'noun', cueva: 'noun', danza: 'noun', deseo: 'noun',
  dieta: 'noun', dolor: 'noun', drama: 'noun', ducha: 'noun', enero: 'noun',
  epoca: 'noun', error: 'noun', espia: 'noun', etapa: 'noun', favor: 'noun',
  fecha: 'noun', fibra: 'noun', ficha: 'noun', firma: 'noun', fondo: 'noun',
  forma: 'noun', fresa: 'noun', fuego: 'noun', gafas: 'noun', gallo: 'noun',
  ganso: 'noun', gente: 'noun', globo: 'noun', golpe: 'noun', grano: 'noun',
  grasa: 'noun', grito: 'noun', grupo: 'noun', guion: 'noun', hacha: 'noun',
  hecho: 'noun', hielo: 'noun', hogar: 'noun', honor: 'noun', hotel: 'noun',
  hueco: 'noun', hueso: 'noun', humor: 'noun', jabon: 'noun', jarra: 'noun',
  jaula: 'noun', juego: 'noun', julio: 'noun', junio: 'noun', labio: 'noun',
  lanza: 'noun', lapiz: 'noun', laser: 'noun', leche: 'noun', libro: 'noun',
  limon: 'noun', lista: 'noun', litro: 'noun', llama: 'noun', llave: 'noun',
  logro: 'noun', lucha: 'noun', madre: 'noun', magia: 'noun', mango: 'noun',
  marca: 'noun', marte: 'noun', matiz: 'noun', mente: 'noun', metal: 'noun',
  metro: 'noun', miedo: 'noun', mitad: 'noun', monte: 'noun', motor: 'noun',
  mundo: 'noun', musgo: 'noun', nieve: 'noun', noche: 'noun', norma: 'noun',
  norte: 'noun', nubes: 'noun', orden: 'noun', oreja: 'noun', oruga: 'noun',
  oveja: 'noun', padre: 'noun', palma: 'noun', panda: 'noun', panel: 'noun',
  papel: 'noun', pared: 'noun', parte: 'noun', patio: 'noun', pausa: 'noun',
  peine: 'noun', pelea: 'noun', perro: 'noun', peste: 'noun', piano: 'noun',
  pieza: 'noun', pilas: 'noun', placa: 'noun', plano: 'noun', plata: 'noun',
  playa: 'noun', plaza: 'noun', plomo: 'noun', pluma: 'noun', poder: 'noun',
  poema: 'noun', pollo: 'noun', porte: 'noun', potro: 'noun', prado: 'noun',
  presa: 'noun', prima: 'noun', primo: 'noun', prosa: 'noun', pulso: 'noun',
  punto: 'noun', queso: 'noun', rabia: 'noun', radio: 'noun', rango: 'noun',
  rasgo: 'noun', raton: 'noun', razon: 'noun', reino: 'noun', reloj: 'noun',
  renta: 'noun', resto: 'noun', reves: 'noun', reyes: 'noun', rifle: 'noun',
  ritmo: 'noun', robot: 'noun', rombo: 'noun', rotor: 'noun', rueda: 'noun',
  ruido: 'noun', rumbo: 'noun', salon: 'noun', salto: 'noun', salud: 'noun',
  sedal: 'noun', selva: 'noun', senal: 'noun', serie: 'noun', siglo: 'noun',
  signo: 'noun', silla: 'noun', sitio: 'noun', socio: 'noun', sudor: 'noun',
  suelo: 'noun', sueno: 'noun', suero: 'noun',
};

const VERB_SUFFIXES = ['ar', 'er', 'ir'];
const ADJ_SUFFIXES = ['oso', 'osa', 'ble', 'ivo', 'iva', 'al', 'il', 'az', 'ico', 'ica'];

/** Devuelve la categoria gramatical de una palabra (manual o heuristica). */
export function getWordPOS(word: string): WordPOS {
  const normalized = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const manual = MANUAL_POS[word] ?? MANUAL_POS[normalized];
  if (manual) return manual;

  if (normalized.length >= 4 && VERB_SUFFIXES.some((s) => normalized.endsWith(s))) {
    return 'verb';
  }
  if (ADJ_SUFFIXES.some((s) => normalized.endsWith(s))) {
    return 'adj';
  }
  return 'noun';
}
