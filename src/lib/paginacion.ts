/** Forma común que devuelven los endpoints paginados del backend. */
export interface Paginacion {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}
