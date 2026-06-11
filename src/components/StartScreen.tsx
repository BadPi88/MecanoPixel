import { useEffect, useState } from 'react';
import type { LeaderboardResponse } from '../types/leaderboard';
import { fetchLeaderboard } from '../services/leaderboard';
import {
  clearSession,
  loadSession,
  loginOrRegister,
  type ProfileSession,
} from '../services/profile';
import { Leaderboard } from './Leaderboard';
import { MetaShop } from './MetaShop';
import { PixelButton } from './PixelButton';
import { SettingsPanel } from './SettingsPanel';

type HubTab = 'play' | 'unlocks' | 'settings';

interface StartScreenProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onStart: () => void;
}

export function StartScreen({
  playerName,
  onPlayerNameChange,
  onStart,
}: StartScreenProps) {
  const [tab, setTab] = useState<HubTab>('play');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null,
  );
  const [loadingLb, setLoadingLb] = useState(true);
  const [nameError, setNameError] = useState('');
  const [session, setSession] = useState<ProfileSession | null>(loadSession);
  const [pin, setPin] = useState('');
  const [profileStatus, setProfileStatus] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);

  // Sin setState sincrono antes del primer await: loadingLb ya arranca en
  // true y las recargas posteriores mantienen visible la lista anterior.
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

  const handleLogin = async () => {
    const trimmed = validateName();
    if (!trimmed) return;
    if (!/^\d{4}$/.test(pin)) {
      setProfileError('El PIN debe tener 4 digitos');
      return;
    }
    setProfileError('');
    setProfileStatus('');
    setProfileBusy(true);
    try {
      const result = await loginOrRegister(trimmed, pin);
      setSession({ playerName: trimmed, pin });
      setPin('');
      setProfileStatus(
        result.created
          ? 'Perfil creado: tu progreso se guardara en la nube'
          : 'Progreso sincronizado con tu perfil',
      );
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'No se pudo conectar',
      );
    } finally {
      setProfileBusy(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setProfileStatus('');
    setProfileError('');
  };

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
              />
              {nameError && <p className="screen__error">{nameError}</p>}

              <h2 className="screen__panel-title screen__panel-title--spaced">
                PERFIL
              </h2>
              {session ? (
                <div className="profile-box">
                  <p className="profile-box__status">
                    PERFIL: {session.playerName} — progreso en la nube
                  </p>
                  <PixelButton variant="secondary" onClick={handleLogout}>
                    SALIR
                  </PixelButton>
                </div>
              ) : (
                <div className="profile-box">
                  <p className="profile-box__hint">
                    Crea un perfil con PIN para guardar tu progreso y jugar
                    desde cualquier dispositivo
                  </p>
                  <div className="profile-box__row">
                    <input
                      type="password"
                      className="pixel-input pixel-input--pin"
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                        setProfileError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleLogin();
                      }}
                      placeholder="PIN"
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="current-password"
                      aria-label="PIN de 4 digitos"
                    />
                    <PixelButton
                      variant="secondary"
                      disabled={profileBusy}
                      onClick={() => void handleLogin()}
                    >
                      {profileBusy ? '...' : 'ENTRAR'}
                    </PixelButton>
                  </div>
                </div>
              )}
              {profileStatus && (
                <p className="screen__status screen__status--highlight">
                  {profileStatus}
                </p>
              )}
              {profileError && <p className="screen__error">{profileError}</p>}

              <h2 className="screen__panel-title screen__panel-title--spaced">
                COMO JUGAR
              </h2>
              <ul className="screen__instructions">
                <li>Elige runner y glosario; sobrevive pisos de 3 subidas</li>
                <li>Trampas (!), bombas (*), bonus (+); V/A/S = verbo, adjetivo, sustantivo</li>
                <li>Escribir sin Backspace carga el ULTIMATE — disparalo con TAB</li>
                <li>Reliquia cada 2 pisos; tienda/evento entre pisos, jefe cada 3</li>
                <li>Letras sueltas que caen se desvian tecleandolas (input vacio)</li>
                <li>Sin tildes: escribe tecnologia, no tecnología</li>
              </ul>
            </div>

            <PixelButton onClick={handleStart} className="screen__btn">
              NUEVA RUN
            </PixelButton>
          </div>

          <div className="screen__panel pixel-panel screen__column">
            <Leaderboard
              top10={leaderboard?.top10 ?? []}
              playerRank={leaderboard?.playerRank ?? null}
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
