'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  encuestaService,
  esErrorYaCompletada,
  type PreguntaSatisfaccion,
  type RespuestaEnvio,
} from '@/services/encuestaService';

type MapaRespuestas = Record<string, number | string>;

function SliderEscala({
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
  const respondida = valor !== undefined;
  const valorMostrado = valor ?? min;
  const porcentaje = max === min ? 0 : ((valorMostrado - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs text-body">Totalmente en desacuerdo</span>
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition-colors ${
            respondida ? 'bg-brand-orange' : 'bg-brand-gray-light'
          }`}
        >
          {respondida ? valorMostrado : '?'}
        </span>
        <span className="text-right text-xs text-body">Totalmente de acuerdo</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={valorMostrado}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`encuesta-slider ${respondida ? '' : 'sin-responder'}`}
        style={{
          background: `linear-gradient(to right, var(--brand-orange) ${porcentaje}%, #e5e5e5 ${porcentaje}%)`,
        }}
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-brand-gray">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
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

  useEffect(() => {
    encuestaService
      .listar()
      .then((data) => setPreguntas([...data].sort((a, b) => a.orden - b.orden)))
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
    // Revalida TODAS las secciones (no solo la última) por si algo obligatorio
    // quedó sin responder en una anterior.
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

  if (cargando) {
    return (
      <main className="flex flex-1 items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm font-medium text-heading">No se pudo cargar la encuesta</p>
        <p className="mt-1 text-xs text-body">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          Reintentar
        </button>
      </main>
    );
  }

  if (preguntas.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm font-medium text-heading">
          No hay una encuesta de satisfacción activa por el momento.
        </p>
      </main>
    );
  }

  if (enviada || yaCompletada) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-bold text-heading">
          {enviada ? '¡Gracias por tu respuesta!' : 'Ya completaste esta encuesta'}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-body">
          {enviada
            ? 'Tu encuesta de satisfacción fue enviada con éxito.'
            : 'Cada persona puede responder la encuesta de satisfacción una sola vez.'}
        </p>
        <Link
          href="/onboarding"
          className="mt-6 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
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
        {preguntasActuales.map((p) => (
          <div key={p.id} className="rounded-2xl border border-default bg-neutral-primary p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-heading">
              {p.pregunta}
              {p.obligatoria && <span className="ml-1 text-brand-orange">*</span>}
            </p>
            <div className="mt-4">
              {p.tipo_respuesta === 'escala' ? (
                <SliderEscala
                  pregunta={p}
                  valor={respuestas[p.id] as number | undefined}
                  onChange={(v) => responder(p.id, v)}
                />
              ) : (
                <CampoTexto
                  valor={respuestas[p.id] as string | undefined}
                  onChange={(v) => responder(p.id, v)}
                />
              )}
            </div>
            {faltantes.has(p.id) && (
              <p className="mt-2 text-xs font-medium text-red-600">
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
  );
}
