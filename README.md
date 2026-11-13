# Key Runner

**Key Runner** es un roguelike de mecanografía en español con estética pixel art. Las palabras caen por la pantalla y hay que escribirlas antes de que lleguen al suelo. Cada partida combina reflejos y precisión con decisiones de estrategia: elegir rutas, mejorar la build y prepararse para los jefes.

## Juega

[**Jugar a Key Runner**](https://mecano-pixel.vercel.app/)

## El proyecto

La partida empieza en un hub desde el que puedes iniciar una run normal o entrar en los retos diario y semanal. En una run normal escoges un runner y un glosario; a medida que avanzas consigues perks y reliquias, y eliges qué salas visitar en el mapa ramificado de cada acto.

Las salas ofrecen distintas oportunidades y riesgos: comprar mejoras, aceptar eventos, conseguir reliquias, descansar, enfrentarte a un combate elite o luchar contra el jefe del acto. Los combates cambian según el bioma y la dificultad aumenta con los pisos. Una run puede terminar en derrota o victoria; tras vencer a La Tiranotipo en el piso 12 puedes cerrar la partida o seguir en modo endless.

La progresión entre partidas permite desbloquear runners, glosarios, reliquias y mejoras del hub. También hay logros, misiones y ascensiones para aumentar el desafío.

## Mecánicas principales

- **Mecanografía de combate:** escribe las palabras que caen y evita que alcancen el suelo. Las palabras especiales incluyen trampas, bombas, bonus y oráculos, identificados por símbolos.
- **Ultimate:** las letras correctas cargan una habilidad que, al llegar al 100%, limpia parte de la pantalla y congela brevemente la caída. Se activa con **Tab**.
- **Builds:** combina las habilidades de 8 runners con perks y hasta 4 reliquias activas. Algunas reliquias son malditas y añaden un coste a cambio de poder.
- **Rutas y encuentros:** avanza por mapas ramificados con salas de tienda, evento, tesoro, elite, descanso y jefe. Los jefes tienen ataques y patrones propios.
- **Retos con ranking:** los retos diario y semanal fijan parte de la configuración y tienen clasificaciones independientes del ranking global.
- **Accesibilidad:** ajustes de distribución de teclado, fuente, tamaño de texto, temas visuales y movimiento reducido.

## Guardado y servicios online

La partida y la progresión funcionan en modo local. Al configurar Supabase, el juego también ofrece cuentas por correo, sincronización de perfil y progreso, y rankings globales, diarios y semanales.

## Tecnologías

- React 19, TypeScript y Vite
- Supabase Auth y Postgres para cuentas, perfiles y puntuaciones
- CSS propio para la interfaz pixel art y sus temas
- Vitest y Testing Library

## Desarrollo local

Necesitas Node.js y npm.

```bash
npm install
npm run dev
```

Para probar las funciones online en local, configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env.local` y ejecuta `npm run vercel:dev`. La migración de base de datos está en `supabase/migrations/`.

Comandos adicionales:

```bash
npm run build
npm run lint
npm run test
```

## Código fuente

[BadPi88/MecanoPixel en GitHub](https://github.com/BadPi88/MecanoPixel)
