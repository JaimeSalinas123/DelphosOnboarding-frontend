'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { isValidEmail, sanitizeInput } from '@/utils/validation';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const cleanEmail = sanitizeInput(email).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.recuperarPassword(cleanEmail);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error al intentar enviar el correo.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Clases compartidas (mismo lenguaje visual que /login y /registro) ---
  const inputClass =
    'block w-full rounded-lg border border-default bg-neutral-primary px-3.5 py-2.5 text-sm text-heading placeholder:text-body/40 outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60';

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {success ? (
        <div className="rounded-lg border border-brand-orange/30 bg-brand-orange/5 px-3.5 py-2.5 text-sm text-heading">
          <p className="mb-2 font-semibold">¡Correo enviado!</p>
          <p className="text-body">
            Si el correo existe en nuestro sistema, recibirás un enlace seguro para crear tu nueva contraseña.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block text-sm font-medium text-brand-orange transition-opacity hover:opacity-70"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <p className="text-sm text-body">
            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu acceso.
          </p>

          <fieldset disabled={isLoading} className="space-y-4">
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

            <button
              type="submit"
              className={`mt-2 flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:ring-offset-2 ${
                isLoading
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
                  Enviando...
                </>
              ) : (
                'Enviar enlace seguro'
              )}
            </button>
          </fieldset>
        </form>
      )}

      {!success && (
        <div className="mt-6 text-center text-sm text-body">
          <Link href="/login" className="font-medium text-brand-orange transition-opacity hover:opacity-70">
            Cancelar y volver
          </Link>
        </div>
      )}
    </div>
  );
}
