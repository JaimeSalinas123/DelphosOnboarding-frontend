const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Pregunta {
  id: string;
  tipo: string;
  nivel: string | null;
  pregunta: string;
  opcion_a: string | null;
  opcion_b: string | null;
  opcion_c: string | null;
  opcion_d: string | null;
  respuesta_correcta: string;
  explicacion: string | null;
  fecha_creacion: string;
  activo?: boolean;
}

export interface ResultadoEnvio {
  usuario_id: string;
  metodo: 'cuestionario' | 'flashcard' | 'verdadero_falso';
  puntuacion?: number | null;
  total_preguntas?: number | null;
  respuestas_detalle?: any[];
}

export interface ResultadoEstudio {
  id: string;
  usuario: {
    nombre: string;
    email: string;
    departamento: string;
  };
  metodo: 'cuestionario' | 'flashcard' | 'verdadero_falso';
  puntuacion?: number | null;
  total_preguntas?: number | null;
  fecha_completado: string;
  respuestas_detalle?: any[];
}

// ==========================================
// SEGURIDAD Y MANEJO DE ERRORES CORREGIDO
// ==========================================

const getAuthHeaders = (): HeadersInit => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  if (typeof window !== 'undefined') {
    // Buscamos el token como lo haces en el ChatbotFlotante
    let token = localStorage.getItem('token');
    
    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-') || key.includes('token'))) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key) || '');
            if (parsed.access_token) token = parsed.access_token;
          } catch (e) {
            // Ignorar si no es JSON
          }
        }
      }
    }
    
    // Solo si encontramos un token, lo enviamos. 
    // Si no hay, dejamos que el backend nos rechace con 401.
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Traduce los códigos de error del backend
const handleResponse = async (response: Response, defaultErrorMessage: string) => {
  if (!response.ok) {
    // Si el backend nos rechaza (Token vencido, inválido o ausente)
    if (response.status === 401 || response.status === 403) {
      throw new Error('Token expirado'); // Esto dispara el componente de SessionExpired
    }
    
    // Cualquier otro tipo de error
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || defaultErrorMessage);
  }
  
  if (response.status === 204) return null;
  
  return response.json();
};

// ==========================================
// SERVICIO PRINCIPAL
// ==========================================

export const estudioService = {
  listar: async (): Promise<Pregunta[]> => {
    const response = await fetch(`${API_URL}/estudio/preguntas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response, 'Error al cargar las preguntas');
  },

  actualizar: async (id: string, datos: Partial<Pregunta>): Promise<Pregunta> => {
    const response = await fetch(`${API_URL}/estudio/preguntas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos)
    });
    return handleResponse(response, 'Error al actualizar la pregunta');
  },

  eliminar: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/estudio/preguntas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    await handleResponse(response, 'Error al eliminar la pregunta');
  },

  guardarResultado: async (datos: ResultadoEnvio): Promise<void> => {
    const response = await fetch(`${API_URL}/estudio/resultados`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(datos)
    });
    await handleResponse(response, 'Error al guardar el resultado');
  },

  obtenerResultados: async (): Promise<ResultadoEstudio[]> => {
    const response = await fetch(`${API_URL}/estudio/resultados`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response, 'Error al cargar los resultados');
  }
};