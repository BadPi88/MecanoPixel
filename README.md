# Key Runner — Roguelike de Mecanografía Pixel

Roguelike de mecanografía con estética pixel art arcade. Palabras en español caen por la pantalla y debes escribirlas antes de que toquen el suelo, mientras construyes tu build con runners, reliquias, perks y glosarios. Incluye **leaderboard global** con top 10 y tu posición.

## Loop roguelike

1. **Hub** — nombre + perfil PIN opcional (pestañas JUGAR | DESBLOQUEOS | LOGROS | AJUSTES). **DESAFIO DIARIO** con ranking aparte.
2. **Elige runner** — 8 personajes pixel art; 5 se desbloquean jugando (hitos de runs, palabras, piso).
3. **Elige glosario** — General; Medico y Tecnico se desbloquean con meta coins.
4. **Pisos** — cada piso dura 3 subidas de ritmo. Perk cada 3 subidas.
5. **Mapa** — al completar un piso eliges entre 3 salas: tienda, evento, tesoro (reliquia), elite (+dificultad), descanso (+vida) y **jefe** (en pisos 3/6/9…). Teclas 1-2-3.
6. **Game over** — permadeath con recompensa: meta coins = `piso × 50 + score / 100`.

## Combate por tipeo

- **Precisión**: cada letra correcta seguida sube tu racha y carga el **ULTIMATE**. Backspace reinicia la racha y resta carga. Palabra perfecta (sin Backspace) = +10% score.
- **Ultimate (TAB)**: con la barra al 100%, purga la mitad inferior de la pantalla y congela 2 s.
- **Categorías gramaticales**: cada palabra normal lleva su marca — `V·` verbo (empuja todas las palabras hacia arriba), `A·` adjetivo (ralentiza la caída 8 s), `S·` sustantivo (carga de escudo). Efecto con cooldown de 10 s.
- **Tipos de palabra**: `!` trampa, `*` bomba, `+` bonus, `?` oraculo (elige +score o +ultimate al completar).
- **Sonido**: efectos sinteticos Web Audio (toggle en AJUSTES).
- **Letras perforantes**: desde el piso 2 caen letras sueltas (Q, X, J...). Con el input vacío, teclear la letra la desvía (+carga ultimate); si llega al suelo, −1 vida.

## Reliquias (build de la run, máx. 4)

| Reliquia | Arquetipo | Efecto |
|----------|-----------|--------|
| Reliquia Ígnea | Piromante | Palabras con F: +25% y queman la palabra más cercana |
| Diccionario Erudito | Francotirador | 8+ letras x3 score; 4 o menos x0.5 |
| Teclado Cortocircuitado | Metralleta | Solo palabras 3-4 letras, spawn x1.4, daño AOE a vecinas |
| Tinta Tóxica | Kamikaze | Fallar un envío: −1 vida pero limpia toda la pantalla |
| Afinacion de Vocales | Teclista Letal | Palabras sin vocales |
| Sello Maldito | Maldito | x2 score, trampas x2 |
| Espejo Roto | Maldito | Anagramas forzados |

**Sinergias**: preview al elegir reliquia; radar+purga, Ignea+Tecnico, Tinta+Combo Seguro, Vocales+Codificador, doble defensa.

## Biomas (zonas visuales)

Cada 3 pisos cambia la estetica del combate (fondo pixel + suelo):

| Pisos | Zona | Tema |
|-------|------|------|
| 1-3 | SCRIPTORIUM | Biblioteca, tonos sepia |
| 4-6 | FABRICA | Circuitos e industria |
| 7-9 | ABISMO | Vacio estrellado |
| 10+ | TRONO | Sala dorada de teclas |

Al entrar en una zona nueva aparece un banner breve y el HUD muestra la zona actual.

## Villanos (jefes cada 3 pisos)

Cada jefe tiene sprite pixel, fondo tematico y ataques propios:

| Piso | Villano | Tema | Mecanica |
|------|---------|------|----------|
| 3 | EL ARCHIVISTA | Biblioteca | Ceguera periodica |
| 6 | EL SABOTEADOR | Fabrica | Remap teclas + proyectiles |
| 9 | EL PERFORADOR | Vacio | Caida rapida + proyectiles |
| 12+ | LA TIRANOTIPO | Trono | Todos los ataques + **dos palabras alternadas** |

## Enemigos que desafian la mente

- **Anagramas** y **cambiantes** en palabras normales.
- **Eventos** condicionales (12+) y **tienda rotativa** (4 de 10 items por visita).
- **Logros**, mision diaria y cartel de run al game over.

## Dificultad adaptativa (flow)

Cada 10 s el juego calcula tu WPM y tasa de error (medias móviles) y ajusta suavemente el ritmo de spawn y la velocidad de caída para mantenerte en la zona (error objetivo 8-15%), sin saltos bruscos.

## Accesibilidad (pestaña AJUSTES)

- **Distribuciones de teclado**: QWERTY (sistema), AZERTY, QWERTZ, Dvorak, Colemak.
- **Fuentes**: pixel, OpenDyslexic (dislexia), sistema; escala de texto x1 / x1.25 / x1.5.
- **Temas**: clásico, alto contraste, protanopia, deuteranopia, tritanopia (con patrones además de color en palabras especiales).
- **Movimiento reducido** (también respeta `prefers-reduced-motion`).
- Tipos de palabra identificables por símbolo (`!`, `*`, `+`, `V·`, `A·`, `S·`), no solo por color.

Las palabras no llevan tildes: escribe `tecnologia`, no `tecnología`.

## Dónde se almacenan los datos

| Qué | Dónde |
|-----|--------|
| **Puntuaciones globales** | **Upstash Redis** (integrada en Vercel) |
| **API** | Funciones serverless en `/api` (Vercel) |
| **Nombre, meta-progresión y ajustes** | `localStorage` (`keyrunner:playerName`, `keyrunner:meta`, `keyrunner:settings`) |

### Estructura en Redis

- `keyrunner:leaderboard:best` — sorted set con la **mejor puntuación de cada jugador**.
- `keyrunner:player:{nombre}` — metadatos (WPM, palabras, tiempo, piso alcanzado, runner, fecha).

El frontend **no** escribe directo en Redis. Siempre pasa por:

- `GET /api/leaderboard` — top 10 + tu posición
- `POST /api/scores` — guardar tu mejor score al terminar la run

## Configurar Redis en Vercel (obligatorio para el ranking)

1. En tu proyecto de Vercel: **Storage → Create Database → Upstash Redis**.
2. Conecta la base al proyecto `MecanoPixel`.
3. Vercel añade automáticamente `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
4. Redeploy el proyecto.

Sin Redis, el juego funciona pero el leaderboard muestra vacío y no guarda puntuaciones.

### Desarrollo local con API

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npm run vercel:dev
```

## Desarrollo

```bash
npm install
npm run dev          # solo frontend
npm run vercel:dev   # frontend + API + Redis
npm run build
```

## Deploy en Vercel

Repo: [BadPi88/MecanoPixel](https://github.com/BadPi88/MecanoPixel).

1. Importa el repo en [vercel.com](https://vercel.com).
2. Añade **Upstash Redis** desde Storage.
3. Deploy. Comparte la URL con tus amigos.

## Stack

- React + TypeScript + Vite
- Vercel Serverless Functions (`/api`)
- Upstash Redis (leaderboard)
- CSS pixel art (Press Start 2P) + temas de accesibilidad
