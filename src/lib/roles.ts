const ETIQUETA_ROL: Record<string, string> = {
  administrador: 'Administrador',
  evaluador: 'Evaluador',
  nuevo_integrante: 'Nuevo integrante',
};

/** Nombre legible de un rol; si no se reconoce, devuelve el valor tal cual. */
export function etiquetaRol(rol: string) {
  return ETIQUETA_ROL[rol] ?? rol;
}
