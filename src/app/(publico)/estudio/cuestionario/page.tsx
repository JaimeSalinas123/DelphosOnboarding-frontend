'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { estudioService, type Pregunta } from '@/services/estudioService';
import { authService } from '@/services/authService';
import { useProgresoStore } from '@/lib/useProgresoStore';

type FaseCuestionario = 'inicio' | 'cargando' | 'preguntas' | 'resultados' | 'error';

export default function CuestionarioPage() {
  const [fase, setFase] = useState<FaseCuestionario>('inicio');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  
  const [respuestasUsuario, setRespuestasUsuario] = useState<Record<string, { key: string; val: string }>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const iniciarCuestionario = async () => {
    setFase('cargando');
    setErrorMsg(null);
    try {
      const data = await estudioService.listar();
      
      const preguntasCuestionario = data.filter(p => p.tipo === 'cuestionario');

      if (preguntasCuestionario.length === 0) {
        throw new Error('No hay preguntas de opción múltiple disponibles.');
      }

      const preguntasMezcladas = preguntasCuestionario
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
  
  const opcionesActuales = preguntaActual ? [
    { key: 'A', val: preguntaActual.opcion_a ?? '' },
    { key: 'B', val: preguntaActual.opcion_b ?? '' },
    { key: 'C', val: preguntaActual.opcion_c ?? '' },
    { key: 'D', val: preguntaActual.opcion_d ?? '' },
  ].filter(opt => opt.val !== '') : [];

  const respuestaSeleccionada = preguntaActual ? respuestasUsuario[preguntaActual.id] : null;

  const handleSeleccionar = (opcion: { key: string; val: string }) => {
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
        const esCorrecta = 
          p.respuesta_correcta.trim().toLowerCase() === seleccion.key.toLowerCase() ||
          p.respuesta_correcta.trim().toLowerCase() === seleccion.val.toLowerCase();
          
        if (esCorrecta) correctas++;
      }
    });
    return correctas;
  };

  const handleSiguiente = async () => {
    if (indiceActual < preguntas.length - 1) {
      setIndiceActual(prev => prev + 1);
    } else {
      const user = authService.getCurrentUser();
      
      if (user) {
        let rawUserId = 
          user.id || 
          user.usuario_id || 
          user.id_usuario || 
          user.uid ||
          (user as any)._id || 
          (user as any).sub || 
          (user as any).uuid ||
          user.user?.id ||
          user.data?.user?.id;
        
        if (rawUserId !== undefined && rawUserId !== null) {
          const userIdString = String(rawUserId);
          
          // CONSTRUIMOS EL DETALLE DE LAS RESPUESTAS
          const respuestas_detalle = preguntas.map(p => {
            const seleccion = respuestasUsuario[p.id];
            const esCorrecta = seleccion ? (
              p.respuesta_correcta.trim().toLowerCase() === seleccion.key.toLowerCase() ||
              p.respuesta_correcta.trim().toLowerCase() === seleccion.val.toLowerCase()
            ) : false;

            return {
              pregunta: p.pregunta,
              respuesta_usuario: seleccion ? `${seleccion.key}) ${seleccion.val}` : 'Sin responder',
              respuesta_correcta: p.respuesta_correcta,
              es_correcta: esCorrecta
            };
          });
          
          try {
            // @ts-ignore
            await estudioService.guardarResultado({
              usuario_id: userIdString,
              metodo: 'cuestionario',
              puntuacion: calcularPuntuacion(),
              total_preguntas: preguntas.length,
              respuestas_detalle // LO ENVIAMOS AL BACKEND
            });
            useProgresoStore.getState().cargar();
          } catch (err) {
            console.error("❌ Error al guardar el resultado en la BD:", err);
          }
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
              <span className="text-brand-orange">Cuestionario</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
              Evaluación <span className="text-brand-orange">Rápida</span>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">¿Listo para empezar?</h2>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                  El cuestionario consta de un máximo de 10 preguntas aleatorias enfocadas en los módulos de Delphos. No hay límite de tiempo, concéntrate en responder correctamente.
                </p>
                <button
                  onClick={iniciarCuestionario}
                  className="w-full sm:w-auto px-10 py-4 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  Comenzar Cuestionario
                </button>
              </div>
            )}

            {fase === 'cargando' && (
              <div className="py-10">
                <div className="w-16 h-16 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Preparando preguntas...</h2>
                <p className="text-gray-500 text-sm">Sincronizando con la base de datos.</p>
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
                  onClick={iniciarCuestionario}
                  className="px-8 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                >
                  Reintentar
                </button>
              </div>
            )}

            {fase === 'preguntas' && preguntaActual && (
              <div className="w-full max-w-2xl mx-auto text-left flex flex-col h-full">
                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-brand-orange uppercase tracking-widest">
                      Pregunta {indiceActual + 1} de {preguntas.length}
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

                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug mb-6">
                  {preguntaActual.pregunta}
                </h2>

                <div className="space-y-3 mb-8">
                  {opcionesActuales.map((opt) => {
                    const isSelected = respuestaSeleccionada?.key === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSeleccionar(opt)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                          isSelected 
                            ? 'border-brand-orange bg-brand-orange/5 shadow-[0_4px_12px_rgba(216,90,48,0.1)]' 
                            : 'border-white bg-white hover:border-gray-300 hover:shadow-sm text-gray-600'
                        }`}
                      >
                        <span className={`font-bold mr-3 ${isSelected ? 'text-brand-orange' : 'text-gray-400'}`}>
                          {opt.key}.
                        </span> 
                        <span className={isSelected ? 'text-slate-800 font-medium' : ''}>
                          {opt.val}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-auto flex justify-end">
                  <button
                    onClick={handleSiguiente}
                    disabled={!respuestaSeleccionada}
                    className={`px-8 py-3.5 font-bold rounded-xl transition-all duration-300 ${
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
                  Resultados del Cuestionario
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
                  {calcularPuntuacion() >= preguntas.length * 0.8 ? '¡Excelente trabajo!' : 'Sigue practicando'}
                </h2>
                <p className="text-gray-500 mb-8 leading-relaxed text-sm">
                  Has completado la evaluación. Puedes revisar tus apuntes en los otros métodos de estudio o volver a intentarlo para mejorar tu puntuación.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={iniciarCuestionario}
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