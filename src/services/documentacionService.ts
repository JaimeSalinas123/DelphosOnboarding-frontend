const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Mismo escáner seguro que usa el Chatbot Flotante
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
            if (parsed.access_token) {
              token = parsed.access_token;
              break;
            }
            if (parsed.session?.access_token) {
              token = parsed.session.access_token;
              break;
            }
          } catch (e) {
            // Ignorar si no es un JSON
          }
        }
      }
    }
    
    // Si encontramos la llave, la ponemos en la petición
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

const handleResponse = async (response: Response, defaultErrorMessage: string) => {
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Token expirado'); // Solo salta si el backend rechaza la llave
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || defaultErrorMessage);
  }
  return response.json();
};

export const documentacionService = {
  // Obtiene el TXT crudo desde el backend
  obtenerTexto: async (): Promise<{ contenido: string }> => {
    const response = await fetch(`${API_URL}/chat/documentacion`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response, 'Error al cargar la documentación');
  },

  // Guarda el TXT crudo en el backend
  guardarTexto: async (contenido: string): Promise<void> => {
    const response = await fetch(`${API_URL}/chat/documentacion`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contenido }),
    });
    await handleResponse(response, 'Error al guardar la documentación');
  },
};