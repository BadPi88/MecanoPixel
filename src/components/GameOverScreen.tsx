import { useEffect, useState } from 'react';
import type { LeaderboardResponse } from '../types/leaderboard';
import { formatPeakIntensity } from '../utils/intensity';
import { calculateWpm, formatTime } from '../utils/wpm';
import { fetchLeaderboard, submitScore } from '../services/leaderboard';
import { Leaderboard } from './Leaderboard';
import { PixelButton } from './PixelButton';

interface GameOverScreenProps {
  playerName: string;
  score: number;
  correctChars: number;
  wordsTyped: number;
  elapsedMs: number;
  maxWordsPerSecond: number;
  onRetry: () => void;
  onHome: () => void;
}

export function GameOverScreen({
  playerName,
  score,
  correctChars,
  wordsTyped,
  elapsedMs,
  maxWordsPerSecond,
  onRetry,
  onHome,
}: GameOverScreenProps) {
  const wpm = calculateWpm(correctChars, elapsedMs);
  const peakIntensity = formatPeakIntensity(maxWordsPerSecond);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null,
  );
  const [submitStatus, setSubmitStatus] = useState<
    'saving' | 'saved' | 'error' | 'skipped'
  >('saving');
  const [newRank, setNewRank] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function saveAndLoad() {
      if (!playerName.trim()) {
        setSubmitStatus('skipped');
        return;
      }

      try {
        const result = await submitScore({
          playerName: playerName.trim(),
          score,
          wpm,
          wordsTyped,
          elapsedMs,
        });
        if (cancelled) return;
        setNewRank(result.rank);
        setSubmitStatus(result.saved ? 'saved' : 'saved');
      } catch {
        if (cancelled) return;
        setSubmitStatus('error');
      }

      try {
        const data = await fetchLeaderboard(playerName.trim());
        if (!cancelled) setLeaderboard(data);
      } catch {
        if (!cancelled) {
          setLeaderboard({
            top10: [],
            playerRank: null,
            playerBest: null,
            totalPlayers: 0,
          });
        }
      }
    }

    void saveAndLoad();
    return () => {
      cancelled = true;
    };
  }, [playerName, score, wpm, wordsTyped, elapsedMs]);

  return (
    <div className="screen screen--gameover">
      <h1 className="screen__title screen__title--danger">GAME OVER</h1>
      <p className="screen__subtitle">{playerName || 'Jugador'}</p>

      {submitStatus === 'saving' && (
        <p className="screen__status">Guardando puntuacion...</p>
      )}
      {submitStatus === 'saved' && newRank !== null && (
        <p className="screen__status screen__status--highlight">
          {leaderboard && leaderboard.totalPlayers > 0
            ? `Eres el #${newRank} de ${leaderboard.totalPlayers} jugadores`
            : `Tu posicion global: #${newRank}`}
        </p>
      )}
      {submitStatus === 'error' && (
        <p className="screen__status screen__status--error">
          No se pudo guardar (leaderboard no configurado en local)
        </p>
      )}

      <div className="screen__layout screen__layout--gameover">
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
          <div className="screen__stat screen__stat--wide">
            <span className="screen__stat-label">RITMO MAX</span>
            <span className="screen__stat-value">{peakIntensity.value}</span>
            <span className="screen__stat-hint">{peakIntensity.hint}</span>
          </div>
        </div>

        <div className="screen__panel pixel-panel">
          <Leaderboard
            top10={leaderboard?.top10 ?? []}
            playerRank={leaderboard?.playerRank ?? newRank}
            playerName={playerName.trim()}
            totalPlayers={leaderboard?.totalPlayers ?? 0}
            loading={submitStatus === 'saving'}
            compact
          />
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
