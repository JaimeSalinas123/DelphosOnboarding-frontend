import { API_URL, REQUEST_TIMEOUT_MS, authService, handleResponse } from './authService';

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
};
