'use client';

import { motion } from 'framer-motion';

/** Invitación discreta cuando no hay módulo seleccionado. */
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
      <div className="flex items-center gap-2.5 rounded-full border border-brand-orange/20 bg-white/80 px-4 py-2 shadow-lg shadow-brand-orange/10 backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-invite rounded-full bg-brand-orange opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-orange" />
        </span>
        <p className="text-sm font-medium tracking-wide text-slate-700">
          Selecciona un módulo para explorarlo
        </p>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Click en un nodo · flechas ← → para navegar · Esc para volver
      </p>
    </motion.div>
  );
}
