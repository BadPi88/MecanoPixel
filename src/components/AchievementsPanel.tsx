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
