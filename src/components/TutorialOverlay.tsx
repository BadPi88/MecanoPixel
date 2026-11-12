import { useRef, useState } from 'react';
import { markTutorialComplete } from '../services/meta';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { PixelButton } from './PixelButton';

const STEPS = [
  {
    title: 'ESCRIBE PALABRAS',
    body: 'Las palabras caen: teclealas antes de que toquen el suelo. Desde el piso 7, algunas llevan tildes que debes escribir.',
  },
  {
    title: 'TIPOS ESPECIALES',
    body: 'Trampa (!), bomba (*), bonus (+), oraculo (?). V/A/S = verbo, adjetivo, sustantivo.',
  },
  {
    title: 'ULTIMATE Y DESVIOS',
    body: 'Sin Backspace carga el ULTIMATE (TAB). Letras sueltas se desvian con input vacio.',
  },
  {
    title: 'MAPA DE RUTAS',
    body: 'Tras cada piso elige ruta: tienda, tesoro, elite (+50% coins), descanso o jefe. Evitar al jefe penaliza.',
  },
  {
    title: 'BIOMAS Y BUILD',
    body: 'Cada 3 pisos cambia la zona y sus reglas. Usa el boton VER BUILD para consultar reliquias, perks y sinergias.',
  },
  {
    title: 'RITMO DE LA RUN',
    body: 'Con buena precision y velocidad, las subidas de ritmo llegan antes y despejas pisos mas rapido. Si necesitas practica, hay mas tiempo entre subidas. Los pisos tardios siempre seran mas exigentes.',
  },
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, step);
  const current = STEPS[step];
  const isLast = step >= STEPS.length - 1;

  const finish = () => {
    markTutorialComplete();
    onComplete();
  };

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" ref={dialogRef}>
      <div className="tutorial-overlay__panel pixel-panel">
        <p className="tutorial-overlay__step">
          {step + 1} / {STEPS.length}
        </p>
        <h2 className="tutorial-overlay__title" id="tutorial-title">{current.title}</h2>
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
