const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// El mismo escáner seguro que usamos en el resto del proyecto
const getAuthHeaders = (): HeadersInit => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('token');
    
    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        const rawData = localStorage.getItem(key) || '';
        
        if (rawData.startsWith('eyJ')) {
          token = rawData;
          break;
        }
        
        if (key.includes('supabase') || key.includes('sb-') || key.includes('token')) {
          try {
            const parsed = JSON.parse(rawData);
            if (parsed.access_token) { token = parsed.access_token; break; }
            if (parsed.session?.access_token) { token = parsed.session.access_token; break; }
          } catch (e) {}
        }
      }
    }
    
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response: Response, defaultError: string) => {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('Token expirado');
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || defaultError);
  }
  return response.json();
};

export interface Pregunta {
  id: string;
  tipo: string;
  nivel?: string;
  pregunta: string;
  respuesta_correcta: string;
  opcion_a?: string;
  opcion_b?: string;
  opcion_c?: string;
  opcion_d?: string;
}

export interface ResultadoEstudio {
  id: string;
  usuario_id: string;
  metodo: string;
  puntuacion?: number;
  total_preguntas?: number;
  fecha_completado: string;
  respuestas_detalle?: any[];
  usuario?: {
    nombre: string;
    email: string;
    departamento: string;
  };
}

export const estudioService = {
  listar: async (): Promise<Pregunta[]> => {
    const response = await fetch(`${API_URL}/estudio/preguntas`, { headers: getAuthHeaders() });
    return handleResponse(response, 'Error al obtener preguntas');
  },

  crear: async (datos: Omit<Pregunta, 'id'>): Promise<Pregunta> => {
    const response = await fetch(`${API_URL}/estudio/preguntas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(response, 'Error al crear pregunta');
  },

  actualizar: async (id: string, datos: Partial<Pregunta>): Promise<Pregunta> => {
    const response = await fetch(`${API_URL}/estudio/preguntas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos),
    });
    return handleResponse(response, 'Error al actualizar pregunta');
  },

  eliminar: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/estudio/preguntas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response, 'Error al eliminar pregunta');
  },

  obtenerResultados: async (): Promise<ResultadoEstudio[]> => {
    const response = await fetch(`${API_URL}/estudio/resultados`, { headers: getAuthHeaders() });
    return handleResponse(response, 'Error al obtener resultados');
  }
};