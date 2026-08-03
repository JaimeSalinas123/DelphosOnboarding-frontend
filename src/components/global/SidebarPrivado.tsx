'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICON_PROPS = {
  className: 'h-5 w-5 flex-shrink-0',
  fill: 'none' as const,
  viewBox: '0 0 24 24',
  strokeWidth: 1.6,
  stroke: 'currentColor' as const,
};

const ENLACES = [
  {
    href: '/dashboard-ch',
    label: 'Resumen',
    icono: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard-ch/usuarios',
    label: 'Usuarios',
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
    href: '/dashboard-ch/estudio',
    label: 'Estudio',
    icono: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard-ch/encuestas',
    label: 'Encuestas',
    icono: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m-9 5h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2.5a.5.5 0 0 0-.4.2l-.9 1.2a.5.5 0 0 1-.4.2h-2.4a.5.5 0 0 1-.4-.2l-.9-1.2a.5.5 0 0 0-.4-.2H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
        />
      </svg>
    ),
  },
  {
    href: '/dashboard-ch/metricas',
    label: 'Métricas',
    icono: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3v16a2 2 0 0 0 2 2h16M7 16v-4m5 4V8m5 8v-7"
        />
      </svg>
    ),
  },
];

function estaActivo(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === '/dashboard-ch'
    ? pathname === href
    : pathname.startsWith(href);
}

/** Navegación del panel privado. Sidebar en desktop, tira de tabs en mobile. */
export default function SidebarPrivado() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación de Capital Humano"
      className="w-full overflow-x-auto border-b border-default bg-neutral-primary md:w-60 md:flex-shrink-0 md:overflow-visible md:border-b-0 md:border-r"
    >
      <ul className="flex gap-1 p-2 md:flex-col md:gap-1 md:p-4">
        {ENLACES.map((enlace) => {
          const activo = estaActivo(pathname, enlace.href);
          return (
            <li key={enlace.href} className="flex-shrink-0">
              <Link
                href={enlace.href}
                aria-current={activo ? 'page' : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  activo
                    ? 'bg-brand-orange/10 text-brand-orange'
                    : 'text-heading hover:bg-neutral-secondary hover:text-brand-orange'
                }`}
              >
                {enlace.icono}
                {enlace.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}