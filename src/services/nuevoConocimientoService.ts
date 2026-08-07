const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Escáner de tokens seguro
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

export const nuevoConocimientoService = {
  obtenerTexto: async (): Promise<{ contenido: string }> => {
    const response = await fetch(`${API_URL}/chat/nuevos-conocimientos`, { 
      headers: getAuthHeaders() 
    });
    return handleResponse(response, 'Error al obtener nuevos conocimientos');
  },

  guardarTexto: async (contenido: string): Promise<void> => {
    const response = await fetch(`${API_URL}/chat/nuevos-conocimientos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ contenido }),
    });
    return handleResponse(response, 'Error al guardar nuevos conocimientos');
  },
};