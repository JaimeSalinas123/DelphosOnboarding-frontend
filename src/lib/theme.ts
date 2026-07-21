/**
 * Acento de marca DEINSA (naranja) usado para resaltar selección/hover en el
 * Ecosistema Delphos. El color propio de cada módulo (`Modulo.color`) sigue
 * vivo solo en el aura de fondo de la vista, no en la iluminación del nodo.
 */
export const BRAND_ORANGE = '#D85A30';
export const BRAND_BLACK = '#171717';

export function hexToRgba(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
