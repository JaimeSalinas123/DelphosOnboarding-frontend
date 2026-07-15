'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/app/services/authService';

export default function RegistroPage() {
  const router = useRouter();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [password, setPassword] = useState('');

  // Estados para la conexión con el Backend
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // --- LÓGICA DE VALIDACIÓN DE CONTRASEÑA EN TIEMPO REAL ---
  const passwordValidations = useMemo(() => {
    return {
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  }, [password]);

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);
  const metCount = Object.values(passwordValidations).filter(Boolean).length;

  // --- handleSubmit CONECTADO AL BACKEND ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError(null);
    setSuccess(false);

    if (!isPasswordValid) {
      setError('Por favor, cumple con todos los requisitos de la contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      // email.trim() limpia espacios accidentales
      await authService.registro(nombre, email.trim(), departamento, password);
      
      setSuccess(true);
      
      setNombre('');
      setEmail('');
      setDepartamento('');
      setPassword('');

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      console.error("Error en registro visual:", err);
      setError(err.message || 'Ocurrió un error inesperado al crear la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-900 text-center mb-6">
        Crear Cuenta
      </h3>

      {/* Mostrador de Mensajes (Error o Éxito) */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded shadow-sm text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded shadow-sm text-sm text-green-800 animate-pulse">
          <strong>Éxito:</strong> Cuenta creada exitosamente. Redirigiendo al sistema...
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-4 ${isLoading || success ? 'opacity-60 pointer-events-none' : ''}`}>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Nombre Completo
          </label>
          <input 
            type="text" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900"
            placeholder="Ej. Alfonso Garcia"
            required
          />
        </div>

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
          <label className="block text-sm font-medium text-slate-700">
            Departamento
          </label>
          <select 
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white"
            required
          >
            <option value="" disabled>Selecciona tu área...</option>
            <option value="TI">Capital Humano</option>
            <option value="RRHH">La Plaza Digital</option>
            <option value="Finanzas">Relaciones Corporativas</option>
            <option value="Operaciones">Research & Development</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Contraseña
          </label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password" // <-- Evita la advertencia de contraseñas vulneradas en Chrome
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
              password.length === 0 
                ? 'border-slate-300 focus:ring-blue-500 focus:border-blue-500' 
                : isPasswordValid 
                  ? 'border-green-500 focus:ring-green-200 focus:border-green-500'
                  : 'border-red-300 focus:ring-red-200 focus:border-red-300'
            }`}
            placeholder="Mínimo 8 caracteres (letras y números)"
            required
          />
          
          <div className="mt-4 space-y-3">
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out ${
                  metCount === 0 ? 'w-0' :
                  metCount <= 2 ? 'w-2/4 bg-red-400' :
                  metCount === 3 ? 'w-3/4 bg-amber-400' :
                  'w-full bg-green-500'
                }`}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold tracking-wide">
              <div className={`flex items-center justify-center px-2 py-2 rounded-md transition-all duration-300 ${passwordValidations.hasMinLength ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>8+ Caracteres</div>
              <div className={`flex items-center justify-center px-2 py-2 rounded-md transition-all duration-300 ${passwordValidations.hasUppercase ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>Mayúscula</div>
              <div className={`flex items-center justify-center px-2 py-2 rounded-md transition-all duration-300 ${passwordValidations.hasLowercase ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>Minúscula</div>
              <div className={`flex items-center justify-center px-2 py-2 rounded-md transition-all duration-300 ${passwordValidations.hasNumber ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>Número</div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={!isPasswordValid || isLoading || success}
          className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors mt-4 ${
            !isPasswordValid || isLoading || success
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
              Creando cuenta...
            </>
          ) : success ? (
            'Cuenta Creada'
          ) : (
            'Registrarse'
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        ¿Ya tienes una cuenta?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}