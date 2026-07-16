'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // <-- Ruta corregida
import { isValidEmail, sanitizeInput } from '@/utils/validation'; // <-- Ruta corregida

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth(); // <-- Conectamos al estado global

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

  // --- Clases compartidas (mismo lenguaje visual que /registro) ---
  const inputClass =
    'block w-full rounded-lg border border-default bg-neutral-primary px-3.5 py-2.5 text-sm text-heading placeholder:text-body/40 outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60';

  return (
    <div className="w-full">
      {/* Banners de retroalimentación */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-brand-orange/30 bg-brand-orange/5 px-3.5 py-2.5 text-sm text-heading">
          Acceso concedido. Cargando el entorno...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        <fieldset disabled={isFormDisabled} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-body">
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
            <div className="mb-1.5 flex items-baseline justify-between">
              <label className="block text-xs font-medium uppercase tracking-wide text-body">
                Contraseña
              </label>
              <Link
                href="/recuperar-password"
                className="text-xs font-medium text-brand-orange transition-opacity hover:opacity-70"
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
                className="absolute inset-y-0 right-0 flex items-center px-3.5 text-xs font-medium text-body transition-colors hover:text-brand-orange"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`mt-2 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:ring-offset-2 ${
              isFormDisabled
                ? 'cursor-not-allowed bg-neutral-tertiary'
                : 'bg-brand-orange hover:opacity-90'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="-ml-1 mr-2.5 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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