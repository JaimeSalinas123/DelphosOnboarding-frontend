'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/app/services/authService';
import { isValidEmail, sanitizeInput } from '@/app/utils/validation';

export default function LoginPage() {
  const router = useRouter();

  // Estados del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Campo señuelo para bots
  const [honeypot, setHoneypot] = useState('');

  // Estados para la conexión con el Backend
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Evita doble envío por múltiples clics
  const isSubmittingRef = useRef(false);

  const isFormDisabled = isLoading || success;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(false);

    // Protección anti-bot silenciosa
    if (honeypot) {
      return; 
    }

    if (isSubmittingRef.current) {
      return;
    }

    const cleanEmail = sanitizeInput(email).toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (password.trim() === '') {
      setError('La contraseña es obligatoria.');
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      // Llamada a nuestro servicio de autenticación
      await authService.login(cleanEmail, password);
      
      setSuccess(true);
      
      // Limpiamos el formulario antes de redirigir
      setEmail('');
      setPassword('');

      setTimeout(() => {
        // Redirigir a la nueva página de onboarding
        router.push('/onboarding'); 
      }, 1500);

    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado al intentar iniciar sesión.');
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-900 text-center mb-6">
        Iniciar Sesión
      </h3>

      {/* Banners de retroalimentación */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded shadow-sm text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded shadow-sm text-sm text-green-800 animate-pulse">
          <strong>Éxito:</strong> Acceso concedido. Cargando el entorno...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Campo honeypot oculto - Nombre modificado para evadir el autocompletado del navegador */}
        <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
          <label htmlFor="filtro_trampa">No llenar este campo</label>
          <input
            type="text"
            id="filtro_trampa"
            name="filtro_trampa"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <fieldset disabled={isFormDisabled} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
              placeholder="tu@correo.com"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <div className="text-sm">
                <Link href="/recuperar-password" className="font-medium text-blue-600 hover:text-blue-500">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
            
            <div className="relative mt-1">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 pr-10 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 text-xs font-medium"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              isFormDisabled
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </>
            ) : success ? (
              'Redirigiendo...'
            ) : (
              'Ingresar'
            )}
          </button>
        </fieldset>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        ¿Eres un nuevo integrante?{' '}
        <Link href="/registro" className="font-medium text-blue-600 hover:text-blue-500">
          Regístrate aquí
        </Link>
      </div>
    </div>
  );
}