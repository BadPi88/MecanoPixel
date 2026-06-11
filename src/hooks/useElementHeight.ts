import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Altura actual de un elemento via ResizeObserver, con fallback hasta la
 * primera medicion. Evita leer `ref.current` durante el render.
 */
export function useElementHeight(
  ref: RefObject<HTMLElement | null>,
  fallback = 500,
): number {
  const [height, setHeight] = useState(fallback);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    // ResizeObserver dispara el callback al observar, lo que cubre la
    // medicion inicial sin necesidad de un setState sincrono aqui.
    const observer = new ResizeObserver(() => {
      setHeight(element.clientHeight || fallback);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, fallback]);

  return height;
}
