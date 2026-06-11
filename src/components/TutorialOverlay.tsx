import { useState } from 'react';
import { markTutorialComplete } from '../services/meta';
import { PixelButton } from './PixelButton';

const STEPS = [
  {
    title: 'ESCRIBE PALABRAS',
    body: 'Las palabras caen: teclealas antes de que toquen el suelo. Sin tildes.',
  },
  {
    title: 'TIPOS ESPECIALES',
    body: 'Trampa (!), bomba (*), bonus (+). V/A/S marcan verbo, adjetivo y sustantivo.',
  },
  {
    title: 'ULTIMATE Y DESVIOS',
    body: 'Escribe sin Backspace para cargar el ULTIMATE (TAB). Letras sueltas se desvian con input vacio.',
  },
  {
    title: 'ROGUELIKE',
    body: '3 subidas por piso, perk cada 3, reliquia cada 2 pisos. Tienda, evento o jefe entre pisos.',
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step >= STEPS.length - 1;

  const finish = () => {
    markTutorialComplete();
    onComplete();
  };

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true">
      <div className="tutorial-overlay__panel pixel-panel">
        <p className="tutorial-overlay__step">
          {step + 1} / {STEPS.length}
        </p>
        <h2 className="tutorial-overlay__title">{current.title}</h2>
        <p className="tutorial-overlay__body">{current.body}</p>
        <div className="tutorial-overlay__actions">
          {!isLast ? (
            <PixelButton onClick={() => setStep((s) => s + 1)}>
              SIGUIENTE
            </PixelButton>
          ) : (
            <PixelButton onClick={finish}>¡A JUGAR!</PixelButton>
          )}
          <button
            type="button"
            className="tutorial-overlay__skip"
            onClick={finish}
          >
            Saltar
          </button>
        </div>
      </div>
    </div>
  );
}
