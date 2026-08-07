'use client';

import React, { useEffect, useState } from 'react';

interface ModalTarjetaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  cargando?: boolean;
  esDestructivo?: boolean;
}

function IconoX() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function ModalTarjeta({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  descripcion,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  cargando = false,
  esDestructivo = false,
}: ModalTarjetaProps) {
  // Pequeño retardo para que la animación de entrada tenga de dónde partir
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => setMontado(true));
      return () => cancelAnimationFrame(id);
    }
    setMontado(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const acento = esDestructivo ? '#dc2626' : '#d85a30';
  // Si no se pasa un texto explícito, "Eliminar" para acciones destructivas y "Confirmar" para el resto
  const textoBoton = textoConfirmar ?? (esDestructivo ? 'Eliminar' : 'Confirmar');

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm transition-opacity duration-300 ${
        montado ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col transition-all duration-300 ease-out ${
          montado ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        }`}
      >
        {/* Blur decorativo, mismo lenguaje que TarjetaKpi */}
        <div
          className="pointer-events-none absolute left-1/2 -top-10 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${acento}22, transparent 70%)` }}
        />

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          disabled={cargando}
          className="absolute right-5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          aria-label="Cerrar"
        >
          <IconoX />
        </button>

        {/* Cabecera y cuerpo, centrado */}
        <div className="relative flex flex-col items-center p-6 pt-10 text-center sm:p-8 sm:pt-11">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
            {titulo}
          </h2>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">{descripcion}</p>
        </div>

        {/* Footer: botones simétricos, con más espacio entre ellos */}
        <div className="relative z-10 flex justify-center gap-4 border-t border-gray-100 bg-gray-50 p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={cargando}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-100 disabled:opacity-50"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={cargando}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all disabled:opacity-50 ${
              esDestructivo
                ? 'bg-red-600 hover:bg-red-700 hover:shadow-lg'
                : 'bg-gradient-to-r from-brand-orange to-[#f97316] hover:shadow-lg'
            }`}
          >
            {cargando ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              textoBoton
            )}
          </button>
        </div>
      </div>
    </div>
  );
}