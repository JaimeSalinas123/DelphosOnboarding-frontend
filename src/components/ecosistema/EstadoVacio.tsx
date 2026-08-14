'use client';

import { motion } from 'framer-motion';

export default function EstadoVacio() {
  return (
    <motion.div
      key="estado-vacio"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="pointer-events-none mt-3 flex flex-col items-start text-left"
    >
      <div className="flex items-center gap-2 rounded-full border border-brand-orange/20 bg-white/80 px-3 py-1.5 shadow-lg shadow-brand-orange/10 backdrop-blur-md sm:gap-2.5 sm:px-4 sm:py-2">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="absolute inline-flex h-full w-full animate-invite rounded-full bg-brand-orange opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-orange" />
        </span>
        <p className="text-[11px] font-medium tracking-wide text-slate-700 sm:text-sm">
          Selecciona un módulo para explorarlo
        </p>
      </div>
      <p className="mt-2 hidden text-xs text-slate-400 md:block">
        Click en un nodo · flechas ← → para navegar · Esc para volver
      </p>
      <p className="mt-2 text-[10px] text-slate-400 md:hidden">
        Toca un nodo para explorarlo
      </p>
    </motion.div>
  );
}