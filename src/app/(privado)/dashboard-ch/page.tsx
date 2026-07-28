'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { etiquetaRol } from '@/lib/roles';

const FECHA_HOY = new Intl.DateTimeFormat('es-CR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

interface Seccion {
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  /** Si tiene href, la sección ya está construida y navega ahí en vez de mostrar "Próximamente". */
  href?: string;
}

const ICON_PROPS = {
  className: 'h-6 w-6',
  fill: 'none' as const,
  viewBox: '0 0 24 24',
  strokeWidth: 1.6,
  stroke: 'currentColor' as const,
};

const SECCIONES: Seccion[] = [
  {
    titulo: 'Colaboradores',
    descripcion: 'Directorio de usuarios registrados y su departamento.',
    href: '/dashboard-ch/usuarios',
    icono: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.5v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 3 18v1.5M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 8.5v-1.25a3 3 0 0 0-2.25-2.9M15.5 5.1a3 3 0 0 1 0 5.8"
        />
      </svg>
    ),
  },
  {
    titulo: 'Evaluaciones de desempeño',
    descripcion:
      'Ciclos de evaluación por competencias y metas, alineados a Delphos Elite.',
    icono: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 17V9m6 8V5M4 21h16M4 17V13"
        />
      </svg>
    ),
  },
  {
    titulo: 'Departamentos',
    descripcion: 'Estructura organizacional y responsables por departamento.',
    icono: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M12 21v-7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v7M4 21h16M8 7h.01M8 11h.01M8 15h.01"
        />
      </svg>
    ),
  },
  {
    titulo: 'Reportes',
    descripcion: 'Exportables y resúmenes de avance para gerencia y dirección.',
    icono: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M12 3c2.5 0 4.847.655 6.879 1.804A2 2 0 0 1 20 6.54v9.876a2 2 0 0 1-1.06 1.766C16.86 19.36 14.5 20 12 20s-4.86-.64-6.94-1.818A2 2 0 0 1 4 16.416V6.54a2 2 0 0 1 1.121-1.736C7.153 3.655 9.5 3 12 3Z"
        />
      </svg>
    ),
  },
];

export default function DashboardCH() {
  const { user } = useAuth();
  if (!user) return null;

  const rolEtiqueta = etiquetaRol(user.rol);

  return (
    <div className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gray">
          {FECHA_HOY}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-heading sm:text-3xl">
          Bienvenido, {user.nombre.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-body">
          Panel de Capital Humano · sesión iniciada como{' '}
          <span className="font-semibold text-brand-orange">{rolEtiqueta}</span>
        </p>
      </header>

      {/* Datos reales de la sesión actual. Nada de cifras inventadas. */}
      <section className="mt-6 rounded-2xl border border-default bg-neutral-primary p-5 shadow-sm sm:p-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
          Tu sesión
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-brand-gray">Nombre</dt>
            <dd className="mt-0.5 text-sm font-medium text-heading">{user.nombre}</dd>
          </div>
          <div>
            <dt className="text-xs text-brand-gray">Correo</dt>
            <dd className="mt-0.5 text-sm font-medium text-heading">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-brand-gray">Departamento</dt>
            <dd className="mt-0.5 text-sm font-medium text-heading">
              {user.departamento ?? '—'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Secciones de gestión. Sin backend de Capital Humano todavía: se
          muestran como accesos planificados, no como datos reales. */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-gray">
          Gestión
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECCIONES.map((seccion) => {
            const contenido = (
              <>
                {!seccion.href && (
                  <span className="absolute right-4 top-4 rounded-full bg-neutral-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-gray">
                    Próximamente
                  </span>
                )}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange-soft text-brand-orange">
                  {seccion.icono}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-heading">
                  {seccion.titulo}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-body">
                  {seccion.descripcion}
                </p>
              </>
            );

            if (seccion.href) {
              return (
                <Link
                  key={seccion.titulo}
                  href={seccion.href}
                  className="relative rounded-2xl border border-default bg-neutral-primary p-5 transition-colors hover:border-brand-orange/40 hover:bg-neutral-secondary"
                >
                  {contenido}
                </Link>
              );
            }

            return (
              <div
                key={seccion.titulo}
                className="relative rounded-2xl border border-default bg-neutral-primary p-5 opacity-80"
              >
                {contenido}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
