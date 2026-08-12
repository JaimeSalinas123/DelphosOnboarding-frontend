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

  let panel;
  if (pathname?.startsWith('/registro')) {
    panel = {
      titulo: 'Únete al equipo',
      texto: 'Registra tus datos para entrar al ecosistema Delphos.',
      pregunta: '¿Ya tienes una cuenta?',
      cta: 'Iniciar sesión',
      href: '/login',
    };
  } else if (pathname?.startsWith('/recuperar-password')) {
    panel = {
      titulo: 'Recupera tu acceso',
      texto: 'Te enviaremos un enlace seguro a tu correo institucional para restablecer tu contraseña.',
      pregunta: '¿Ya recordaste tu contraseña?',
      cta: 'Iniciar sesión',
      href: '/login',
    };
  } else if (pathname?.startsWith('/resetear-password')) {
    panel = {
      titulo: 'Crea una nueva contraseña',
      texto: 'Define una contraseña nueva y segura para volver a entrar al ecosistema Delphos.',
      pregunta: '¿Recordaste tu contraseña anterior?',
      cta: 'Iniciar sesión',
      href: '/login',
    };
  } else {
    panel = {
      titulo: 'Bienvenido de vuelta',
      texto: 'Ingresa con tu correo institucional para continuar.',
      pregunta: '¿Eres un nuevo integrante?',
      cta: 'Crear cuenta',
      href: '/registro',
    };
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-neutral-primary p-4 sm:p-6">
      
      {/* Contenedor principal: Mantiene tu borde naranja y fondo */}
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border-2 border-brand-orange bg-neutral-primary lg:min-h-[38rem] lg:grid-cols-2 shadow-2xl shadow-brand-orange/10">

        {/* PANEL OSCURO (Cabecera en móvil / Lateral en PC) */}
        {/* UX 100%: 'py-6 gap-2' en móvil hace que sea compacto para que el teclado no tape el formulario */}
        <aside className="flex flex-col items-center justify-center gap-2 bg-brand-black px-6 py-6 text-center sm:gap-4 sm:px-8 sm:py-10 lg:order-2 lg:rounded-l-[2.5rem] lg:px-12 lg:py-14">
          
          <Image
            src="/images/logo.svg"
            alt="Logo Delphos"
            width={160}
            height={160}
            priority
            // Logo más sutil en móvil, tamaño original en PC
            className="h-12 w-auto sm:h-16 lg:h-28"
          />

          <p className="text-base font-semibold tracking-tight text-white sm:text-xl">
            Delphos <span className="text-brand-orange">Onboarding</span>
          </p>

          <span className="my-1 block h-0.5 w-8 rounded-full bg-brand-orange lg:w-10" />

          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-3xl">
            {panel.titulo}
          </h1>
          <p className="max-w-xs text-xs leading-relaxed text-white/60 sm:text-sm">
            {panel.texto}
          </p>

          {/* CTA Desktop: Oculto en celular para no competir visualmente */}
          <div className="mt-4 hidden flex-col items-center gap-2.5 lg:flex">
            <p className="text-xs text-white/60">{panel.pregunta}</p>
            <Link
              href={panel.href}
              className="rounded-lg bg-brand-orange px-6 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-[#d85a30] focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-brand-black"
            >
              {panel.cta}
            </Link>
          </div>
        </aside>

        {/* COLUMNA DEL FORMULARIO */}
        {/* UX 100%: Reducimos el padding superior en móvil (py-6) para conectar más rápido con la cabecera */}
        <main className="flex flex-col justify-center px-6 py-6 sm:px-10 lg:order-1 lg:px-12 lg:py-10">
          
          {children}

          {/* CTA Responsive: Exclusivo para móvil, con toque "app nativa" */}
          <div className="mt-6 border-t border-gray-200/60 pt-5 text-center lg:hidden">
            <p className="text-sm font-medium text-gray-500">
              {panel.pregunta}{' '}
              <Link
                href={panel.href}
                className="font-bold text-brand-orange transition-colors hover:text-[#d85a30] active:scale-95 inline-block"
              >
                {panel.cta}
              </Link>
            </p>
          </div>
        </main>

      </div>
    </div>
  );
}