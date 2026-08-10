export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Tiempo máximo de espera para evitar solicitudes colgadas indefinidamente.
export const REQUEST_TIMEOUT_MS = 15000;

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

export const handleResponse = async (response: Response) => {
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
    
    // Si el login es exitoso, guardamos el token y el perfil localmente.
    // El backend no incluye el email dentro de "usuario", así que lo agregamos
    // nosotros con el email usado para iniciar sesión (ya validado por el backend).
    if (data && data.token) {
      const usuarioConEmail = { ...data.usuario, email: data.usuario?.email || email };
      data.usuario = usuarioConEmail;
      localStorage.setItem('delphos_token', data.token);
      localStorage.setItem('delphos_user', JSON.stringify(usuarioConEmail));
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

  // Función para actualizar los datos locales del usuario
  updateCurrentUser: (newData: any) => {
    if (typeof window !== 'undefined') {
      const current = authService.getCurrentUser();
      if (current) {
        localStorage.setItem('delphos_user', JSON.stringify({ ...current, ...newData }));
      }
    }
  },

  // Función para obtener el token de seguridad para futuras peticiones
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('delphos_token');
    }
    return null;
  },

  // --- NUEVAS FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA ---
  recuperarPassword: async (email: string) => {
    const response = await postJson('/recuperar-password', { email });
    return handleResponse(response);
  },

  resetearPassword: async (access_token: string, refresh_token: string, new_password: string) => {
    const response = await postJson('/resetear-password', { access_token, refresh_token, new_password });
    return handleResponse(response);
  },

  // --- FUNCIÓN PARA EL ONBOARDING ---
  completarPrimerIngreso: async (email: string) => {
    const response = await postJson('/completar-onboarding', { email });
    const data = await handleResponse(response);

    // Actualizamos el storage local para que no vuelva a salir la animación si recarga la página
    authService.updateCurrentUser({ primer_ingreso: false });

    return data;
  },

  // --- CONTROL DE LA BIENVENIDA (100% local, no depende del backend) ---
  // Se guarda por email para que, en un dispositivo compartido, cada cuenta
  // vea su propia animación de bienvenida una única vez.
  haVistoBienvenida: (email: string) => {
    if (typeof window === 'undefined' || !email) return true;
    return localStorage.getItem(`delphos_bienvenida_${email}`) === 'true';
  },

  marcarBienvenidaVista: (email: string) => {
    if (typeof window !== 'undefined' && email) {
      localStorage.setItem(`delphos_bienvenida_${email}`, 'true');
    }
  }
};