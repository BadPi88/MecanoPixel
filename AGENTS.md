# Key Runner — Agent Guide

Roguelike de mecanografía en español con estética pixel art. Palabras caen por la pantalla; el jugador las escribe antes de que toquen el suelo. Loop roguelike: hub → elegir runner → pisos (3 subidas de ritmo por piso) → perk cada 3 subidas → tienda/evento/jefe entre pisos → game over → meta coins persistentes.

## Comandos

```bash
npm run dev          # solo frontend (Vite)
npm run vercel:dev   # frontend + API serverless + Redis (requiere vercel link + env pull)
npm run build        # tsc -b && vite build — ejecutar SIEMPRE antes de dar algo por terminado
npm run lint         # eslint
```

## Stack

- React 19 + TypeScript + Vite (sin Redux; un solo `useReducer`)
- Vercel Serverless Functions en `api/` + Upstash Redis (`@upstash/redis`, NO `@vercel/kv` que está deprecado)
- CSS plano con variables en `src/index.css` (fuente Press Start 2P, sin frameworks CSS)
- Deploy: Vercel, repo GitHub `BadPi88/MecanoPixel`

## Arquitectura

Todo el estado de juego vive en un único reducer:

- `src/types/game.ts` — `GameState`, `GameAction`, `GameStatus` (`idle | runnerPick | playing | paused | perkPick | shop | event | boss | gameOver`), `initialGameState`
- `src/hooks/useGameState.ts` — `gameReducer` central: typing (TYPE_CHAR/BACKSPACE/SUBMIT), ramps, pisos, tienda, eventos, jefe
- `src/hooks/useGameLoop.ts` — rAF tick, spawn de palabras por intervalo, tick del jefe, detección de suelo
- `src/hooks/useKeyboard.ts` — listener global de teclado (normaliza tildes con NFD)
- `src/components/Game.tsx` — wiring de pantallas según `state.status`

Capas de modificadores (funciones puras, se componen en `getEffectiveDifficulty`):

- `src/utils/difficulty.ts` — tier base por tiempo + `tierOffset`
- `src/utils/perkModifiers.ts` — 12 perks (catálogo en `src/data/perks.ts`)
- `src/utils/runnerModifiers.ts` — 5 runners (catálogo en `src/data/runners.ts`)
- `src/utils/runTransitions.ts` — pisos: `shouldCompleteFloor`, `buildFloorClearState`, `advanceToNextFloor`, `getFloorTierOffset`
- `src/utils/wordSpawn.ts` — tipos de palabra (`normal | trap | bomb | bonus`) y palabra de jefe

Persistencia:

- `localStorage` — `keyrunner:playerName`, `keyrunner:meta` (meta coins, runners desbloqueados, stats) vía `src/services/meta.ts`
- Redis — leaderboard global: `keyrunner:leaderboard:best` (sorted set, mejor score por jugador) + `keyrunner:player:{nombre}` (metadatos). Cliente en `api/lib/redis.ts`
- Tipos compartidos frontend/API en `shared/leaderboard.ts` (re-exportados desde `src/types/leaderboard.ts`)

## Convenciones

- Idioma de la UI y textos del juego: **español sin tildes** en palabras jugables (`tecnologia`, no `tecnología`); el diccionario en `src/data/dictionary.ts` ya está normalizado
- Nombres de componentes y CSS en BEM-ish: `.screen__panel`, `.hud__stat`, `.runner-card--locked`
- `FallingWord.kind` es **obligatorio** — cualquier spawn nuevo debe pasar `kind`
- Acciones del reducer en SCREAMING_SNAKE; estados derivados se calculan en utils puros, nunca dentro de componentes
- El frontend nunca escribe directo en Redis; siempre `GET /api/leaderboard` y `POST /api/scores`
- Las trampas (kind `trap`) no deben activar el resaltado azul de match parcial

## Gotchas

- Shell del usuario es **PowerShell**: usar `;` en vez de `&&` para encadenar comandos
- `npm run dev` no sirve la API: el leaderboard falla en local salvo con `npm run vercel:dev`
- Sin `KV_REST_API_URL`/`KV_REST_API_TOKEN` la API responde 503 y la UI muestra leaderboard vacío (comportamiento esperado)
- `tsc -b` es estricto con imports sin usar (`noUnusedLocals`): limpiar imports al refactorizar
- Hay un plan activo de expansión (combate/reliquias/accesibilidad) en `.cursor/plans/key_runner_combat_expansion_5ec9e132.plan.md` — no editar los archivos de plan
