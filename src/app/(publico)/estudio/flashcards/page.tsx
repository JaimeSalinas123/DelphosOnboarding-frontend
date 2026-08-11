'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { estudioService, type Pregunta } from '@/services/estudioService';
import { useProgresoStore } from '@/lib/useProgresoStore';

type FaseFlashcard = 'inicio' | 'cargando' | 'estudio' | 'fin' | 'error';

// Extendemos localmente el tipo para evitar el error de TypeScript
type PreguntaExtendida = Pregunta & { explicacion?: string };

export default function FlashcardsPage() {
  const [fase, setFase] = useState<FaseFlashcard>('inicio');
  const [tarjetas, setTarjetas] = useState<PreguntaExtendida[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [respuestaEscrita, setRespuestaEscrita] = useState('');
  const [historialRespuestas, setHistorialRespuestas] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const iniciarFlashcards = async () => {
    setFase('cargando');
    setErrorMsg(null);
    try {
      const data = await estudioService.listar();
      const dataFlashcards = data.filter(p => p.tipo === 'flashcard');

      if (!dataFlashcards || dataFlashcards.length === 0) {
        throw new Error('No hay flashcards disponibles en este momento.');
      }

      const tarjetasMezcladas = dataFlashcards
        .sort(() => 0.5 - Math.random())
        .slice(0, 10) as PreguntaExtendida[]; // Forzamos el tipo extendido aquí
      
      setTarjetas(tarjetasMezcladas);
      setIndiceActual(0);
      setIsFlipped(false);
      setRespuestaEscrita('');
      setHistorialRespuestas([]);
      setFase('estudio');
    } catch (error: any) {
      setErrorMsg(error.message || 'Error al conectar con el servidor.');
      setFase('error');
    }
  };

  const handleVerRespuesta = () => {
    if (respuestaEscrita.trim() !== '') {
      setIsFlipped(true);
    }
  };

  const handleSiguiente = async () => {
    const tarjetaActual = tarjetas[indiceActual];
    
    // GUARDAMOS EL DETALLE LOCALMENTE
    const nuevoDetalle = {
      pregunta: tarjetaActual.pregunta,
      respuesta_usuario: respuestaEscrita || 'Sin responder',
      respuesta_correcta: tarjetaActual.respuesta_correcta,
      es_correcta: true 
    };
    const nuevoHistorial = [...historialRespuestas, nuevoDetalle];
    setHistorialRespuestas(nuevoHistorial);

    if (indiceActual < tarjetas.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setIndiceActual(prev => prev + 1);
        setRespuestaEscrita('');
      }, 300);
    } else {
      try {
        // @ts-ignore
        await estudioService.guardarResultado({
          metodo: 'flashcard',
          puntuacion: null, 
          total_preguntas: tarjetas.length,
          respuestas_detalle: nuevoHistorial
        });
        useProgresoStore.getState().cargar();
      } catch (err: any) {
        console.error("No se pudo guardar el registro en la bd", err);
        alert("Error al guardar tu progreso: " + (err.message || "Revisa la consola"));
      }
      setFase('fin');
    }
  };

  const tarjetaActual = tarjetas[indiceActual];

  return (
    <div className="flex flex-col flex-1 w-full bg-white">
      <main className="w-full pb-20">
        <div className="mx-auto max-w-4xl px-6 pt-12 md:pt-16">
          
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-5">
              <Link href="/estudio" className="hover:text-brand-orange transition-colors">
                Métodos de Estudio
              </Link>
              <span>/</span>
              <span className="text-brand-orange">Flashcards</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
              Tarjetas <span className="text-brand-orange">Dinámicas</span>
            </h1>
          </div>

          <motion.div
            key={fase}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-slate-50 border border-gray-100 rounded-[2rem] p-8 md:p-14 text-center shadow-inner min-h-[450px] flex flex-col justify-center perspective-[1000px]"
          >
            {fase === 'inicio' && (
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-white border-4 border-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Estudio Activo</h2>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                  Lee el concepto, escribe tu respuesta y luego voltea la tarjeta para autoevaluarte. Este método fortalece tu memoria al forzarte a recordar la información.
                </p>
                <button
                  onClick={iniciarFlashcards}
                  className="w-full sm:w-auto px-10 py-4 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  Iniciar Repaso
                </button>
              </div>
            )}

            {fase === 'cargando' && (
              <div className="py-10">
                <div className="w-16 h-16 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Barajando tarjetas...</h2>
              </div>
            )}

            {fase === 'error' && (
              <div className="py-10 max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Uy, algo salió mal</h2>
                <p className="text-gray-600 mb-8 text-sm">{errorMsg}</p>
                <button
                  onClick={iniciarFlashcards}
                  className="px-8 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                >
                  Reintentar
                </button>
              </div>
            )}

            {fase === 'estudio' && tarjetaActual && (
              <div className="w-full max-w-2xl mx-auto flex flex-col h-full items-center">
                
                <div className="w-full flex justify-between items-end mb-6 px-2">
                  <span className="text-xs font-bold text-brand-orange uppercase tracking-widest">
                    Tarjeta {indiceActual + 1} de {tarjetas.length}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    Sin puntuación
                  </span>
                </div>

                <div className="relative w-full h-64 md:h-80 perspective-[1000px] mb-8">
                  <motion.div
                    className="w-full h-full relative"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    
                    <div 
                      className="absolute inset-0 w-full h-full bg-white border-2 border-gray-100 rounded-3xl shadow-md flex flex-col items-center justify-center p-8 text-center"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest border border-gray-200 px-3 py-1 rounded-full">
                        Concepto
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-snug">
                        {tarjetaActual.pregunta}
                      </h2>
                    </div>

                    <div 
                      className="absolute inset-0 w-full h-full bg-brand-orange text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-center overflow-y-auto"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <span className="text-[10px] font-bold text-white/80 mb-2 uppercase tracking-widest border border-white/30 px-3 py-1 rounded-full">
                        Respuesta Correcta
                      </span>
                      <h2 className="text-2xl md:text-3xl font-extrabold leading-tight mb-4">
                        {tarjetaActual.respuesta_correcta}
                      </h2>
                      
                      {tarjetaActual.explicacion && (
                        <p className="mt-2 text-white/90 text-sm mb-4">
                          {tarjetaActual.explicacion}
                        </p>
                      )}

                      <div className="mt-4 w-full bg-white/10 rounded-xl p-4 border border-white/20">
                        <span className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">
                          Lo que tú escribiste:
                        </span>
                        <p className="text-sm italic font-medium">"{respuestaEscrita}"</p>
                      </div>
                    </div>

                  </motion.div>
                </div>

                <div className="w-full flex flex-col items-center">
                  {!isFlipped ? (
                    <div className="w-full space-y-4">
                      <textarea
                        value={respuestaEscrita}
                        onChange={(e) => setRespuestaEscrita(e.target.value)}
                        placeholder="Escribe tu respuesta aquí..."
                        className="w-full h-24 p-4 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 outline-none resize-none transition-all text-slate-700"
                      />
                      <button
                        onClick={handleVerRespuesta}
                        disabled={respuestaEscrita.trim() === ''}
                        className={`px-10 py-3.5 font-bold rounded-xl transition-all duration-300 w-full ${
                          respuestaEscrita.trim() === ''
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-slate-800 text-white hover:bg-slate-700 shadow-md'
                        }`}
                      >
                        Voltear y Comparar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSiguiente}
                      className="px-10 py-3.5 font-bold rounded-xl transition-all duration-300 w-full bg-slate-800 text-white hover:bg-slate-700 shadow-md mt-4"
                    >
                      {indiceActual === tarjetas.length - 1 ? 'Finalizar Repaso' : 'Siguiente Tarjeta'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {fase === 'fin' && (
              <div className="py-10 max-w-md mx-auto text-center">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">¡Repaso Completado!</h2>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                  El esfuerzo de intentar recordar la respuesta es lo que realmente consolida el aprendizaje en tu memoria. ¡Sigue así!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={iniciarFlashcards}
                    className="px-6 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    Repasar de nuevo
                  </button>
                  <Link
                    href="/estudio"
                    className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-300 hover:bg-white transition-colors"
                  >
                    Volver al menú
                  </Link>
                </div>
              </div>
            )}

          </motion.div>
        </div>
      </main>
    </div>
  );
}