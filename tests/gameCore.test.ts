import { describe, expect, it } from 'vitest';
import { generateActMap } from '../src/data/mapRooms';
import { gameReducer } from '../src/hooks/useGameState';
import { initialGameState } from '../src/types/game';
import { getDifficultyTier } from '../src/utils/difficulty';
import { calculateMissPenalty, calculateWordScore } from '../src/utils/scoring';
import { createSeededRandom } from '../src/utils/random';
import { getRandomWord } from '../src/data/dictionary';
import { decorateSpawn, rollWordKind } from '../src/utils/wordSpawn';
import { DEFAULT_SETTINGS, loadSettings } from '../src/services/settings';
import { pickPerkChoices } from '../src/data/perks';
import { pickRelicChoices } from '../src/data/relics';
import { INITIAL_FLOW_STATS } from '../src/types/combat';
import { updateFlowStats } from '../src/utils/flowDifficulty';
import { recordRunEnd } from '../src/services/meta';
import { getFloorTierOffset } from '../src/utils/runTransitions';

describe('random reproducible', () => {
  it('produce la misma secuencia para una semilla y distintas para otra', () => {
    const first = createSeededRandom(42);
    const repeated = createSeededRandom(42);
    const other = createSeededRandom(43);
    expect(Array.from({ length: 5 }, first)).toEqual(Array.from({ length: 5 }, repeated));
    expect(createSeededRandom(42)()).not.toBe(other());
  });

  it('mantiene palabras, tipo y decoracion al repetir la semilla', () => {
    const makeSpawn = () => {
      const random = createSeededRandom(914);
      const kind = rollWordKind({ trap: 0.1, bomb: 0.1, bonus: 0.1 }, 1, false, random);
      const text = getRandomWord(0, 0, { floor: 8 }, random);
      return { kind, text, decoration: decorateSpawn(kind, text, 8, 12_000, [], 'scriptorium', false, random) };
    };
    expect(makeSpawn()).toEqual(makeSpawn());
  });

  it('mantiene elecciones de perks y reliquias reproducibles y sin duplicados', () => {
    const perks = pickPerkChoices([], 3, 7, 0, createSeededRandom(123));
    expect(pickPerkChoices([], 3, 7, 0, createSeededRandom(123))).toEqual(perks);
    expect(new Set(perks).size).toBe(3);
    const relics = pickRelicChoices([], 3, false, createSeededRandom(123));
    expect(pickRelicChoices([], 3, false, createSeededRandom(123))).toEqual(relics);
    expect(new Set(relics).size).toBe(relics.length);
  });
});

describe('dificultad y puntuacion', () => {
  it('aumenta gradualmente y limita la velocidad y el intervalo', () => {
    expect(getDifficultyTier(0).fallSpeed).toBe(40);
    expect(getDifficultyTier(20_000).fallSpeed).toBe(45);
    expect(getDifficultyTier(1_000_000).fallSpeed).toBe(240);
    expect(getDifficultyTier(1_000_000).spawnInterval).toBe(700);
    expect(getDifficultyTier(40_000, 2).tier).toBe(0);
  });

  it('premia combo y posicion alta; penalizacion por fallo estable', () => {
    expect(calculateWordScore(5, 0, 90, 300)).toBe(75);
    expect(calculateWordScore(5, 2, 250, 300)).toBe(60);
    expect(calculateMissPenalty()).toBe(25);
  });

  it('adapta suavemente la caida cuando los errores superan el objetivo', () => {
    const stats = {
      ...INITIAL_FLOW_STATS,
      lastUpdateMs: 1,
      emaErrorRate: 0.15,
      windowChars: 10,
      windowErrors: 10,
    };
    const updated = updateFlowStats(stats, 12_001);
    expect(updated.speedMult).toBeLessThan(1);
    expect(updated.spawnMult).toBeGreaterThan(1);
    expect(updated.spawnMult).toBeLessThanOrEqual(1.1);
    expect(updated.speedMult).toBeGreaterThanOrEqual(0.94);
    expect(updated.progressionRate).toBe(0.95);
    expect(updated.windowChars).toBe(0);
  });

  it('solo acelera a quien ya demuestra velocidad y precision sostenidas', () => {
    const stats = {
      ...INITIAL_FLOW_STATS,
      lastUpdateMs: 1,
      emaWpm: 80,
      emaErrorRate: 0.04,
      windowChars: 250,
      windowErrors: 0,
    };
    const updated = updateFlowStats(stats, 60_001);
    expect(updated.emaWpm).toBeGreaterThan(45);
    expect(updated.spawnMult).toBeLessThan(1);
    expect(updated.speedMult).toBeGreaterThan(1);
    expect(updated.progressionRate).toBe(1.05);
  });
});

