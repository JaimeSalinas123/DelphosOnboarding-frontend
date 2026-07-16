'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRegistro = pathname?.startsWith('/registro') ?? false;

  // Copy contextual del panel de marca.
  // Única fuente de esta información: no se repite dentro de la tarjeta del formulario.
  const panel = isRegistro
    ? {
        titulo: 'Únete al equipo',
        texto: 'Registra tus datos para entrar al ecosistema Delphos.',
        pregunta: '¿Ya tienes una cuenta?',
        cta: 'Iniciar sesión',
        href: '/login',
      }
    : {
        titulo: 'Bienvenido de vuelta',
        texto: 'Ingresa con tu correo institucional para continuar.',
        pregunta: '¿Eres un nuevo integrante?',
        cta: 'Crear cuenta',
        href: '/registro',
      };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-neutral-secondary p-4 sm:p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-default bg-neutral-primary lg:min-h-[38rem] lg:grid-cols-2">

        {/* Panel de marca — arriba en móvil, a la derecha en escritorio */}
        <aside className="flex flex-col items-center justify-center gap-4 bg-brand-black px-8 py-10 text-center lg:order-2 lg:rounded-l-[2.5rem] lg:px-12 lg:py-14">
          <Image
            src="/images/logo.svg"
            alt="Logo Delphos"
            width={160}
            height={160}
            priority
            className="h-20 w-auto lg:h-28"
          />

          <p className="text-xl font-semibold tracking-tight text-white">
            Delphos <span className="text-brand-orange">Onboarding</span>
          </p>

          <span className="my-1 block h-0.5 w-10 rounded-full bg-brand-orange" />

          <h1 className="text-2xl font-semibold tracking-tight text-white lg:text-3xl">
            {panel.titulo}
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-white/60">
            {panel.texto}
          </p>

          <div className="mt-4 flex flex-col items-center gap-2.5">
            <p className="text-xs text-white/60">{panel.pregunta}</p>
            <Link
              href={panel.href}
              className="rounded-lg bg-brand-orange px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-black"
            >
              {panel.cta}
            </Link>
          </div>
        </aside>

        {/* Columna del formulario — aquí solo vive el form */}
        <main className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:order-1 lg:px-12">
          {children}
        </main>

      </div>
    </div>
  );
}