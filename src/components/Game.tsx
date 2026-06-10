import { useCallback, useRef, useState } from 'react';
import type { PerkId } from '../types/perks';
import { findLowestWord, getEffectiveDifficulty } from '../utils/perkModifiers';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameState } from '../hooks/useGameState';
import { useKeyboard } from '../hooks/useKeyboard';
import { loadPlayerName, savePlayerName } from '../services/leaderboard';
import { GameArea } from './GameArea';
import { GameOverScreen } from './GameOverScreen';
import { HUD } from './HUD';
import { PerkPicker } from './PerkPicker';
import { StartScreen } from './StartScreen';

export function Game() {
  const { state, dispatch } = useGameState();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [playerName, setPlayerName] = useState(loadPlayerName);

  useGameLoop(state, dispatch, gameAreaRef);
  useKeyboard(state, dispatch);

  const handlePopEnd = useCallback(() => {
    dispatch({ type: 'CLEAR_POP' });
  }, [dispatch]);

  const handlePlayerNameChange = useCallback((name: string) => {
    setPlayerName(name);
    savePlayerName(name);
  }, []);

  const handleStart = useCallback(() => {
    savePlayerName(playerName.trim());
    dispatch({ type: 'START' });
  }, [dispatch, playerName]);

  const handlePerkSelect = useCallback(
    (id: PerkId) => {
      dispatch({ type: 'SELECT_PERK', payload: id });
    },
    [dispatch],
  );

  const effective = getEffectiveDifficulty(
    state.elapsedMs,
    state.difficultyTierOffset,
    state.activePerks,
    state.frozenUntilMs,
  );

  const radarTargetId =
    effective.modifiers.radarActive && state.words.length > 0
      ? findLowestWord(state.words)?.id ?? null
      : null;

  const inGame =
    state.status === 'playing' ||
    state.status === 'paused' ||
    state.status === 'perkPick';

  return (
    <div className="game">
      {state.status === 'idle' && (
        <StartScreen
          playerName={playerName}
          onPlayerNameChange={handlePlayerNameChange}
          onStart={handleStart}
        />
      )}

      {inGame && (
        <>
          <HUD
            playerName={playerName.trim()}
            score={state.score}
            lives={state.lives}
            combo={state.combo}
            correctChars={state.correctChars}
            elapsedMs={state.elapsedMs}
            input={state.input}
            showSpeedNotice={state.showSpeedNotice}
            rampBlockedNotice={state.rampBlockedNotice}
            difficultyTierOffset={state.difficultyTierOffset}
            activePerks={state.activePerks}
            frozenUntilMs={state.frozenUntilMs}
            isPaused={state.status === 'paused'}
            isPerkPick={state.status === 'perkPick'}
          />
          <GameArea
            areaRef={gameAreaRef}
            words={state.words}
            input={state.input}
            poppingWordId={state.poppingWordId}
            radarTargetId={radarTargetId}
            onPopEnd={handlePopEnd}
          />
          {state.status === 'perkPick' && state.pendingPerkChoice && (
            <PerkPicker
              choices={state.pendingPerkChoice}
              onSelect={handlePerkSelect}
            />
          )}
        </>
      )}

      {state.status === 'gameOver' && (
        <GameOverScreen
          playerName={playerName.trim()}
          score={state.score}
          correctChars={state.correctChars}
          wordsTyped={state.wordsTyped}
          elapsedMs={state.elapsedMs}
          maxWordsPerSecond={state.maxWordsPerSecond}
          onRetry={() => dispatch({ type: 'RETRY' })}
          onHome={() => dispatch({ type: 'GO_HOME' })}
        />
      )}
    </div>
  );
}
