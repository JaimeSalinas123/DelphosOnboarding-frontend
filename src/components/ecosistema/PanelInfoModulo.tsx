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
          // OPTIMIZACIÓN: will-change-transform le dice al celular que use la GPU para este panel
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 md:inset-x-auto md:inset-y-0 md:right-0 md:flex md:items-center md:pr-8 lg:pr-16 will-change-transform"
        >
          <div
            // RESPONSIVE: Adaptación del padding inferior usando env(safe-area-inset-bottom) para iPhones
            className="deinsa-scroll max-h-[80vh] sm:max-h-[75vh] overflow-y-auto rounded-t-3xl border p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl sm:p-7 md:max-h-[78vh] md:w-[450px] lg:w-[600px] md:rounded-3xl md:p-8 lg:p-9 md:pb-8 lg:pb-9"
            style={{
              backgroundColor: hexToRgba(BRAND_BLACK, 0.94),
              borderColor: hexToRgba(BRAND_ORANGE, 0.4),
              boxShadow: `0 24px 60px -20px ${hexToRgba(BRAND_ORANGE, 0.55)}`,
            }}
            role="region"
            aria-label={`Información del módulo ${modulo.nombre}`}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20 md:hidden" />

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
                    className="flex h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 flex-shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: hexToRgba(BRAND_ORANGE, 0.16) }}
                  >
                    <Image
                      src={`/logos/${modulo.logo}`}
                      alt={modulo.nombre}
                      width={42}
                      height={42}
                      className="h-[34px] w-[34px] sm:h-[42px] sm:w-[42px] lg:h-[50px] lg:w-[50px]"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest"
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
                  className="text-xl sm:text-2xl lg:text-3xl font-semibold leading-tight text-white"
                >
                  {modulo.nombre}
                </motion.h2>

                <motion.p
                  variants={item}
                  className="mt-1.5 sm:mt-2 text-[13px] sm:text-sm lg:text-base font-semibold"
                  style={{ color: BRAND_ORANGE }}
                >
                  {modulo.tagline}
                </motion.p>

                <motion.p
                  variants={item}
                  className="mt-3 sm:mt-4 text-[13px] sm:text-sm lg:text-[15px] leading-relaxed text-white/70"
                >
                  {modulo.descripcion}
                </motion.p>

                <motion.div variants={item} className="mt-5 sm:mt-6 lg:mt-7">
                  <h3 className="mb-2 sm:mb-2.5 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-white/40">
                    Funciones destacadas
                  </h3>
                  <ul className="space-y-2 sm:space-y-2.5">
                    {modulo.capacidades.map((cap) => (
                      <li
                        key={cap}
                        className="flex items-start gap-2.5 text-[13px] sm:text-sm lg:text-[15px] leading-relaxed text-white/85"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: BRAND_ORANGE }}
                        />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  variants={item}
                  className="mt-5 sm:mt-6 lg:mt-7 rounded-r-xl py-3 pl-3.5 pr-3 sm:py-3.5 sm:pl-4 sm:pr-3.5 lg:py-4 lg:pl-5 lg:pr-4"
                  style={{
                    borderLeft: `3px solid ${BRAND_ORANGE}`,
                    backgroundColor: hexToRgba(BRAND_ORANGE, 0.12),
                  }}
                >
                  <h3
                    className="mb-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-widest"
                    style={{ color: BRAND_ORANGE }}
                  >
                    Diferencial
                  </h3>
                  <p className="text-[13px] sm:text-sm lg:text-[15px] leading-relaxed text-white/80">
                    {modulo.diferencial}
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={deselect}
              className="mt-5 sm:mt-6 lg:mt-7 w-full rounded-xl border border-white/15 py-2.5 sm:py-3 text-[11px] sm:text-xs font-medium uppercase tracking-widest text-white/60 transition-colors hover:bg-white/10"
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