import { useEffect } from 'react';
import { RELIC_CATALOG } from '../data/relics';
import { RUNNER_CATALOG } from '../data/runners';
import { recordVictory } from '../services/meta';
import type { RelicId } from '../types/combat';
import type { RunnerId } from '../types/run';
import { PixelButton } from './PixelButton';

interface VictoryScreenProps {
  score: number;
  floor: number;
  runnerId: RunnerId | null;
  relics: RelicId[];
  elapsedMs: number;
  onContinueEndless: () => void;
  onHome: () => void;
}

export function VictoryScreen({
  score,
  floor,
  runnerId,
  relics,
  elapsedMs,
  onContinueEndless,
  onHome,
}: VictoryScreenProps) {
  useEffect(() => {
    recordVictory();
  }, []);

  return (
    <div className="screen screen--victory">
      <h1 className="screen__title screen__title--victory">¡VICTORIA!</h1>
      <p className="screen__subtitle">TRONO CONQUISTADO</p>
      <p className="victory__quote">
        Has derrotado a la Tiranotipo. La tirania de las teclas ha caido.
      </p>

      <div className="victory__stats pixel-panel">
        <p>Score: {score}</p>
        <p>Piso: {floor}</p>
        {runnerId && <p>Runner: {RUNNER_CATALOG[runnerId].name}</p>}
        <p>
          Reliquias:{' '}
          {relics.map((id) => RELIC_CATALOG[id].name).join(', ') || '—'}
        </p>
        <p>Tiempo: {Math.floor(elapsedMs / 1000)}s</p>
      </div>

      <p className="victory__unlock">ASCENSION desbloqueada</p>

      <div className="victory__actions">
        <PixelButton onClick={onContinueEndless}>CONTINUAR ENDLESS</PixelButton>
        <PixelButton onClick={onHome}>VOLVER AL HUB</PixelButton>
      </div>
    </div>
  );
}
