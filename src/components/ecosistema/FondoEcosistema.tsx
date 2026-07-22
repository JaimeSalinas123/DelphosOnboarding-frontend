'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { getModuloById } from '@/data/modulos';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { BRAND_ORANGE, hexToRgba } from '@/lib/theme';

// Punto aproximado (en % de la vista) donde termina el nodo seleccionado. En
// desktop el anillo se desplaza a la izquierda (deja aire a la tarjeta), así
// que el spotlight se ancla ahí; en mobile el anillo casi no se mueve
// (la tarjeta es un bottom sheet, no compite por ancho), así que se ancla
// al centro. El spotlight, la ola de revelado y la silueta del ícono se
// anclan todos al mismo punto, sin necesitar proyección 3D→2D en tiempo real.
const SPOT_DESKTOP = { x: '36%', y: '56%' };
const SPOT_MOBILE = { x: '50%', y: '46%' };

const GRADIENTE_IDLE =
  'linear-gradient(180deg, #fbfbfa 0%, #ffffff 55%, #fdf6f3 100%)';
const GRADIENTE_SELECCION =
  'linear-gradient(180deg, #fff8f4 0%, #ffffff 45%, #f6d9cb 100%)';

const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")";

/**
 * Fondo por capas de la vista Ecosistema Delphos. Vive detrás del Canvas
 * (que ahora es transparente) y reacciona a qué módulo está seleccionado:
 * degradado base, spotlight con ola de revelado, silueta difusa del ícono,
 * extensión de vidrio esmerilado detrás del panel y grano sutil. Todo
 * puramente decorativo (pointer-events-none).
 */
export default function FondoEcosistema() {
  const selectedId = useEcosistemaStore((s) => s.selectedId);
  const modulo = getModuloById(selectedId);
  const isDesktop = useIsDesktop();

  const spot = isDesktop ? SPOT_DESKTOP : SPOT_MOBILE;
  const SPOT_ORIGIN = `${spot.x} ${spot.y}`;
  const siluetaSize = isDesktop ? 640 : 380;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* 1. Degradado base (idea "horizonte"): siempre presente, se calienta al seleccionar. */}
      <motion.div
        className="absolute inset-0"
        animate={{ background: modulo ? GRADIENTE_SELECCION : GRADIENTE_IDLE }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      />

      {/* 2. Spotlight radial + ola de revelado (clip-path), se re-dispara con cada módulo. */}
      <AnimatePresence>
        {modulo && (
          <motion.div
            key={modulo.id}
            className="animate-bgBreathe absolute inset-0"
            style={{
              background: `radial-gradient(900px 720px at ${SPOT_ORIGIN}, ${hexToRgba(
                BRAND_ORANGE,
                0.34
              )}, ${hexToRgba(BRAND_ORANGE, 0.13)} 45%, transparent 72%)`,
            }}
            initial={{ clipPath: `circle(0% at ${SPOT_ORIGIN})`, opacity: 0 }}
            animate={{ clipPath: `circle(150% at ${SPOT_ORIGIN})`, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{
              clipPath: { duration: 0.75, ease: 'easeOut' },
              opacity: { duration: 0.3 },
            }}
          />
        )}
      </AnimatePresence>

      {/* 3. Silueta difusa, enorme, del ícono del módulo seleccionado. */}
      <AnimatePresence>
        {modulo && (
          <motion.div
            key={modulo.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: spot.x,
              top: spot.y,
              width: siluetaSize,
              height: siluetaSize,
              filter: `blur(${isDesktop ? 70 : 42}px)`,
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 0.18, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
          >
            <Image
              src={`/logos/${modulo.logo}`}
              alt=""
              fill
              style={{ objectFit: 'contain' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Extensión de vidrio esmerilado detrás del panel (solo desktop). */}
      <motion.div
        className="absolute inset-y-0 right-0 hidden w-[42%] md:block"
        animate={{
          opacity: modulo ? 1 : 0,
          backdropFilter: modulo ? 'blur(40px)' : 'blur(0px)',
        }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      {/* 5. Grano sutil, siempre presente, un poco más marcado al seleccionar. */}
      <motion.div
        className="absolute inset-0 mix-blend-overlay"
        style={{ backgroundImage: NOISE_URL }}
        animate={{ opacity: modulo ? 0.05 : 0.025 }}
        transition={{ duration: 0.9 }}
      />
    </div>
  );
}
