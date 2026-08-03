'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { usuarioService, type UsuarioListado } from '@/services/usuarioService';
import {
  encuestaService,
  type PreguntaSatisfaccion,
  type ResultadoEncuesta,
} from '@/services/encuestaService';
import { etiquetaRol } from '@/lib/roles';

// Paleta de marca (naranja/negro/gris, nada de azules/verdes/morados).
const COLORES = ['#d85a30', '#171717', '#e8916f', '#6b7280', '#9ca3af'];

const formatoFechaCorta = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' });

function truncar(texto: string, max: number) {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

interface TarjetaKpiProps {
  etiqueta: string;
  valor: string;
  detalle?: string;
}

function TarjetaKpi({ etiqueta, valor, detalle }: TarjetaKpiProps) {
  return (
    <div className="rounded-2xl border border-default bg-neutral-primary p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{etiqueta}</p>
      <p className="mt-2 text-3xl font-bold text-heading">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-body">{detalle}</p>}
    </div>
  );
}

export default function MetricasPage() {
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [resultados, setResultados] = useState<ResultadoEncuesta[]>([]);
  const [preguntas, setPreguntas] = useState<PreguntaSatisfaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    let cancelado = false;
    // Patrón estándar de fetch-con-spinner (react.dev/learn/synchronizing-with-effects#fetching-data).
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const barrasPromedio = promedioPorPregunta.map((p) => ({
    nombre: truncar(p.pregunta, 42),
    nombreCompleto: p.pregunta,
    porcentaje: Math.round((p.promedio / p.max) * 100),
    promedio: p.promedio.toFixed(1),
    max: p.max,
    respuestas: p.respuestas,
  }));

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

  return (
    <div className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-heading sm:text-3xl">Métricas</h1>
        <p className="mt-1 text-sm text-body">
          Progreso y estadísticas de los usuarios, a partir de usuarios registrados y la encuesta
          de satisfacción.
        </p>
      </header>

      {cargando ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-default bg-neutral-primary py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
          <p className="text-sm text-body">Cargando métricas...</p>
        </div>
      ) : error ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-default bg-neutral-primary py-20 text-center">
          <p className="text-sm font-medium text-heading">No se pudieron cargar las métricas</p>
          <p className="max-w-sm text-xs text-body">{error}</p>
          <button
            onClick={() => setIntentos((n) => n + 1)}
            className="mt-1 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-1 rounded-2xl border border-default bg-neutral-primary py-20 text-center text-body">
          <p className="text-sm font-medium text-heading">Todavía no hay usuarios registrados.</p>
          <p className="text-xs text-body">Las métricas van a aparecer cuando haya datos.</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TarjetaKpi etiqueta="Usuarios registrados" valor={String(usuarios.length)} />
            <TarjetaKpi
              etiqueta="Completaron la encuesta"
              valor={String(resultados.length)}
              detalle={`${tasaFinalizacion}% de finalización`}
            />
            <TarjetaKpi
              etiqueta="Índice de satisfacción"
              valor={indiceSatisfaccion !== null ? `${indiceSatisfaccion}%` : '—'}
              detalle="Promedio ponderado de preguntas de escala"
            />
            <TarjetaKpi etiqueta="Preguntas de escala evaluadas" valor={String(promedioPorPregunta.length)} />
          </section>

          {/* Distribución de usuarios */}
          <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-default bg-neutral-primary p-5 shadow-sm">
              <h2 className="text-sm font-bold text-heading">Usuarios por departamento</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porDepartamento}
                      dataKey="valor"
                      nameKey="nombre"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {porDepartamento.map((entry, index) => (
                        <Cell key={entry.nombre} fill={COLORES[index % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(valor) => [`${valor} usuarios`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-default bg-neutral-primary p-5 shadow-sm">
              <h2 className="text-sm font-bold text-heading">Usuarios por rol</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porRol}
                      dataKey="valor"
                      nameKey="nombre"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {porRol.map((entry, index) => (
                        <Cell key={entry.nombre} fill={COLORES[index % COLORES.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(valor) => [`${valor} usuarios`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Promedio por pregunta de escala */}
          <section className="mt-6 rounded-2xl border border-default bg-neutral-primary p-5 shadow-sm">
            <h2 className="text-sm font-bold text-heading">Promedio de respuesta por pregunta</h2>
            <p className="mt-1 text-xs text-body">
              Normalizado como porcentaje de la escala máxima de cada pregunta, para poder
              comparar preguntas de 1–5 y de 1–10 en el mismo gráfico.
            </p>
            {barrasPromedio.length === 0 ? (
              <p className="mt-6 py-10 text-center text-sm text-body">
                Todavía no hay respuestas de escala para mostrar.
              </p>
            ) : (
              <div className="mt-4" style={{ height: Math.max(220, barrasPromedio.length * 46) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barrasPromedio} layout="vertical" margin={{ left: 16, right: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-tertiary)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} unit="%" stroke="var(--brand-gray)" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      width={220}
                      stroke="var(--brand-gray)"
                      fontSize={12}
                      tick={{ fill: 'var(--heading)' }}
                    />
                    <Tooltip
                      formatter={(_valor, _clave, item) => {
                        const punto = item.payload as (typeof barrasPromedio)[number];
                        return [`${punto.promedio} / ${punto.max} (${punto.respuestas} respuestas)`, 'Promedio'];
                      }}
                      labelFormatter={(_etiqueta, payload) =>
                        (payload?.[0]?.payload as (typeof barrasPromedio)[number] | undefined)
                          ?.nombreCompleto ?? ''
                      }
                    />
                    <Bar dataKey="porcentaje" fill="var(--brand-orange)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Encuestas completadas en el tiempo */}
          <section className="mt-6 rounded-2xl border border-default bg-neutral-primary p-5 shadow-sm">
            <h2 className="text-sm font-bold text-heading">Encuestas completadas por día</h2>
            {completadasPorDia.length === 0 ? (
              <p className="mt-6 py-10 text-center text-sm text-body">
                Todavía nadie completó la encuesta.
              </p>
            ) : (
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={completadasPorDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--neutral-tertiary)" />
                    <XAxis dataKey="etiqueta" stroke="var(--brand-gray)" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="var(--brand-gray)" fontSize={12} />
                    <Tooltip formatter={(valor) => [`${valor} encuestas`, '']} />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="var(--brand-orange)"
                      strokeWidth={2}
                      dot={{ fill: 'var(--brand-orange)', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
