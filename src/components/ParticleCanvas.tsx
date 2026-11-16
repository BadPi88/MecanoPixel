import { useEffect, useRef } from 'react';

interface Burst {
  id: string;
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

/** Canvas aislado para efectos efímeros; el loop no causa renders de React. */
export function ParticleCanvas({ burst }: { burst: Burst | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstRef = useRef(burst);
  burstRef.current = burst;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const activeBurst = burstRef.current;
    if (!canvas || !context || !activeBurst) return;

    const bounds = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(bounds.width * ratio);
    canvas.height = Math.round(bounds.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    for (let index = 0; index < 14; index += 1) {
      const angle = (Math.PI * 2 * index) / 14;
      const speed = 45 + ((index * 17) % 65);
      particlesRef.current.push({
        x: activeBurst.x,
        y: activeBurst.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.45 + (index % 4) * 0.08,
        color: index % 3 === 0 ? '#ffd34e' : index % 3 === 1 ? '#65e6a8' : '#63c7ff',
      });
    }

    let frameId = 0;
    let previousTime = 0;
    const draw = (time: number) => {
      const delta = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      context.clearRect(0, 0, bounds.width, bounds.height);
      particlesRef.current = particlesRef.current.filter((particle) => particle.life > 0);
      for (const particle of particlesRef.current) {
        particle.life -= delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vy += 100 * delta;
        context.globalAlpha = Math.max(0, particle.life / 0.7);
        context.fillStyle = particle.color;
        context.fillRect(Math.round(particle.x), Math.round(particle.y), 4, 4);
      }
      context.globalAlpha = 1;
      if (particlesRef.current.length > 0) frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [burst?.id]);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}
