'use client';

import Image from 'next/image';
import Link from 'next/link';

const enlaces = [
  { href: '/onboarding', label: 'Inicio' },
  { href: '/estudio', label: 'Estudio' },
  { href: '/encuesta', label: 'Encuesta' },
  { href: '/ecosistema', label: 'Ecosistema' },
];

export default function FooterPublico() {
  return (
    <footer className="relative mt-auto border-t border-white/5 bg-[#0a0a0c] text-white overflow-hidden">
      
      {/* Efecto de luz ambiental sutil en el fondo (Premium UX) */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-orange/10 blur-[120px]" />

      {/* Ajuste Responsive: py-8 en móvil para que no sea tan alto, py-16 en PC */}
      <div className="relative mx-auto max-w-screen-xl px-6 py-8 md:py-16 lg:px-8 z-10">
        
        {/* Ajuste Responsive: gap-8 en móvil para acercar los elementos, gap-12/8 en PC */}
        <div className="grid grid-cols-1 gap-8 md:gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          
          {/* COLUMNA 1: Marca y Descripción */}
          <div className="flex flex-col gap-5 sm:gap-6 lg:col-span-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner shrink-0">
                <Image
                  src="/images/logo.svg"
                  alt="Logo Delphos"
                  width={36}
                  height={36}
                  priority
                  className="h-6 sm:h-8 w-auto"
                />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
                  Delphos <span className="text-brand-orange">Onboarding</span>
                </p>
                <p className="text-[12px] sm:text-[13px] font-medium text-white/50 tracking-wide mt-0.5">
                  Tu recorrido guiado hacia la Suite Delphos.
                </p>
              </div>
            </div>

            <p className="max-w-md text-[13px] sm:text-sm leading-relaxed text-white/60">
              Explora módulos, practica con evaluaciones y profundiza en el
              ecosistema para presentarte con confianza frente a cada reto.
            </p>

            {/* Botones: Ligeramente más pequeños en móvil (py-2.5 y text-[13px]) */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <Link
                href="/onboarding"
                className="flex items-center justify-center rounded-xl bg-brand-orange px-4 py-2.5 sm:px-5 sm:py-3 text-[13px] sm:text-sm font-bold text-white shadow-lg shadow-brand-orange/20 transition-all hover:bg-[#ff6a2f] hover:-translate-y-0.5"
              >
                Volver al inicio
              </Link>
              <Link
                href="/estudio"
                className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 sm:px-5 sm:py-3 text-[13px] sm:text-sm font-bold text-white transition-all hover:border-brand-orange/50 hover:bg-brand-orange/10 hover:text-brand-orange"
              >
                Ir a estudio
              </Link>
            </div>
          </div>

          {/* COLUMNA 2: Navegación */}
          <div className="lg:col-span-3 lg:ml-auto">
            {/* Margen inferior reducido en móvil mb-4 vs mb-6 */}
            <p className="mb-4 sm:mb-6 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.25em] text-brand-orange">
              Navegación
            </p>
            <ul className="flex flex-col gap-3 sm:gap-4 text-[13px] sm:text-sm">
              {enlaces.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-2 text-white/60 transition-colors hover:text-white w-fit"
                  >
                    <span className="h-px w-2.5 sm:w-3 bg-brand-orange/0 transition-all duration-300 group-hover:w-4 group-hover:bg-brand-orange" />
                    <span className="transition-transform duration-300 group-hover:translate-x-1 font-medium">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMNA 3: Recursos Útiles */}
          <div className="lg:col-span-4">
            <p className="mb-4 sm:mb-6 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.25em] text-brand-orange">
              Recursos útiles
            </p>
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <a
                href="https://drive.google.com/drive/folders/1u3HOv49mzSQt_yMdMIratzhBBBna-0gX?usp=drive_link"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 sm:px-5 sm:py-4 transition-all hover:border-brand-orange/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white/40 group-hover:text-brand-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[13px] sm:text-sm font-semibold text-white/80 group-hover:text-white transition-colors">Biblioteca de videos</span>
                </div>
                <span className="text-brand-orange/50 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-brand-orange">↗</span>
              </a>
              
              <Link
                href="/encuesta"
                className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3.5 sm:px-5 sm:py-4 transition-all hover:border-brand-orange/40 hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white/40 group-hover:text-brand-orange transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-[13px] sm:text-sm font-semibold text-white/80 group-hover:text-white transition-colors">Responder encuesta</span>
                </div>
                <span className="text-brand-orange/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-brand-orange">→</span>
              </Link>
            </div>
          </div>
          
        </div>

        {/* BOTTOM BAR: Ajustado el mt-8 en móvil, mt-16 en PC */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 sm:gap-4 border-t border-white/10 pt-6 sm:pt-8 text-center md:mt-16 md:flex-row md:text-left">
          <p className="text-[12px] sm:text-[13px] font-medium text-white/40">
            © 2026 Delphos Onboarding. Diseñado para acompañarte.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-orange/50"></span>
            <p className="text-[12px] sm:text-[13px] font-bold tracking-wide text-white/50">
              DEINSA Global · Suite Delphos
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}