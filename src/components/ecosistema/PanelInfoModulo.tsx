'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { getModuloById } from '@/data/modulos';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';

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

function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

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
          className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 md:inset-x-auto md:inset-y-0 md:right-0 md:flex md:items-center md:pr-5"
        >
          <div
            className="deinsa-scroll max-h-[64vh] overflow-y-auto rounded-t-3xl border bg-white/85 p-6 shadow-2xl backdrop-blur-xl md:max-h-[86vh] md:w-[380px] md:rounded-3xl md:p-7"
            style={{
              borderColor: hexToRgba(modulo.color, 0.35),
              boxShadow: `0 24px 60px -20px ${hexToRgba(modulo.color, 0.5)}`,
            }}
            role="region"
            aria-label={`Información del módulo ${modulo.nombre}`}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 md:hidden" />

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
                  className="mb-4 flex items-center gap-3"
                >
                  <div
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: hexToRgba(modulo.color, 0.12) }}
                  >
                    <Image
                      src={`/logos/${modulo.logo}`}
                      alt={modulo.nombre}
                      width={44}
                      height={44}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest"
                    style={{
                      backgroundColor: hexToRgba(modulo.color, 0.14),
                      color: modulo.color,
                    }}
                  >
                    Módulo
                  </span>
                </motion.div>

                <motion.h2
                  variants={item}
                  className="text-2xl font-semibold leading-tight text-slate-900"
                >
                  {modulo.nombre}
                </motion.h2>

                <motion.p
                  variants={item}
                  className="mt-1.5 text-sm font-semibold"
                  style={{ color: modulo.color }}
                >
                  {modulo.tagline}
                </motion.p>

                <motion.p
                  variants={item}
                  className="mt-4 text-sm leading-relaxed text-slate-600"
                >
                  {modulo.descripcion}
                </motion.p>

                <motion.div variants={item} className="mt-6">
                  <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Capacidades clave
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {modulo.capacidades.map((cap) => (
                      <li
                        key={cap}
                        className="rounded-full px-3 py-1.5 text-[13px] font-medium text-slate-700"
                        style={{
                          backgroundColor: hexToRgba(modulo.color, 0.1),
                        }}
                      >
                        {cap}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  variants={item}
                  className="mt-6 rounded-r-xl py-3 pl-4 pr-3"
                  style={{
                    borderLeft: `3px solid ${modulo.color}`,
                    backgroundColor: hexToRgba(modulo.color, 0.07),
                  }}
                >
                  <h3
                    className="mb-1 text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: modulo.color }}
                  >
                    Diferencial
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {modulo.diferencial}
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={deselect}
              className="mt-6 w-full rounded-xl border border-slate-200 py-2 text-xs font-medium uppercase tracking-widest text-slate-500 transition-colors hover:bg-slate-50"
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
