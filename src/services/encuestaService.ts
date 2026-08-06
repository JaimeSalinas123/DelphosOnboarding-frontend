import { API_URL, REQUEST_TIMEOUT_MS, authService, handleResponse } from './authService';
import type { Paginacion } from '@/lib/paginacion';

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

/** Una respuesta del pasante a una pregunta puntual. */
export interface RespuestaEnvio {
  pregunta_id: string;
  respuesta_numerica?: number | null;
  respuesta_texto?: string | null;
}

/** Usuario dueño de una encuesta completada (vista de resultados, solo admin). */
export interface UsuarioResultado {
  id: string;
  nombre: string;
  email: string;
  departamento: string;
}

/** Una respuesta ya guardada, con los datos de su pregunta embebidos. */
export interface RespuestaResultado {
  id: string;
  respuesta_numerica: number | null;
  respuesta_texto: string | null;
  pregunta: {
    id: string;
    seccion: string;
    pregunta: string;
    orden: number;
    tipo_respuesta: TipoRespuesta;
  };
}

/** Una encuesta completada por un usuario, con todas sus respuestas. */
export interface ResultadoEncuesta {
  id: string;
  estado: string;
  fecha_completado: string;
  usuario: UsuarioResultado;
  respuestas: RespuestaResultado[];
}

export interface FiltrosResultados {
  /** Página a pedir (1-indexed). El backend por defecto usa 1. */
  pagina?: number;
  /** Tamaño de página. El backend por defecto usa 10, tope 100. */
  limite?: number;
  /** Coincidencia exacta contra el departamento del usuario. */
  departamento?: string;
  /** Fecha mínima de finalización, formato YYYY-MM-DD (inclusive). */
  fechaDesde?: string;
  /** Fecha máxima de finalización, formato YYYY-MM-DD (inclusive, incluye todo el día). */
  fechaHasta?: string;
}

export interface ListadoResultados {
  resultados: ResultadoEncuesta[];
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

  // Envío del pasante (una sola vez por usuario; el backend rechaza con 409
  // si ya existe una encuesta previa para su usuario_id).
  // Nota: asumo que esta ruta vive en el mismo router que /preguntas
  // (/api/satisfaccion/encuestas). Si en tu backend está montada aparte,
  // avisame y ajusto la URL.
  enviar: async (respuestas: RespuestaEnvio[]): Promise<{ mensaje: string; encuestaId: string }> => {
    const response = await authFetch('/satisfaccion/encuestas', {
      method: 'POST',
      body: JSON.stringify({ respuestas }),
    });
    return handleResponse(response);
  },

  // Si el usuario logueado ya completó la encuesta, para no dejarlo ni
  // empezarla de nuevo (en vez de descubrirlo recién al enviar).
  obtenerMiEstado: async (): Promise<{ completada: boolean }> => {
    const response = await authFetch('/satisfaccion/mi-estado', { method: 'GET' });
    return handleResponse(response);
  },

  // Resultados de todos los usuarios que completaron la encuesta (solo admin),
  // paginados. Nota: asumo que vive en el mismo router que /preguntas y
  // /encuestas (/api/satisfaccion/resultados). Si está montada aparte, avisame y ajusto.
  obtenerResultados: async (filtros: FiltrosResultados = {}): Promise<ListadoResultados> => {
    const params = new URLSearchParams();
    if (filtros.pagina) params.set('pagina', String(filtros.pagina));
    if (filtros.limite) params.set('limite', String(filtros.limite));
    if (filtros.departamento) params.set('departamento', filtros.departamento);
    if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
    if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);
    const query = params.toString();

    const response = await authFetch(`/satisfaccion/resultados${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
    return handleResponse(response);
  },

  // Trae todos los resultados (sin paginar), recorriendo todas las páginas
  // con el límite máximo que acepta el backend. Pensado para agregaciones
  // en cliente (ej. promedios por pregunta, avance en el tiempo).
  obtenerTodosLosResultados: async (): Promise<ResultadoEncuesta[]> => {
    const LIMITE_MAXIMO = 100;
    const primera = await encuestaService.obtenerResultados({ pagina: 1, limite: LIMITE_MAXIMO });
    const resultados = [...primera.resultados];
    for (let pagina = 2; pagina <= primera.paginacion.totalPaginas; pagina++) {
      const siguiente = await encuestaService.obtenerResultados({ pagina, limite: LIMITE_MAXIMO });
      resultados.push(...siguiente.resultados);
    }
    return resultados;
  },
};

/** El backend usa este mensaje exacto para "ya respondiste esta encuesta". */
export function esErrorYaCompletada(mensaje: string): boolean {
  return mensaje.toLowerCase().includes('ya has completado');
}
