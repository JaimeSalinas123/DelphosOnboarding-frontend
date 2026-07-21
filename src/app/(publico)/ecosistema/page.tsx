'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { modulos } from '@/data/modulos';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';
import PanelInfoModulo from '@/components/ecosistema/PanelInfoModulo';
import EstadoVacio from '@/components/ecosistema/EstadoVacio';
import FondoEcosistema from '@/components/ecosistema/FondoEcosistema';

const EcosistemaScene = dynamic(
  () => import('@/components/ecosistema/EcosistemaScene'),
  { ssr: false }
);

function Loader() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white">
      <div className="h-1 w-40 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-1/3 animate-loaderPulse rounded-full bg-brand-orange" />
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
        Cargando ecosistema
      </p>
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

/**
 * Detecta WebGL por software (SwiftShader/llvmpipe/etc). Ocurre p.ej. en Brave
 * cuando el navegador no puede confirmar la GPU y cae a un renderer de CPU:
 * ahí Bloom + sombras en tiempo real cuestan órdenes de magnitud más.
 */
function isSoftwareRenderer(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(
      dbg
        ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER)
    );
    return /swiftshader|software|llvmpipe|basic render|microsoft basic/i.test(
      renderer
    );
  } catch {
    return false;
  }
}

function useLowPower() {
  const [low, setLow] = useState(false);
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 8;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const smallDpr = window.devicePixelRatio > 2.5;
    setLow((coarse && cores <= 4) || smallDpr || isSoftwareRenderer());
  }, []);
  return low;
}

/** true en viewports md+ (el panel de info es una barra lateral, no un bottom sheet). */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export default function EcosistemaPage() {
  const reducedMotion = usePrefersReducedMotion();
  const lowPower = useLowPower();
  const isDesktop = useIsDesktop();
  const [mounted, setMounted] = useState(false);

  const selectedId = useEcosistemaStore((s) => s.selectedId);
  const visitedIds = useEcosistemaStore((s) => s.visitedIds);
  const step = useEcosistemaStore((s) => s.step);
  const deselect = useEcosistemaStore((s) => s.deselect);
  const select = useEcosistemaStore((s) => s.select);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          step(1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          step(-1);
          break;
        case 'Enter':
          if (!selectedId) {
            e.preventDefault();
            step(1);
          }
          break;
        case 'Escape':
          e.preventDefault();
          deselect();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, step, deselect]);

  const seleccionadoModulo = useMemo(
    () => modulos.find((m) => m.id === selectedId) ?? null,
    [selectedId]
  );
  const seleccionadoNombre = seleccionadoModulo?.nombre ?? 'ninguno';

  return (
    <main className="relative w-full flex-1 overflow-hidden bg-white">
      <FondoEcosistema />

      <header className="pointer-events-none absolute left-0 top-0 z-10 p-5 md:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
          DEINSA Global
        </p>
        <h1 className="mt-1 text-sm font-semibold tracking-wide text-slate-800">
          Ecosistema Delphos
          <span className="ml-2 font-normal text-slate-400">
            · Círculo Virtuoso
          </span>
        </h1>

        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-900/10">
            <div
              className="h-full rounded-full bg-brand-orange transition-[width] duration-500 ease-out"
              style={{
                width: `${(visitedIds.length / modulos.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-[11px] font-medium tabular-nums text-slate-400">
            {visitedIds.length}/{modulos.length} explorados
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedId && <EstadoVacio key="vacio" />}
        </AnimatePresence>
      </header>

      <div className="absolute inset-0 z-[1]">
        {mounted ? (
          <Suspense fallback={<Loader />}>
            <EcosistemaScene
              reducedMotion={reducedMotion}
              lowPower={lowPower}
              isDesktop={isDesktop}
            />
          </Suspense>
        ) : (
          <Loader />
        )}
      </div>

      {/* Viñeta sutil: oscurece los bordes para dar profundidad cinematográfica. */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          boxShadow: 'inset 0 0 18vw rgba(23, 23, 23, 0.16)',
        }}
      />

      <PanelInfoModulo />

      <nav aria-label="Módulos del ecosistema Delphos" className="sr-only">
        <p>Módulo seleccionado: {seleccionadoNombre}.</p>
        <ul>
          {modulos.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                aria-pressed={selectedId === m.id}
                onClick={() => select(m.id)}
              >
                {m.nombre}: {m.tagline}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
