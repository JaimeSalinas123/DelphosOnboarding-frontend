import { useId } from 'react';
import { HEXAGONO_PATH } from '@/lib/insignias';

export default function InsigniaMedalla({
  desbloqueada,
  tamano = 64,
}: {
  desbloqueada: boolean;
  tamano?: number;
}) {
  const idBase = useId();
  const gradId = `insignia-grad-${idBase}`;

  return (
    <div className="relative flex-shrink-0" style={{ width: tamano, height: tamano }}>
      <svg viewBox="0 0 100 100" className={`h-full w-full ${desbloqueada ? 'drop-shadow-[0_2px_6px_rgba(216,90,48,0.35)]' : ''}`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand-orange)" />
            <stop offset="100%" stopColor="#a8431f" />
          </linearGradient>
        </defs>
        <path
          d={HEXAGONO_PATH}
          fill={desbloqueada ? `url(#${gradId})` : 'var(--neutral-tertiary)'}
          stroke={desbloqueada ? 'var(--brand-black)' : 'var(--default)'}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {desbloqueada ? (
          // Mismo truco que en la ventana del Asistente Delphos: brightness-0 + invert
          // deja el logo completamente blanco sin importar sus colores originales.
          // eslint-disable-next-line @next/next/no-img-element -- ícono decorativo chico, no vale la pena next/image acá
          <img src="/images/logo.svg" alt="" className="h-[44%] w-[44%] object-contain brightness-0 invert" />
        ) : (
          <svg className="h-[32%] w-[32%] text-brand-gray" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
          </svg>
        )}
      </div>
    </div>
  );
}
