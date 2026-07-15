import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Contenedor principal: Ocupa toda la pantalla, fondo gris claro, y centra el contenido
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      {/* Logo y título: fuera y arriba de la tarjeta blanca */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Image
          src="/images/logo.svg"
          alt="Logo Delphos"
          width={80}
          height={80}
          style={{ width: 'auto', height: 'auto' }} // Soluciona la advertencia de proporciones del SVG
          className="mb-4"
        />
        <h3 className="text-2xl font-bold text-slate-900 text-center">
          Delphos Onboarding
        </h3>
      </div>

      {/* Tarjeta blanca central: Aquí es donde Next.js inyectará el Login o el Registro */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>

    </div>
  );
}