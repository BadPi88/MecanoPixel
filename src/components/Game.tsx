import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMeta } from '../services/meta';
import type { PerkId } from '../types/perks';
import type { GlossaryId, RelicId } from '../types/combat';
import type { RunnerId, ShopItemId } from '../types/run';
import type { BossId } from '../types/combat';
import { findLowestWord, getEffectiveDifficulty } from '../utils/perkModifiers';
import { BIOME_CATALOG } from '../data/biomes';
import { getFloorTierOffset } from '../utils/runTransitions';
import { RELIC_CATALOG } from '../data/relics';
import { getActiveSynergies, SYNERGY_CATALOG } from '../utils/synergyEngine';
import { useGameAudio } from '../hooks/useGameAudio';
import { useGameLoop } from '../hooks/useGameLoop';
import { useGameState } from '../hooks/useGameState';
import { useKeyboard } from '../hooks/useKeyboard';
import { loadPlayerName, savePlayerName } from '../services/leaderboard';
import { syncMetaToProfile } from '../services/profile';
import { BossScreen } from './BossScreen';
import { EventScreen } from './EventScreen';
import { GameArea } from './GameArea';
import { GameOverScreen } from './GameOverScreen';
import { GlossaryPicker } from './GlossaryPicker';
import { HUD } from './HUD';
import { PerkPicker } from './PerkPicker';
import { RelicPicker } from './RelicPicker';
import { RunnerPicker } from './RunnerPicker';
import { getBiomeModifierLabel } from '../utils/biomeModifiers';
import { BuildOverlay } from './BuildOverlay';
import { ContextualHint } from './ContextualHint';
import { MapScreen } from './MapScreen';
import { ShopScreen } from './ShopScreen';
import { VictoryScreen } from './VictoryScreen';
import { PixelButton } from './PixelButton';
import { StartScreen } from './StartScreen';
import { TutorialOverlay } from './TutorialOverlay';
import { BossSprite } from '../assets/bossSprites';
import { useDialogFocus } from '../hooks/useDialogFocus';

