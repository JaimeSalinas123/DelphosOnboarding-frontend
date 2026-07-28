'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, type Usuario } from '@/context/AuthContext';
import { etiquetaRol } from '@/lib/roles';

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return 'CH';
}

/** Barra superior del panel privado (Capital Humano): identidad + sesión + cerrar sesión. */
export default function NavbarPrivado({ user }: { user: Usuario }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alClickearFuera(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener('mousedown', alClickearFuera);
    return () => document.removeEventListener('mousedown', alClickearFuera);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-default bg-neutral-primary/95 backdrop-blur">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between p-4">
        <Link
          href="/dashboard-ch"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Image src="/images/logo.svg" alt="Logo Delphos" width={33} height={32} style={{ width: 'auto', height: '32px' }} />
          <span className="text-xl font-semibold text-heading">
            Capital <span className="text-brand-orange">Humano</span>
          </span>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors hover:bg-neutral-secondary focus:outline-none focus:ring-4 focus:ring-brand-orange/20"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-expanded={menuAbierto}
            aria-haspopup="true"
            aria-label="Abrir menú de sesión"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange text-sm font-semibold tracking-wider text-white">
              {iniciales(user.nombre)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-heading">
                {user.nombre}
              </span>
              <span className="block text-xs leading-tight text-body">
                {etiquetaRol(user.rol)}
              </span>
            </span>
          </button>

          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-default bg-neutral-primary shadow-lg">
              <div className="border-b border-default px-4 py-3 sm:hidden">
                <p className="text-sm font-medium text-heading">{user.nombre}</p>
                <p className="text-xs text-body">{etiquetaRol(user.rol)}</p>
              </div>
              <ul className="py-1.5 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-2.5 text-left text-body transition-colors hover:bg-neutral-secondary hover:text-brand-orange"
                  >
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
