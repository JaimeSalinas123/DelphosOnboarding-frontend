import type { Paginacion } from '@/lib/paginacion';

export default function Paginador({
  paginacion,
  onCambiarPagina,
}: {
  paginacion: Paginacion;
  onCambiarPagina: (pagina: number) => void;
}) {
  const { pagina, limite, total, totalPaginas } = paginacion;
  if (totalPaginas <= 1) return null;

  const desde = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const hasta = Math.min(pagina * limite, total);

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row w-full py-1">
      <p className="text-sm font-medium text-gray-500">
        Mostrando <span className="font-bold text-gray-900">{desde}</span> a{' '}
        <span className="font-bold text-gray-900">{hasta}</span> de{' '}
        <span className="font-bold text-gray-900">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onCambiarPagina(pagina - 1)}
          disabled={pagina <= 1}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
        >
          Anterior
        </button>
        <span className="px-3 text-sm font-medium text-gray-500">
          Página <span className="font-bold text-gray-900">{pagina}</span> de {totalPaginas}
        </span>
        <button
          type="button"
          onClick={() => onCambiarPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}