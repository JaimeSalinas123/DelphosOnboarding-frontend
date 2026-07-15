const API_URL = 'http://localhost:4000/api';

// Función auxiliar para procesar respuestas de forma segura
const handleResponse = async (response: Response) => {
  // 1. Obtenemos la respuesta primero como texto plano, sin asumir que es JSON
  const textBody = await response.text();
  
  let data;
  let isJson = false;

  // 2. Intentamos verificar si el texto recibido es un JSON válido
  try {
    if (textBody) {
      data = JSON.parse(textBody);
      isJson = true;
    }
  } catch (e) {
    // Si falla el parseo, no es JSON (probablemente HTML o texto plano)
    isJson = false;
  }

  // 3. Si la respuesta fue exitosa (status 200-299)
  if (response.ok) {
    return data; // Devolvemos los datos (o undefined si el cuerpo estaba vacío)
  }

  // 4. MENEJO PROFESIONAL DE ERRORES si la respuesta NO fue exitosa

  // Escenario A: El backend respondió un error en formato JSON (lo ideal)
  if (isJson && data) {
    // Usamos el mensaje específico que envió el backend (ej: "El correo ya existe")
    throw new Error(data.error || data.mensaje || `Error del servidor (${response.status})`);
  }

  // Escenario B: El backend respondió un error que NO es JSON (ej: el HTML que te sale)
  // Aquí capturamos el error técnico y devolvemos el mensaje profesional que pediste.
  
  // Analizamos el status code para ser más específicos pero sobrios
  if (response.status === 404) {
    throw new Error('Error de conexión: No se pudo encontrar el punto de acceso al servicio de autenticación.');
  }
  
  if (response.status >= 500) {
    throw new Error('Error en el servidor: Ocurrió un problema interno al procesar su solicitud. Por favor, inténtelo más tarde.');
  }

  // Error genérico por defecto
  throw new Error(`Error inesperado de red (${response.status}): La respuesta del servidor no tiene el formato correcto.`);
};


export const authService = {
  // Función para iniciar sesión
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // Usamos la función auxiliar para manejar la respuesta
    return handleResponse(response);
  },

  // Función para registrar un nuevo integrante
  registro: async (nombre: string, email: string, departamento: string, password: string) => {
    // No necesitamos envolver en try/catch aquí,handleResponse lanzará el error
    // y page.tsx lo capturará en su propio try/catch.
    const response = await fetch(`${API_URL}/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre, email, departamento, password }),
    });

    // Usamos la función auxiliar para manejar la respuesta
    return handleResponse(response);
  }
};