describe('mapa y reducer', () => {
  it('genera el mismo acto para una semilla y garantiza un jefe al final', () => {
    const first = generateActMap(0, 1234);
    expect(generateActMap(0, 1234)).toEqual(first);
    expect(generateActMap(0, 1235)).not.toEqual(first);
    expect(first.nodes.find((node) => node.id === first.bossNodeId)?.type).toBe('boss');
    expect(first.nodes.filter((node) => node.layer === 4)).toHaveLength(1);
  });

  it('recorre inicio, seleccion, pausa, derrota y regreso al hub', () => {
    let state = gameReducer(initialGameState, { type: 'BEGIN_RUN', payload: { runSeed: 99 } });
    expect(state.status).toBe('runnerPick');
    expect(state.runSeed).toBe(99);
    state = gameReducer(state, { type: 'SELECT_RUNNER', payload: 'veloz' });
    expect(state.status).toBe('glossaryPick');
    state = gameReducer(state, { type: 'SELECT_GLOSSARY', payload: 'general' });
    expect(state.status).toBe('playing');
    expect(state.runSeed).toBe(99);
    state = gameReducer(state, { type: 'TOGGLE_PAUSE' });
    expect(state.status).toBe('paused');
    state = gameReducer({ ...state, status: 'boss', bossId: 'archivista' }, { type: 'BOSS_FAIL' });
    expect(state.status).toBe('gameOver');
    state = gameReducer(state, { type: 'VICTORY_HOME' });
    expect(state.status).toBe('idle');
  });

  it('entrega perk y abre el mapa al completar los tres ramps del piso', () => {
    const runState = {
      ...initialGameState,
      status: 'playing' as const,
      runSeed: 876,
      rampsThisFloor: 2,
      rampCount: 2,
    };
    const perkState = gameReducer(runState, {
      type: 'SPEED_RAMP',
      payload: { fallSpeed: 100, spawnInterval: 1000 },
    });
    expect(perkState.status).toBe('perkPick');
    expect(perkState.pendingPerkChoice).toHaveLength(3);
    const mapState = gameReducer(perkState, {
      type: 'SELECT_PERK',
      payload: perkState.pendingPerkChoice![0],
    });
    expect(mapState.status).toBe('mapPick');
    expect(mapState.mapRoomOptions.length).toBeGreaterThan(0);
    expect(mapState.actMap?.nodes).toEqual(generateActMap(0, 876).nodes);
  });

  it('registra precision, errores y puntuacion al escribir palabras', () => {
    const word = { id: 'w1', text: 'sol', x: 100, y: 80, kind: 'normal' as const };
    let state = { ...initialGameState, status: 'playing' as const, runSeed: 23, words: [word] };
    state = gameReducer(state, { type: 'TYPE_CHAR', payload: 's' });
    state = gameReducer(state, { type: 'TYPE_CHAR', payload: 'z' });
    expect(state.mistakes).toBe(1);
    state = gameReducer(state, { type: 'BACKSPACE' });
    state = gameReducer(state, { type: 'BACKSPACE' });
    state = gameReducer(state, { type: 'TYPE_CHAR', payload: 's' });
    state = gameReducer(state, { type: 'TYPE_CHAR', payload: 'o' });
    state = gameReducer(state, { type: 'TYPE_CHAR', payload: 'l' });
    state = gameReducer(state, { type: 'SUBMIT' });
    expect(state.mistakes).toBe(3);
    expect(state.wordsTyped).toBe(1);
    expect(state.correctChars).toBe(3);
    expect(state.score).toBeGreaterThan(0);
    expect(state.input).toBe('');
    expect(gameReducer(state, { type: 'CLEAR_POP' }).words).toHaveLength(0);
  });

  it('vence al jefe final y permite continuar en endless', () => {
    const word = { id: 'boss-word', text: 'victoria', x: 120, y: 40, kind: 'normal' as const };
    let state = {
      ...initialGameState,
      status: 'boss' as const,
      floor: 12,
      runSeed: 120,
      bossId: 'tiranotipo' as const,
      bossWord: word,
      bossWords: [word],
    };
    for (const char of word.text) state = gameReducer(state, { type: 'TYPE_CHAR', payload: char });
    state = gameReducer(state, { type: 'SUBMIT' });
    expect(state.status).toBe('victory');
    state = gameReducer(state, { type: 'CONTINUE_ENDLESS' });
    expect(state.status).toBe('playing');
    expect(state.endlessMode).toBe(true);
    expect(state.floor).toBe(13);
  });

  it('avanza el reloj de dificultad mas rapido o mas lento segun el rendimiento', () => {
    const state = {
      ...initialGameState,
      status: 'playing' as const,
      flowStats: { ...INITIAL_FLOW_STATS, progressionRate: 1.2 },
    };
    const next = gameReducer(state, {
      type: 'TICK',
      payload: { deltaMs: 1_000, fallSpeed: 40, groundHeight: 800 },
    });
    expect(next.elapsedMs).toBe(1_000);
    expect(next.difficultyElapsedMs).toBe(1_200);
  });
});

