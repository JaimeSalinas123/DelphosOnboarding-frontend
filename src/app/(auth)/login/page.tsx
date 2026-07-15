'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login simulado con:', { email, password });
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-900 text-center mb-6">
        Iniciar Sesión
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
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
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
            placeholder="••••••••"
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Ingresar
        </button>
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