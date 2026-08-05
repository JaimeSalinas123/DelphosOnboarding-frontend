import { API_URL, REQUEST_TIMEOUT_MS, authService, handleResponse } from './authService';
import type { Paginacion } from '@/lib/paginacion';

export interface ProgresoPasante {
  usuario_id: string;
  nombre?: string;
  email?: string;
  departamento?: string;
  porcentaje_ecosistema: number;
  porcentaje_estudio: number;
  porcentaje_encuesta: number;
  porcentaje_total: number;
}

export interface MiProgreso {
  modulosVistos: string[];
  progreso: ProgresoPasante;
}

export interface FiltrosProgreso {
  /** Página a pedir (1-indexed). El backend por defecto usa 1. */
  pagina?: number;
  /** Tamaño de página. El backend por defecto usa 10, tope 100. */
  limite?: number;
}

export interface ListadoProgreso {
  progreso: ProgresoPasante[];
  paginacion: Paginacion;
}

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

export const progresoService = {
  // Progreso del usuario logueado: porcentajes por etapa + qué módulos del
  // ecosistema ya vio (para hidratar el anillo 3D al recargar la página).
  obtenerMio: async (): Promise<MiProgreso> => {
    const response = await authFetch('/progreso/mio', { method: 'GET' });
    return handleResponse(response);
  },

  // El pasante marca un módulo del ecosistema como visitado. Es seguro
  // llamarlo aunque ya esté visitado: el backend no duplica ni falla.
  registrarModuloEcosistema: async (modulo: string): Promise<void> => {
    const response = await authFetch('/progreso/ecosistema', {
      method: 'POST',
      body: JSON.stringify({ modulo }),
    });
    await handleResponse(response);
  },

  // Progreso de todos los usuarios, paginado (solo administradores).
  obtenerTodosAdmin: async (filtros: FiltrosProgreso = {}): Promise<ListadoProgreso> => {
    const params = new URLSearchParams();
    if (filtros.pagina) params.set('pagina', String(filtros.pagina));
    if (filtros.limite) params.set('limite', String(filtros.limite));
    const query = params.toString();

    const response = await authFetch(`/progreso${query ? `?${query}` : ''}`, { method: 'GET' });
    return handleResponse(response);
  },

  // Trae el progreso de TODOS los usuarios sin paginar, recorriendo todas
  // las páginas con el límite máximo. Pensado para cruzarlo con la tabla de
  // Usuarios (que pagina distinto), no para listas gigantes.
  listarTodoAdmin: async (): Promise<ProgresoPasante[]> => {
    const LIMITE_MAXIMO = 100;
    const primera = await progresoService.obtenerTodosAdmin({ pagina: 1, limite: LIMITE_MAXIMO });
    const progreso = [...primera.progreso];
    for (let pagina = 2; pagina <= primera.paginacion.totalPaginas; pagina++) {
      const siguiente = await progresoService.obtenerTodosAdmin({ pagina, limite: LIMITE_MAXIMO });
      progreso.push(...siguiente.progreso);
    }
    return progreso;
  },
};
