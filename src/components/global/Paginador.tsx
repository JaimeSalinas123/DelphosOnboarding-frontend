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
    <div className="flex flex-col items-center justify-between gap-3 border-t border-default px-5 py-3 sm:flex-row">
      <p className="text-xs text-body">
        Mostrando {desde}–{hasta} de {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onCambiarPagina(pagina - 1)}
          disabled={pagina <= 1}
          className="rounded-lg border border-default px-3 py-1.5 text-xs font-medium text-heading transition-colors hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-xs text-body">
          Página {pagina} de {totalPaginas}
        </span>
        <button
          type="button"
          onClick={() => onCambiarPagina(pagina + 1)}
          disabled={pagina >= totalPaginas}
          className="rounded-lg border border-default px-3 py-1.5 text-xs font-medium text-heading transition-colors hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
