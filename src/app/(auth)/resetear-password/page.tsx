'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/authService';

export default function ResetearPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [tokens, setTokens] = useState({ access_token: '', refresh_token: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Capturar los tokens de seguridad desde la URL de Supabase
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');

      if (access_token && refresh_token) {
        setTokens({ access_token, refresh_token });
      } else {
        setError('El enlace de recuperación no es válido o está incompleto.');
      }
    } else {
      setError('No se detectó ningún token de seguridad en el enlace.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!tokens.access_token || !tokens.refresh_token) {
      setError('No tienes autorización para realizar esta acción.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetearPassword(tokens.access_token, tokens.refresh_token, password);
      setSuccess(true);

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Clases compartidas (mismo lenguaje visual que /login y /registro) ---
  const inputClass =
    'block w-full rounded-lg border border-default bg-neutral-primary px-3.5 py-2.5 text-sm text-heading placeholder:text-body/40 outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60';

  if (success) {
    return (
      <div className="w-full text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange/10">
          <svg className="h-6 w-6 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-bold text-heading">¡Contraseña actualizada!</h3>
        <p className="text-sm text-body">Serás redirigido al inicio de sesión en unos segundos...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <fieldset disabled={isLoading} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-body">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClass} pr-16`}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
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

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-body">
              Confirmar contraseña
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={!!error && !tokens.access_token}
            className={`mt-2 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:ring-offset-2 ${
              isLoading || (!!error && !tokens.access_token)
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
                Actualizando...
              </>
            ) : (
              'Guardar nueva contraseña'
            )}
          </button>
        </fieldset>
      </form>

      <div className="mt-6 text-center text-sm text-body">
        <Link href="/login" className="font-medium text-brand-orange transition-opacity hover:opacity-70">
          Cancelar
        </Link>
      </div>
    </div>
  );
}
