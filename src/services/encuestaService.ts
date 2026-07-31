import { API_URL, REQUEST_TIMEOUT_MS, authService, handleResponse } from './authService';

export type TipoRespuesta = 'escala' | 'texto';

export interface PreguntaSatisfaccion {
  id: string;
  seccion: string;
  pregunta: string;
  tipo_respuesta: TipoRespuesta;
  escala_min: number | null;
  escala_max: number | null;
  orden: number;
  obligatoria: boolean;
  activo?: boolean;
}

/** Forma que espera el backend en POST/PUT (mismo esquema para crear y editar). */
export type DatosPregunta = {
  seccion: string;
  pregunta: string;
  tipo_respuesta: TipoRespuesta;
  escala_min: number | null;
  escala_max: number | null;
  orden: number;
  obligatoria: boolean;
};

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

export const encuestaService = {
  // Preguntas activas de la encuesta de satisfacción, en el orden en que se muestran.
  listar: async (): Promise<PreguntaSatisfaccion[]> => {
    const response = await authFetch('/satisfaccion/preguntas', { method: 'GET' });
    return handleResponse(response);
  },

  crear: async (datos: DatosPregunta): Promise<PreguntaSatisfaccion> => {
    const response = await authFetch('/satisfaccion/preguntas', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    return handleResponse(response);
  },

  // El backend valida con el mismo esquema que crear: hay que mandar el objeto completo.
  actualizar: async (id: string, datos: DatosPregunta): Promise<PreguntaSatisfaccion> => {
    const response = await authFetch(`/satisfaccion/preguntas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos),
    });
    return handleResponse(response);
  },

  // Borrado lógico: el backend marca activo=false, no borra el registro.
  eliminar: async (id: string): Promise<void> => {
    const response = await authFetch(`/satisfaccion/preguntas/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
};
