'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { isValidEmail, isValidName, passwordContainsPersonalInfo, sanitizeInput } from '@/utils/validation';
import { DEPARTAMENTOS } from '@/lib/departamentos';

export default function RegistroPage() {
  const router = useRouter();

  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Campo señuelo invisible para usuarios: si un bot lo rellena, se descarta el envío.
  const [honeypot, setHoneypot] = useState('');

  // Estados para la conexión con el Backend
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Evita doble envío por doble clic antes de que el estado de React se actualice.
  const isSubmittingRef = useRef(false);

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

  const isFormDisabled = isLoading || success;

  // --- handleSubmit CONECTADO AL BACKEND ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(false);

    // Protección anti-bot: si el honeypot tiene contenido, se ignora silenciosamente el envío.
    if (honeypot) {
      return;
    }

    if (isSubmittingRef.current) {
      return;
    }

    const cleanNombre = sanitizeInput(nombre);
    const cleanEmail = sanitizeInput(email).toLowerCase();

    if (!isValidName(cleanNombre)) {
      setError('El nombre solo puede contener letras y espacios (2-100 caracteres).');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    if (!departamento) {
      setError('Selecciona un departamento.');
      return;
    }

    if (!isPasswordValid) {
      setError('Por favor, cumple con todos los requisitos de la contraseña.');
      return;
    }

    if (passwordContainsPersonalInfo(password, cleanNombre, cleanEmail)) {
      setError('La contraseña no debe contener tu nombre o tu correo electrónico.');
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      await authService.registro(cleanNombre, cleanEmail, departamento, password);

      setSuccess(true);

      setNombre('');
      setEmail('');
      setDepartamento('');
      setPassword('');

      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado al crear la cuenta.');
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // --- Clases UX/UI Premium Móvil (Touch targets amplios, prevención de zoom iOS) ---
  const inputClass =
    'block w-full rounded-xl border border-default bg-neutral-primary px-4 py-3.5 text-base sm:text-sm text-heading placeholder:text-body/40 outline-none transition-all shadow-sm focus:border-brand-orange focus:bg-white focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60';

  const chipClass = (met: boolean) =>
    `flex items-center justify-center rounded-lg px-2 py-1.5 text-[10px] font-bold tracking-wide transition-all duration-300 ${
      met ? 'bg-brand-orange/10 text-brand-orange shadow-sm' : 'bg-neutral-secondary text-body/60'
    }`;

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
          Cuenta creada. Redirigiendo al inicio de sesión...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Campo honeypot: oculto visualmente y de lectores de pantalla, solo lo rellenan bots */}
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="empresa_web">No llenar este campo</label>
          <input
            type="text"
            id="empresa_web"
            name="empresa_web"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <fieldset disabled={isFormDisabled} className="space-y-4">
          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-body/80">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
              placeholder="Ej. Alfonso Garcia"
              autoComplete="name"
              maxLength={100}
              required
            />
          </div>

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
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={150}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-body/80">
              Departamento
            </label>
            <select
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              className={`${inputClass} appearance-none bg-[length:14px] bg-[right_1rem_center] bg-no-repeat pr-10 bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%23888' stroke-width='1.5'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")]`}
              required
            >
              <option value="" disabled>Selecciona tu área...</option>
              {DEPARTAMENTOS.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-body/80">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                maxLength={72}
                className={`${inputClass} pr-16 ${isPasswordValid ? 'border-brand-orange ring-1 ring-brand-orange/30' : ''}`}
                placeholder="Mínimo 8 caracteres"
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

            <div className="mt-3 space-y-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-secondary">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    metCount === 0 ? 'w-0' :
                    metCount <= 2 ? 'w-2/4 bg-brand-orange/40' :
                    metCount === 3 ? 'w-3/4 bg-brand-orange/70' :
                    'w-full bg-brand-orange shadow-[0_0_8px_rgba(216,90,48,0.6)]'
                  }`}
                ></div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <div className={chipClass(passwordValidations.hasMinLength)}>8+</div>
                <div className={chipClass(passwordValidations.hasUppercase)}>Mayús.</div>
                <div className={chipClass(passwordValidations.hasLowercase)}>Minús.</div>
                <div className={chipClass(passwordValidations.hasNumber)}>Número</div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isPasswordValid || isFormDisabled}
            className={`mt-6 flex h-12 sm:h-14 w-full items-center justify-center rounded-xl text-base font-bold text-white transition-all focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:ring-offset-2 ${
              !isPasswordValid || isFormDisabled
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
                Creando cuenta...
              </>
            ) : success ? (
              'Cuenta creada'
            ) : (
              'Registrarse'
            )}
          </button>
        </fieldset>
      </form>
    </div>
  );
}