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
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState<ResultadoEncuesta | null>(
    null
  );

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
    // Patrón estándar de fetch-con-spinner al montar (react.dev/learn/synchronizing-with-effects#fetching-data).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPreguntas();
  }, []);

  // Solo pega al backend una vez que se entra a la pestaña; recarga al
  // cambiar de página o reintentar tras un error.
  useEffect(() => {
    if (vista !== 'resultados') return;
    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  return (
    <div className="relative mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl">Encuestas</h1>
          <p className="mt-1 text-sm text-body">
            {vista === 'preguntas'
              ? 'Gestiona las preguntas de la encuesta de satisfacción.'
              : 'Revisa las respuestas que cada usuario envió.'}
          </p>
        </div>

        {vista === 'preguntas' && (
          <button
            onClick={abrirCrear}
            className="inline-flex items-center justify-center rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-orange/90"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar pregunta
          </button>
        )}
      </header>

      {/* PESTAÑAS: Preguntas vs Resultados */}
      <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-default bg-neutral-secondary/40 p-1">
        <button
          onClick={() => setVista('preguntas')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            vista === 'preguntas'
              ? 'bg-white text-brand-orange shadow-sm'
              : 'text-body hover:text-heading'
          }`}
        >
          Preguntas
        </button>
        <button
          onClick={() => setVista('resultados')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            vista === 'resultados'
              ? 'bg-white text-brand-orange shadow-sm'
              : 'text-body hover:text-heading'
          }`}
        >
          Resultados
        </button>
      </div>

      {vista === 'preguntas' ? (
        <>
          {/* PESTAÑAS: "Todas" + las secciones que ya existan en los datos */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {['todas', ...secciones].map((seccion) => (
              <button
                key={seccion}
                onClick={() => setSeccionActiva(seccion)}
                className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition-all ${
                  seccionActiva === seccion
                    ? 'border-brand-orange bg-brand-orange text-white'
                    : 'border-default bg-white text-heading hover:border-brand-orange/50'
                }`}
              >
                {seccion === 'todas' ? 'Todas' : seccion}
              </button>
            ))}
          </div>

      {/* TABLA */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-default bg-neutral-primary shadow-sm">
        {cargando ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-medium text-heading">No se pudo cargar el listado</p>
            <p className="max-w-sm text-xs text-body">{error}</p>
            <button
              onClick={cargarPreguntas}
              className="mt-1 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              Reintentar
            </button>
          </div>
        ) : preguntasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-20 text-center text-body">
            <p className="text-sm font-medium text-heading">No hay preguntas registradas aquí.</p>
            <p className="text-xs text-body">Usá &quot;Agregar pregunta&quot; para crear la primera.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-default bg-neutral-secondary/60 text-xs uppercase tracking-wide text-brand-gray">
                  <th className="px-5 py-3 font-semibold">Orden</th>
                  <th className="px-5 py-3 font-semibold">Sección</th>
                  <th className="px-5 py-3 font-semibold">Pregunta</th>
                  <th className="px-5 py-3 font-semibold">Tipo</th>
                  <th className="px-5 py-3 font-semibold">Escala</th>
                  <th className="px-5 py-3 font-semibold">Obligatoria</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {preguntasFiltradas
                  .slice()
                  .sort((a, b) => a.orden - b.orden)
                  .map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-neutral-secondary/40">
                      <td className="px-5 py-4 text-body">{p.orden}</td>
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-heading">
                        {p.seccion}
                      </td>
                      <td className="max-w-md px-5 py-4 text-heading">{p.pregunta}</td>
                      <td className="px-5 py-4 text-body capitalize">{p.tipo_respuesta}</td>
                      <td className="px-5 py-4 text-body">
                        {p.tipo_respuesta === 'escala' ? `${p.escala_min}–${p.escala_max}` : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                            p.obligatoria
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-default bg-neutral-secondary text-brand-gray'
                          }`}
                        >
                          {p.obligatoria ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => abrirEditar(p)}
                          className="mr-3 font-medium text-brand-orange hover:text-brand-orange/80"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(p)}
                          className="font-medium text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
        </>
      ) : (
        <section className="mt-6 overflow-hidden rounded-2xl border border-default bg-neutral-primary shadow-sm">
          {cargandoResultados ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
            </div>
          ) : errorResultados ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-sm font-medium text-heading">No se pudo cargar los resultados</p>
              <p className="max-w-sm text-xs text-body">{errorResultados}</p>
              <button
                onClick={() => setIntentosResultados((n) => n + 1)}
                className="mt-1 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                Reintentar
              </button>
            </div>
          ) : resultados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-20 text-center text-body">
              <p className="text-sm font-medium text-heading">Todavía nadie completó la encuesta.</p>
              <p className="text-xs text-body">Cuando un usuario la responda, va a aparecer acá.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-default bg-neutral-secondary/60 text-xs uppercase tracking-wide text-brand-gray">
                    <th className="px-5 py-3 font-semibold">Usuario</th>
                    <th className="px-5 py-3 font-semibold">Departamento</th>
                    <th className="px-5 py-3 font-semibold">Completada</th>
                    <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-default">
                  {resultados.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-neutral-secondary/40">
                      <td className="px-5 py-4">
                        <p className="font-medium text-heading">{r.usuario.nombre}</p>
                        <p className="text-xs text-body">{r.usuario.email}</p>
                      </td>
                      <td className="px-5 py-4 text-body">{r.usuario.departamento}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-body">
                        {formatoFecha.format(new Date(r.fecha_completado))}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setResultadoSeleccionado(r)}
                          className="font-medium text-brand-orange hover:text-brand-orange/80"
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
          {!cargandoResultados && !errorResultados && paginacionResultados && (
            <Paginador paginacion={paginacionResultados} onCambiarPagina={setPaginaResultados} />
          )}
        </section>
      )}

      {/* MODAL: RESPUESTAS DE UN USUARIO */}
      {resultadoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-default p-6">
              <div>
                <h2 className="text-xl font-bold text-heading">{resultadoSeleccionado.usuario.nombre}</h2>
                <p className="mt-1 text-sm text-body">{resultadoSeleccionado.usuario.email}</p>
                <p className="text-xs text-brand-gray">
                  {resultadoSeleccionado.usuario.departamento} · Completada el{' '}
                  {formatoFecha.format(new Date(resultadoSeleccionado.fecha_completado))}
                </p>
              </div>
              <button
                onClick={() => setResultadoSeleccionado(null)}
                className="rounded-lg p-1.5 text-body hover:bg-neutral-secondary hover:text-heading"
                aria-label="Cerrar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="deinsa-scroll overflow-y-auto p-6">
              {agruparPorSeccion(resultadoSeleccionado).map((grupo) => (
                <div key={grupo.seccion} className="mb-6 last:mb-0">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-orange">
                    {grupo.seccion}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {grupo.respuestas.map((r) => (
                      <div key={r.id} className="rounded-xl border border-default p-3.5">
                        <p className="text-sm font-medium text-heading">{r.pregunta.pregunta}</p>
                        {r.pregunta.tipo_respuesta === 'texto' ? (
                          <p className="mt-2 rounded-lg bg-neutral-secondary/60 p-2.5 text-sm text-body italic">
                            {r.respuesta_texto || 'Sin respuesta.'}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-body">
                            Respuesta:{' '}
                            <span className="font-bold text-brand-orange">
                              {r.respuesta_numerica ?? '—'}
                            </span>
                          </p>
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

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-heading">
              {editandoId ? 'Editar pregunta' : 'Nueva pregunta'}
            </h2>

            {errorModal && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                {errorModal}
              </div>
            )}

            <form onSubmit={handleGuardar} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-heading">Sección</label>
                <input
                  type="text"
                  list="secciones-existentes"
                  className="w-full rounded-lg border border-default p-2.5 text-sm outline-none focus:border-brand-orange"
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
                <label className="mb-1 block text-sm font-medium text-heading">Pregunta</label>
                <textarea
                  className="w-full rounded-lg border border-default p-2.5 text-sm outline-none focus:border-brand-orange"
                  rows={3}
                  value={formulario.pregunta}
                  onChange={(e) => setFormulario({ ...formulario, pregunta: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-heading">
                    Tipo de respuesta
                  </label>
                  <select
                    className="w-full rounded-lg border border-default p-2.5 text-sm outline-none focus:border-brand-orange"
                    value={formulario.tipo_respuesta}
                    onChange={(e) => cambiarTipoRespuesta(e.target.value as TipoRespuesta)}
                  >
                    <option value="escala">Escala</option>
                    <option value="texto">Texto libre</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-heading">Orden</label>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-default p-2.5 text-sm outline-none focus:border-brand-orange"
                    value={formulario.orden}
                    onChange={(e) =>
                      setFormulario({ ...formulario, orden: Number(e.target.value) })
                    }
                    min={1}
                    required
                  />
                </div>
              </div>

              {formulario.tipo_respuesta === 'escala' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-heading">
                      Escala mínima
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-default p-2.5 text-sm outline-none focus:border-brand-orange"
                      value={formulario.escala_min ?? ''}
                      onChange={(e) =>
                        setFormulario({ ...formulario, escala_min: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-heading">
                      Escala máxima
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-default p-2.5 text-sm outline-none focus:border-brand-orange"
                      value={formulario.escala_max ?? ''}
                      onChange={(e) =>
                        setFormulario({ ...formulario, escala_max: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2.5 text-sm font-medium text-heading">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-default text-brand-orange focus:ring-brand-orange"
                  checked={formulario.obligatoria}
                  onChange={(e) =>
                    setFormulario({ ...formulario, obligatoria: e.target.checked })
                  }
                />
                Pregunta obligatoria
              </label>

              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-body hover:bg-neutral-secondary"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange/90 disabled:opacity-50"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
