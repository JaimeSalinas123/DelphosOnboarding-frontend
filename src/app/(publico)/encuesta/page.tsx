'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  encuestaService,
  esErrorYaCompletada,
  type PreguntaSatisfaccion,
  type RespuestaEnvio,
} from '@/services/encuestaService';
import SessionExpired from '@/components/global/SessionExpired';
import { useProgresoStore } from '@/lib/useProgresoStore';

type MapaRespuestas = Record<string, number | string>;

// ============================================================================
// FUNCIONES Y COMPONENTES AUXILIARES
// ============================================================================

function BarraEscala({
  pregunta,
  valor,
  onChange,
}: {
  pregunta: PreguntaSatisfaccion;
  valor: number | undefined;
  onChange: (valor: number) => void;
}) {
  const min = pregunta.escala_min ?? 1;
  const max = pregunta.escala_max ?? 5;
  const opciones = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs text-body">Totalmente en desacuerdo</span>
        <span className="text-right text-xs text-body">Totalmente de acuerdo</span>
      </div>
      <div className="flex overflow-hidden rounded-full border border-default">
        {opciones.map((n) => {
          const activo = valor !== undefined && n <= valor;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`Calificar con ${n}`}
              aria-pressed={valor === n}
              className={`flex-1 border-r border-default py-2.5 text-xs font-semibold transition-colors last:border-r-0 ${
                activo
                  ? 'bg-brand-orange text-white'
                  : 'bg-white text-body hover:bg-neutral-secondary'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalificacionEstrellas({
  pregunta,
  valor,
  onChange,
}: {
  pregunta: PreguntaSatisfaccion;
  valor: number | undefined;
  onChange: (valor: number) => void;
}) {
  const min = pregunta.escala_min ?? 1;
  const max = pregunta.escala_max ?? 5;
  const [hover, setHover] = useState<number | null>(null);
  const activoHasta = hover ?? valor ?? 0;

  return (
    <div>
      <div
        className="flex flex-wrap items-center gap-1"
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => {
          const lleno = n <= activoHasta;
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onClick={() => onChange(n)}
              aria-label={`Calificar con ${n} de ${max}`}
              aria-pressed={valor === n}
              className="p-0.5"
            >
              <svg
                className={`h-7 w-7 transition-colors ${
                  lleno ? 'text-brand-orange' : 'text-neutral-tertiary'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.286 3.957c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.363-1.118L2.83 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69z" />
              </svg>
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-body">
        {valor !== undefined ? `${valor} de ${max}` : 'Sin calificar'}
      </p>
    </div>
  );
}

function usaEstrellas(p: PreguntaSatisfaccion): boolean {
  if (p.tipo_respuesta !== 'escala') return false;
  const rango = (p.escala_max ?? 0) - (p.escala_min ?? 0) + 1;
  if (rango === 10) return true;
  return /motivad/i.test(p.pregunta);
}

function CampoTexto({
  valor,
  onChange,
}: {
  valor: string | undefined;
  onChange: (valor: string) => void;
}) {
  return (
    <textarea
      className="w-full rounded-lg border border-default p-3 text-sm outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
      rows={4}
      placeholder="Escribí tu respuesta acá..."
      value={valor ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Pantalla completa con ícono + título + descripción, para los estados de carga/error/fin. */
function EstadoPantalla({
  icono,
  iconoFondo = 'bg-neutral-secondary',
  titulo,
  descripcion,
  accion,
}: {
  icono: ReactNode;
  iconoFondo?: string;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 w-full bg-white">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full rounded-3xl border border-default bg-neutral-primary p-8 text-center shadow-sm sm:p-10">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${iconoFondo}`}>
            {icono}
          </div>
          <h1 className="mt-5 text-xl font-bold text-heading sm:text-2xl">{titulo}</h1>
          {descripcion && <p className="mt-2 text-sm leading-relaxed text-body">{descripcion}</p>}
          {accion && <div className="mt-6 flex justify-center">{accion}</div>}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function EncuestaPage() {
  const [preguntas, setPreguntas] = useState<PreguntaSatisfaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [respuestas, setRespuestas] = useState<MapaRespuestas>({});
  const [seccionIndex, setSeccionIndex] = useState(0);
  const [faltantes, setFaltantes] = useState<Set<string>>(new Set());

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);
  const [yaCompletada, setYaCompletada] = useState(false);
  const [comenzada, setComenzada] = useState(false);

  useEffect(() => {
    // Se chequea si ya la completó antes de cargar las preguntas: así no lo
    // dejamos ni empezarla de nuevo, en vez de descubrirlo recién al enviar.
    encuestaService
      .obtenerMiEstado()
      .then((estado) => {
        if (estado.completada) {
          setYaCompletada(true);
          return;
        }
        return encuestaService
          .listar()
          .then((data) => setPreguntas([...data].sort((a, b) => a.orden - b.orden)));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  const secciones = useMemo(() => {
    const vistas = new Set<string>();
    const orden: string[] = [];
    for (const p of preguntas) {
      if (!vistas.has(p.seccion)) {
        vistas.add(p.seccion);
        orden.push(p.seccion);
      }
    }
    return orden;
  }, [preguntas]);

  const preguntasDe = (seccion: string) => preguntas.filter((p) => p.seccion === seccion);

  const seccionActual = secciones[seccionIndex];
  const preguntasActuales = seccionActual ? preguntasDe(seccionActual) : [];
  const esPrimeraSeccion = seccionIndex === 0;
  const esUltimaSeccion = seccionIndex === secciones.length - 1;

  const responder = (preguntaId: string, valor: number | string) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: valor }));
    setFaltantes((prev) => {
      if (!prev.has(preguntaId)) return prev;
      const copia = new Set(prev);
      copia.delete(preguntaId);
      return copia;
    });
  };

  const idsFaltantesEn = (seccion: string) =>
    preguntasDe(seccion)
      .filter((p) => p.obligatoria && respuestas[p.id] === undefined)
      .map((p) => p.id);

  const irAnterior = () => {
    if (esPrimeraSeccion) return;
    setSeccionIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const irSiguiente = () => {
    const faltan = idsFaltantesEn(seccionActual);
    if (faltan.length > 0) {
      setFaltantes(new Set(faltan));
      return;
    }
    if (esUltimaSeccion) {
      handleEnviar();
    } else {
      setSeccionIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEnviar = async () => {
    const seccionInvalidaIndex = secciones.findIndex((s) => idsFaltantesEn(s).length > 0);
    if (seccionInvalidaIndex !== -1) {
      setSeccionIndex(seccionInvalidaIndex);
      setFaltantes(new Set(idsFaltantesEn(secciones[seccionInvalidaIndex])));
      return;
    }

    const payload: RespuestaEnvio[] = preguntas
      .filter((p) => respuestas[p.id] !== undefined)
      .map((p) => ({
        pregunta_id: p.id,
        respuesta_numerica: p.tipo_respuesta === 'escala' ? Number(respuestas[p.id]) : null,
        respuesta_texto: p.tipo_respuesta === 'texto' ? String(respuestas[p.id]) : null,
      }));

    setEnviando(true);
    setErrorEnvio(null);
    try {
      await encuestaService.enviar(payload);
      setEnviada(true);
      // Refresca el progreso global (ej. el badge del navbar) sin esperar a un reload.
      useProgresoStore.getState().cargar();
    } catch (err) {
      const mensaje = (err as Error).message;
      if (esErrorYaCompletada(mensaje)) {
        setYaCompletada(true);
      } else {
        setErrorEnvio(mensaje);
      }
    } finally {
      setEnviando(false);
    }
  };

  // Envolvemos todo en un div maestro blanco
  if (cargando) {
    return (
      <div className="flex flex-col flex-1 w-full bg-white">
        <main className="flex flex-1 items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
        </main>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('401') || error.toLowerCase().includes('jwt') || error.toLowerCase().includes('autorizado');

    if (isAuthError) {
      return (
        <div className="flex flex-col flex-1 w-full bg-white">
          <main className="flex-1 flex flex-col items-center justify-center py-16 px-4">
            <SessionExpired />
          </main>
        </div>
      );
    }

    return (
      <EstadoPantalla
        iconoFondo="bg-red-50"
        icono={
          <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        }
        titulo="No se pudo cargar la encuesta"
        descripcion={error}
        accion={
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Reintentar
          </button>
        }
      />
    );
  }

  // Se chequea antes que "sin preguntas": si ya la completó, nunca llegamos a
  // cargar el listado de preguntas, así que preguntas.length también da 0.
  if (enviada || yaCompletada) {
    return (
      <EstadoPantalla
        iconoFondo="bg-green-50"
        icono={
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        }
        titulo={enviada ? '¡Gracias por tus respuestas!' : 'Ya completaste la encuesta'}
        descripcion={
          enviada
            ? 'Tu encuesta de satisfacción fue enviada con éxito. Ya quedó registrada.'
            : 'Gracias por tus respuestas — ya las tenemos registradas. Cada persona puede responder la encuesta una sola vez.'
        }
        accion={
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Volver al inicio
          </Link>
        }
      />
    );
  }

  if (preguntas.length === 0) {
    return (
      <EstadoPantalla
        icono={
          <svg className="h-7 w-7 text-brand-gray" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        }
        titulo="No hay una encuesta activa"
        descripcion="Todavía no hay una encuesta de satisfacción disponible. Volvé a intentarlo más tarde."
      />
    );
  }

  if (!comenzada) {
    // Estimación en base a la cantidad real de preguntas de esta encuesta
    // (no una cifra fija): ~20 segundos por pregunta, redondeado a minutos.
    const minutosEstimados = Math.max(1, Math.round((preguntas.length * 20) / 60));

    return (
      <div className="flex flex-col flex-1 w-full bg-white">
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16">
          <div className="w-full rounded-3xl border border-default bg-neutral-primary p-8 shadow-sm sm:p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange/10">
              <svg className="h-6 w-6 text-brand-orange" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                />
              </svg>
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-brand-gray">
              Encuesta de satisfacción
            </p>
            <h1 className="mt-1 text-2xl font-bold text-heading sm:text-3xl">
              Evalúa tu programa de Onboarding
            </h1>

            <div className="mt-5 flex flex-col gap-3 text-sm leading-relaxed text-body">
              <p>
                ¡Gracias por completar tu primera semana con nosotros! Tu opinión es muy valiosa
                para mejorar la experiencia de futuros pasantes.
              </p>
              <p>
                Esta encuesta tiene como objetivo conocer tu experiencia durante el proceso de
                onboarding e identificar oportunidades de mejora.{' '}
                <span className="rounded bg-brand-orange/10 px-1 font-semibold text-heading">
                  Tus respuestas serán utilizadas exclusivamente para mejorar la incorporación de
                  nuevos integrantes.
                </span>
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-brand-gray">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Te tomará aproximadamente {minutosEstimados} {minutosEstimados === 1 ? 'minuto' : 'minutos'}
            </div>

            <button
              type="button"
              onClick={() => setComenzada(true)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
            >
              Comenzar encuesta
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full bg-white">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gray">
            Encuesta de satisfacción
          </p>
          <h1 className="mt-1 text-2xl font-bold text-heading sm:text-3xl">{seccionActual}</h1>
          <p className="mt-1 text-xs text-body">
            Sección {seccionIndex + 1} de {secciones.length}
          </p>
        </header>

        <div className="mt-5 flex items-center justify-center gap-2">
          {secciones.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                i === seccionIndex
                  ? 'w-8 bg-brand-orange'
                  : i < seccionIndex
                    ? 'w-1.5 bg-brand-orange/50'
                    : 'w-1.5 bg-neutral-tertiary'
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {preguntasActuales.map((p, i) => (
            <div
              key={p.id}
              className="relative overflow-hidden rounded-2xl border border-default bg-neutral-secondary/60 p-5 pl-6 shadow-sm sm:p-6 sm:pl-7"
            >
              <span className="absolute inset-y-0 left-0 w-1.5 bg-brand-orange" />

              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="mt-0.5 text-sm font-semibold text-heading">
                  {p.pregunta}
                  {p.obligatoria && <span className="ml-1 text-brand-orange">*</span>}
                </p>
              </div>

              <div className="mt-4 sm:pl-10">
                {p.tipo_respuesta === 'texto' ? (
                  <CampoTexto
                    valor={respuestas[p.id] as string | undefined}
                    onChange={(v: string) => responder(p.id, v)}
                  />
                ) : usaEstrellas(p) ? (
                  <CalificacionEstrellas
                    pregunta={p}
                    valor={respuestas[p.id] as number | undefined}
                    onChange={(v: number) => responder(p.id, v)}
                  />
                ) : (
                  <BarraEscala
                    pregunta={p}
                    valor={respuestas[p.id] as number | undefined}
                    onChange={(v: number) => responder(p.id, v)}
                  />
                )}
              </div>
              {faltantes.has(p.id) && (
                <p className="mt-2 text-xs font-medium text-red-600 sm:pl-10">
                  Esta pregunta es obligatoria.
                </p>
              )}
            </div>
          ))}
        </div>

        {errorEnvio && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
            No se pudo enviar la encuesta: {errorEnvio}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={irAnterior}
            disabled={esPrimeraSeccion || enviando}
            className="inline-flex items-center gap-2 rounded-lg border border-default px-4 py-2.5 text-sm font-semibold text-heading transition-colors hover:border-brand-orange/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Anterior
          </button>

          <button
            type="button"
            onClick={irSiguiente}
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {esUltimaSeccion ? (enviando ? 'Enviando...' : 'Enviar encuesta') : 'Siguiente'}
            {!esUltimaSeccion && (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}