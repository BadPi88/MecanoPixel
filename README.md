# Key Runner — Roguelike de Mecanografía Pixel

Roguelike de mecanografía con estética pixel art arcade. Palabras en español caen por la pantalla y debes escribirlas antes de que toquen el suelo, mientras construyes tu build con runners, reliquias, perks y glosarios. Incluye **leaderboard global** con top 10 y tu posición.

## Loop roguelike

1. **Hub** — nombre + perfil PIN opcional (pestañas JUGAR | DESBLOQUEOS | LOGROS | AJUSTES). **DESAFIO DIARIO** con ranking aparte.
2. **Elige runner** — 8 personajes pixel art; 5 se desbloquean jugando (hitos de runs, palabras, piso).
3. **Elige glosario** — General; Medico y Tecnico se desbloquean con meta coins.
4. **Pisos** — cada piso dura 3 subidas de ritmo. Perk cada 3 subidas.
5. **Mapa en árbol** — tras cada piso eliges entre dos rutas por acto de 5 capas (preview `?` a 2 nodos). La última capa ofrece una sala elite; puedes tomar el atajo al jefe. Salas: tienda, evento, tesoro, elite (+50% coins + modificador), descanso, jefe. Evitar al jefe penaliza (debuff + boss obligatorio; meta coins ×0.7).
6. **Victoria / endless** — derrotar a La Tiranotipo en el piso 12 da victoria; puedes continuar en modo endless por El Palimpsesto (piso 13+) o volver al hub. Desbloquea ascensiones (0–5).
7. **Game over** — permadeath: meta coins = `(piso × 50 + score / 100) × mult` (ascensión 5: ×1.25; evitar jefe: ×0.7).

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

En endless se incorporan **Marca de Agua** (carga ultimate por palabras perfectas) y **Colofon** (run coins por palabras largas).

## Biomas (zonas visuales)

Cada 3 pisos cambia la estetica del combate (fondo pixel + suelo):

| Pisos | Zona | Tema |
|-------|------|------|
| 1-3 | SCRIPTORIUM | Biblioteca, tonos sepia |
| 4-6 | FABRICA | Circuitos e industria |
| 7-9 | ABISMO | Vacio estrellado |
| 10+ | TRONO | Sala dorada de teclas |
| 13+ | PALIMPSESTO | Paginas borradas y tinta espectral (solo endless) |

Al entrar en una zona nueva aparece un banner breve y el HUD muestra la zona actual. Cada bioma altera el combate (anagramas, bombas, oráculos, remap teclas, mini-jefe en trono).

Usa el boton **VER BUILD** en el HUD para consultar tu build (reliquias, perks, sinergias y modificadores activos). Las elecciones durante la run se pueden recorrer con Tab y confirmar con Enter; tambien puedes hacer clic.

## Villanos (jefes cada 3 pisos)

Cada jefe tiene sprite pixel, fondo tematico y ataques propios:

| Piso | Villano | Tema | Mecanica |
|------|---------|------|----------|
| 3 | EL ARCHIVISTA | Biblioteca | Ceguera periodica |
| 6 | EL SABOTEADOR | Fabrica | Remap teclas + proyectiles |
| 9 | EL PERFORADOR | Vacio | Caida rapida + proyectiles |
| 12 | LA TIRANOTIPO | Trono | Todos los ataques + **dos palabras alternadas** |
| 15 | LA INDEXADORA | Palimpsesto | Dos fases; proyectiles telegrafiados y ceguera anunciada (endless) |

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

Desde el piso 7 aparecen gradualmente palabras con tildes: al principio escribe `tecnologia`; en pisos avanzados también puede aparecer `tecnología` y tendrás que escribir la tilde.

## Cuentas, progreso y rankings en la nube

Supabase centraliza autenticacion por correo, perfiles, progreso y rankings en un proyecto Postgres. El navegador conserva una copia local para que la partida siga disponible sin conexion; al iniciar sesion, el progreso se sincroniza con el perfil remoto.

### Configurar Supabase

1. Crea un proyecto en Supabase y habilita confirmacion de correo en **Authentication → Providers → Email**.
2. Ejecuta `supabase/migrations/20261111000000_keyrunner_accounts_and_scores.sql` en el SQL Editor del proyecto.
3. Copia `.env.example` a `.env.local` y configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` desde **Project Settings → API**.
4. Añade esas mismas variables en Vercel para Production, Preview y Development; despues vuelve a desplegar.
5. En **Authentication → URL Configuration**, configura la URL del juego y sus redirecciones permitidas para confirmacion y recuperacion de contrasena.

El cliente solo usa la clave publica/anonima. Las politicas RLS limitan el perfil al usuario autenticado; las funciones SQL de puntuaciones asocian cada resultado a su usuario y exponen al ranking solo nombre visible y metricas de la run. No pongas claves `service_role` en variables `VITE_*`.

Sin las variables de Supabase, el modo local sigue funcionando, pero las cuentas y rankings online no estaran disponibles.

## Desarrollo

```bash
npm install
npm run dev          # solo frontend
npm run build
```

## Deploy en Vercel

Repo: [BadPi88/MecanoPixel](https://github.com/BadPi88/MecanoPixel).

1. Importa el repo en [vercel.com](https://vercel.com).
2. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Environment Variables.
3. Deploy. Comparte la URL con tus amigos.

## Stack

- React + TypeScript + Vite
- Supabase Auth + Postgres (cuentas, progreso y rankings)
- CSS pixel art (Press Start 2P) + temas de accesibilidad
