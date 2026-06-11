import { useState } from 'react';
import {
  applySettingsToDocument,
  loadSettings,
  saveSettings,
  type FontMode,
  type FontScale,
  type GameSettings,
  type KeyboardLayoutId,
  type ThemeId,
} from '../services/settings';
import { LAYOUT_LABELS } from '../utils/keyboardLayout';

const FONT_LABELS: Record<FontMode, string> = {
  pixel: 'PIXEL (Press Start 2P)',
  opendyslexic: 'OPENDYSLEXIC (dislexia)',
  system: 'SISTEMA (legible)',
};

const THEME_LABELS: Record<ThemeId, string> = {
  default: 'CLASICO',
  highContrast: 'ALTO CONTRASTE',
  protanopia: 'PROTANOPIA',
  deuteranopia: 'DEUTERANOPIA',
  tritanopia: 'TRITANOPIA',
};

const SCALE_OPTIONS: FontScale[] = [1, 1.25, 1.5];

export function SettingsPanel() {
  const [settings, setSettings] = useState<GameSettings>(loadSettings);

  const update = <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K],
  ) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
    applySettingsToDocument(next);
  };

  return (
    <div className="settings">
      <div className="settings__group">
        <span className="settings__label" id="lbl-layout">
          DISTRIBUCION DE TECLADO
        </span>
        <div
          className="settings__options"
          role="radiogroup"
          aria-labelledby="lbl-layout"
        >
          {(Object.keys(LAYOUT_LABELS) as KeyboardLayoutId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={settings.keyboardLayout === id}
              className={`settings__option ${
                settings.keyboardLayout === id ? 'settings__option--active' : ''
              }`}
              onClick={() => update('keyboardLayout', id)}
            >
              {LAYOUT_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      <div className="settings__group">
        <span className="settings__label" id="lbl-font">
          FUENTE
        </span>
        <div
          className="settings__options"
          role="radiogroup"
          aria-labelledby="lbl-font"
        >
          {(Object.keys(FONT_LABELS) as FontMode[]).map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={settings.fontMode === id}
              className={`settings__option ${
                settings.fontMode === id ? 'settings__option--active' : ''
              }`}
              onClick={() => update('fontMode', id)}
            >
              {FONT_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      <div className="settings__group">
        <span className="settings__label" id="lbl-theme">
          TEMA VISUAL
        </span>
        <div
          className="settings__options"
          role="radiogroup"
          aria-labelledby="lbl-theme"
        >
          {(Object.keys(THEME_LABELS) as ThemeId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={settings.theme === id}
              className={`settings__option ${
                settings.theme === id ? 'settings__option--active' : ''
              }`}
              onClick={() => update('theme', id)}
            >
              {THEME_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      <div className="settings__group">
        <span className="settings__label" id="lbl-scale">
          TAMANO DE TEXTO
        </span>
        <div
          className="settings__options"
          role="radiogroup"
          aria-labelledby="lbl-scale"
        >
          {SCALE_OPTIONS.map((scale) => (
            <button
              key={scale}
              type="button"
              role="radio"
              aria-checked={settings.fontScale === scale}
              className={`settings__option ${
                settings.fontScale === scale ? 'settings__option--active' : ''
              }`}
              onClick={() => update('fontScale', scale)}
            >
              x{scale}
            </button>
          ))}
        </div>
      </div>

      <div className="settings__group">
        <button
          type="button"
          role="switch"
          aria-checked={settings.reducedMotion}
          className={`settings__option ${
            settings.reducedMotion ? 'settings__option--active' : ''
          }`}
          onClick={() => update('reducedMotion', !settings.reducedMotion)}
        >
          MOVIMIENTO REDUCIDO: {settings.reducedMotion ? 'SI' : 'NO'}
        </button>
      </div>

      <div className="settings__preview pixel-panel" aria-hidden="true">
        <span className="settings__preview-word falling-word falling-word--safe">
          vista
        </span>
        <span className="settings__preview-word falling-word falling-word--warn">
          previa
        </span>
        <span className="settings__preview-word falling-word falling-word--kind-trap">
          trampa
        </span>
      </div>
    </div>
  );
}
