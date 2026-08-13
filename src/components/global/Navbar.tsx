"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authService } from "@/services/authService";
import { useProgresoStore } from "@/lib/useProgresoStore";
import { INSIGNIAS } from "@/lib/insignias";
import InsigniaMedalla from "@/components/global/InsigniaMedalla";

// Circunferencia del anillo de progreso (r=15.5): 2 * PI * 15.5
const CIRCUNFERENCIA_ANILLO = 2 * Math.PI * 15.5;

type NavLink = {
  href: string;
  label: string;
  subLinks?: { href: string; label: string }[];
};

const NAV_LINKS: NavLink[] = [
  { href: "/onboarding", label: "Inicio" },
  { href: "/ecosistema", label: "Ecosistema" },
  {
    href: "/estudio",
    label: "Estudio",
    subLinks: [
      { href: "/estudio/cuestionario", label: "Cuestionario" },
      { href: "/estudio/flashcards", label: "FlashCards" },
      { href: "/estudio/verdadero-falso", label: "Verdadero/Falso" },
    ],
  },
  { href: "/encuesta", label: "Encuesta" }
];

const USER_MENU = [
  { href: "/perfil", label: "Mi perfil" },
  { href: "/login", label: "Cerrar sesión" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [progresoMenuOpen, setProgresoMenuOpen] = useState(false);
  const progresoMenuRef = useRef<HTMLDivElement>(null);

  const [initials, setInitials] = useState("DO");
  const [esPasante, setEsPasante] = useState(false);

  const progreso = useProgresoStore((s) => s.progreso);
  const progresoCargado = useProgresoStore((s) => s.cargado);
  const cargarProgreso = useProgresoStore((s) => s.cargar);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setUserMenuOpen(false);
    setProgresoMenuOpen(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const user = authService.getCurrentUser();
      if (user && user.nombre) {
        const nameParts = user.nombre.trim().split(/\s+/);

        if (nameParts.length >= 2) {
          setInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase());
        } else if (nameParts.length === 1) {
          setInitials((nameParts[0].substring(0, 2)).toUpperCase());
        }
      }
      setEsPasante(user?.rol === "nuevo_integrante");
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (esPasante) cargarProgreso();
  }, [esPasante, cargarProgreso]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        progresoMenuRef.current &&
        !progresoMenuRef.current.contains(event.target as Node)
      ) {
        setProgresoMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const linkClass = (isActive: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-brand-orange/10 text-brand-orange"
        : "text-heading hover:bg-neutral-secondary hover:text-brand-orange"
    }`;

  const handleLogoutClick = (href: string) => {
    if (href === "/login") {
      authService.logout();
      useProgresoStore.getState().resetear();
    }
    setUserMenuOpen(false);
  };

  return (
    <nav className="fixed start-0 top-0 z-50 w-full border-b border-default bg-neutral-primary/90 backdrop-blur">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between px-3 py-3 sm:px-4 sm:py-4">
        
        {/* ========================================================= */}
        {/* LOGO CON TEXTO APILADO EN MÓVIL Y EN LÍNEA EN PC */}
        {/* ========================================================= */}
        <Link
          href="/onboarding"
          className="flex shrink-0 items-center gap-2 sm:gap-3 transition-opacity hover:opacity-80 rtl:space-x-reverse"
          onClick={() => setMobileOpen(false)}
        >
          <Image
            src="/images/logo.svg"
            alt="Logo Delphos"
            width={33}
            height={32}
            className="h-8 w-auto"
          />
          {/* Contenedor que apila los textos en móvil y los alinea en PC */}
          <div className="flex flex-col justify-center sm:flex-row sm:items-center sm:gap-1.5">
            <span className="text-sm font-bold leading-none text-heading sm:text-xl sm:font-semibold">
              Delphos
            </span>
            <span className="text-[11px] font-bold leading-none text-brand-orange sm:text-xl sm:font-semibold mt-[2px] sm:mt-0">
              Onboarding
            </span>
          </div>
        </Link>

        {/* LADO DERECHO (Progreso, Avatar, Hamburguesa) */}
        <div className="flex items-center gap-2 sm:gap-3 md:order-2 rtl:space-x-reverse">
          {esPasante && progresoCargado ? (
            <div className="relative" ref={progresoMenuRef}>
              <button
                type="button"
                onClick={() => setProgresoMenuOpen((open) => !open)}
                aria-expanded={progresoMenuOpen}
                aria-haspopup="true"
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-default bg-neutral-primary px-2 py-1.5 text-xs font-semibold text-heading transition-colors hover:border-brand-orange/40 focus:outline-none focus:ring-4 focus:ring-brand-orange/20 sm:gap-2 sm:px-2.5"
              >
                <svg viewBox="0 0 36 36" className="h-5 w-5 shrink-0 -rotate-90 sm:h-6 sm:w-6">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--neutral-tertiary)" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="var(--brand-orange)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUNFERENCIA_ANILLO}
                    strokeDashoffset={
                      CIRCUNFERENCIA_ANILLO -
                      (Math.min(100, progreso.porcentaje_total) / 100) * CIRCUNFERENCIA_ANILLO
                    }
                  />
                </svg>
                <span className="hidden sm:inline">{Math.round(progreso.porcentaje_total)}% completado</span>
                <span className="sm:hidden">{Math.round(progreso.porcentaje_total)}%</span>
              </button>

              {progresoMenuOpen ? (
                <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-xl border border-default bg-neutral-primary p-4 shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                    Tu progreso de onboarding
                  </p>
                  <div className="mt-3 flex flex-col gap-3">
                    {[
                      { etiqueta: "Ecosistema", valor: progreso.porcentaje_ecosistema },
                      { etiqueta: "Estudio", valor: progreso.porcentaje_estudio },
                      { etiqueta: "Encuesta", valor: progreso.porcentaje_encuesta },
                    ].map((etapa) => (
                      <div key={etapa.etiqueta}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-heading">{etapa.etiqueta}</span>
                          <span className="text-brand-gray">{Math.round(etapa.valor)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-secondary">
                          <div
                            className="h-full rounded-full bg-brand-orange transition-all"
                            style={{ width: `${Math.min(100, etapa.valor)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-default pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">
                      Insignias
                    </p>
                    <div className="mt-3 flex justify-between gap-2">
                      {INSIGNIAS.map((insignia) => {
                        const valor = progreso[insignia.clave];
                        const desbloqueada = valor >= 100;
                        return (
                          <div key={insignia.clave} className="flex flex-col items-center gap-1.5" title={insignia.descripcion}>
                            <InsigniaMedalla forma={insignia.forma} desbloqueada={desbloqueada} tamano={40} />
                            <span
                              className={`text-center text-[10px] font-medium leading-tight ${
                                desbloqueada ? "text-heading" : "text-brand-gray"
                              }`}
                            >
                              {insignia.nombre}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Link
                    href="/perfil"
                    className="mt-4 block text-center text-[11px] font-semibold text-brand-orange hover:text-brand-orange/80"
                  >
                    Ver mi perfil completo
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="flex cursor-pointer rounded-full bg-neutral-primary text-sm transition-shadow focus:outline-none focus:ring-4 focus:ring-brand-orange/20 md:me-0"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label="Abrir menú de usuario"
            >
              <span className="sr-only">Abrir menú de usuario</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-xs font-semibold tracking-wider text-white sm:h-9 sm:w-9 sm:text-sm">
                {initials}
              </span>
            </button>

            {userMenuOpen ? (
              <div className="absolute right-0 mt-3 w-48 overflow-hidden rounded-xl border border-default bg-neutral-primary shadow-lg">
                <ul className="py-1.5 text-sm">
                  {USER_MENU.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-4 py-2.5 text-body transition-colors hover:bg-neutral-secondary hover:text-brand-orange"
                        onClick={() => handleLogoutClick(item.href)}
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
            className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/20 md:hidden ${
              mobileOpen 
                ? "bg-brand-orange/10 text-brand-orange" 
                : "text-body hover:bg-neutral-secondary hover:text-brand-orange"
            }`}
            aria-controls="navbar-user"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="sr-only">Abrir menú principal</span>
            {mobileOpen ? (
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

        {/* MENÚ ESCRITORIO ORIGINAL (Intacto, se oculta en celular) */}
        <div className="hidden items-center justify-between md:order-1 md:flex md:w-auto" id="navbar-desktop">
          <ul className="mt-4 flex flex-col gap-1 md:mt-0 md:flex-row md:items-center md:gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);

              if (link.subLinks) {
                return (
                  <li key={link.href} className="relative group">
                    <Link
                      href={link.href}
                      className={`${linkClass(!!isActive)} flex items-center gap-1`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {link.label}
                      <svg 
                        className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Link>
                    
                    <div className="absolute left-0 top-full hidden w-48 pt-2 group-hover:block">
                      <div className="overflow-hidden rounded-xl border border-default bg-neutral-primary shadow-lg">
                        <ul className="py-1.5 text-sm">
                          {link.subLinks.map((subLink) => (
                            <li key={subLink.href}>
                              <Link
                                href={subLink.href}
                                className="block px-4 py-2 text-body transition-colors hover:bg-neutral-secondary hover:text-brand-orange"
                              >
                                {subLink.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block ${linkClass(!!isActive)}`}
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

      {/* MENÚ MÓVIL DESPLEGABLE (Aplanado y usando tus variables) */}
      <div 
        className={`md:hidden w-full overflow-hidden transition-all duration-300 ease-in-out bg-neutral-primary ${
          mobileOpen ? "max-h-screen border-t border-default opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-1 px-4 py-4">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);

            if (link.subLinks) {
              return (
                <li key={link.href} className="flex flex-col mb-1">
                  <Link
                    href={link.href}
                    className={`block rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                      isActive ? "bg-brand-orange/10 text-brand-orange" : "text-heading hover:bg-neutral-secondary"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                  
                  {/* Sub-menú aplanado con sangría y línea naranja */}
                  <div className="mt-1 ml-4 flex flex-col gap-1 border-l-2 border-brand-orange/30 pl-3">
                    {link.subLinks.map((subLink) => {
                      const isSubActive = pathname?.startsWith(subLink.href);
                      return (
                        <Link
                          key={subLink.href}
                          href={subLink.href}
                          className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isSubActive 
                              ? "bg-brand-orange/10 text-brand-orange" 
                              : "text-body hover:bg-neutral-secondary hover:text-brand-orange"
                          }`}
                          onClick={() => setMobileOpen(false)}
                        >
                          {subLink.label}
                        </Link>
                      );
                    })}
                  </div>
                </li>
              );
            }

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                    isActive ? "bg-brand-orange/10 text-brand-orange" : "text-heading hover:bg-neutral-secondary"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}