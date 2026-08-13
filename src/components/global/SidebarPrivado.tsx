'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { etiquetaRol } from '@/lib/roles';

// 1. ICONOS MÁS GRANDES
const ICON_PROPS = {
  className: 'h-6 w-6 flex-shrink-0',
  fill: 'none' as const,
  viewBox: '0 0 24 24',
  strokeWidth: 1.6,
  stroke: 'currentColor' as const,
};

const ENLACES = [
  {
    href: '/dashboard-ch',
    label: 'Métricas',
    icono: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v16a2 2 0 0 0 2 2h16M7 16v-4m5 4V8m5 8v-7" />
      </svg>
    ),
  },
  {
    href: '/dashboard-ch/usuarios',
    label: 'Usuarios',
    icono: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.5v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 3 18v1.5M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 8.5v-1.25a3 3 0 0 0-2.25-2.9M15.5 5.1a3 3 0 0 1 0 5.8" />
      </svg>
    ),
  },
  {
    href: '/dashboard-ch/estudio',
    label: 'Estudio',
    icono: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    href: '/dashboard-ch/encuestas',
    label: 'Encuestas',
    icono: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-9 5h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2.5a.5.5 0 0 0-.4.2l-.9 1.2a.5.5 0 0 1-.4.2h-2.4a.5.5 0 0 1-.4-.2l-.9-1.2a.5.5 0 0 0-.4-.2H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      </svg>
    ),
  },
  {
    href: '/dashboard-ch/documentacion',
    label: 'Documentación',
    icono: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 13.2 8.8 19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m18.4 15.5 1 2.9 2.9 1-2.9 1-1 2.9-1-2.9-2.9-1 2.9-1 1-2.9Z" />
      </svg>
    ),
  },
  {
    href: '/dashboard-ch/nuevoconocimiento',
    label: 'Aprendizaje IA',
    icono: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.829 1.58-2.083a4.501 4.501 0 10-7.66 0c.922.254 1.58 1.1 1.58 2.083v.192" />
      </svg>
    ),
  },
  {
    href: '/dashboard-ch/auditoria',
    label: 'Auditoría',
    icono: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  }
];

function estaActivo(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === '/dashboard-ch'
    ? pathname === href
    : pathname.startsWith(href);
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return 'CH';
}

export default function SidebarPrivado() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [menuDesktopAbierto, setMenuDesktopAbierto] = useState(false);
  const [perfilMobileAbierto, setPerfilMobileAbierto] = useState(false);
  const [navMobileAbierto, setNavMobileAbierto] = useState(false);
  
  const menuRefDesktop = useRef<HTMLDivElement>(null);
  const menuRefMobile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNavMobileAbierto(false);
    setPerfilMobileAbierto(false);
  }, [pathname]);

  useEffect(() => {
    function alClickearFuera(e: MouseEvent) {
      if (menuRefDesktop.current && !menuRefDesktop.current.contains(e.target as Node)) {
        setMenuDesktopAbierto(false);
      }
      if (menuRefMobile.current && !menuRefMobile.current.contains(e.target as Node)) {
        setPerfilMobileAbierto(false);
      }
    }
    document.addEventListener('mousedown', alClickearFuera);
    return () => document.removeEventListener('mousedown', alClickearFuera);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <aside className="flex flex-col w-full md:w-72 md:h-screen md:flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-100 bg-white md:sticky md:top-0 z-50">
      
      <div className="flex h-16 items-center justify-between px-4 md:px-6 md:h-24 md:border-b md:border-gray-100 bg-white relative z-20">
        <Link href="/dashboard-ch" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <Image src="/images/logo.svg" alt="Logo Delphos" width={32} height={32} style={{ width: 'auto', height: '32px' }} />
          <span className="text-xl font-semibold text-gray-900">
            Capital <span className="text-brand-orange">Humano</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          <div className="relative" ref={menuRefMobile}>
            <button
              type="button"
              className="flex cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-105 focus:outline-none"
              onClick={() => {
                setPerfilMobileAbierto(!perfilMobileAbierto);
                setNavMobileAbierto(false);
              }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-[#f97316] text-sm font-bold tracking-wider text-white shadow-sm">
                {iniciales(user.nombre)}
              </span>
            </button>

            {perfilMobileAbierto && (
              <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl z-50">
                <div className="border-b border-gray-100 px-5 py-4 bg-gray-50/50">
                  <p className="text-sm font-extrabold text-gray-900 truncate">{user.nombre}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 truncate mt-1">{etiquetaRol(user.rol)}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AJUSTE RESPONSIVE: Botón hamburguesa animado igual al público */}
          <button
            type="button"
            className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/20 md:hidden ${
              navMobileAbierto 
                ? "bg-brand-orange/10 text-brand-orange" 
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
            aria-expanded={navMobileAbierto}
            onClick={() => {
              setNavMobileAbierto(!navMobileAbierto);
              setPerfilMobileAbierto(false);
            }}
          >
            <span className="sr-only">Abrir menú principal</span>
            {navMobileAbierto ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 17 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* AJUSTE RESPONSIVE: Transición suave de max-height igual al Navbar público */}
      <nav 
        aria-label="Navegación de Capital Humano" 
        className={`md:block w-full md:flex-1 bg-white relative z-10 border-b md:border-b-0 border-gray-100 transition-all duration-300 ease-in-out overflow-hidden md:overflow-y-auto ${
          navMobileAbierto ? "max-h-screen opacity-100" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
        }`}
      >
        <ul className="flex flex-col gap-1 p-4 md:gap-2 md:p-5">
          {ENLACES.map((enlace) => {
            const activo = estaActivo(pathname, enlace.href);
            return (
              <li key={enlace.href} className="flex-shrink-0">
                <Link
                  href={enlace.href}
                  aria-current={activo ? 'page' : undefined}
                  onClick={() => setNavMobileAbierto(false)}
                  className={`flex items-center gap-3.5 whitespace-nowrap rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    activo
                      ? 'bg-brand-orange/10 text-brand-orange font-bold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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

      <div className="hidden md:block relative border-t border-gray-100 p-4" ref={menuRefDesktop}>
        <div 
          className={`absolute bottom-full left-4 mb-2 w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl transition-all duration-200 z-50 origin-bottom ${
            menuDesktopAbierto ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-bold text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>

        <button
          type="button"
          className={`flex w-full cursor-pointer items-center gap-3.5 rounded-xl p-3 transition-all duration-200 focus:outline-none ${
            menuDesktopAbierto ? 'bg-gray-50 ring-2 ring-gray-100' : 'hover:bg-gray-50'
          }`}
          onClick={() => setMenuDesktopAbierto((abierto) => !abierto)}
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand-orange to-[#f97316] text-sm font-bold tracking-wider text-white shadow-sm">
            {iniciales(user.nombre)}
          </span>
          <span className="flex flex-col text-left overflow-hidden">
            <span className="truncate text-sm font-extrabold leading-tight text-gray-900">
              {user.nombre}
            </span>
            <span className="truncate text-[11px] font-bold uppercase tracking-wider text-gray-500 mt-1">
              {etiquetaRol(user.rol)}
            </span>
          </span>
          <svg 
            className={`ml-auto h-4 w-4 text-gray-400 transition-transform duration-300 ${menuDesktopAbierto ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </aside>
  );
}