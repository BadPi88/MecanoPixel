import {
  ACHIEVEMENT_CATALOG,
  ACHIEVEMENT_IDS,
  type AchievementId,
} from '../data/achievements';
import {
  DAILY_MISSION_CATALOG,
  type DailyMissionId,
} from '../data/dailyMissions';
import type { MetaProgress } from '../services/meta';

interface AchievementsPanelProps {
  meta: MetaProgress;
}

export function AchievementsPanel({ meta }: AchievementsPanelProps) {
  const mission = DAILY_MISSION_CATALOG[meta.daily.missionId as DailyMissionId];
  const missionDone = meta.daily.claimed;
  const missionPct = mission
    ? Math.min(100, Math.round((meta.daily.progress / mission.target) * 100))
    : 0;

  return (
    <div className="achievements-panel">
      <section className="achievements-panel__section">
        <h2 className="screen__panel-title screen__panel-title--spaced">APRENDIZAJE</h2>
        {meta.learning.history.length === 0 ? (
          <p className="achievements-panel__desc">Completa una run para empezar tu historial de ritmo y precision.</p>
        ) : (
          <>
            <p className="achievements-panel__mission-meta">
              Ultima run: {meta.learning.history.at(-1)?.wpm ?? 0} WPM · {meta.learning.history.at(-1)?.accuracy ?? 100}% precision · {meta.learning.history.at(-1)?.wordsTyped ?? 0} palabras
            </p>
            <div className="learning-history" aria-label="Tendencia de las ultimas runs">
              {meta.learning.history.slice(-10).map((run) => (
                <div key={run.id} className="learning-history__run" title={`${run.wpm} WPM, ${run.accuracy}% precision`}>
                  <span className="learning-history__bar" style={{ height: `${Math.max(8, Math.min(100, run.wpm * 1.5))}%` }} />
                </div>
              ))}
            </div>
            <p className="achievements-panel__mission-meta">Ritmo por run (ultimas 10); historial guardado: {meta.learning.history.length} / 30</p>
            <div className="learning-history__details">
              {meta.learning.history.slice(-5).reverse().map((run) => (
                <p key={run.id}>{new Date(run.date).toLocaleDateString()} · Piso {run.floor} · {run.wpm} WPM · {run.accuracy}% · {run.wordsTyped} palabras</p>
              ))}
            </div>
            {Object.keys(meta.learning.mistakeCounts).length > 0 && (
              <p className="achievements-panel__mission-meta">
                Errores frecuentes: {Object.entries(meta.learning.mistakeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([char, count]) => `${char.toUpperCase()} (${count})`).join(' · ')}
              </p>
            )}
          </>
        )}
      </section>

      <section className="achievements-panel__section">
        <h2 className="screen__panel-title">MISION DIARIA</h2>
        {mission && (
          <>
            <p className="achievements-panel__mission-label">{mission.label}</p>
            <div className="achievements-panel__progress-bar">
              <div
                className="achievements-panel__progress-fill"
                style={{ width: `${missionPct}%` }}
              />
            </div>
            <p className="achievements-panel__mission-meta">
              {meta.daily.progress} / {mission.target}
              {missionDone
                ? ' — ¡Completada!'
                : ` — Recompensa: ${mission.reward} meta coins`}
            </p>
          </>
        )}
      </section>

      <section className="achievements-panel__section">
        <h2 className="screen__panel-title screen__panel-title--spaced">
          LOGROS ({meta.unlockedAchievements.length}/{ACHIEVEMENT_IDS.length})
        </h2>
        <ul className="achievements-panel__list">
          {ACHIEVEMENT_IDS.map((id: AchievementId) => {
            const def = ACHIEVEMENT_CATALOG[id];
            const unlocked = meta.unlockedAchievements.includes(id);
            return (
              <li
                key={id}
                className={`achievements-panel__item ${unlocked ? 'achievements-panel__item--unlocked' : ''}`}
              >
                <span className="achievements-panel__icon">
                  {unlocked ? '★' : '·'}
                </span>
                <div>
                  <span className="achievements-panel__name">{def.title}</span>
                  <p className="achievements-panel__desc">{def.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
