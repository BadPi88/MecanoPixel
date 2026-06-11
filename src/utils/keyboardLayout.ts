import type { KeyboardLayoutId } from '../services/settings';

/**
 * Mapas de tecla fisica (event.code, nombrada segun QWERTY) al caracter que
 * produce esa posicion en cada distribucion. Para QWERTY se usa event.key
 * directamente (respeta la distribucion del sistema operativo).
 * Solo se mapean diferencias respecto a QWERTY; el resto cae en event.key.
 */
const LAYOUT_OVERRIDES: Record<
  Exclude<KeyboardLayoutId, 'qwerty'>,
  Record<string, string>
> = {
  azerty: {
    KeyQ: 'a',
    KeyA: 'q',
    KeyW: 'z',
    KeyZ: 'w',
    Semicolon: 'm',
    KeyM: ',',
  },
  qwertz: {
    KeyY: 'z',
    KeyZ: 'y',
  },
  dvorak: {
    KeyQ: "'",
    KeyW: ',',
    KeyE: '.',
    KeyR: 'p',
    KeyT: 'y',
    KeyY: 'f',
    KeyU: 'g',
    KeyI: 'c',
    KeyO: 'r',
    KeyP: 'l',
    KeyA: 'a',
    KeyS: 'o',
    KeyD: 'e',
    KeyF: 'u',
    KeyG: 'i',
    KeyH: 'd',
    KeyJ: 'h',
    KeyK: 't',
    KeyL: 'n',
    Semicolon: 's',
    KeyZ: ';',
    KeyX: 'q',
    KeyC: 'j',
    KeyV: 'k',
    KeyB: 'x',
    KeyN: 'b',
    KeyM: 'm',
    Comma: 'w',
    Period: 'v',
    Slash: 'z',
  },
  colemak: {
    KeyE: 'f',
    KeyR: 'p',
    KeyT: 'g',
    KeyY: 'j',
    KeyU: 'l',
    KeyI: 'u',
    KeyO: 'y',
    KeyP: ';',
    KeyS: 'r',
    KeyD: 's',
    KeyF: 't',
    KeyG: 'd',
    KeyJ: 'n',
    KeyK: 'e',
    KeyL: 'i',
    Semicolon: 'o',
    KeyN: 'k',
  },
};

const LETTER_RE = /^[a-zñ]$/;

function normalizeChar(char: string): string {
  return char
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Resuelve el caracter tecleado segun la distribucion elegida.
 * Devuelve null si la tecla no produce una letra valida del juego.
 */
export function resolveTypedChar(
  event: KeyboardEvent,
  layout: KeyboardLayoutId,
): string | null {
  let char: string;

  if (layout === 'qwerty') {
    if (event.key.length !== 1) return null;
    char = normalizeChar(event.key);
  } else {
    const override = LAYOUT_OVERRIDES[layout][event.code];
    if (override !== undefined) {
      char = override;
    } else if (event.key.length === 1) {
      char = normalizeChar(event.key);
    } else {
      return null;
    }
  }

  return LETTER_RE.test(char) ? char : null;
}

export const LAYOUT_LABELS: Record<KeyboardLayoutId, string> = {
  qwerty: 'QWERTY (sistema)',
  azerty: 'AZERTY',
  qwertz: 'QWERTZ',
  dvorak: 'DVORAK',
  colemak: 'COLEMAK',
};
