import { useEffect, useRef } from 'react';
import { RELIC_CATALOG } from '../data/relics';
import { RUNNER_CATALOG } from '../data/runners';
import { recordRunEnd, recordVictory } from '../services/meta';
import { syncMetaToProfile } from '../services/profile';
import { calculateMetaCoinsEarned } from '../utils/metaCoins';
import { getAscensionMetaCoinsMult } from '../utils/ascensionModifiers';
import { calculateWpm } from '../utils/wpm';
import type { RelicId } from '../types/combat';
import type { RunnerId } from '../types/run';
import { PixelButton } from './PixelButton';

interface VictoryScreenProps {
  score: number;
  floor: number;
  runnerId: RunnerId | null;
  relics: RelicId[];
  elapsedMs: number;
  correctChars: number;
  correctKeyPresses: number;
  mistakes: number;
  mistakesByChar: Record<string, number>;
  wordsTyped: number;
  ultimatesUsed: number;
  deflectedLetters: number;
  reachedBoss: boolean;
  ascensionLevel: number;
  onContinueEndless: () => void;
  onHome: () => void;
}

export function VictoryScreen({
  score,
  floor,
  runnerId,
  relics,
  elapsedMs,
  correctChars,
  correctKeyPresses,
  mistakes,
  mistakesByChar,
  wordsTyped,
  ultimatesUsed,
  deflectedLetters,
  reachedBoss,
  ascensionLevel,
  onContinueEndless,
  onHome,
}: VictoryScreenProps) {
  const recordedRef = useRef(false);
  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordVictory();
    const wpm = calculateWpm(correctChars, elapsedMs);
    const metaCoins = calculateMetaCoinsEarned(
      floor, score, getAscensionMetaCoinsMult(ascensionLevel),
    );
    const result = recordRunEnd(floor, wordsTyped, metaCoins, {
      score, wpm, accuracy: correctKeyPresses + mistakes > 0
        ? Math.round((correctKeyPresses / (correctKeyPresses + mistakes)) * 100)
        : 100,
      mistakes, mistakesByChar, ultimatesUsed, deflectedLetters,
      relicsCollected: relics.length, dailyRun: false, deathCause: null,
      reachedBoss,
    });
    void syncMetaToProfile(result.meta);
  }, [
    ascensionLevel, correctChars, correctKeyPresses, deflectedLetters, elapsedMs,
    floor, mistakes, mistakesByChar, reachedBoss, relics.length, score,
    ultimatesUsed, wordsTyped,
  ]);

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
