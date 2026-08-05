'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  encuestaService,
  type DatosPregunta,
  type PreguntaSatisfaccion,
  type ResultadoEncuesta,
  type TipoRespuesta,
} from '@/services/encuestaService';
import type { Paginacion } from '@/lib/paginacion';
import Paginador from '@/components/global/Paginador';
import SessionExpired from '@/components/global/SessionExpired';

const RESULTADOS_POR_PAGINA = 10;

const FORM_VACIO: DatosPregunta = {
  seccion: '',
  pregunta: '',
  tipo_respuesta: 'escala',
  escala_min: 1,
  escala_max: 5,
  orden: 1,
  obligatoria: true,
};

function aFormulario(p: PreguntaSatisfaccion): DatosPregunta {
  return {
    seccion: p.seccion,
    pregunta: p.pregunta,
    tipo_respuesta: p.tipo_respuesta,
    escala_min: p.escala_min,
    escala_max: p.escala_max,
    orden: p.orden,
    obligatoria: p.obligatoria,
  };
}

const formatoFecha = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Agrupa las respuestas de una encuesta por sección, en orden de pregunta. */
function agruparPorSeccion(resultado: ResultadoEncuesta) {
  const ordenadas = resultado.respuestas
    .slice()
    .sort((a, b) => a.pregunta.orden - b.pregunta.orden);

  const secciones: { seccion: string; respuestas: typeof ordenadas }[] = [];
  for (const r of ordenadas) {
    let grupo = secciones.find((s) => s.seccion === r.pregunta.seccion);
    if (!grupo) {
      grupo = { seccion: r.pregunta.seccion, respuestas: [] };
      secciones.push(grupo);
    }
    grupo.respuestas.push(r);
  }
  return secciones;
}

