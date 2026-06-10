import { useCallback, useRef } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameState } from '../hooks/useGameState';
import { useKeyboard } from '../hooks/useKeyboard';
import { GameArea } from './GameArea';
import { GameOverScreen } from './GameOverScreen';
import { HUD } from './HUD';
import { StartScreen } from './StartScreen';

export function Game() {
  const { state, dispatch } = useGameState();
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useGameLoop(state, dispatch, gameAreaRef);
  useKeyboard(state, dispatch);

  const handlePopEnd = useCallback(() => {
    dispatch({ type: 'CLEAR_POP' });
  }, [dispatch]);

  return (
    <div className="game">
      {state.status === 'idle' && (
        <StartScreen onStart={() => dispatch({ type: 'START' })} />
      )}

      {(state.status === 'playing' || state.status === 'paused') && (
        <>
          <HUD
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
          score={state.score}
          correctChars={state.correctChars}
          wordsTyped={state.wordsTyped}
          elapsedMs={state.elapsedMs}
          maxFallSpeed={state.maxFallSpeed}
          onRetry={() => dispatch({ type: 'RETRY' })}
          onHome={() => dispatch({ type: 'GO_HOME' })}
        />
      )}
    </div>
  );
}
