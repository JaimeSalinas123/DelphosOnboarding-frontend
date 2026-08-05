import { DEPARTAMENTOS } from '@/lib/departamentos';

const CLASE_BASE =
  'w-full sm:w-64 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm';

export default function SelectorDepartamento({
  value,
  onChange,
  className = CLASE_BASE,
  placeholder = 'Todos los departamentos',
}: {
  value: string;
  onChange: (valor: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{placeholder}</option>
      {DEPARTAMENTOS.map((dep) => (
        <option key={dep} value={dep}>
          {dep}
        </option>
      ))}
    </select>
  );
}
