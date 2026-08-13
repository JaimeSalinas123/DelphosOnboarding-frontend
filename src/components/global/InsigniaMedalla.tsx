import { useId } from 'react';
import { FORMA_PATH, type FormaInsignia } from '@/lib/insignias';

export default function InsigniaMedalla({
  forma,
  desbloqueada,
  tamano = 64,
}: {
  forma: FormaInsignia;
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
          d={FORMA_PATH[forma]}
          fill={desbloqueada ? `url(#${gradId})` : 'var(--neutral-tertiary)'}
          stroke={desbloqueada ? 'var(--brand-black)' : 'var(--default)'}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {desbloqueada ? (
          <svg className="h-[36%] w-[36%] text-white" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="h-[32%] w-[32%] text-brand-gray" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
          </svg>
        )}
      </div>
    </div>
  );
}
