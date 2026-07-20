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

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-900 text-center mb-6">
        Recuperar Contraseña
      </h3>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded shadow-sm text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {success ? (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded shadow-sm text-sm text-green-800 text-center">
          <p className="font-semibold mb-2">¡Correo enviado!</p>
          <p>Si el correo existe en nuestro sistema, recibirás un enlace seguro para crear tu nueva contraseña.</p>
          <Link href="/login" className="mt-4 inline-block font-medium text-blue-600 hover:text-blue-500">
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <p className="text-sm text-slate-600 text-center">
            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu acceso.
          </p>

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
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
              isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Enviando...' : 'Enviar enlace seguro'}
          </button>
        </form>
      )}

      {!success && (
        <div className="mt-6 text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Cancelar y volver
          </Link>
        </div>
      )}
    </div>
  );
}