import { useCallback, useRef, useState } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameState } from '../hooks/useGameState';
import { useKeyboard } from '../hooks/useKeyboard';
import { loadPlayerName, savePlayerName } from '../services/leaderboard';
import { GameArea } from './GameArea';
import { GameOverScreen } from './GameOverScreen';
import { HUD } from './HUD';
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

  return (
    <div className="game">
      {state.status === 'idle' && (
        <StartScreen
          playerName={playerName}
          onPlayerNameChange={handlePlayerNameChange}
          onStart={handleStart}
        />
      )}

      {(state.status === 'playing' || state.status === 'paused') && (
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
            isPaused={state.status === 'paused'}
          />
          <GameArea
            areaRef={gameAreaRef}
            words={state.words}
            input={state.input}
            poppingWordId={state.poppingWordId}
            onPopEnd={handlePopEnd}
          />
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
