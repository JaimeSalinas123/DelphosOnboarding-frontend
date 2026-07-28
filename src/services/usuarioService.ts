import { API_URL, REQUEST_TIMEOUT_MS, authService, handleResponse } from './authService';

export interface UsuarioListado {
  id: string;
  nombre: string;
  email: string;
  departamento: string;
  rol: string;
}

export const usuarioService = {
  // Lista los usuarios registrados. Requiere sesión activa (endpoint protegido
  // con verificarToken en el backend).
  listar: async (): Promise<UsuarioListado[]> => {
    const token = authService.getToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${API_URL}/usuarios`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

    const data = await handleResponse(response);
    return data?.usuarios ?? [];
  },
};