// ============================================================================
// COMPONENTES AUXILIARES DE DISEÑO
// ============================================================================
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">
      <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
      {children}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function EncuestasPage() {
  const [vista, setVista] = useState<'preguntas' | 'resultados'>('preguntas');

  const [preguntas, setPreguntas] = useState<PreguntaSatisfaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seccionActiva, setSeccionActiva] = useState('todas');

  // Modal de creación/edición.
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<DatosPregunta>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Resultados: encuestas completadas por los usuarios.
  const [resultados, setResultados] = useState<ResultadoEncuesta[]>([]);
  const [paginacionResultados, setPaginacionResultados] = useState<Paginacion | null>(null);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [errorResultados, setErrorResultados] = useState<string | null>(null);
  const [intentosResultados, setIntentosResultados] = useState(0);
  const [paginaResultados, setPaginaResultados] = useState(1);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState<ResultadoEncuesta | null>(null);

  const cargarPreguntas = () => {
    setCargando(true);
    setError(null);
    encuestaService
      .listar()
      .then(setPreguntas)
      .catch((err: Error) => setError(err.message))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarPreguntas();
  }, []);

  // Recarga resultados
  useEffect(() => {
    if (vista !== 'resultados') return;
    let cancelado = false;
    setCargandoResultados(true);
    setErrorResultados(null);
    encuestaService
      .obtenerResultados({ pagina: paginaResultados, limite: RESULTADOS_POR_PAGINA })
      .then((data) => {
        if (cancelado) return;
        setResultados(data.resultados);
        setPaginacionResultados(data.paginacion);
      })
      .catch((err: Error) => {
        if (!cancelado) setErrorResultados(err.message);
      })
      .finally(() => {
        if (!cancelado) setCargandoResultados(false);
      });
    return () => {
      cancelado = true;
    };
  }, [vista, paginaResultados, intentosResultados]);

  const secciones = useMemo(
    () => Array.from(new Set(preguntas.map((p) => p.seccion))),
    [preguntas]
  );

  const preguntasFiltradas =
    seccionActiva === 'todas'
      ? preguntas
      : preguntas.filter((p) => p.seccion === seccionActiva);

  const abrirCrear = () => {
    setEditandoId(null);
    setFormulario({
      ...FORM_VACIO,
      seccion: seccionActiva !== 'todas' ? seccionActiva : '',
      orden: preguntas.length + 1,
    });
    setErrorModal(null);
    setModalAbierto(true);
  };

  const abrirEditar = (p: PreguntaSatisfaccion) => {
    setEditandoId(p.id);
    setFormulario(aFormulario(p));
    setErrorModal(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
  };

  const cambiarTipoRespuesta = (tipo: TipoRespuesta) => {
    setFormulario((prev) => ({
      ...prev,
      tipo_respuesta: tipo,
      escala_min: tipo === 'escala' ? (prev.escala_min ?? 1) : null,
      escala_max: tipo === 'escala' ? (prev.escala_max ?? 5) : null,
    }));
  };

  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true);
    setErrorModal(null);
    try {
      if (editandoId) {
        await encuestaService.actualizar(editandoId, formulario);
      } else {
        await encuestaService.crear(formulario);
      }
      setModalAbierto(false);
      cargarPreguntas();
    } catch (err) {
      setErrorModal((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (p: PreguntaSatisfaccion) => {
    if (!window.confirm(`¿Eliminar la pregunta "${p.pregunta}"? Quedará oculta, no se borra del historial.`)) {
      return;
    }
    try {
      await encuestaService.eliminar(p.id);
      cargarPreguntas();
    } catch (err) {
      window.alert(`No se pudo eliminar: ${(err as Error).message}`);
    }
  };

  const esErrorSesionPreguntas = error?.toLowerCase().includes('token') || error?.toLowerCase().includes('expirad');
  const esErrorSesionResultados = errorResultados?.toLowerCase().includes('token') || errorResultados?.toLowerCase().includes('expirad');

  // ============================================================================
  // RENDERIZADO
  // ============================================================================
  return (
    <div className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-10 xl:px-14 bg-[#f8f9fa] min-h-screen">
      
      {/* HEADER ELEGANTE */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-orange mb-2">
            Gestión de Satisfacción
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Encuestas
          </h1>
          <p className="mt-2 text-base text-gray-500">
            {vista === 'preguntas'
              ? 'Configura las preguntas de la evaluación de satisfacción.'
              : 'Revisa las respuestas enviadas por los usuarios.'}
          </p>
        </div>

        {/* NAVEGACIÓN PRINCIPAL (Toggle) */}
        <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm shrink-0">
          <button
            onClick={() => setVista('preguntas')}
            className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
              vista === 'preguntas'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Preguntas
          </button>
          <button
            onClick={() => setVista('resultados')}
            className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
              vista === 'resultados'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Resultados
          </button>
        </div>
      </header>

      {/* ============================================================================
          VISTA: PREGUNTAS
          ============================================================================ */}
      {vista === 'preguntas' ? (
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <Eyebrow>Diseño del Formulario</Eyebrow>
            <button
              onClick={abrirCrear}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-orange to-[#f97316] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand-orange/20"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar Pregunta
            </button>
          </div>

          {/* PESTAÑAS TIPO PÍLDORA (SECCIONES) - CORREGIDO CON FLEX-WRAP */}
          <div className="flex flex-wrap w-full pb-6 gap-2.5">
            {['todas', ...secciones].map((seccion) => {
              const isActive = seccionActiva === seccion;
              return (
                <button
                  key={seccion}
                  onClick={() => setSeccionActiva(seccion)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-out ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20 scale-105'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  {seccion === 'todas' ? 'Todas' : seccion}
                </button>
              );
            })}
          </div>

          {/* TABLA DE PREGUNTAS */}
          {cargando ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
              <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando preguntas...</p>
            </div>
          ) : error ? (
            esErrorSesionPreguntas ? (
              <div className="py-12 flex justify-center"><SessionExpired /></div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-base font-bold text-gray-900">Error al cargar preguntas</p>
                <p className="max-w-sm text-sm text-gray-500">{error}</p>
                <button onClick={cargarPreguntas} className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md">Reintentar</button>
              </div>
            )
          ) : preguntasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <div className="h-16 w-16 mb-2 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-lg font-bold text-gray-900">Sin preguntas registradas</p>
              <p className="text-sm text-gray-500">Haz clic en "Agregar pregunta" para comenzar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-center">Orden</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Sección</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Pregunta</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Tipo</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Obligatoria</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preguntasFiltradas
                    .slice()
                    .sort((a, b) => a.orden - b.orden)
                    .map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-4 py-5 text-gray-500 font-bold text-center">{p.orden}</td>
                        <td className="px-4 py-5 font-bold text-gray-900 whitespace-nowrap">{p.seccion}</td>
                        <td className="px-4 py-5 font-medium text-gray-600 max-w-md">{p.pregunta}</td>
                        <td className="px-4 py-5">
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 capitalize">
                            {p.tipo_respuesta} {p.tipo_respuesta === 'escala' && `(${p.escala_min}-${p.escala_max})`}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <span className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-bold shadow-sm ${
                            p.obligatoria ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {p.obligatoria ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-right whitespace-nowrap">
                          <button onClick={() => abrirEditar(p)} className="text-sm font-bold text-brand-orange hover:text-orange-700 mr-4 transition-colors">Editar</button>
                          <button onClick={() => handleEliminar(p)} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        /* ============================================================================
           VISTA: RESULTADOS
           ============================================================================ */
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <Eyebrow>Registro de Evaluaciones</Eyebrow>

          {cargandoResultados ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
              <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando respuestas...</p>
            </div>
          ) : errorResultados ? (
            esErrorSesionResultados ? (
              <div className="py-12 flex justify-center"><SessionExpired /></div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-base font-bold text-gray-900">Error al cargar resultados</p>
                <p className="max-w-sm text-sm text-gray-500">{errorResultados}</p>
                <button
                  onClick={() => setIntentosResultados((n) => n + 1)}
                  className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md"
                >
                  Reintentar
                </button>
              </div>
            )
          ) : resultados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <div className="h-16 w-16 mb-2 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m-9 5h12a2 2 0 002-2V6a2 2 0 00-2-2h-2.5a.5.5 0 00-.4.2l-.9 1.2a.5.5 0 01-.4.2h-2.4a.5.5 0 01-.4-.2l-.9-1.2a.5.5 0 00-.4-.2H6a2 2 0 00-2 2v13a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-lg font-bold text-gray-900">Sin encuestas completadas</p>
              <p className="text-sm text-gray-500">Cuando un usuario responda la encuesta, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Usuario</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Departamento</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Completada el</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {resultados.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-5">
                        <p className="font-bold text-gray-900">{r.usuario.nombre}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{r.usuario.email}</p>
                      </td>
                      <td className="px-4 py-5 font-medium text-gray-600">
                        {r.usuario.departamento ? (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {r.usuario.departamento}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-5 font-medium text-gray-500 whitespace-nowrap">
                        {formatoFecha.format(new Date(r.fecha_completado))}
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setResultadoSeleccionado(r)}
                          className="text-sm font-bold text-brand-orange hover:text-orange-700 transition-colors"
                        >
                          Ver respuestas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINACIÓN CON EL NUEVO DISEÑO AL 100% WIDTH */}
          {!cargandoResultados && !errorResultados && paginacionResultados && (
            <div className="mt-4 pt-5 border-t border-gray-100 w-full">
              <Paginador paginacion={paginacionResultados} onCambiarPagina={setPaginaResultados} />
            </div>
          )}
        </section>
      )}

      {/* ============================================================================
          MODAL: CREACIÓN / EDICIÓN DE PREGUNTA
          ============================================================================ */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl overflow-hidden">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
              {editandoId ? 'Editar Pregunta' : 'Nueva Pregunta'}
            </h2>

            {errorModal && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-600 flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errorModal}
              </div>
            )}

            <form onSubmit={handleGuardar} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Sección</label>
                <input
                  type="text"
                  list="secciones-existentes"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                  value={formulario.seccion}
                  onChange={(e) => setFormulario({ ...formulario, seccion: e.target.value })}
                  placeholder="Ej. Ambiente laboral"
                  required
                />
                <datalist id="secciones-existentes">
                  {secciones.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pregunta</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                  rows={3}
                  value={formulario.pregunta}
                  onChange={(e) => setFormulario({ ...formulario, pregunta: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tipo de respuesta</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                    value={formulario.tipo_respuesta}
                    onChange={(e) => cambiarTipoRespuesta(e.target.value as TipoRespuesta)}
                  >
                    <option value="escala">Escala Numérica</option>
                    <option value="texto">Texto Libre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Orden</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                    value={formulario.orden}
                    onChange={(e) => setFormulario({ ...formulario, orden: Number(e.target.value) })}
                    min={1}
                    required
                  />
                </div>
              </div>

              {formulario.tipo_respuesta === 'escala' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">Escala Mínima</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                      value={formulario.escala_min ?? ''}
                      onChange={(e) => setFormulario({ ...formulario, escala_min: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">Escala Máxima</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                      value={formulario.escala_max ?? ''}
                      onChange={(e) => setFormulario({ ...formulario, escala_max: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={formulario.obligatoria}
                      onChange={(e) => setFormulario({ ...formulario, obligatoria: e.target.checked })}
                    />
                    <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:bg-brand-orange peer-checked:border-brand-orange transition-all"></div>
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">Esta pregunta es obligatoria</span>
                </label>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="rounded-xl px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors w-full sm:w-auto"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-brand-orange to-[#f97316] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all w-full sm:w-auto disabled:opacity-50"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar Pregunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================
          MODAL: DETALLES DE RESPUESTA DE UN USUARIO
          ============================================================================ */}
      {resultadoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-8 bg-white z-10">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{resultadoSeleccionado.usuario.nombre}</h2>
                <p className="text-sm font-medium text-gray-500 mb-2">{resultadoSeleccionado.usuario.email}</p>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                    {resultadoSeleccionado.usuario.departamento}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    Enviado el {formatoFecha.format(new Date(resultadoSeleccionado.fecha_completado))}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setResultadoSeleccionado(null)}
                className="rounded-full p-2 text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="deinsa-scroll overflow-y-auto p-8 bg-[#f8f9fa]">
              {agruparPorSeccion(resultadoSeleccionado).map((grupo) => (
                <div key={grupo.seccion} className="mb-10 last:mb-0">
                  <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-orange mb-4">
                    <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
                    {grupo.seccion}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {grupo.respuestas.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <p className="text-base font-bold text-gray-900 mb-4">{r.pregunta.pregunta}</p>
                        
                        {r.pregunta.tipo_respuesta === 'texto' ? (
                          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                            <p className="text-sm text-gray-700 italic">
                              "{r.respuesta_texto || 'No se proporcionó respuesta.'}"
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="flex items-center gap-4">
                              <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100 shadow-inner">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-brand-orange to-[#f97316]"
                                  style={{ width: `${Math.round(((r.respuesta_numerica ?? 0) / ((r.pregunta as any).escala_max ?? 5)) * 100)}%` }}
                                />
                              </div>
                              <span className="w-16 shrink-0 text-right text-sm font-black text-gray-900">
                                {r.respuesta_numerica ?? 0} <span className="text-xs font-bold text-gray-400">/ {(r.pregunta as any).escala_max ?? 5}</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}