describe('curva roguelike por pisos', () => {
  it('mantiene el ritmo al cruzar de piso y endurece claramente el final', () => {
    const floorOne = { ...initialGameState, floor: 1 };
    const floorTwo = { ...initialGameState, floor: 2 };
    const early = getDifficultyTier(60_000, getFloorTierOffset(floorOne));
    const nextFloorStart = getDifficultyTier(60_000, getFloorTierOffset(floorTwo));
    const late = getDifficultyTier(720_000, getFloorTierOffset({ ...initialGameState, floor: 12 }));

    expect(nextFloorStart.tier).toBe(early.tier);
    expect(early.fallSpeed).toBe(55);
    expect(early.spawnInterval).toBe(2_350);
    expect(late.fallSpeed).toBeGreaterThan(early.fallSpeed * 3);
    expect(late.spawnInterval).toBeLessThan(early.spawnInterval);
    expect(late.wordLengthRange[0]).toBeGreaterThan(early.wordLengthRange[0]);
  });
});

describe('ajustes persistidos', () => {
  it('recupera valores por defecto para preferencias corruptas', () => {
    localStorage.setItem('keyrunner:settings', JSON.stringify({ theme: 'broken', fontScale: 99, reducedMotion: 'yes' }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('conserva metadatos de balance por run dentro del perfil local', () => {
    const { meta } = recordRunEnd(6, 42, 10, {
      score: 500,
      wpm: 38,
      ultimatesUsed: 2,
      deflectedLetters: 3,
      relicsCollected: 1,
      dailyRun: false,
      deathCause: 'boss',
      reachedBoss: true,
      ascensionLevel: 2,
      runnerId: 'codificador',
      relics: ['sello_maldito'],
      runSeed: 917,
    });
    const run = meta.learning.history.at(-1)!;
    expect(run).toMatchObject({
      floor: 6,
      ascensionLevel: 2,
      deathCause: 'boss',
      reachedBoss: true,
      runnerId: 'codificador',
      relics: ['sello_maldito'],
      runSeed: 917,
    });
  });
});
