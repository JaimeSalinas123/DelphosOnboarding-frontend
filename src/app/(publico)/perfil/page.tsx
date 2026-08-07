'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useProgresoStore } from '@/lib/useProgresoStore';
import type { ProgresoPasante } from '@/services/progresoService';
import { etiquetaRol } from '@/lib/roles';

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return 'DO';
}

const ETAPAS: {
  clave: keyof Pick<ProgresoPasante, 'porcentaje_ecosistema' | 'porcentaje_estudio' | 'porcentaje_encuesta'>;
  etiqueta: string;
  href: string;
  cta: string;
}[] = [
  { clave: 'porcentaje_ecosistema', etiqueta: 'Ecosistema', href: '/ecosistema', cta: 'Explorar módulos' },
  { clave: 'porcentaje_estudio', etiqueta: 'Estudio', href: '/estudio', cta: 'Seguir estudiando' },
  { clave: 'porcentaje_encuesta', etiqueta: 'Encuesta', href: '/encuesta', cta: 'Responder encuesta' },
];

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const progreso = useProgresoStore((s) => s.progreso);
  const modulosVistos = useProgresoStore((s) => s.modulosVistos);
  const progresoCargado = useProgresoStore((s) => s.cargado);
  const cargarProgreso = useProgresoStore((s) => s.cargar);

  const esPasante = user?.rol === 'nuevo_integrante';

  useEffect(() => {
    if (esPasante && !progresoCargado) cargarProgreso();
  }, [esPasante, progresoCargado, cargarProgreso]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="w-full flex-1 bg-neutral-secondary/40">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {/* HERO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-black via-brand-black to-brand-orange p-8 shadow-sm sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-orange/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-3xl font-bold text-white ring-4 ring-white/20 backdrop-blur">
              {iniciales(user.nombre)}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Mi perfil</p>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{user.nombre}</h1>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center rounded-full bg-brand-orange px-3 py-1 text-xs font-semibold text-white">
                  {etiquetaRol(user.rol)}
                </span>
                {user.departamento && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                    {user.departamento}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* INFORMACIÓN DE LA CUENTA */}
          <section className="rounded-3xl border border-default bg-neutral-primary p-6 shadow-sm sm:p-7 lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
              Información de la cuenta
            </h2>

            <dl className="mt-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-gray">Correo</dt>
                  <dd className="truncate text-sm font-semibold text-heading">{user.email}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                    />
                  </svg>
                </span>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-gray">Departamento</dt>
                  <dd className="text-sm font-semibold text-heading">{user.departamento || '—'}</dd>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                    />
                  </svg>
                </span>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-brand-gray">Rol</dt>
                  <dd className="text-sm font-semibold text-heading">{etiquetaRol(user.rol)}</dd>
                </div>
              </div>
            </dl>

            <button
              onClick={handleLogout}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-default px-4 py-2.5 text-sm font-semibold text-heading transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </section>

          {/* PROGRESO DE ONBOARDING (solo pasantes) */}
          {esPasante ? (
            <section className="rounded-3xl border border-default bg-neutral-primary p-6 shadow-sm sm:p-7 lg:col-span-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
                Tu progreso de onboarding
              </h2>

              {!progresoCargado ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
                  <div className="relative h-36 w-36 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="72%"
                        outerRadius="100%"
                        data={[{ value: Math.min(100, progreso.porcentaje_total) }]}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar dataKey="value" cornerRadius={20} fill="var(--brand-orange)" background={{ fill: 'var(--neutral-secondary)' }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-heading">
                        {Math.round(progreso.porcentaje_total)}%
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-brand-gray">
                        Completo
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3">
                    {ETAPAS.map((etapa) => {
                      const valor = progreso[etapa.clave];
                      return (
                        <Link
                          key={etapa.clave}
                          href={etapa.href}
                          className="group block rounded-xl border border-default p-3 transition-colors hover:border-brand-orange/40 hover:bg-neutral-secondary/60"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-heading">
                              {etapa.etiqueta}
                              {etapa.clave === 'porcentaje_ecosistema' && (
                                <span className="ml-1.5 font-normal text-brand-gray">
                                  ({modulosVistos.length}/8)
                                </span>
                              )}
                            </span>
                            <span className="text-brand-gray">{Math.round(valor)}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-secondary">
                            <div
                              className="h-full rounded-full bg-brand-orange transition-all"
                              style={{ width: `${Math.min(100, valor)}%` }}
                            />
                          </div>
                          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-orange opacity-0 transition-opacity group-hover:opacity-100">
                            {etapa.cta}
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          ) : (
            <section className="flex flex-col items-center justify-center rounded-3xl border border-default bg-neutral-primary p-8 text-center shadow-sm lg:col-span-3">
              <p className="text-sm font-medium text-heading">Panel de Capital Humano</p>
              <p className="mt-1 max-w-sm text-xs text-body">
                Tu cuenta tiene acceso administrativo. Gestioná usuarios, encuestas y estudio desde
                el panel privado.
              </p>
              <Link
                href="/dashboard-ch"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Ir al panel
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
