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
  soundEnabled: boolean;
}

const SETTINGS_KEY = 'keyrunner:settings';

export const DEFAULT_SETTINGS: GameSettings = {
  keyboardLayout: 'qwerty',
  fontMode: 'pixel',
  theme: 'default',
  fontScale: 1,
  reducedMotion: false,
  soundEnabled: true,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const keyboardLayouts: KeyboardLayoutId[] = ['qwerty', 'azerty', 'qwertz', 'dvorak', 'colemak'];
    const fonts: FontMode[] = ['pixel', 'opendyslexic', 'system'];
    const themes: ThemeId[] = ['default', 'highContrast', 'protanopia', 'deuteranopia', 'tritanopia'];
    const scales: FontScale[] = [1, 1.25, 1.5];
    return {
      keyboardLayout: keyboardLayouts.includes(parsed.keyboardLayout as KeyboardLayoutId)
        ? parsed.keyboardLayout as KeyboardLayoutId
        : DEFAULT_SETTINGS.keyboardLayout,
      fontMode: fonts.includes(parsed.fontMode as FontMode)
        ? parsed.fontMode as FontMode
        : DEFAULT_SETTINGS.fontMode,
      theme: themes.includes(parsed.theme as ThemeId)
        ? parsed.theme as ThemeId
        : DEFAULT_SETTINGS.theme,
      fontScale: scales.includes(parsed.fontScale as FontScale)
        ? parsed.fontScale as FontScale
        : DEFAULT_SETTINGS.fontScale,
      reducedMotion: typeof parsed.reducedMotion === 'boolean'
        ? parsed.reducedMotion
        : DEFAULT_SETTINGS.reducedMotion,
      soundEnabled: typeof parsed.soundEnabled === 'boolean'
        ? parsed.soundEnabled
        : DEFAULT_SETTINGS.soundEnabled,
    };
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
