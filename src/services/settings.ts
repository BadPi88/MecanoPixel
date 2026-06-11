export type KeyboardLayoutId =
  | 'qwerty'
  | 'azerty'
  | 'qwertz'
  | 'dvorak'
  | 'colemak';

export type FontMode = 'pixel' | 'opendyslexic' | 'system';

export type ThemeId =
  | 'default'
  | 'highContrast'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia';

export type FontScale = 1 | 1.25 | 1.5;

export interface GameSettings {
  keyboardLayout: KeyboardLayoutId;
  fontMode: FontMode;
  theme: ThemeId;
  fontScale: FontScale;
  reducedMotion: boolean;
}

const SETTINGS_KEY = 'keyrunner:settings';

export const DEFAULT_SETTINGS: GameSettings = {
  keyboardLayout: 'qwerty',
  fontMode: 'pixel',
  theme: 'default',
  fontScale: 1,
  reducedMotion: false,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/** Aplica los ajustes como data-attributes en <html> para que el CSS reaccione. */
export function applySettingsToDocument(settings: GameSettings): void {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.font = settings.fontMode;
  root.dataset.scale = String(settings.fontScale).replace('.', '_');
  root.dataset.motion = settings.reducedMotion ? 'reduced' : 'full';
}
