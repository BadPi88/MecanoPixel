import { useEffect, useState } from 'react';
import type { LeaderboardResponse } from '../types/leaderboard';
import type { DailyLeaderboardResponse } from '../types/daily';
import { RUNNER_CATALOG } from '../data/runners';
import { ASCENSION_LEVELS } from '../data/ascension';
import { GLOSSARY_CATALOG } from '../data/glossaries';
import { fetchLeaderboard } from '../services/leaderboard';
import { fetchDailyLeaderboard } from '../services/daily';
import { fetchWeeklyLeaderboard } from '../services/weekly';
import type { WeeklyLeaderboardResponse } from '../types/weekly';
import { loadMeta } from '../services/meta';
import {
  loginOrRegister,
  logoutProfile,
  restoreProfileSession,
  sendPasswordReset,
  subscribeToAuthEvents,
  updateProfilePassword,
  type ProfileSession,
} from '../services/profile';
import { AchievementsPanel } from './AchievementsPanel';
import { Leaderboard } from './Leaderboard';
import { MetaShop } from './MetaShop';
import { PixelButton } from './PixelButton';
import { SettingsPanel } from './SettingsPanel';

type HubTab = 'play' | 'logros' | 'unlocks' | 'settings';

interface StartScreenProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onStart: () => void;
  onDailyStart: () => void;
  onWeeklyStart: () => void;
  ascensionLevel?: number;
  onAscensionChange?: (level: number) => void;
}

