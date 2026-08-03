'use client';

import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

export default function SessionExpired() {
  const router = useRouter();

  const handleRedirigirLogin = () => {
    authService.logout(); // Limpiamos la basura del local storage
    router.push('/login'); // Lo mandamos de regreso
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 text-center rounded-2xl shadow-xl border border-gray-100">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">Tu sesión ha expirado</h2>
      <p className="text-gray-600 mb-8 leading-relaxed text-sm">
        Por motivos de seguridad, tu sesión se ha cerrado automáticamente. Vuelve a iniciar sesión para continuar.
      </p>
      <button
        onClick={handleRedirigirLogin}
        className="w-full py-3.5 px-4 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-colors"
      >
        Volver a iniciar sesión
      </button>
    </div>
  );
}