export function Game() {
  const { state, dispatch } = useGameState();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const oracleDialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(oracleDialogRef, state.status === 'oraclePick');
  const [playerName, setPlayerName] = useState(loadPlayerName);
  const [showTutorial, setShowTutorial] = useState(
    () => !loadMeta().tutorialComplete,
  );

  const [areaShake, setAreaShake] = useState(false);
  const prevLivesRef = useRef(state.lives);
  const previousBossRef = useRef({ status: state.status, bossId: state.bossId });
  const bossOutroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bossDefeatEffect, setBossDefeatEffect] = useState<BossId | null>(null);

  useEffect(() => {
    const previous = previousBossRef.current;
    previousBossRef.current = { status: state.status, bossId: state.bossId };
    if (
      previous.status === 'boss' &&
      state.status !== 'boss' &&
      state.status !== 'gameOver' &&
      previous.bossId
    ) {
      setBossDefeatEffect(previous.bossId);
      if (bossOutroTimerRef.current) clearTimeout(bossOutroTimerRef.current);
      bossOutroTimerRef.current = setTimeout(() => {
        setBossDefeatEffect(null);
        bossOutroTimerRef.current = null;
      }, 1_350);
    }
  }, [state.status, state.bossId]);

  useEffect(
    () => () => {
      if (bossOutroTimerRef.current) clearTimeout(bossOutroTimerRef.current);
    },
    [],
  );

  useGameLoop(state, dispatch, gameAreaRef);
  useKeyboard(state, dispatch);
  useGameAudio(state);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sync = (event: Event) => {
      const meta = (event as CustomEvent<ReturnType<typeof loadMeta>>).detail;
      if (!meta) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void syncMetaToProfile(meta), 400);
    };
    window.addEventListener('keyrunner:meta-changed', sync);
    return () => {
      window.removeEventListener('keyrunner:meta-changed', sync);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (state.lives < prevLivesRef.current) {
      setAreaShake(true);
      const timer = setTimeout(() => setAreaShake(false), 380);
      prevLivesRef.current = state.lives;
      return () => clearTimeout(timer);
    }
    prevLivesRef.current = state.lives;
  }, [state.lives]);

  const handlePopEnd = useCallback(() => {
    dispatch({ type: 'CLEAR_POP' });
  }, [dispatch]);

  const handlePlayerNameChange = useCallback((name: string) => {
    setPlayerName(name);
    savePlayerName(name);
  }, []);

  const [ascensionLevel, setAscensionLevel] = useState(0);

  const handleStart = useCallback(() => {
    savePlayerName(playerName.trim());
    dispatch({ type: 'BEGIN_RUN', payload: { ascensionLevel } });
  }, [dispatch, playerName, ascensionLevel]);

  const handleDailyStart = useCallback(() => {
    savePlayerName(playerName.trim());
    dispatch({ type: 'BEGIN_RUN', payload: { dailyRun: true } });
  }, [dispatch, playerName]);

  const handleWeeklyStart = useCallback(() => {
    savePlayerName(playerName.trim());
    dispatch({ type: 'BEGIN_RUN', payload: { weeklyRun: true } });
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
    state.status === 'boss' ||
    state.status === 'oraclePick';

  return (
    <div className="game">
      {bossDefeatEffect && (
        <div
          className={`boss-defeat boss-defeat--${bossDefeatEffect}`}
          aria-live="polite"
          aria-label="Jefe derrotado"
        >
          <BossSprite bossId={bossDefeatEffect} size={160} />
          <span>JEFE DERROTADO</span>
        </div>
      )}
      {state.status === 'idle' && (
        <StartScreen
          playerName={playerName}
          onPlayerNameChange={handlePlayerNameChange}
          onStart={handleStart}
          onDailyStart={handleDailyStart}
          onWeeklyStart={handleWeeklyStart}
          ascensionLevel={ascensionLevel}
          onAscensionChange={setAscensionLevel}
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

      {state.status === 'mapPick' && (
        <MapScreen
          floor={state.floor}
          options={state.mapRoomOptions}
          actMap={state.actMap}
          actMapNodeId={state.actMapNodeId}
          bossSkippedPending={state.bossSkippedPending}
          onPick={(roomId) =>
            dispatch({ type: 'PICK_ROOM', payload: roomId })
          }
        />
      )}

      {state.status === 'victory' && (
        <VictoryScreen
          score={state.score}
          floor={state.floor}
          runnerId={state.runnerId}
          relics={state.relicsHistory}
          elapsedMs={state.elapsedMs}
          correctChars={state.correctChars}
          correctKeyPresses={state.correctKeyPresses}
          mistakes={state.mistakes}
          mistakesByChar={state.mistakesByChar}
          wordsTyped={state.wordsTyped}
          ultimatesUsed={state.ultimatesUsed}
          deflectedLetters={state.deflectedLetters}
          reachedBoss={state.reachedBoss}
          ascensionLevel={state.ascensionLevel}
          runSeed={state.runSeed}
          onContinueEndless={() => dispatch({ type: 'CONTINUE_ENDLESS' })}
          onHome={() => dispatch({ type: 'VICTORY_HOME' })}
        />
      )}

      {state.status === 'shop' && (
        <ShopScreen
          runCoins={state.runCoins}
          lives={state.lives}
          offers={state.shopOffers}
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

      {showTutorial && inGame && (
        <TutorialOverlay onComplete={() => setShowTutorial(false)} />
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
            biomeId={state.biomeId}
            runCoins={state.runCoins}
            rampsThisFloor={state.rampsThisFloor}
            runnerId={state.runnerId}
            precisionStreak={state.precisionStreak}
            ultimateCharge={state.ultimateCharge}
            inputBlinded={state.elapsedMs < state.inputBlindedUntilMs}
            synergyNames={synergyNames}
            relicNames={relicNames}
            selectedGlossary={state.selectedGlossary}
            gameStatus={state.status}
            eliteModifierId={state.eliteModifierId}
            onToggleBuild={
              state.status === 'playing' ||
              state.status === 'paused' ||
              state.status === 'boss'
                ? () => dispatch({ type: 'TOGGLE_BUILD_OVERLAY' })
                : undefined
            }
          />
          <div className="game__playfield">
            {state.status === 'playing' &&
              state.elapsedMs < state.biomeIntroUntilMs && (
                <div className="biome-intro" role="status">
                  <span className="biome-intro__label">
                    {BIOME_CATALOG[state.biomeId].enterLabel}
                    <br />
                    <span className="biome-intro__mod">
                      {getBiomeModifierLabel(state.biomeId)}
                    </span>
                    <br />
                    <span className="biome-intro__story">
                      {BIOME_CATALOG[state.biomeId].story}
                    </span>
                  </span>
                </div>
              )}
            <GameArea
              areaRef={gameAreaRef}
              biomeId={state.biomeId}
              words={state.status === 'boss' ? [] : state.words}
              projectiles={state.letterProjectiles}
              input={state.input}
              poppingWordId={state.poppingWordId}
              radarTargetId={radarTargetId}
              onPopEnd={handlePopEnd}
              shake={areaShake}
            />
            {state.status === 'boss' && state.bossWord && state.bossId && (
              <BossScreen
                bossId={state.bossId}
                bossWord={state.bossWord}
                bossWords={state.bossWords}
                activeBossWordIndex={state.activeBossWordIndex}
                bossPhase={state.bossPhase}
                input={state.input}
                floor={state.floor}
                areaRef={gameAreaRef}
                bossAttack={state.bossAttack}
                remapActive={state.keyRemap !== null}
                telegraphX={state.bossTelegraphX}
                elapsedMs={state.elapsedMs}
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
              state={state}
              onSelect={handleRelicSelect}
            />
          )}
          {state.showBuildOverlay && (
            <BuildOverlay
              activeRelics={state.activeRelics}
              activePerks={state.activePerks}
              perksHistory={state.perksHistory}
              synergyIds={getActiveSynergies(state)}
              biomeId={state.biomeId}
              eliteModifierId={state.eliteModifierId}
              ascensionLevel={state.ascensionLevel}
              bossSkippedPending={state.bossSkippedPending}
              onClose={() => dispatch({ type: 'TOGGLE_BUILD_OVERLAY' })}
            />
          )}
          <ContextualHint
            hintId="word_trap"
            message="Trampa (!): escribirla resta puntos"
            visible={state.words.some((w) => w.kind === 'trap')}
          />
          <ContextualHint
            hintId="word_bomb"
            message="Bomba (*): al suelo quita 2 vidas"
            visible={state.words.some((w) => w.kind === 'bomb')}
          />
          <ContextualHint
            hintId="word_oracle"
            message="Oraculo (?): elige recompensa al completar"
            visible={state.words.some((w) => w.kind === 'oracle')}
          />
          <ContextualHint
            hintId="word_accent"
            message="Tilde: escribe tambien el acento que aparece en la palabra"
            visible={
              state.words.some((w) => /[áéíóúü]/i.test(w.text)) ||
              state.bossWords.some((w) => /[áéíóúü]/i.test(w.text))
            }
          />
          <ContextualHint
            hintId="boss_intro"
            message="Jefe: escribe la palabra antes de que toque el suelo"
            visible={state.status === 'boss'}
          />
          {state.status === 'oraclePick' && state.oracleRewardWord && (
            <div className="oracle-overlay" role="dialog" aria-modal="true" aria-labelledby="oracle-title" ref={oracleDialogRef}>
              <div className="oracle-overlay__panel pixel-panel">
                <h2 className="oracle-overlay__title" id="oracle-title">ORACULO</h2>
                <p className="oracle-overlay__word">
                  {state.oracleRewardWord.text}
                </p>
                <p className="oracle-overlay__hint">Elige tu recompensa</p>
                <div className="oracle-overlay__choices">
                  <PixelButton
                    onClick={() =>
                      dispatch({ type: 'ORACLE_CHOICE', payload: 'score' })
                    }
                  >
                    +PUNTOS
                  </PixelButton>
                  <PixelButton
                    variant="secondary"
                    onClick={() =>
                      dispatch({ type: 'ORACLE_CHOICE', payload: 'charge' })
                    }
                  >
                    +CARGA ULTIMATE
                  </PixelButton>
                </div>
                <p className="oracle-overlay__hint">
                  Usa Tab para recorrer las opciones y Enter para elegir, o haz clic.
                </p>
              </div>
            </div>
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
          synergyNames={synergyNames}
          dailyRun={state.dailyRun}
          weeklyRun={state.weeklyRun}
          challengeWeek={state.challengeWeek}
          mistakes={state.mistakes}
          mistakesByChar={state.mistakesByChar}
          correctKeyPresses={state.correctKeyPresses}
          reachedBoss={state.reachedBoss}
          bossSkipMetaMult={state.bossSkipMetaMult}
          ascensionLevel={state.ascensionLevel}
          runSeed={state.runSeed}
          onRetry={() =>
            state.dailyRun
              ? dispatch({ type: 'BEGIN_RUN', payload: { dailyRun: true } })
              : state.weeklyRun
                ? dispatch({ type: 'BEGIN_RUN', payload: { weeklyRun: true } })
              : dispatch({ type: 'RETRY' })
          }
          onHome={() => dispatch({ type: 'GO_HOME' })}
        />
      )}
    </div>
  );
}
