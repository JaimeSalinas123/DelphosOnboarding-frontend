'use client';

import { motion } from 'framer-motion';

/** Invitación discreta cuando no hay módulo seleccionado. */
export default function EstadoVacio() {
  return (
    <motion.div
      key="estado-vacio"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center text-center"
    >
      <div className="flex items-center gap-2 text-slate-500">
        <span className="h-2 w-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 animate-invite" />
        <p className="text-sm font-medium tracking-wide">
          Selecciona un módulo para explorarlo
        </p>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        Click en un nodo · flechas ← → para navegar · Esc para volver
      </p>
    </motion.div>
  );
}
