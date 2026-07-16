"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Inicio" },
  { href: "/bienvenida", label: "Bienvenida" },
  { href: "/ecosistema", label: "Ecosistema" },
  { href: "/perfil", label: "Perfil" },
];

const USER_MENU = [
  { href: "/perfil", label: "Mi perfil" },
  { href: "/login", label: "Cerrar sesión" },
];

/**
 * Navbar global de Delphos Onboarding.
 *
 * Componente único y estandarizado (carpeta `components/global`) para que
 * todas las vistas compartan la misma barra de navegación, marca y paleta
 * DEINSA (naranja / blanco / negro / gris). Se monta una sola vez desde el
 * layout raíz.
 */
export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Cierra el menú de usuario al hacer clic fuera de él.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cierra ambos menús al cambiar de ruta.
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="bg-neutral-primary/90 backdrop-blur fixed w-full z-50 top-0 start-0 border-b border-default">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <Image
            src="/images/logo.svg"
            alt="Logo Delphos"
            width={33}
            height={32}
            style={{ width: "auto", height: "32px" }}
          />
          <span className="self-center text-xl text-heading font-semibold whitespace-nowrap">
            Delphos <span className="text-brand-orange">Onboarding</span>
          </span>
        </Link>

        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="flex text-sm bg-neutral-primary rounded-full md:me-0 focus:outline-none focus:ring-4 focus:ring-neutral-tertiary"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label="Abrir menú de usuario"
            >
              <span className="sr-only">Abrir menú de usuario</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-black text-sm font-semibold text-white">
                DO
              </span>
            </button>

            {userMenuOpen ? (
              <div className="absolute right-0 mt-3 w-44 divide-y divide-default overflow-hidden rounded-lg border border-default bg-neutral-primary shadow-lg">
                <ul className="py-1 text-sm text-body">
                  {USER_MENU.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-4 py-2 hover:bg-neutral-secondary hover:text-brand-orange transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center w-10 h-10 text-body rounded-lg md:hidden hover:bg-neutral-secondary focus:outline-none focus:ring-2 focus:ring-neutral-tertiary"
            aria-controls="navbar-user"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="sr-only">Abrir menú principal</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>

        <div
          className={`items-center justify-between ${
            mobileOpen ? "flex" : "hidden"
          } w-full md:flex md:w-auto md:order-1`}
          id="navbar-user"
        >
          <ul className="flex flex-col font-medium mt-4 rounded-lg md:mt-0 md:space-x-6 rtl:space-x-reverse md:flex-row md:border-0">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block py-2 px-3 rounded-sm md:p-0 transition-colors ${
                      isActive
                        ? "text-brand-orange md:font-semibold"
                        : "text-heading hover:text-brand-orange"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
