'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { getModuloById } from '@/data/modulos';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';
import { BRAND_ORANGE, BRAND_BLACK, hexToRgba } from '@/lib/theme';

const container = {
  hidden: { opacity: 0, x: 60, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 26 },
  },
  exit: {
    opacity: 0,
    x: 60,
    scale: 0.96,
    transition: { duration: 0.25, ease: 'easeIn' as const },
  },
};

const list = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 24 },
  },
};

export default function PanelInfoModulo() {
  const selectedId = useEcosistemaStore((s) => s.selectedId);
  const deselect = useEcosistemaStore((s) => s.deselect);
  const modulo = getModuloById(selectedId);

  return (
    <AnimatePresence mode="wait">
      {modulo && (
        <motion.aside
          key="panel"
          variants={container}
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-live="polite"
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 md:inset-x-auto md:inset-y-0 md:right-0 md:flex md:items-center md:pr-16"
        >
          <div
            className="deinsa-scroll max-h-[75vh] overflow-y-auto rounded-t-3xl border p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl sm:p-7 md:max-h-[88vh] md:w-[460px] md:rounded-3xl md:p-9 md:pb-9"
            style={{
              backgroundColor: hexToRgba(BRAND_BLACK, 0.94),
              borderColor: hexToRgba(BRAND_ORANGE, 0.4),
              boxShadow: `0 24px 60px -20px ${hexToRgba(BRAND_ORANGE, 0.55)}`,
            }}
            role="region"
            aria-label={`Información del módulo ${modulo.nombre}`}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 md:hidden" />

            <AnimatePresence mode="wait">
              <motion.div
                key={modulo.id}
                variants={list}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <motion.div
                  variants={item}
                  className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-3.5"
                >
                  <div
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl sm:h-16 sm:w-16"
                    style={{ backgroundColor: hexToRgba(BRAND_ORANGE, 0.16) }}
                  >
                    <Image
                      src={`/logos/${modulo.logo}`}
                      alt={modulo.nombre}
                      width={42}
                      height={42}
                      className="h-[42px] w-[42px] sm:h-[50px] sm:w-[50px]"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest"
                    style={{
                      backgroundColor: hexToRgba(BRAND_ORANGE, 0.18),
                      color: BRAND_ORANGE,
                    }}
                  >
                    Módulo
                  </span>
                </motion.div>

                <motion.h2
                  variants={item}
                  className="text-2xl font-semibold leading-tight text-white sm:text-3xl"
                >
                  {modulo.nombre}
                </motion.h2>

                <motion.p
                  variants={item}
                  className="mt-2 text-sm font-semibold sm:text-base"
                  style={{ color: BRAND_ORANGE }}
                >
                  {modulo.tagline}
                </motion.p>

                <motion.p
                  variants={item}
                  className="mt-4 text-sm leading-relaxed text-white/70 sm:text-[15px]"
                >
                  {modulo.descripcion}
                </motion.p>

                <motion.div variants={item} className="mt-6 sm:mt-7">
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-white/40 sm:mb-3">
                    Capacidades clave
                  </h3>
                  <ul className="flex flex-wrap gap-2 sm:gap-2.5">
                    {modulo.capacidades.map((cap) => (
                      <li
                        key={cap}
                        className="rounded-full px-3 py-1.5 text-[13px] font-medium text-white/90 sm:px-3.5 sm:py-2 sm:text-sm"
                        style={{
                          backgroundColor: hexToRgba(BRAND_ORANGE, 0.16),
                        }}
                      >
                        {cap}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  variants={item}
                  className="mt-6 rounded-r-xl py-3.5 pl-4 pr-3.5 sm:mt-7 sm:py-4 sm:pl-5 sm:pr-4"
                  style={{
                    borderLeft: `3px solid ${BRAND_ORANGE}`,
                    backgroundColor: hexToRgba(BRAND_ORANGE, 0.12),
                  }}
                >
                  <h3
                    className="mb-1.5 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: BRAND_ORANGE }}
                  >
                    Diferencial
                  </h3>
                  <p className="text-sm leading-relaxed text-white/80 sm:text-[15px]">
                    {modulo.diferencial}
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={deselect}
              className="mt-6 w-full rounded-xl border border-white/15 py-2.5 text-xs font-medium uppercase tracking-widest text-white/60 transition-colors hover:bg-white/10 sm:mt-7"
              aria-label="Cerrar panel y volver al ecosistema"
            >
              Volver al ecosistema
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
