import type { LeaderboardEntry } from '../types/leaderboard';

interface LeaderboardProps {
  top10: LeaderboardEntry[];
  playerRank: number | null;
  playerName: string;
  loading?: boolean;
  compact?: boolean;
}

export function Leaderboard({
  top10,
  playerRank,
  playerName,
  loading = false,
  compact = false,
}: LeaderboardProps) {
  if (loading) {
    return (
      <div className={`leaderboard ${compact ? 'leaderboard--compact' : ''}`}>
        <p className="leaderboard__status">Cargando ranking...</p>
      </div>
    );
  }

  return (
    <div className={`leaderboard ${compact ? 'leaderboard--compact' : ''}`}>
      <h2 className="leaderboard__title">TOP 10 GLOBAL</h2>

      {top10.length === 0 ? (
        <p className="leaderboard__empty">Aun no hay puntuaciones. ¡Se el primero!</p>
      ) : (
        <ol className="leaderboard__list">
          {top10.map((entry, index) => {
            const isYou =
              playerName &&
              entry.playerName.toLowerCase() === playerName.toLowerCase();
            return (
              <li
                key={`${entry.playerName}-${index}`}
                className={`leaderboard__row ${isYou ? 'leaderboard__row--you' : ''}`}
              >
                <span className="leaderboard__rank">{index + 1}</span>
                <span className="leaderboard__name">{entry.playerName}</span>
                <span className="leaderboard__score">{entry.score}</span>
              </li>
            );
          })}
        </ol>
      )}

      {playerName && playerRank !== null && (
        <p className="leaderboard__your-rank">
          Tu posicion: <strong>#{playerRank}</strong> ({playerName})
        </p>
      )}

      {playerName && playerRank === null && top10.length > 0 && (
        <p className="leaderboard__your-rank leaderboard__your-rank--unranked">
          {playerName}, juega para entrar al ranking global
        </p>
      )}
    </div>
  );
}
