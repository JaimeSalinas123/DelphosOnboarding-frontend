import { API_URL, REQUEST_TIMEOUT_MS, authService, handleResponse } from './authService';

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
}

export const usuarioService = {
  // Lista los usuarios registrados, con filtro opcional por departamento y
  // búsqueda opcional por nombre (ambos resueltos en el backend). Requiere
  // sesión activa (endpoint protegido con verificarToken).
  listar: async (filtros: FiltrosUsuarios = {}): Promise<UsuarioListado[]> => {
    const params = new URLSearchParams();
    if (filtros.departamento) params.set('departamento', filtros.departamento);
    if (filtros.nombre) params.set('nombre', filtros.nombre);
    const query = params.toString();

    const response = await authFetch(`/usuarios${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
    const data = await handleResponse(response);
    return data?.usuarios ?? [];
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
};
