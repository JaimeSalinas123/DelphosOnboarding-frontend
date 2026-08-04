'use client';

import { useState, useEffect } from 'react';
import { estudioService, type Pregunta } from '@/services/estudioService';

type ModoEstudio = 'cuestionario' | 'flashcard' | 'verdadero_falso';
type VistaEstudio = 'preguntas' | 'resultados';

// ============================================================================
// INTERFACES PARA RESULTADOS 
// ============================================================================
export interface ResultadoEstudio {
  id: string;
  usuario: {
    nombre: string;
    email: string;
    departamento: string;
  };
  metodo: ModoEstudio;
  puntuacion?: number | null;
  total_preguntas?: number | null;
  fecha_completado: string;
  respuestas_detalle?: any[]; 
}

// Interfaz para agrupar los resultados por usuario
interface UsuarioAgrupado {
  email: string;
  nombre: string;
  departamento: string;
  intentos: ResultadoEstudio[];
}

const formatoFecha = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default function EstudioPage() {
  // Estado principal de navegación
  const [vista, setVista] = useState<VistaEstudio>('preguntas');

  // ============================================================================
  // ESTADOS: PREGUNTAS
  // ============================================================================
  const [modoActivo, setModoActivo] = useState<ModoEstudio>('cuestionario');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [cargandoPreguntas, setCargandoPreguntas] = useState(true);
  const [errorPreguntas, setErrorPreguntas] = useState<string | null>(null);

  const [preguntaEditando, setPreguntaEditando] = useState<Pregunta | null>(null);
  const [guardando, setGuardando] = useState(false);

  // ============================================================================
  // ESTADOS: RESULTADOS AGRUPADOS
  // ============================================================================
  const [resultadosAgrupados, setResultadosAgrupados] = useState<UsuarioAgrupado[]>([]);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [errorResultados, setErrorResultados] = useState<string | null>(null);
  const [resultadosCargados, setResultadosCargados] = useState(false);
  
  // Estado para el modal: ahora guarda un "UsuarioAgrupado" completo
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAgrupado | null>(null);

  // ============================================================================
  // EFECTOS Y CARGA DE DATOS
  // ============================================================================
  useEffect(() => {
    cargarPreguntas();
  }, []);

  const cargarPreguntas = () => {
    setCargandoPreguntas(true);
    estudioService.listar()
      .then(setPreguntas)
      .catch((err: Error) => setErrorPreguntas(err.message))
      .finally(() => setCargandoPreguntas(false));
  };

  const cargarResultados = async () => {
    setCargandoResultados(true);
    setErrorResultados(null);
    try {
      const data = await estudioService.obtenerResultados();
      
      // Agrupar los resultados por el email del usuario
      const gruposMap = new Map<string, UsuarioAgrupado>();
      
      data.forEach((r) => {
        // Asegurarse de que el usuario existe (prevención de errores si un usuario fue borrado a la mala en la BD)
        if (!r.usuario) return;
        
        const email = r.usuario.email;
        if (!gruposMap.has(email)) {
          gruposMap.set(email, {
            email: email,
            nombre: r.usuario.nombre,
            departamento: r.usuario.departamento,
            intentos: []
          });
        }
        gruposMap.get(email)!.intentos.push(r);
      });

      // Convertir el mapa a un array
      const gruposArray = Array.from(gruposMap.values());
      setResultadosAgrupados(gruposArray);
      setResultadosCargados(true);
    } catch (err: any) {
      setErrorResultados(err.message);
    } finally {
      setCargandoResultados(false);
    }
  };

  const cambiarVista = (v: VistaEstudio) => {
    setVista(v);
    if (v === 'resultados' && !resultadosCargados && !cargandoResultados) {
      cargarResultados();
    }
  };

  // ============================================================================
  // FUNCIONES DE ACCIÓN (PREGUNTAS)
  // ============================================================================
  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta pregunta del sistema? (Se mantendrá oculta en el historial)')) return;
    try {
      await estudioService.eliminar(id);
      cargarPreguntas();
    } catch (error) {
      alert('Hubo un error al eliminar');
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!preguntaEditando) return;
    
    setGuardando(true);
    try {
      await estudioService.actualizar(preguntaEditando.id, {
        pregunta: preguntaEditando.pregunta,
        respuesta_correcta: preguntaEditando.respuesta_correcta,
        opcion_a: preguntaEditando.opcion_a,
        opcion_b: preguntaEditando.opcion_b,
        opcion_c: preguntaEditando.opcion_c,
        opcion_d: preguntaEditando.opcion_d,
      });
      setPreguntaEditando(null);
      cargarPreguntas();
    } catch (error) {
      alert('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const preguntasFiltradas = preguntas.filter(p => p.tipo === modoActivo);

  const formatoMetodo = (metodo: ModoEstudio) => {
    if (metodo === 'cuestionario') return 'Cuestionario';
    if (metodo === 'flashcard') return 'Flashcards';
    return 'Verdadero / Falso';
  };

  // Orden requerido para los intentos en el modal: Cuestionario, luego Flashcard, luego V/F
  const ordenarIntentos = (intentos: ResultadoEstudio[]) => {
    const orden = {
      'cuestionario': 1,
      'flashcard': 2,
      'verdadero_falso': 3
    };

    return [...intentos].sort((a, b) => {
      // Primero ordena por método según el requerimiento
      if (orden[a.metodo] !== orden[b.metodo]) {
        return orden[a.metodo] - orden[b.metodo];
      }
      // Si son del mismo método, los ordenamos del más reciente al más antiguo
      return new Date(b.fecha_completado).getTime() - new Date(a.fecha_completado).getTime();
    });
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================
  return (
    <div className="relative mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl">Estudio</h1>
          <p className="mt-1 text-sm text-body">
            {vista === 'preguntas'
              ? 'Gestiona las preguntas y respuestas de los diferentes métodos de aprendizaje.'
              : 'Revisa el progreso y los resultados consolidados de los usuarios.'}
          </p>
        </div>
        
        {vista === 'preguntas' && (
          <button className="inline-flex items-center justify-center rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-orange/90">
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar Pregunta
          </button>
        )}
      </header>

      {/* NAVEGACIÓN PRINCIPAL: PREGUNTAS VS RESULTADOS */}
      <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-default bg-neutral-secondary/40 p-1">
        <button
          onClick={() => cambiarVista('preguntas')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            vista === 'preguntas'
              ? 'bg-white text-brand-orange shadow-sm'
              : 'text-body hover:text-heading'
          }`}
        >
          Preguntas
        </button>
        <button
          onClick={() => cambiarVista('resultados')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            vista === 'resultados'
              ? 'bg-white text-brand-orange shadow-sm'
              : 'text-body hover:text-heading'
          }`}
        >
          Resultados
        </button>
      </div>

      {/* ============================================================================
          VISTA: PREGUNTAS
          ============================================================================ */}
      {vista === 'preguntas' ? (
        <>
          {/* SUB-PESTAÑAS DE MÉTODOS */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {['cuestionario', 'flashcard', 'verdadero_falso'].map((modo) => (
              <button
                key={modo}
                onClick={() => setModoActivo(modo as ModoEstudio)}
                className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition-all ${
                  modoActivo === modo
                    ? 'border-brand-orange bg-brand-orange text-white'
                    : 'border-default bg-white text-heading hover:border-brand-orange/50'
                }`}
              >
                {formatoMetodo(modo as ModoEstudio)}
              </button>
            ))}
          </div>

          {/* TABLA DE PREGUNTAS */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-default bg-neutral-primary shadow-sm">
            {cargandoPreguntas ? (
              <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" /></div>
            ) : errorPreguntas ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-sm font-medium text-heading">No se pudo cargar el listado</p>
                <p className="max-w-sm text-xs text-body">{errorPreguntas}</p>
                <button onClick={cargarPreguntas} className="mt-1 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white hover:opacity-90">Reintentar</button>
              </div>
            ) : preguntasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-body">
                <p className="text-sm font-medium text-heading">No hay preguntas registradas aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-default bg-neutral-secondary/60 text-xs uppercase tracking-wide text-brand-gray">
                      <th className="px-5 py-3 font-semibold">Nivel</th>
                      <th className="px-5 py-3 font-semibold">Pregunta</th>
                      <th className="px-5 py-3 font-semibold">Respuesta Correcta</th>
                      <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {preguntasFiltradas.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-neutral-secondary/40">
                        <td className="px-5 py-4 text-body font-medium whitespace-nowrap">{p.nivel || 'General'}</td>
                        <td className="px-5 py-4 text-heading max-w-md">{p.pregunta}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                            {p.respuesta_correcta}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button onClick={() => setPreguntaEditando(p)} className="text-brand-orange hover:text-brand-orange/80 mr-3 font-medium">Editar</button>
                          <button onClick={() => handleEliminar(p.id)} className="text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* MODAL DE EDICIÓN DE PREGUNTAS */}
          {preguntaEditando && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl overflow-hidden">
                <h2 className="text-xl font-bold text-heading mb-4">Editar Pregunta</h2>
                <form onSubmit={handleGuardarEdicion} className="flex flex-col gap-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-heading mb-1">Pregunta</label>
                    <textarea
                      className="w-full rounded-lg border border-default p-2.5 text-sm outline-none focus:border-brand-orange"
                      rows={3}
                      value={preguntaEditando.pregunta}
                      onChange={(e) => setPreguntaEditando({ ...preguntaEditando, pregunta: e.target.value })}
                      required
                    />
                  </div>

                  {preguntaEditando.tipo === 'cuestionario' && (
                    <div className="grid grid-cols-2 gap-4">
                      {(['a', 'b', 'c', 'd'] as const).map(letra => (
                        <div key={letra}>
                          <label className="block text-xs font-medium text-heading mb-1 uppercase">Opción {letra}</label>
                          <input
                            type="text"
                            className="w-full rounded-lg border border-default p-2 text-sm outline-none focus:border-brand-orange"
                            value={preguntaEditando[`opcion_${letra}`] || ''}
                            onChange={(e) => setPreguntaEditando({ ...preguntaEditando, [`opcion_${letra}`]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-heading mb-1">Respuesta Correcta</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-default p-2.5 text-sm outline-none focus:border-brand-orange"
                      value={preguntaEditando.respuesta_correcta}
                      onChange={(e) => setPreguntaEditando({ ...preguntaEditando, respuesta_correcta: e.target.value })}
                      required
                      placeholder={preguntaEditando.tipo === 'cuestionario' ? 'A, B, C o D' : 'Texto exacto'}
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setPreguntaEditando(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-body hover:bg-neutral-secondary" disabled={guardando}>Cancelar</button>
                    <button type="submit" className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange/90 disabled:opacity-50" disabled={guardando}>
                      {guardando ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ============================================================================
           VISTA: RESULTADOS
           ============================================================================ */
        <>
          <section className="mt-6 overflow-hidden rounded-2xl border border-default bg-neutral-primary shadow-sm">
            {cargandoResultados ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
              </div>
            ) : errorResultados ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-sm font-medium text-heading">No se pudo cargar los resultados</p>
                <p className="max-w-sm text-xs text-body">{errorResultados}</p>
                <button onClick={cargarResultados} className="mt-1 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white hover:opacity-90">Reintentar</button>
              </div>
            ) : resultadosAgrupados.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 py-20 text-center text-body">
                <p className="text-sm font-medium text-heading">No hay resultados de estudio registrados aún.</p>
                <p className="text-xs text-body">Cuando un usuario complete un método de estudio, aparecerá aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-default bg-neutral-secondary/60 text-xs uppercase tracking-wide text-brand-gray">
                      <th className="px-5 py-3 font-semibold">Usuario</th>
                      <th className="px-5 py-3 font-semibold">Departamento</th>
                      <th className="px-5 py-3 font-semibold text-center">Total Intentos</th>
                      <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-default">
                    {resultadosAgrupados.map((usuario) => (
                      <tr key={usuario.email} className="transition-colors hover:bg-neutral-secondary/40">
                        <td className="px-5 py-4">
                          <p className="font-medium text-heading">{usuario.nombre}</p>
                          <p className="text-xs text-body">{usuario.email}</p>
                        </td>
                        <td className="px-5 py-4 text-body">
                          {usuario.departamento}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange/10 font-bold text-brand-orange">
                            {usuario.intentos.length}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setUsuarioSeleccionado(usuario)}
                            className="font-medium text-brand-orange hover:text-brand-orange/80"
                          >
                            Ver detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* MODAL DE DETALLES DE RESULTADO AGRUPADO */}
          {usuarioSeleccionado && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              {/* Le agregamos 'overflow-hidden' aquí abajo para evitar bordes cuadrados */}
              <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl overflow-hidden">
                
                {/* Cabecera del Modal */}
                <div className="flex items-start justify-between gap-4 border-b border-default p-6 bg-white z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-heading mb-1">{usuarioSeleccionado.nombre}</h2>
                    <p className="text-sm text-body">{usuarioSeleccionado.departamento} · {usuarioSeleccionado.email}</p>
                  </div>
                  <button
                    onClick={() => setUsuarioSeleccionado(null)}
                    className="rounded-lg p-1.5 text-body hover:bg-neutral-secondary hover:text-heading"
                    aria-label="Cerrar"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Contenido del Modal (Historial ordenado) */}
                <div className="deinsa-scroll overflow-y-auto p-6 bg-slate-50">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-gray">
                    Historial de Sesiones (Ordenado por Método)
                  </h3>
                  
                  <div className="overflow-hidden rounded-xl border border-default bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-default bg-neutral-secondary/30 text-xs font-semibold text-brand-gray">
                          <th className="px-5 py-3">Método Evaluado</th>
                          <th className="px-5 py-3">Puntuación Final</th>
                          <th className="px-5 py-3 text-right">Fecha y Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-default">
                        {ordenarIntentos(usuarioSeleccionado.intentos).map((intento) => (
                          <tr key={intento.id} className="hover:bg-neutral-secondary/10 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold border
                                ${intento.metodo === 'cuestionario' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                ${intento.metodo === 'flashcard' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                ${intento.metodo === 'verdadero_falso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                              `}>
                                {formatoMetodo(intento.metodo)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {intento.puntuacion !== undefined && intento.puntuacion !== null ? (
                                <span className="font-bold text-heading">
                                  {intento.puntuacion} <span className="text-body font-normal">/ {intento.total_preguntas}</span>
                                </span>
                              ) : (
                                <span className="text-brand-gray italic">Sin puntaje (Repaso libre)</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right whitespace-nowrap text-body">
                              {formatoFecha.format(new Date(intento.fecha_completado))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}