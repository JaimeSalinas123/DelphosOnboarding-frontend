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
    <footer className="mt-auto border-t border-white/10 bg-[#0d0d0f] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.8fr_0.9fr] lg:items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.svg"
                alt="Logo Delphos"
                width={44}
                height={44}
                priority
                className="h-11 w-auto"
              />
              <div>
                <p className="text-xl font-bold tracking-tight text-white">
                  Delphos <span className="text-brand-orange">Onboarding</span>
                </p>
                <p className="text-sm text-white/60">
                  Tu recorrido guiado hacia la Suite Delphos.
                </p>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-6 text-white/70">
              Explora módulos, practica con evaluaciones y profundiza en el
              ecosistema para presentarte con confianza frente a cada reto.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/onboarding"
                className="rounded-xl bg-brand-orange px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#ff6a2f]"
              >
                Volver al inicio
              </Link>
              <Link
                href="/estudio"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition-all hover:border-brand-orange hover:text-brand-orange"
              >
                Ir a estudio
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-brand-orange">
              Navegación
            </p>
            <ul className="space-y-2 text-sm text-white/75">
              {enlaces.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-brand-orange"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-brand-orange">
              Recursos útiles
            </p>
            <div className="space-y-3">
              <a
                href="https://drive.google.com/drive/folders/1u3HOv49mzSQt_yMdMIratzhBBBna-0gX?usp=drive_link"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition-colors hover:border-brand-orange hover:text-white"
              >
                <span>Biblioteca de videos</span>
                <span className="text-brand-orange">↗</span>
              </a>
              <Link
                href="/encuesta"
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 transition-colors hover:border-brand-orange hover:text-white"
              >
                <span>Responder encuesta</span>
                <span className="text-brand-orange">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Delphos Onboarding. Diseñado para acompañarte en tu aprendizaje.</p>
          <p className="text-white/60">DEINSA Global · Suite Delphos</p>
        </div>
      </div>
    </footer>
  );
}
