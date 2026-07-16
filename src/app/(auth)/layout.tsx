'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Solo la ruta de registro necesita un layout más compacto (formulario más largo).
  // El login no toca esta rama, por lo que su apariencia queda exactamente igual.
  const pathname = usePathname();
  const isRegistro = pathname?.startsWith('/registro') ?? false;

  return (
    // Contenedor principal: Ocupa toda la pantalla, fondo gris claro, y centra el contenido
    <div
      className={`min-h-screen bg-slate-50 flex flex-col justify-center sm:px-6 lg:px-8 ${
        isRegistro ? 'py-4' : 'py-12'
      }`}
    >

      {/* Logo y título: fuera y arriba de la tarjeta blanca */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Image
          src="/images/logo.svg"
          alt="Logo Delphos"
          width={isRegistro ? 48 : 80}
          height={isRegistro ? 48 : 80}
          style={{ width: 'auto', height: 'auto' }} // Soluciona la advertencia de proporciones del SVG
          priority // <-- ¡Esto limpia el warning del LCP en la consola!
          className={isRegistro ? 'mb-1' : 'mb-4'}
        />
        <h3 className={`font-bold text-slate-900 text-center ${isRegistro ? 'text-lg' : 'text-2xl'}`}>
          Delphos Onboarding
        </h3>
      </div>

      {/* Tarjeta blanca central: Aquí es donde Next.js inyectará el Login o el Registro */}
      <div className={`sm:mx-auto sm:w-full sm:max-w-md ${isRegistro ? 'mt-2' : 'mt-8'}`}>
        <div
          className={`bg-white shadow sm:rounded-lg ${
            isRegistro ? 'py-4 px-4 sm:px-6' : 'py-8 px-4 sm:px-10'
          }`}
        >
          {children}
        </div>
      </div>

    </div>
  );
}