import { useCallback, useRef, useState } from 'react';
import type { PerkId } from '../types/perks';
import type { GlossaryId, RelicId } from '../types/combat';
import type { RunnerId, ShopItemId } from '../types/run';
import { findLowestWord, getEffectiveDifficulty } from '../utils/perkModifiers';
import { getFloorTierOffset } from '../utils/runTransitions';
import { RELIC_CATALOG } from '../data/relics';
import { getActiveSynergies, SYNERGY_CATALOG } from '../utils/synergyEngine';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameState } from '../hooks/useGameState';
import { useKeyboard } from '../hooks/useKeyboard';
import { loadPlayerName, savePlayerName } from '../services/leaderboard';
import { BossScreen } from './BossScreen';
import { EventScreen } from './EventScreen';
import { GameArea } from './GameArea';
import { GameOverScreen } from './GameOverScreen';
import { GlossaryPicker } from './GlossaryPicker';
import { HUD } from './HUD';
import { PerkPicker } from './PerkPicker';
import { RelicPicker } from './RelicPicker';
import { RunnerPicker } from './RunnerPicker';
import { ShopScreen } from './ShopScreen';
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
    dispatch({ type: 'BEGIN_RUN' });
  }, [dispatch, playerName]);

  const handleRunnerSelect = useCallback(
    (runnerId: RunnerId) => {
      dispatch({ type: 'SELECT_RUNNER', payload: runnerId });
    },
    [dispatch],
  );

  const handleGlossarySelect = useCallback(
    (glossaryId: GlossaryId) => {
      dispatch({ type: 'SELECT_GLOSSARY', payload: glossaryId });
    },
    [dispatch],
  );

  const handlePerkSelect = useCallback(
    (id: PerkId) => {
      dispatch({ type: 'SELECT_PERK', payload: id });
    },
    [dispatch],
  );

  const handleRelicSelect = useCallback(
    (id: RelicId) => {
      dispatch({ type: 'SELECT_RELIC', payload: id });
    },
    [dispatch],
  );

  const tierOffset = getFloorTierOffset(state);
  const effective = getEffectiveDifficulty(
    state.elapsedMs,
    tierOffset,
    state.activePerks,
    state.frozenUntilMs,
    state.runnerId,
    {
      tempoBuffUntilMs: state.tempoBuffUntilMs,
      flowSpawnMult: state.flowStats.spawnMult,
      flowSpeedMult: state.flowStats.speedMult,
    },
  );

  const radarTargetId =
    effective.modifiers.radarActive && state.words.length > 0
      ? findLowestWord(state.words)?.id ?? null
      : null;

  const synergyNames = getActiveSynergies(state).map(
    (id) => SYNERGY_CATALOG[id].name,
  );

  const relicNames = state.activeRelics.map((id) => RELIC_CATALOG[id].name);

  const inGame =
    state.status === 'playing' ||
    state.status === 'paused' ||
    state.status === 'perkPick' ||
    state.status === 'relicPick' ||
    state.status === 'boss';

  return (
    <div className="game">
      {state.status === 'idle' && (
        <StartScreen
          playerName={playerName}
          onPlayerNameChange={handlePlayerNameChange}
          onStart={handleStart}
        />
      )}

      {state.status === 'runnerPick' && (
        <RunnerPicker
          onSelect={handleRunnerSelect}
          onBack={() => dispatch({ type: 'GO_HOME' })}
        />
      )}

      {state.status === 'glossaryPick' && (
        <GlossaryPicker
          onSelect={handleGlossarySelect}
          onBack={() => dispatch({ type: 'BEGIN_RUN' })}
        />
      )}

      {state.status === 'shop' && (
        <ShopScreen
          runCoins={state.runCoins}
          lives={state.lives}
          floor={state.floor}
          onBuy={(id: ShopItemId) => dispatch({ type: 'SHOP_BUY', payload: id })}
          onLeave={() => dispatch({ type: 'SHOP_LEAVE' })}
        />
      )}

      {state.status === 'event' && state.pendingEvent && (
        <EventScreen
          event={state.pendingEvent}
          floor={state.floor}
          onChoice={(choice) =>
            dispatch({ type: 'EVENT_CHOICE', payload: choice })
          }
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
            difficultyTierOffset={tierOffset}
            activePerks={state.activePerks}
            frozenUntilMs={state.frozenUntilMs}
            isPaused={state.status === 'paused'}
            isPerkPick={state.status === 'perkPick' || state.status === 'relicPick'}
            floor={state.floor}
            runCoins={state.runCoins}
            rampsThisFloor={state.rampsThisFloor}
            runnerId={state.runnerId}
            precisionStreak={state.precisionStreak}
            ultimateCharge={state.ultimateCharge}
            inputBlinded={state.elapsedMs < state.inputBlindedUntilMs}
            synergyNames={synergyNames}
            relicNames={relicNames}
          />
          <div className="game__playfield">
            <GameArea
              areaRef={gameAreaRef}
              words={state.status === 'boss' ? [] : state.words}
              projectiles={state.letterProjectiles}
              input={state.input}
              poppingWordId={state.poppingWordId}
              radarTargetId={radarTargetId}
              onPopEnd={handlePopEnd}
            />
            {state.status === 'boss' && state.bossWord && (
              <BossScreen
                bossWord={state.bossWord}
                input={state.input}
                floor={state.floor}
                areaRef={gameAreaRef}
                bossAttack={state.bossAttack}
                remapActive={state.keyRemap !== null}
              />
            )}
          </div>
          {state.status === 'perkPick' && state.pendingPerkChoice && (
            <PerkPicker
              choices={state.pendingPerkChoice}
              onSelect={handlePerkSelect}
            />
          )}
          {state.status === 'relicPick' && state.pendingRelicChoice && (
            <RelicPicker
              choices={state.pendingRelicChoice}
              onSelect={handleRelicSelect}
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
          floor={state.floor}
          runnerId={state.runnerId}
          runCoins={state.runCoins}
          deathCause={state.deathCause}
          relics={state.relicsHistory}
          glossary={state.selectedGlossary}
          ultimatesUsed={state.ultimatesUsed}
          deflectedLetters={state.deflectedLetters}
          onRetry={() => dispatch({ type: 'RETRY' })}
          onHome={() => dispatch({ type: 'GO_HOME' })}
        />
      )}
    </div>
  );
}
