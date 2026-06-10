import { useCallback, useEffect, useState } from 'react';
import type { LeaderboardResponse } from '../types/leaderboard';
import { fetchLeaderboard } from '../services/leaderboard';
import { Leaderboard } from './Leaderboard';
import { MetaShop } from './MetaShop';
import { PixelButton } from './PixelButton';

type HubTab = 'play' | 'unlocks';

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

  const loadLeaderboard = useCallback(async () => {
    setLoadingLb(true);
    try {
      const data = await fetchLeaderboard(playerName.trim() || undefined);
      setLeaderboard(data);
    } catch {
      setLeaderboard({
        top10: [],
        playerRank: null,
        playerBest: null,
        totalPlayers: 0,
      });
    } finally {
      setLoadingLb(false);
    }
  }, [playerName]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  const handleStart = () => {
    const trimmed = playerName.trim();
    if (trimmed.length < 2) {
      setNameError('Minimo 2 caracteres');
      return;
    }
    if (!/^[a-zA-Z0-9_\- ]+$/.test(trimmed)) {
      setNameError('Solo letras, numeros, espacio, _ y -');
      return;
    }
    setNameError('');
    onStart();
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
      </div>

      {tab === 'play' ? (
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
                COMO JUGAR
              </h2>
              <ul className="screen__instructions">
                <li>Elige un runner y sobrevive pisos de 3 subidas de ritmo</li>
                <li>Trampas (morado), bombas (naranja), bonus (oro)</li>
                <li>Tienda en pisos impares, eventos en pares, jefe cada 3</li>
                <li>Perk cada 3 subidas de ritmo — meta coins al morir</li>
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
      ) : (
        <div className="screen__panel pixel-panel screen__column screen__column--wide">
          <MetaShop />
        </div>
      )}
    </div>
  );
}
