'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { estudioService, type Pregunta } from '@/services/estudioService';
import { authService } from '@/services/authService';

type FaseVF = 'inicio' | 'cargando' | 'preguntas' | 'resultados' | 'error';

export default function VerdaderoFalsoPage() {
  const [fase, setFase] = useState<FaseVF>('inicio');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  
  const [respuestasUsuario, setRespuestasUsuario] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const iniciarReto = async () => {
    setFase('cargando');
    setErrorMsg(null);
    try {
      const data = await estudioService.listar();
      const preguntasVF = data.filter(p => p.tipo === 'verdadero_falso');

      if (!preguntasVF || preguntasVF.length === 0) {
        throw new Error('No hay preguntas de Verdadero/Falso disponibles.');
      }

      const preguntasMezcladas = preguntasVF
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);
      
      setPreguntas(preguntasMezcladas);
      setIndiceActual(0);
      setRespuestasUsuario({});
      setFase('preguntas');
    } catch (error: any) {
      setErrorMsg(error.message || 'Error al conectar con el servidor.');
      setFase('error');
    }
  };

  const preguntaActual = preguntas[indiceActual];
  const respuestaSeleccionada = preguntaActual ? respuestasUsuario[preguntaActual.id] : null;

  const handleSeleccionar = (opcion: string) => {
    setRespuestasUsuario(prev => ({
      ...prev,
      [preguntaActual.id]: opcion
    }));
  };

  const calcularPuntuacion = () => {
    let correctas = 0;
    preguntas.forEach(p => {
      const seleccion = respuestasUsuario[p.id];
      if (seleccion) {
        const esCorrecta = p.respuesta_correcta.trim().toLowerCase() === seleccion.toLowerCase();
        if (esCorrecta) correctas++;
      }
    });
    return correctas;
  };

  // AQUÍ ESTÁ EL CAMBIO PARA GUARDAR EL RESULTADO
  const handleSiguiente = async () => {
    if (indiceActual < preguntas.length - 1) {
      setIndiceActual(prev => prev + 1);
    } else {
      // Guardar en BD antes de ir a resultados
      const user = authService.getCurrentUser();
      if (user) {
        try {
          await estudioService.guardarResultado({
            usuario_id: user.id,
            metodo: 'verdadero_falso',
            puntuacion: calcularPuntuacion(),
            total_preguntas: preguntas.length
          });
        } catch (err) {
          console.error("No se pudo guardar la nota en la bd", err);
        }
      }
      setFase('resultados');
    }
  };

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
              <span className="text-brand-orange">Verdadero / Falso</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
              Reto de <span className="text-brand-orange">Agilidad</span>
            </h1>
          </div>

          <motion.div
            key={fase} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-slate-50 border border-gray-100 rounded-[2rem] p-8 md:p-14 text-center shadow-inner min-h-[400px] flex flex-col justify-center"
          >
            {fase === 'inicio' && (
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-white border-4 border-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <svg className="w-10 h-10 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Decisiones rápidas</h2>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                  Lee la afirmación y decide rápidamente si es verdadera o falsa. Este método te ayudará a evitar dudar frente a preguntas "trampa" o conceptos muy similares.
                </p>
                <button
                  onClick={iniciarReto}
                  className="w-full sm:w-auto px-10 py-4 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  Comenzar Reto
                </button>
              </div>
            )}

            {fase === 'cargando' && (
              <div className="py-10">
                <div className="w-16 h-16 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Preparando afirmaciones...</h2>
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
                  onClick={iniciarReto}
                  className="px-8 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                >
                  Reintentar
                </button>
              </div>
            )}

            {fase === 'preguntas' && preguntaActual && (
              <div className="w-full max-w-2xl mx-auto text-center flex flex-col h-full">
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-brand-orange uppercase tracking-widest">
                      Afirmación {indiceActual + 1} de {preguntas.length}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      {Math.round(((indiceActual + 1) / preguntas.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-brand-orange rounded-full"
                      initial={{ width: `${(indiceActual / preguntas.length) * 100}%` }}
                      animate={{ width: `${((indiceActual + 1) / preguntas.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 mb-8">
                  <h2 className="text-xl md:text-3xl font-bold text-slate-800 leading-relaxed">
                    "{preguntaActual.pregunta}"
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => handleSeleccionar('Verdadero')}
                    className={`w-full py-5 rounded-2xl border-2 font-bold text-lg transition-all duration-200 ${
                      respuestaSeleccionada === 'Verdadero'
                        ? 'border-brand-orange bg-brand-orange/5 text-brand-orange shadow-[0_4px_12px_rgba(216,90,48,0.1)]'
                        : 'border-white bg-white text-gray-600 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    Verdadero
                  </button>
                  <button
                    onClick={() => handleSeleccionar('Falso')}
                    className={`w-full py-5 rounded-2xl border-2 font-bold text-lg transition-all duration-200 ${
                      respuestaSeleccionada === 'Falso'
                        ? 'border-slate-800 bg-slate-800/5 text-slate-800 shadow-[0_4px_12px_rgba(30,41,59,0.1)]'
                        : 'border-white bg-white text-gray-600 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    Falso
                  </button>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={handleSiguiente}
                    disabled={!respuestaSeleccionada}
                    className={`px-10 py-3.5 font-bold rounded-xl transition-all duration-300 w-full sm:w-auto ${
                      !respuestaSeleccionada 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-brand-orange text-white hover:bg-orange-600 hover:-translate-y-0.5 shadow-md'
                    }`}
                  >
                    {indiceActual === preguntas.length - 1 ? 'Finalizar' : 'Siguiente'}
                  </button>
                </div>
              </div>
            )}

            {fase === 'resultados' && (
              <div className="py-8 max-w-md mx-auto text-center">
                <span className="text-xs font-bold text-gray-400 tracking-widest uppercase block mb-6">
                  Puntuación de Agilidad
                </span>
                
                <div className="relative w-40 h-40 mx-auto mb-8 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <path
                      className="text-gray-200"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <motion.path
                      className="text-brand-orange"
                      strokeWidth="3"
                      strokeDasharray={`${(calcularPuntuacion() / preguntas.length) * 100}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      initial={{ strokeDasharray: "0, 100" }}
                      animate={{ strokeDasharray: `${(calcularPuntuacion() / preguntas.length) * 100}, 100` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-slate-900">{calcularPuntuacion()}</span>
                    <span className="text-sm font-medium text-gray-500 border-t border-gray-200 pt-1 mt-1 w-12">
                      de {preguntas.length}
                    </span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-3">
                  {calcularPuntuacion() >= preguntas.length * 0.8 ? '¡Reflejos perfectos!' : 'Sigue practicando'}
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                  {calcularPuntuacion() >= preguntas.length * 0.8 
                    ? 'Tienes los conceptos muy claros. Estás listo para cualquier pregunta capciosa.' 
                    : 'Algunos conceptos aún se confunden. Te recomendamos repasar las flashcards nuevamente.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={iniciarReto}
                    className="px-6 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    Volver a intentar
                  </button>
                  <Link
                    href="/estudio"
                    className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:border-gray-300 hover:bg-white transition-colors"
                  >
                    Salir
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