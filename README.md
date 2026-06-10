# Typing Game — Mecanografía Pixel

Juego de mecanografía con estética pixel art arcade. Palabras en español caen por la pantalla y debes escribirlas antes de que toquen el suelo.

## Cómo jugar

1. Pulsa **JUGAR** en la pantalla de inicio.
2. Escribe la palabra que ves cayendo y confirma con **Espacio** o **Enter**.
3. Usa **Backspace** para corregir.
4. Pierdes una vida si una palabra llega al suelo (3 vidas).
5. La velocidad aumenta automáticamente cada 20 segundos.
6. Pulsa **Escape** para pausar.

Las palabras no llevan tildes: escribe `tecnologia`, no `tecnología`.

## Puntuación

- Base: longitud de la palabra × 10 puntos.
- Combo: bonus por palabras consecutivas acertadas.
- Bonus de velocidad: más puntos si eliminas la palabra en la parte alta de la pantalla.

## Desarrollo

```bash
npm install
npm run dev
```

```bash
npm run build
```

## Stack

- React 18 + TypeScript
- Vite
- CSS pixel art (Press Start 2P, sin dependencias de animación)
