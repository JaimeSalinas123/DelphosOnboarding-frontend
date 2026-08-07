'use client';

import { useState, useEffect, useMemo } from 'react';
import ModalTarjeta from '@/components/global/ModalTarjeta';
import { estudioService, type Pregunta, type ResultadoEstudio } from '@/services/estudioService';
import SessionExpired from '@/components/global/SessionExpired';
import Paginador from '@/components/global/Paginador';

type ModoEstudio = 'cuestionario' | 'flashcard' | 'verdadero_falso';
type VistaEstudio = 'preguntas' | 'resultados';

interface UsuarioAgrupado {
  email: string;
  nombre: string;
  departamento: string;
  intentos: ResultadoEstudio[];
}

const RESULTADOS_POR_PAGINA = 10;

const FORM_VACIO = {
  tipo: 'cuestionario' as ModoEstudio,
  nivel: 'Nivel 1',
  pregunta: '',
  respuesta_correcta: '',
  opcion_a: '',
  opcion_b: '',
  opcion_c: '',
  opcion_d: '',
};

const formatoFecha = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">
      <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
      {children}
    </div>
  );
}

export default function EstudioPage() {
  const [vista, setVista] = useState<VistaEstudio>('preguntas');

  const [modoActivo, setModoActivo] = useState<ModoEstudio>('cuestionario');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [cargandoPreguntas, setCargandoPreguntas] = useState(true);
  const [errorPreguntas, setErrorPreguntas] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [preguntaAEliminar, setPreguntaAEliminar] = useState<string | null>(null);
  const [eliminandoPregunta, setEliminandoPregunta] = useState(false);
  const [alertModal, setAlertModal] = useState<string | null>(null);

  const [resultadosAgrupados, setResultadosAgrupados] = useState<UsuarioAgrupado[]>([]);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [errorResultados, setErrorResultados] = useState<string | null>(null);
  const [resultadosCargados, setResultadosCargados] = useState(false);
  
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAgrupado | null>(null);
  const [intentoSeleccionado, setIntentoSeleccionado] = useState<ResultadoEstudio | null>(null);
  const [paginaResultados, setPaginaResultados] = useState(1);

  // Polling para Preguntas y Resultados dependiendo de la vista activa
  useEffect(() => {
    let cancelado = false;
    let intId: NodeJS.Timeout;

    if (vista === 'preguntas') {
      const fetchPreguntas = async (fondo = false) => {
        if (!fondo) setCargandoPreguntas(true);
        try {
          const data = await estudioService.listar();
          if (!cancelado) {
            setPreguntas(data);
            setErrorPreguntas(null);
          }
        } catch (err: any) {
          if (!cancelado && !fondo) setErrorPreguntas(err.message);
        } finally {
          if (!cancelado && !fondo) setCargandoPreguntas(false);
        }
      };

      fetchPreguntas(false);
      intId = setInterval(() => fetchPreguntas(true), 10000);
    } else {
      const fetchResultados = async (fondo = false) => {
        if (!fondo) setCargandoResultados(true);
        try {
          const data = await estudioService.obtenerResultados();
          if (!cancelado) {
            const gruposMap = new Map<string, UsuarioAgrupado>();
            data.forEach((r) => {
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
            setResultadosAgrupados(Array.from(gruposMap.values()));
            setResultadosCargados(true);
            setErrorResultados(null);
          }
        } catch (err: any) {
          if (!cancelado && !fondo) setErrorResultados(err.message);
        } finally {
          if (!cancelado && !fondo) setCargandoResultados(false);
        }
      };

      fetchResultados(!resultadosCargados ? false : true);
      intId = setInterval(() => fetchResultados(true), 10000);
    }

    return () => {
      cancelado = true;
      if (intId) clearInterval(intId);
    };
  }, [vista, resultadosCargados]);

  const cambiarVista = (v: VistaEstudio) => {
    setVista(v);
  };

  const cerrarModalUsuario = () => {
    setUsuarioSeleccionado(null);
    setIntentoSeleccionado(null);
  };

  const abrirCrear = () => {
    setEditandoId(null);
    setFormulario({ ...FORM_VACIO, tipo: modoActivo });
    setModalAbierto(true);
  };

  const abrirEditar = (p: Pregunta) => {
    setEditandoId(p.id);
    setFormulario({
      tipo: p.tipo as ModoEstudio,
      nivel: p.nivel || '',
      pregunta: p.pregunta,
      respuesta_correcta: p.respuesta_correcta,
      opcion_a: p.opcion_a || '',
      opcion_b: p.opcion_b || '',
      opcion_c: p.opcion_c || '',
      opcion_d: p.opcion_d || '',
    });
    setModalAbierto(true);
  };

  const handleEliminar = (id: string) => {
    setPreguntaAEliminar(id);
  };

  const ejecutarEliminacion = async () => {
    if (!preguntaAEliminar) return;
    setEliminandoPregunta(true);
    try {
      await estudioService.eliminar(preguntaAEliminar);
      setPreguntas((prev) => prev.filter((p) => p.id !== preguntaAEliminar));
      setPreguntaAEliminar(null);
    } catch (error) {
      setAlertModal('Hubo un error al eliminar');
    } finally {
      setEliminandoPregunta(false);
    }
  };

  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const datosAEnviar = { ...formulario };
      if (datosAEnviar.tipo !== 'cuestionario') {
        datosAEnviar.opcion_a = '';
        datosAEnviar.opcion_b = '';
        datosAEnviar.opcion_c = '';
        datosAEnviar.opcion_d = '';
        datosAEnviar.nivel = ''; 
      }

      if (editandoId) {
        await estudioService.actualizar(editandoId, datosAEnviar);
      } else {
        // @ts-ignore
        await estudioService.crear(datosAEnviar);
      }
      setModalAbierto(false);
      // Forzar carga inmediatamente
      const data = await estudioService.listar();
      setPreguntas(data);
    } catch (error) {
      setAlertModal('Error al guardar la pregunta');
    } finally {
      setGuardando(false);
    }
  };

  const preguntasFiltradas = useMemo(() => {
    const filtradas = preguntas.filter(p => p.tipo === modoActivo);
    
    if (modoActivo === 'cuestionario') {
      return filtradas.sort((a, b) => {
        const numA = parseInt((a.nivel || '').match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt((b.nivel || '').match(/\d+/)?.[0] || '0', 10);
        
        if (numA !== numB) return numA - numB; 
        return (a.nivel || '').localeCompare(b.nivel || ''); 
      });
    }
    
    return filtradas;
  }, [preguntas, modoActivo]);

  const formatoMetodo = (metodo: ModoEstudio) => {
    if (metodo === 'cuestionario') return 'Cuestionario';
    if (metodo === 'flashcard') return 'Flashcards';
    return 'Verdadero / Falso';
  };

  const ordenarIntentos = (intentos: ResultadoEstudio[]) => {
    return [...intentos].sort((a, b) => {
      return new Date(b.fecha_completado).getTime() - new Date(a.fecha_completado).getTime();
    });
  };

  const resultadosPaginados = useMemo(() => {
    const inicio = (paginaResultados - 1) * RESULTADOS_POR_PAGINA;
    return resultadosAgrupados.slice(inicio, inicio + RESULTADOS_POR_PAGINA);
  }, [resultadosAgrupados, paginaResultados]);

  const tokenInvalido = (err: string | null) => {
    if (!err) return false;
    const lower = err.toLowerCase();
    return lower.includes('token') || 
           lower.includes('expirad') || 
           lower.includes('sesi') || 
           lower.includes('autoriz') || 
           lower.includes('unauthorized') || 
           lower.includes('jwt') || 
           lower.includes('401') || 
           lower.includes('403');
  };

  const esErrorSesionPreguntas = tokenInvalido(errorPreguntas);
  const esErrorSesionResultados = tokenInvalido(errorResultados);

  return (
    <div className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-10 xl:px-14 bg-[#f8f9fa] min-h-screen">
      
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-orange mb-2">
            Módulos de Aprendizaje
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Estudio
          </h1>
          <p className="mt-2 text-base text-gray-500">
            {vista === 'preguntas'
              ? 'Gestiona las preguntas y respuestas de los diferentes métodos.'
              : 'Revisa el progreso y resultados consolidados de los usuarios.'}
          </p>
        </div>
        
        <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm shrink-0">
          <button
            onClick={() => cambiarVista('preguntas')}
            className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
              vista === 'preguntas'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Preguntas
          </button>
          <button
            onClick={() => cambiarVista('resultados')}
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

      {vista === 'preguntas' && (
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <Eyebrow>Banco de Preguntas</Eyebrow>
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

          <div className="flex flex-wrap gap-2.5 pb-6">
            {['cuestionario', 'flashcard', 'verdadero_falso'].map((modo) => (
              <button
                key={modo}
                onClick={() => setModoActivo(modo as ModoEstudio)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-out ${
                  modoActivo === modo
                    ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20 scale-105'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-900'
                }`}
              >
                {formatoMetodo(modo as ModoEstudio)}
              </button>
            ))}
          </div>

          {cargandoPreguntas ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
              <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando banco de preguntas...</p>
            </div>
          ) : errorPreguntas ? (
            esErrorSesionPreguntas ? (
              <div className="py-12 flex justify-center"><SessionExpired /></div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-base font-bold text-gray-900">Error al cargar preguntas</p>
                <p className="max-w-sm text-sm text-gray-500">{errorPreguntas}</p>
                <button onClick={() => setCargandoPreguntas(true)} className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md">Reintentar</button>
              </div>
            )
          ) : preguntasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <div className="h-16 w-16 mb-2 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-lg font-bold text-gray-900">Sin preguntas registradas</p>
              <p className="text-sm text-gray-500">Agrega la primera pregunta para este método.</p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {modoActivo === 'cuestionario' && (
                      <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Nivel</th>
                    )}
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Pregunta</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Respuesta Correcta</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preguntasFiltradas.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-gray-50/50">
                      {modoActivo === 'cuestionario' && (
                        <td className="px-4 py-5 font-bold text-gray-900 whitespace-nowrap">{p.nivel || '—'}</td>
                      )}
                      <td className="px-4 py-5 font-medium text-gray-600 max-w-md">{p.pregunta}</td>
                      <td className="px-4 py-5">
                        <span className="inline-flex items-center rounded-md bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 border border-green-200 shadow-sm">
                          {p.respuesta_correcta}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap">
                        <button onClick={() => abrirEditar(p)} className="text-sm font-bold text-brand-orange hover:text-orange-700 mr-4 transition-colors">Editar</button>
                        <button onClick={() => handleEliminar(p.id)} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {vista === 'resultados' && (
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <Eyebrow>Registro de Evaluaciones</Eyebrow>
          
          {cargandoResultados ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
              <p className="text-sm font-medium text-gray-500 animate-pulse">Sincronizando evaluaciones...</p>
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
                <button onClick={() => setCargandoResultados(true)} className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md">Reintentar</button>
              </div>
            )
          ) : resultadosAgrupados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <div className="h-16 w-16 mb-2 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <p className="text-lg font-bold text-gray-900">Sin evaluaciones</p>
              <p className="text-sm text-gray-500">Cuando un usuario complete un método de estudio, aparecerá aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Usuario</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Departamento</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-center">Total Intentos</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {resultadosPaginados.map((usuario) => (
                    <tr key={usuario.email} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-5">
                        <p className="font-bold text-gray-900">{usuario.nombre}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{usuario.email}</p>
                      </td>
                      <td className="px-4 py-5 font-medium text-gray-600">
                        {usuario.departamento ? (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {usuario.departamento}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange/10 font-black text-brand-orange shadow-inner">
                          {usuario.intentos.length}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setUsuarioSeleccionado(usuario)}
                          className="text-sm font-bold text-brand-orange hover:text-orange-700 transition-colors"
                        >
                          Ver historial
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-4 pt-5 border-t border-gray-100 w-full">
                <Paginador 
                  paginacion={{
                    pagina: paginaResultados,
                    limite: RESULTADOS_POR_PAGINA,
                    total: resultadosAgrupados.length,
                    totalPaginas: Math.ceil(resultadosAgrupados.length / RESULTADOS_POR_PAGINA)
                  }} 
                  onCambiarPagina={setPaginaResultados} 
                />
              </div>
            </div>
          )}
        </section>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl overflow-hidden">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
              {editandoId ? 'Editar Pregunta' : 'Nueva Pregunta'}
            </h2>
            
            <form onSubmit={handleGuardar} className="flex flex-col gap-5">
              <div className={`grid grid-cols-1 ${formulario.tipo === 'cuestionario' ? 'sm:grid-cols-2' : ''} gap-5`}>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Método de Estudio</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm disabled:opacity-60"
                    value={formulario.tipo}
                    onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value as ModoEstudio })}
                    disabled={!!editandoId}
                  >
                    <option value="cuestionario">Cuestionario (Opciones A,B,C,D)</option>
                    <option value="flashcard">Flashcards</option>
                    <option value="verdadero_falso">Verdadero o Falso</option>
                  </select>
                </div>
                
                {formulario.tipo === 'cuestionario' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Nivel o Módulo</label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                      value={formulario.nivel}
                      onChange={(e) => setFormulario({ ...formulario, nivel: e.target.value })}
                      placeholder="Ej. Nivel 1"
                      required={formulario.tipo === 'cuestionario'}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pregunta</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                  rows={3}
                  value={formulario.pregunta}
                  onChange={(e) => setFormulario({ ...formulario, pregunta: e.target.value })}
                  placeholder="Escribe la pregunta o concepto aquí..."
                  required
                />
              </div>

              {formulario.tipo === 'cuestionario' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {(['a', 'b', 'c', 'd'] as const).map(letra => (
                    <div key={letra}>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">Opción {letra.toUpperCase()}</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                        value={formulario[`opcion_${letra}`]}
                        onChange={(e) => setFormulario({ ...formulario, [`opcion_${letra}`]: e.target.value })}
                        placeholder={`Respuesta ${letra.toUpperCase()}`}
                        required={formulario.tipo === 'cuestionario'}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  {formulario.tipo === 'cuestionario' ? 'Opción Correcta (A, B, C o D)' : 'Respuesta Correcta'}
                </label>
                
                {formulario.tipo === 'verdadero_falso' ? (
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                    value={formulario.respuesta_correcta}
                    onChange={(e) => setFormulario({ ...formulario, respuesta_correcta: e.target.value })}
                    required
                  >
                    <option value="">Selecciona...</option>
                    <option value="Verdadero">Verdadero</option>
                    <option value="Falso">Falso</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                    value={formulario.respuesta_correcta}
                    onChange={(e) => setFormulario({ ...formulario, respuesta_correcta: e.target.value })}
                    placeholder={formulario.tipo === 'cuestionario' ? 'Ej. A' : 'Escribe la respuesta correcta'}
                    required
                  />
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100 pt-6">
                <button 
                  type="button" 
                  onClick={() => setModalAbierto(false)} 
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

      <ModalTarjeta
        isOpen={!!preguntaAEliminar}
        onClose={() => setPreguntaAEliminar(null)}
        onConfirm={ejecutarEliminacion}
        titulo="¿Eliminar pregunta?"
        descripcion="¿Estás seguro de que deseas eliminar esta pregunta del sistema? Se mantendrá oculta en el historial."
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        cargando={eliminandoPregunta}
        esDestructivo={true}
      />

      <ModalTarjeta
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        onConfirm={() => setAlertModal(null)}
        titulo="Error"
        descripcion={alertModal ?? ''}
        textoConfirmar="Aceptar"
        textoCancelar="Cerrar"
      />

      {usuarioSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-8 bg-white z-10">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{usuarioSeleccionado.nombre}</h2>
                <p className="text-sm font-medium text-gray-500">{usuarioSeleccionado.departamento} · {usuarioSeleccionado.email}</p>
              </div>
              <button
                onClick={cerrarModalUsuario}
                className="rounded-full p-2 text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="deinsa-scroll overflow-y-auto p-8 bg-[#f8f9fa]">
              
              {intentoSeleccionado ? (
                <div>
                  <button 
                    onClick={() => setIntentoSeleccionado(null)} 
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al historial
                  </button>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-orange">
                      <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
                      Respuestas de {formatoMetodo(intentoSeleccionado.metodo)}
                    </div>
                    {intentoSeleccionado.puntuacion !== undefined && intentoSeleccionado.puntuacion !== null && (
                       <span className="inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-sm font-bold text-white shadow-sm">
                         Nota: {intentoSeleccionado.puntuacion} / {intentoSeleccionado.total_preguntas}
                       </span>
                    )}
                  </div>

                  {!intentoSeleccionado.respuestas_detalle || intentoSeleccionado.respuestas_detalle.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                      <p className="text-sm font-medium text-gray-500">No hay detalles de las respuestas guardados para este intento histórico.</p>
                      <p className="text-xs text-gray-400 mt-1">(Los nuevos intentos registrarán cada pregunta)</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {intentoSeleccionado.respuestas_detalle.map((resp, idx) => (
                        <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                          <p className="text-base font-bold text-gray-900 mb-4">{idx + 1}. {resp.pregunta}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Respuesta del Usuario</p>
                              <p className={`text-sm font-bold ${resp.es_correcta ? 'text-green-600' : 'text-red-500'}`}>
                                {resp.respuesta_usuario || 'Sin responder'}
                              </p>
                            </div>
                            <div className="rounded-xl bg-green-50 p-4 border border-green-100">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-1">Respuesta Correcta</p>
                              <p className="text-sm font-bold text-green-700">{resp.respuesta_correcta}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">
                    <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
                    Historial de Sesiones
                  </div>
                  
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="pb-4 pt-4 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Método Evaluado</th>
                          <th className="pb-4 pt-4 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Puntuación Final</th>
                          <th className="pb-4 pt-4 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Fecha y Hora</th>
                          <th className="pb-4 pt-4 px-6 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-right">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ordenarIntentos(usuarioSeleccionado.intentos).map((intento) => (
                          <tr key={intento.id} className="transition-colors hover:bg-gray-50/50">
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-bold border shadow-sm border-brand-orange/20 bg-brand-orange/10 text-brand-orange`}>
                                {formatoMetodo(intento.metodo)}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              {intento.puntuacion !== undefined && intento.puntuacion !== null ? (
                                <span className="font-black text-gray-900 text-base">
                                  {intento.puntuacion} <span className="text-sm font-bold text-gray-400">/ {intento.total_preguntas}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 font-medium italic">Repaso libre</span>
                              )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap font-medium text-gray-500">
                              {formatoFecha.format(new Date(intento.fecha_completado))}
                            </td>
                            <td className="px-6 py-5 text-right whitespace-nowrap">
                              <button 
                                onClick={() => setIntentoSeleccionado(intento)}
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
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}