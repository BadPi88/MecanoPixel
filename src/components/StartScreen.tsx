import { PixelButton } from './PixelButton';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="screen screen--start">
      <h1 className="screen__title">TYPING GAME</h1>
      <p className="screen__subtitle">MECANOGRAFIA PIXEL</p>

      <div className="screen__panel pixel-panel">
        <h2 className="screen__panel-title">COMO JUGAR</h2>
        <ul className="screen__instructions">
          <li>Escribe las palabras antes de que toquen el suelo</li>
          <li>Pulsa ESPACIO o ENTER para confirmar</li>
          <li>La velocidad sube cada 20 segundos</li>
          <li>Sin tildes: escribe &quot;tecnologia&quot;, no &quot;tecnología&quot;</li>
          <li>ESC para pausar</li>
        </ul>
      </div>

      <PixelButton onClick={onStart} className="screen__btn">
        JUGAR
      </PixelButton>
    </div>
  );
}
