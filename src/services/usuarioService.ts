import { API_URL, REQUEST_TIMEOUT_MS, authService, handleResponse } from './authService';
import type { Paginacion } from '@/lib/paginacion';

export interface UsuarioListado {
  id: string;
  nombre: string;
  email: string;
  departamento: string;
  rol: string;
}

/**
 * Roles que se pueden asignar desde el toggle de la tabla de usuarios.
 * El backend también acepta 'evaluador' vía este mismo endpoint, pero ese
 * rol se maneja aparte (no por un control de dos estados).
 */
export type RolEditable = 'nuevo_integrante' | 'administrador';

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = authService.getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
      credentials: 'omit',
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado en responder. Inténtalo de nuevo.');
    }
    throw new Error('No se pudo establecer conexión con el servidor. Verifica tu conexión a internet.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface FiltrosUsuarios {
  /** Coincidencia exacta. */
  departamento?: string;
  /** Búsqueda parcial, insensible a mayúsculas (ilike en el backend). */
  nombre?: string;
  /** Página a pedir (1-indexed). El backend por defecto usa 1. */
  pagina?: number;
  /** Tamaño de página. El backend por defecto usa 10, tope 100. */
  limite?: number;
}

export interface ListadoUsuarios {
  usuarios: UsuarioListado[];
  paginacion: Paginacion;
}

export const usuarioService = {
  // Lista los usuarios registrados, con filtro opcional por departamento y
  // búsqueda opcional por nombre, y paginación (todo resuelto en el
  // backend). Requiere sesión activa (endpoint protegido con verificarToken).
  listar: async (filtros: FiltrosUsuarios = {}): Promise<ListadoUsuarios> => {
    const params = new URLSearchParams();
    if (filtros.departamento) params.set('departamento', filtros.departamento);
    if (filtros.nombre) params.set('nombre', filtros.nombre);
    if (filtros.pagina) params.set('pagina', String(filtros.pagina));
    if (filtros.limite) params.set('limite', String(filtros.limite));
    const query = params.toString();

    const response = await authFetch(`/usuarios${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
    const data = await handleResponse(response);
    return {
      usuarios: data?.usuarios ?? [],
      paginacion: data?.paginacion ?? {
        pagina: filtros.pagina ?? 1,
        limite: filtros.limite ?? 10,
        total: data?.usuarios?.length ?? 0,
        totalPaginas: 1,
      },
    };
  },

  // Actualiza el rol de un usuario. Requiere sesión de administrador
  // (verificarAdmin en el backend); si el usuario actual no lo es, el
  // backend responde 403.
  actualizarRol: async (id: string, rol: RolEditable): Promise<UsuarioListado> => {
    const response = await authFetch(`/usuarios/${id}/rol`, {
      method: 'PATCH',
      body: JSON.stringify({ rol }),
    });
    const data = await handleResponse(response);
    return data.usuario;
  },

  // Trae el listado completo (sin paginar), recorriendo todas las páginas
  // con el límite máximo que acepta el backend. Pensado para agregaciones
  // en cliente (ej. métricas por departamento/rol), no para tablas grandes.
  listarTodos: async (): Promise<UsuarioListado[]> => {
    const LIMITE_MAXIMO = 100;
    const primera = await usuarioService.listar({ pagina: 1, limite: LIMITE_MAXIMO });
    const usuarios = [...primera.usuarios];
    for (let pagina = 2; pagina <= primera.paginacion.totalPaginas; pagina++) {
      const siguiente = await usuarioService.listar({ pagina, limite: LIMITE_MAXIMO });
      usuarios.push(...siguiente.usuarios);
    }
    return usuarios;
  },
};