export function StartScreen({
  playerName,
  onPlayerNameChange,
  onStart,
  onDailyStart,
  onWeeklyStart,
  ascensionLevel = 0,
  onAscensionChange,
}: StartScreenProps) {
  const meta = loadMeta();
  const [tab, setTab] = useState<HubTab>('play');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null,
  );
  const [dailyBoard, setDailyBoard] = useState<DailyLeaderboardResponse | null>(
    null,
  );
  const [weeklyBoard, setWeeklyBoard] = useState<WeeklyLeaderboardResponse | null>(null);
  const [loadingLb, setLoadingLb] = useState(true);
  const [nameError, setNameError] = useState('');
  const [session, setSession] = useState<ProfileSession | null>(null);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(() => new URLSearchParams(window.location.search).has('password-reset'));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void restoreProfileSession()
      .then((restored) => {
        if (cancelled) return;
        setSession(restored);
        if (restored?.playerName) onPlayerNameChange(restored.playerName);
      })
      .catch(() => { if (!cancelled) setSession(null); });
    return () => { cancelled = true; };
  }, [onPlayerNameChange]);

  useEffect(() => {
    try {
      return subscribeToAuthEvents((event) => {
        if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
        if (event === 'SIGNED_OUT') setSession(null);
      });
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      try {
        const data = await fetchLeaderboard(playerName.trim() || undefined);
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
      } finally {
        if (!cancelled) setLoadingLb(false);
      }
    }

    void loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [playerName]);

  useEffect(() => {
    let cancelled = false;
    void fetchWeeklyLeaderboard(playerName.trim() || undefined).then((data) => {
      if (!cancelled) setWeeklyBoard(data);
    }).catch(() => { if (!cancelled) setWeeklyBoard(null); });
    return () => { cancelled = true; };
  }, [playerName]);

  useEffect(() => {
    let cancelled = false;
    void fetchDailyLeaderboard(playerName.trim() || undefined).then((data) => {
      if (!cancelled) setDailyBoard(data);
    }).catch(() => { if (!cancelled) setDailyBoard(null); });
    return () => {
      cancelled = true;
    };
  }, [playerName]);

  const validateName = (): string | null => {
    const trimmed = playerName.trim();
    if (trimmed.length < 2) {
      setNameError('Minimo 2 caracteres');
      return null;
    }
    if (!/^[a-zA-Z0-9_\- ]+$/.test(trimmed)) {
      setNameError('Solo letras, numeros, espacio, _ y -');
      return null;
    }
    setNameError('');
    return trimmed;
  };

  const handleStart = () => {
    if (!validateName()) return;
    onStart();
  };

  const handleDailyStart = () => {
    if (!validateName()) return;
    onDailyStart();
  };

  const handleWeeklyStart = () => {
    if (!validateName()) return;
    onWeeklyStart();
  };

  const handleAccountAuth = async (action: 'register' | 'login') => {
    const trimmed = action === 'register' ? validateName() : playerName.trim();
    if (action === 'register' && !trimmed) return;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setProfileError('Escribe un correo valido');
      return;
    }
    if (action === 'register' && password.length < 10) {
      setProfileError('La contrasena debe tener al menos 10 caracteres');
      return;
    }
    if (action === 'register' && password !== confirmPassword) {
      setProfileError('Las contrasenas no coinciden');
      return;
    }
    setProfileError('');
    setProfileStatus('');
    setProfileBusy(true);
    try {
      const result = await loginOrRegister(trimmed ?? '', email, password, action);
      setSession(result.session);
      if (result.session) onPlayerNameChange(result.session.playerName);
      setPassword('');
      setConfirmPassword('');
      setProfileStatus(result.needsEmailConfirmation
        ? 'Cuenta creada. Confirma el correo para activar la sincronizacion.'
        : result.created
          ? 'Cuenta creada: tu progreso ya se guarda en la nube'
          : 'Sesion iniciada: progreso sincronizado desde la nube');
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'No se pudo conectar',
      );
    } finally {
      setProfileBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) { setProfileError('Escribe tu correo para enviarte el enlace'); return; }
    setProfileBusy(true); setProfileError('');
    try { await sendPasswordReset(email); setProfileStatus('Te enviamos un enlace para restablecer la contrasena.'); }
    catch (err) { setProfileError(err instanceof Error ? err.message : 'No se pudo enviar el correo'); }
    finally { setProfileBusy(false); }
  };

  const handlePasswordUpgrade = async () => {
    if (newPassword.length < 10 || newPassword !== confirmPassword) {
      setProfileError(newPassword.length < 10
        ? 'La contrasena debe tener al menos 10 caracteres'
        : 'Las contrasenas no coinciden');
      return;
    }
    setProfileBusy(true);
    setProfileError('');
    try {
      await updateProfilePassword(newPassword);
      setRecoveryMode(false);
      const restored = await restoreProfileSession();
      setSession(restored);
      if (restored?.playerName) onPlayerNameChange(restored.playerName);
      window.history.replaceState({}, '', '/');
      setNewPassword('');
      setConfirmPassword('');
      setProfileStatus('Contrasena actualizada. Ya puedes guardar y competir.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'No se pudo actualizar la contrasena');
    } finally {
      setProfileBusy(false);
    }
  };

  const handleLogout = async () => {
    await logoutProfile();
    setSession(null);
    setProfileStatus('');
    setProfileError('');
  };

  if (window.location.pathname === '/recover-password') {
    return (
      <main className="screen screen--start">
        <h1 className="screen__title">KEY RUNNER</h1>
        <p className="screen__subtitle">RECUPERAR CONTRASENA</p>
        <section className="screen__panel pixel-panel screen__column">
          <h2 className="screen__panel-title">NUEVA CONTRASENA</h2>
          <p className="profile-box__hint">Elige una contrasena nueva para tu cuenta.</p>
          <input
            type="password"
            className="pixel-input"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value.slice(0, 128))}
            placeholder="Nueva contrasena (10 caracteres minimo)"
            autoComplete="new-password"
            aria-label="Nueva contrasena"
          />
          <input
            type="password"
            className="pixel-input"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value.slice(0, 128))}
            placeholder="Repite la contrasena"
            autoComplete="new-password"
            aria-label="Repite la contrasena"
          />
          <PixelButton disabled={profileBusy} onClick={() => void handlePasswordUpgrade()}>
            {profileBusy ? '...' : 'ACTUALIZAR CONTRASENA'}
          </PixelButton>
          {profileStatus && <p className="screen__status screen__status--highlight">{profileStatus}</p>}
          {profileError && <p className="screen__error">{profileError}</p>}
          <a className="profile-box__hint" href="/">Volver al inicio</a>
        </section>
      </main>
    );
  }

  const dailyChallenge = dailyBoard?.challenge;
  const dailyRunner =
    dailyChallenge && dailyChallenge.runnerId in RUNNER_CATALOG
      ? RUNNER_CATALOG[dailyChallenge.runnerId as keyof typeof RUNNER_CATALOG]
      : null;
  const dailyGlossary =
    dailyChallenge && dailyChallenge.glossaryId in GLOSSARY_CATALOG
      ? GLOSSARY_CATALOG[dailyChallenge.glossaryId as keyof typeof GLOSSARY_CATALOG]
      : null;

  return (
    <div className="screen screen--start">
      <h1 className="screen__title">KEY RUNNER</h1>
      <p className="screen__subtitle">ROGUELIKE DE MECANOGRAFIA</p>

      <div className="hub-tabs">
        <button
          type="button"
          className={`hub-tabs__tab ${tab === 'play' ? 'hub-tabs__tab--active' : ''}`}
          onClick={() => setTab('play')}
        >
          JUGAR
        </button>
        <button
          type="button"
          className={`hub-tabs__tab ${tab === 'logros' ? 'hub-tabs__tab--active' : ''}`}
          onClick={() => setTab('logros')}
        >
          LOGROS
        </button>
        <button
          type="button"
          className={`hub-tabs__tab ${tab === 'unlocks' ? 'hub-tabs__tab--active' : ''}`}
          onClick={() => setTab('unlocks')}
        >
          DESBLOQUEOS
        </button>
        <button
          type="button"
          className={`hub-tabs__tab ${tab === 'settings' ? 'hub-tabs__tab--active' : ''}`}
          onClick={() => setTab('settings')}
        >
          AJUSTES
        </button>
      </div>

      {tab === 'settings' && (
        <div className="screen__panel pixel-panel screen__column screen__column--wide">
          <SettingsPanel />
        </div>
      )}

      {tab === 'unlocks' && (
        <div className="screen__panel pixel-panel screen__column screen__column--wide">
          <MetaShop />
        </div>
      )}

      {tab === 'logros' && (
        <div className="screen__panel pixel-panel screen__column screen__column--wide">
          <AchievementsPanel meta={loadMeta()} />
        </div>
      )}

      {tab === 'play' && (
        <div className="screen__layout">
          <div className="screen__column">
            <div className="screen__panel pixel-panel">
              <h2 className="screen__panel-title">TU NOMBRE</h2>
              <input
                type="text"
                className="pixel-input"
                value={playerName}
                onChange={(e) => {
                  onPlayerNameChange(e.target.value);
                  setNameError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStart();
                }}
                placeholder="Escribe aqui..."
                maxLength={16}
                autoComplete="username"
                autoFocus
                disabled={Boolean(session)}
              />
              {nameError && <p className="screen__error">{nameError}</p>}

              <h2 className="screen__panel-title screen__panel-title--spaced">
                PERFIL
              </h2>
              {recoveryMode ? (
                <div className="profile-box">
                  <p className="profile-box__hint">Elige una contrasena nueva para tu cuenta.</p>
                  <input type="password" className="pixel-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value.slice(0, 128))} placeholder="Nueva contrasena (10 caracteres minimo)" autoComplete="new-password" />
                  <input type="password" className="pixel-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value.slice(0, 128))} placeholder="Repite la contrasena" autoComplete="new-password" />
                  <PixelButton disabled={profileBusy} onClick={() => void handlePasswordUpgrade()}>{profileBusy ? '...' : 'ACTUALIZAR CONTRASENA'}</PixelButton>
                </div>
              ) : session ? (
                <div className="profile-box">
                  <p className="profile-box__status">PERFIL: {session.playerName} — progreso en la nube</p>
                  <PixelButton variant="secondary" onClick={() => void handleLogout()}>SALIR</PixelButton>
                </div>
              ) : (
                <div className="profile-box">
                  <p className="profile-box__hint">
                    Crea una cuenta con nombre unico y contrasena para sincronizar tu progreso entre ordenadores.
                  </p>
                  <div className="profile-box__row profile-box__row--stacked">
                    <input type="email" className="pixel-input" value={email} onChange={(e) => { setEmail(e.target.value); setProfileError(''); }} placeholder="Correo electronico" autoComplete="email" />
                    <input
                      type="password"
                      className="pixel-input"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value.slice(0, 128));
                        setProfileError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleAccountAuth('login');
                      }}
                      placeholder="Contrasena (10 caracteres minimo)"
                      autoComplete="current-password"
                      aria-label="Contrasena"
                    />
                    <input type="password" className="pixel-input" value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value.slice(0, 128))}
                      placeholder="Repite para crear cuenta" autoComplete="new-password" />
                    <PixelButton disabled={profileBusy} onClick={() => void handleAccountAuth('register')}>
                      {profileBusy ? '...' : 'CREAR CUENTA'}
                    </PixelButton>
                    <PixelButton variant="secondary" disabled={profileBusy} onClick={() => void handleAccountAuth('login')}>
                      INICIAR SESION
                    </PixelButton>
                    <PixelButton variant="secondary" disabled={profileBusy} onClick={() => void handlePasswordReset()}>OLVIDE MI CONTRASENA</PixelButton>
                  </div>
                </div>
              )}
              {profileStatus && (
                <p className="screen__status screen__status--highlight">
                  {profileStatus}
                </p>
              )}
              {profileError && <p className="screen__error">{profileError}</p>}

              {dailyChallenge && dailyRunner && dailyGlossary && (
                <>
                  <h2 className="screen__panel-title screen__panel-title--spaced">
                    DESAFIO DIARIO
                  </h2>
                  <p className="daily-challenge__hint">
                    {dailyRunner.name} · {dailyGlossary.name} — ranking del dia
                  </p>
                  {dailyBoard && dailyBoard.playerRank !== null && (
                    <p className="screen__status">
                      Tu mejor hoy: #{dailyBoard.playerRank}
                      {dailyBoard.playerBest
                        ? ` (${dailyBoard.playerBest.score} pts)`
                        : ''}
                    </p>
                  )}
                </>
              )}

              {weeklyBoard && (
                <>
                  <h2 className="screen__panel-title screen__panel-title--spaced">RETO SEMANAL</h2>
                  <p className="daily-challenge__hint">
                    {RUNNER_CATALOG[weeklyBoard.challenge.runnerId as keyof typeof RUNNER_CATALOG]?.name ?? weeklyBoard.challenge.runnerId}
                    {' · '}
                    {GLOSSARY_CATALOG[weeklyBoard.challenge.glossaryId as keyof typeof GLOSSARY_CATALOG]?.name ?? weeklyBoard.challenge.glossaryId}
                    {' · ASCENSION 1 · ENDLESS · Semana desde '}{weeklyBoard.week}
                  </p>
                  {weeklyBoard.playerRank !== null && <p className="screen__status">Tu mejor semanal: #{weeklyBoard.playerRank}</p>}
                  {weeklyBoard.top10.slice(0, 3).map((entry, index) => (
                    <p key={entry.playerName} className="achievements-panel__mission-meta">
                      {index + 1}. {entry.playerName} — {entry.score} pts
                    </p>
                  ))}
                </>
              )}

              <h2 className="screen__panel-title screen__panel-title--spaced">
                COMO JUGAR
              </h2>
              <ul className="screen__instructions">
                <li>Elige runner y glosario; 3 subidas por piso de combate</li>
                <li>Mapa con rutas: tienda, tesoro, elite, descanso, jefe</li>
                <li>ULTIMATE con TAB; boton VER BUILD para consultar tu build</li>
                <li>Biomas cambian las reglas cada 3 pisos</li>
                <li>Desde el piso 7 aparecen algunas tildes: escribe tecnologia y tambien tecnología</li>
              </ul>

              {meta.ascensionUnlocked && onAscensionChange && (
                <>
                  <h2 className="screen__panel-title screen__panel-title--spaced">
                    ASCENSION
                  </h2>
                  <div className="ascension-picker">
                    {ASCENSION_LEVELS.filter(
                      (l) => l.level <= meta.maxAscension,
                    ).map((level) => (
                      <button
                        key={level.level}
                        type="button"
                        className={`ascension-picker__btn${
                          ascensionLevel === level.level
                            ? ' ascension-picker__btn--active'
                            : ''
                        }`}
                        onClick={() => onAscensionChange(level.level)}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                  <p className="ascension-picker__desc">
                    {ASCENSION_LEVELS[ascensionLevel]?.description}
                  </p>
                </>
              )}
            </div>

            <PixelButton onClick={handleStart} className="screen__btn">
              NUEVA RUN
            </PixelButton>
            <PixelButton
              variant="secondary"
              onClick={handleDailyStart}
              className="screen__btn"
            >
              DESAFIO DIARIO
            </PixelButton>
            <PixelButton variant="secondary" onClick={handleWeeklyStart} className="screen__btn">
              RETO SEMANAL
            </PixelButton>
          </div>

          <div className="screen__panel pixel-panel screen__column">
            <Leaderboard
              top10={leaderboard?.top10 ?? []}
              playerRank={leaderboard?.playerRank ?? null}
              playerBest={leaderboard?.playerBest}
              playerName={playerName.trim()}
              totalPlayers={leaderboard?.totalPlayers ?? 0}
              loading={loadingLb}
            />
          </div>
        </div>
      )}
    </div>
  );
}
