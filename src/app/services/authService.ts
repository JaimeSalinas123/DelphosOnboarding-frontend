const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Tiempo máximo de espera para evitar solicitudes colgadas indefinidamente.
const REQUEST_TIMEOUT_MS = 15000;

const postJson = async (path: string, body: unknown) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'omit',
      body: JSON.stringify(body),
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
};

const handleResponse = async (response: Response) => {
  const textBody = await response.text();
  
  let data;
  let isJson = false;

  try {
    if (textBody) {
      data = JSON.parse(textBody);
      isJson = true;
    }
  } catch (e) {
    isJson = false;
  }

  if (response.ok) {
    return data; 
  }

  if (isJson && data) {
    throw new Error(data.error || data.mensaje || `Error del servidor (${response.status})`);
  }
  
  if (response.status === 404) {
    throw new Error('Error de conexión: No se pudo encontrar el punto de acceso al servicio de autenticación.');
  }
  
  if (response.status >= 500) {
    throw new Error('Error en el servidor: Ocurrió un problema interno al procesar su solicitud. Por favor, inténtelo más tarde.');
  }

  throw new Error(`Error inesperado de red (${response.status}): La respuesta del servidor no tiene el formato correcto.`);
};

export const authService = {
  // Función para iniciar sesión
  login: async (email: string, password: string) => {
    const response = await postJson('/login', { email, password });
    const data = await handleResponse(response);
    
    // Si el login es exitoso, guardamos el token y el perfil localmente
    if (data && data.token) {
      localStorage.setItem('delphos_token', data.token);
      localStorage.setItem('delphos_user', JSON.stringify(data.usuario));
    }
    
    return data;
  },

  // Función para registrar un nuevo integrante
  registro: async (nombre: string, email: string, departamento: string, password: string) => {
    const response = await postJson('/registro', { nombre, email, departamento, password });
    return handleResponse(response);
  },

  // Función para cerrar sesión destruyendo las credenciales
  logout: () => {
    localStorage.removeItem('delphos_token');
    localStorage.removeItem('delphos_user');
  },

  // Función para leer quién está conectado actualmente
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('delphos_user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  // Función para obtener el token de seguridad para futuras peticiones
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('delphos_token');
    }
    return null;
  }
};