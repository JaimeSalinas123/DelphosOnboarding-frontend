'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isValidEmail, sanitizeInput } from '@/utils/validation';
import { authService } from '@/services/authService'; 

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth(); 

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
      // Llamada a nuestro ESTADO GLOBAL en lugar del servicio directo
      await login(cleanEmail, password);

      setSuccess(true);

      // Limpiamos el formulario antes de redirigir
      setEmail('');
      setPassword('');

      setTimeout(() => {
        // Leemos el usuario que se acaba de guardar en memoria tras el login exitoso
        const currentUser = authService.getCurrentUser();

        // REDIRECCIÓN INTELIGENTE BASADA EN ROLES
        if (currentUser?.rol === 'administrador' || currentUser?.rol === 'evaluador') {
          // Asegúrate de crear esta página cuando construyas el panel
          router.push('/dashboard-ch'); 
        } else {
          router.push('/onboarding');
        }
      }, 1500);

    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado al intentar iniciar sesión.');
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // --- Clases UX/UI Premium Móvil (Touch targets amplios, prevención de zoom iOS) ---
  const inputClass =
    'block w-full rounded-xl border border-default bg-neutral-primary px-4 py-3.5 text-base sm:text-sm text-heading placeholder:text-body/40 outline-none transition-all shadow-sm focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60';

  return (
    <div className="w-full">
      {/* Banners de retroalimentación modernizados */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 flex items-center gap-3 shadow-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-xl border border-brand-orange/30 bg-brand-orange/5 px-4 py-3 text-sm font-medium text-heading flex items-center gap-3 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-orange/30 border-t-brand-orange flex-shrink-0" />
          Acceso concedido. Cargando el entorno...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Campo honeypot oculto - Nombre modificado para evadir el autocompletado del navegador */}
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
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

        <fieldset disabled={isFormDisabled} className="space-y-5">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-body/80">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="tu@correo.com"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-body/80">
                Contraseña
              </label>
              <Link
                href="/recuperar-password"
                className="text-xs font-bold text-brand-orange transition-opacity hover:opacity-70"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-16`}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-xs font-bold text-body/70 transition-colors hover:text-brand-orange focus:outline-none"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`mt-8 flex h-12 sm:h-14 w-full items-center justify-center rounded-xl text-base font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:ring-offset-2 ${
              isFormDisabled
                ? 'cursor-not-allowed bg-neutral-tertiary shadow-none'
                : 'bg-brand-orange hover:bg-[#d85a30] hover:shadow-lg hover:shadow-brand-orange/20 active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="-ml-1 mr-2.5 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    </div>
  );
}