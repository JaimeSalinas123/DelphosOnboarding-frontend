'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { etiquetaRol } from '@/lib/roles';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';
import { usuarioService, type UsuarioListado } from '@/services/usuarioService';
import {
  encuestaService,
  type PreguntaSatisfaccion,
  type ResultadoEncuesta,
} from '@/services/encuestaService';

// IMPORTAMOS TU COMPONENTE DE SESIÓN EXPIRADA
import SessionExpired from '@/components/global/SessionExpired';

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const FECHA_HOY = new Intl.DateTimeFormat('es-CR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

const formatoFechaCorta = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' });

// Paleta de marca modernizada para los gráficos
const COLORES = ['#d85a30', '#1f2937', '#f97316', '#9ca3af', '#fb923c'];

// ============================================================================
// ICONOS (Con trazos más elegantes)
// ============================================================================

function IconoUsuarios() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconoEstrella() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 21.53a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function IconoLista() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES REDISEÑADOS
// ============================================================================

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">
      <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
      {children}
    </div>
  );
}

interface TarjetaKpiProps {
  etiqueta: string;
  valor: string;
  detalle?: string;
  icono?: React.ReactNode;
}

function TarjetaKpi({ etiqueta, valor, detalle, icono }: TarjetaKpiProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-brand-orange/20 to-transparent blur-2xl pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{etiqueta}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{valor}</p>
          {detalle && <p className="mt-2 text-xs font-bold text-gray-600">{detalle}</p>}
        </div>
        {icono && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 text-brand-orange shadow-inner">
            {icono}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function DashboardCH() {
  const { user } = useAuth();

  // Estados
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [resultados, setResultados] = useState<ResultadoEncuesta[]>([]);
  const [preguntas, setPreguntas] = useState<PreguntaSatisfaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(0);
  const [seccionActiva, setSeccionActiva] = useState<string | null>(null);

  // Carga de datos
  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    Promise.all([
      usuarioService.listarTodos(),
      encuestaService.obtenerTodosLosResultados(),
      encuestaService.listar(),
    ])
      .then(([datosUsuarios, datosResultados, datosPreguntas]) => {
        if (cancelado) return;
        setUsuarios(datosUsuarios);
        setResultados(datosResultados);
        setPreguntas(datosPreguntas);
      })
      .catch((err: Error) => {
        if (!cancelado) setError(err.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [intentos]);

  // Cálculos
  const porDepartamento = useMemo(() => {
    const conteo = new Map<string, number>();
    usuarios.forEach((u) => {
      const dep = u.departamento || 'Sin departamento';
      conteo.set(dep, (conteo.get(dep) ?? 0) + 1);
    });
    return Array.from(conteo, ([nombre, valor]) => ({ nombre, valor }));
  }, [usuarios]);

  const porRol = useMemo(() => {
    const conteo = new Map<string, number>();
    usuarios.forEach((u) => {
      conteo.set(u.rol, (conteo.get(u.rol) ?? 0) + 1);
    });
    return Array.from(conteo, ([rol, valor]) => ({ nombre: etiquetaRol(rol), valor }));
  }, [usuarios]);

  const completadasPorDia = useMemo(() => {
    const conteo = new Map<string, number>();
    resultados.forEach((r) => {
      const clave = r.fecha_completado.slice(0, 10);
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    });
    return Array.from(conteo, ([fecha, valor]) => ({ fecha, valor }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((d) => ({ ...d, etiqueta: formatoFechaCorta.format(new Date(d.fecha)) }));
  }, [resultados]);

  const promedioPorPregunta = useMemo(() => {
    return preguntas
      .filter((p) => p.tipo_respuesta === 'escala' && p.escala_max)
      .map((p) => {
        const valores = resultados
          .flatMap((r) => r.respuestas)
          .filter((r) => r.pregunta.id === p.id && r.respuesta_numerica != null)
          .map((r) => r.respuesta_numerica as number);
        const promedio = valores.length
          ? valores.reduce((a, b) => a + b, 0) / valores.length
          : null;
        return {
          id: p.id,
          pregunta: p.pregunta,
          seccion: p.seccion,
          max: p.escala_max as number,
          promedio,
          respuestas: valores.length,
        };
      })
      .filter((p): p is typeof p & { promedio: number } => p.promedio !== null)
      .sort((a, b) => a.seccion.localeCompare(b.seccion, 'es'));
  }, [preguntas, resultados]);

  const promedioPorSeccion = useMemo(() => {
    const grupos = new Map<string, typeof promedioPorPregunta>();
    promedioPorPregunta.forEach((p) => {
      if (!grupos.has(p.seccion)) grupos.set(p.seccion, []);
      grupos.get(p.seccion)!.push(p);
    });
    return Array.from(grupos, ([seccion, preguntas]) => {
      const promedioSeccion = Math.round(
        (preguntas.reduce((acc, p) => acc + p.promedio / p.max, 0) / preguntas.length) * 100
      );
      return { seccion, preguntas, promedioSeccion };
    });
  }, [promedioPorPregunta]);

  useEffect(() => {
    if (promedioPorSeccion.length > 0 && !seccionActiva) {
      setSeccionActiva(promedioPorSeccion[0].seccion);
    }
  }, [promedioPorSeccion, seccionActiva]);

  const indiceSatisfaccion =
    promedioPorPregunta.length > 0
      ? Math.round(
          (promedioPorPregunta.reduce((acc, p) => acc + p.promedio / p.max, 0) /
            promedioPorPregunta.length) *
            100
        )
      : null;

  const tasaFinalizacion =
    usuarios.length > 0 ? Math.min(100, Math.round((resultados.length / usuarios.length) * 100)) : 0;

  const grupoActivo = promedioPorSeccion.find((g) => g.seccion === seccionActiva);

  // Verificamos si el error es por token expirado/inválido
  const esErrorSesion = error?.toLowerCase().includes('token') || error?.toLowerCase().includes('expirad');

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  if (!user) return null;

  return (
    <div className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-10 xl:px-14 bg-[#f8f9fa] min-h-screen">
      
      {/* HEADER ELEGANTE */}
      <header className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-orange mb-2">
          {FECHA_HOY}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Bienvenido, {user.nombre.split(' ')[0]}
        </h1>
        <p className="mt-2 text-base text-gray-500">
          Panel de Control de <span className="font-semibold text-gray-700">Capital Humano</span>
        </p>
      </header>

      {/* SECCIÓN: TU SESIÓN (Estilo Banner) */}
      <section className="mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 shadow-xl relative text-white">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-700">
          <div className="sm:pr-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Usuario Activo</p>
            <p className="mt-2 text-lg font-semibold">{user.nombre}</p>
            <span className="inline-flex items-center mt-2 rounded-md bg-brand-orange/20 px-2 py-1 text-xs font-medium text-brand-orange ring-1 ring-inset ring-brand-orange/30">
              {etiquetaRol(user.rol)}
            </span>
          </div>
          <div className="pt-6 sm:pt-0 sm:px-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Correo Electrónico</p>
            <p className="mt-2 text-base font-medium">{user.email}</p>
          </div>
          <div className="pt-6 sm:pt-0 sm:pl-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Departamento</p>
            <p className="mt-2 text-base font-medium">{user.departamento ?? 'Sin asignar'}</p>
          </div>
        </div>
      </section>

      {/* SECCIÓN PRINCIPAL DE MÉTRICAS */}
      <section>
        <Eyebrow>Análisis de Rendimiento</Eyebrow>

        {cargando ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white py-24 shadow-sm border border-gray-100">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
            <p className="text-sm font-medium text-gray-500 animate-pulse">Sincronizando métricas...</p>
          </div>
        ) : error ? (
          esErrorSesion ? (
            <div className="py-12 flex justify-center">
              <SessionExpired />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-white py-24 shadow-sm border border-red-100 text-center">
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-base font-bold text-gray-900">Error de conexión</p>
              <p className="max-w-sm text-sm text-gray-500">{error}</p>
              <button onClick={() => setIntentos((n) => n + 1)} className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md">
                Reintentar
              </button>
            </div>
          )
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-3xl bg-white py-24 shadow-sm border border-gray-100 text-center">
            <div className="h-16 w-16 mb-2 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <IconoUsuarios />
            </div>
            <p className="text-lg font-bold text-gray-900">Sin datos registrados</p>
            <p className="text-sm text-gray-500">Las métricas aparecerán cuando ingresen los primeros usuarios.</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* 1. KPIs */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <TarjetaKpi etiqueta="Total Usuarios" valor={String(usuarios.length)} icono={<IconoUsuarios />} />
              <TarjetaKpi etiqueta="Completaron Encuesta" valor={String(resultados.length)} detalle={`${tasaFinalizacion}% de la plantilla`} icono={<IconoCheck />} />
              <TarjetaKpi etiqueta="Satisfacción Global" valor={indiceSatisfaccion !== null ? `${indiceSatisfaccion}%` : '—'} detalle="Basado en escala 1-5" icono={<IconoEstrella />} />
              <TarjetaKpi etiqueta="Preguntas Activas" valor={String(promedioPorPregunta.length)} icono={<IconoLista />} />
            </div>

            {/* 2. GRÁFICAS DE PASTEL */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6">Usuarios por Departamento</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={porDepartamento} dataKey="valor" nameKey="nombre" innerRadius={70} outerRadius={110} paddingAngle={3}>
                        {porDepartamento.map((entry, index) => (
                          <Cell key={entry.nombre} fill={COLORES[index % COLORES.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(valor: any) => [`${valor} usuarios`, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px', fontWeight: '600', color: '#111827' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-6">Distribución de Roles</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={porRol} dataKey="valor" nameKey="nombre" innerRadius={70} outerRadius={110} paddingAngle={3}>
                        {porRol.map((entry, index) => (
                          <Cell key={entry.nombre} fill={COLORES[index % COLORES.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(valor: any) => [`${valor} usuarios`, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px', fontWeight: '600', color: '#111827' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 3. DESGLOSE DE ENCUESTAS */}
            <div className="rounded-3xl bg-white p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Satisfacción Detallada</h3>
                  <p className="mt-1 text-sm text-gray-500">Desglose de resultados por cada categoría evaluada.</p>
                </div>
              </div>

              {promedioPorSeccion.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm font-medium text-gray-500">Aún no hay suficientes datos para generar el reporte.</p>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap gap-2.5 pb-6">
                    {promedioPorSeccion.map((grupo) => {
                      const isActive = seccionActiva === grupo.seccion;
                      return (
                        <button
                          key={grupo.seccion}
                          onClick={() => setSeccionActiva(grupo.seccion)}
                          className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-out ${
                            isActive
                              ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20 scale-105'
                              : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400 hover:text-gray-900'
                          }`}
                        >
                          {grupo.seccion}
                        </button>
                      );
                    })}
                  </div>

                  {grupoActivo && (
                    <div className="mt-6 rounded-xl bg-white p-6 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                        <h4 className="text-lg font-bold text-gray-900">
                          {grupoActivo.seccion}
                        </h4>
                        <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mr-2">Promedio</span>
                          <span className="text-sm font-bold text-[#d85a30]">{grupoActivo.promedioSeccion}%</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {grupoActivo.preguntas.map((p) => {
                          const pct = Math.round((p.promedio / p.max) * 100);
                          return (
                            <div key={p.id}>
                              <div className="flex justify-between items-end mb-2">
                                <p className="text-sm font-medium text-gray-700">{p.pregunta}</p>
                                <span className="text-sm font-bold text-gray-900">{pct}%</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                                  <div
                                    className="h-full rounded-full bg-[#d85a30]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-10 shrink-0 text-right text-xs font-medium text-gray-400">
                                  {p.promedio.toFixed(1)} / {p.max}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. GRÁFICA DE BARRAS */}
            <div className="rounded-3xl bg-white p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-2">Tráfico de Evaluaciones</h3>
              <p className="text-sm text-gray-500 mb-8">Volumen de encuestas completadas por fecha.</p>
              
              {completadasPorDia.length === 0 ? (
                <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-sm font-medium text-gray-500">Esperando respuestas de los usuarios.</p>
                </div>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completadasPorDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                          <stop offset="100%" stopColor="#d85a30" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      
                      <CartesianGrid strokeDasharray="3 3" stroke="#111827" vertical={false} />
                      
                      <XAxis dataKey="etiqueta" stroke="#111827" fontSize={13} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                      <YAxis allowDecimals={false} stroke="#111827" fontSize={13} fontWeight="bold" tickLine={false} axisLine={false} />
                      
                      <Tooltip 
                        formatter={(valor: any) => [`${valor} encuestas`, 'Completadas']} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#111827' }}
                        cursor={{ fill: '#f3f4f6' }}
                      />
                      <Bar 
                        dataKey="valor" 
                        fill="url(#barGradient)" 
                        radius={[6, 6, 0, 0]} 
                        maxBarSize={50} 
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>
        )}
      </section>
    </div>
  );
}