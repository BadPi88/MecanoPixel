# Key Runner — Mecanografía Pixel

Juego de mecanografía con estética pixel art arcade. Palabras en español caen por la pantalla y debes escribirlas antes de que toquen el suelo. Incluye **leaderboard global** con top 10 y tu posición.

## Cómo jugar

1. Escribe tu **nombre** en el menú (obligatorio para jugar y aparecer en el ranking).
2. Pulsa **JUGAR**.
3. Escribe la palabra que ves cayendo y confirma con **Espacio** o **Enter**.
4. Usa **Backspace** para corregir.
5. Pierdes una vida si una palabra llega al suelo (3 vidas).
6. La velocidad aumenta automáticamente cada 20 segundos.
7. Pulsa **Escape** para pausar.

Las palabras no llevan tildes: escribe `tecnologia`, no `tecnología`.

## Dónde se almacenan los datos del leaderboard

| Qué | Dónde |
|-----|--------|
| **Puntuaciones globales** | **Upstash Redis** (base de datos en la nube, integrada en Vercel) |
| **API** | Funciones serverless en `/api` (Vercel) |
| **Nombre del jugador** | `localStorage` del navegador (solo en tu PC, para no escribirlo cada vez) |

### Estructura en Redis

- `keyrunner:leaderboard:best` — sorted set con la **mejor puntuación** de cada jugador (ranking global).
- `keyrunner:player:{nombre}` — metadatos (WPM, palabras, tiempo, fecha).

El frontend **no** escribe directo en Redis. Siempre pasa por:

- `GET /api/leaderboard` — top 10 + tu posición
- `POST /api/scores` — guardar tu mejor score al terminar partida

## Configurar Redis en Vercel (obligatorio para el ranking)

1. En tu proyecto de Vercel: **Storage → Create Database → Upstash Redis** (o [Marketplace → Redis](https://vercel.com/marketplace?category=storage&search=redis)).
2. Conecta la base al proyecto `MecanoPixel`.
3. Vercel añade automáticamente `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
4. Redeploy el proyecto.

Sin Redis, el juego funciona pero el leaderboard muestra vacío y no guarda puntuaciones.

### Desarrollo local con API

`npm run dev` solo sirve el frontend. Para probar el leaderboard en local:

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npm run vercel:dev
```

Copia `.env.example` a `.env.local` si configuras las variables a mano.

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
- CSS pixel art (Press Start 2P)
