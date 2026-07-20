'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/authService';

export default function ResetearPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
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

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">¡Contraseña actualizada!</h3>
        <p className="text-sm text-slate-600">Serás redirigido al inicio de sesión en unos segundos...</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-900 text-center mb-6">
        Nueva Contraseña
      </h3>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded shadow-sm text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nueva Contraseña</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Confirmar Contraseña</label>
          <input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
            required
            minLength={8}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !!error}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
            isLoading || !!error ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Actualizando...' : 'Guardar nueva contraseña'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Cancelar
        </Link>
      </div>
    </div>
  );
}