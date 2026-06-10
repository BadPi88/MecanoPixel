import { calculateWpm, formatTime } from '../utils/wpm';
import { PixelButton } from './PixelButton';

interface GameOverScreenProps {
  score: number;
  correctChars: number;
  wordsTyped: number;
  elapsedMs: number;
  maxFallSpeed: number;
  onRetry: () => void;
  onHome: () => void;
}

export function GameOverScreen({
  score,
  correctChars,
  wordsTyped,
  elapsedMs,
  maxFallSpeed,
  onRetry,
  onHome,
}: GameOverScreenProps) {
  const wpm = calculateWpm(correctChars, elapsedMs);

  return (
    <div className="screen screen--gameover">
      <h1 className="screen__title screen__title--danger">GAME OVER</h1>

      <div className="screen__panel screen__stats pixel-panel">
        <div className="screen__stat">
          <span className="screen__stat-label">SCORE</span>
          <span className="screen__stat-value">{score}</span>
        </div>
        <div className="screen__stat">
          <span className="screen__stat-label">WPM</span>
          <span className="screen__stat-value">{wpm}</span>
        </div>
        <div className="screen__stat">
          <span className="screen__stat-label">PALABRAS</span>
          <span className="screen__stat-value">{wordsTyped}</span>
        </div>
        <div className="screen__stat">
          <span className="screen__stat-label">TIEMPO</span>
          <span className="screen__stat-value">{formatTime(elapsedMs)}</span>
        </div>
        <div className="screen__stat">
          <span className="screen__stat-label">VEL MAX</span>
          <span className="screen__stat-value">{maxFallSpeed}px/s</span>
        </div>
      </div>

      <div className="screen__actions">
        <PixelButton onClick={onRetry}>REINTENTAR</PixelButton>
        <PixelButton variant="secondary" onClick={onHome}>
          INICIO
        </PixelButton>
      </div>
    </div>
  );
}
