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

// NUEVO: Lo que le enviaremos al backend cuando acabe de estudiar
export interface ResultadoEnvio {
  usuario_id: string;
  metodo: 'cuestionario' | 'flashcard' | 'verdadero_falso';
  puntuacion?: number | null;
  total_preguntas?: number | null;
}

// NUEVO: Lo que recibiremos del backend para pintar la tabla del Admin
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
}

export const estudioService = {
  listar: async (): Promise<Pregunta[]> => {
    const response = await fetch(`${API_URL}/estudio/preguntas`);
    if (!response.ok) throw new Error('Error al cargar las preguntas');
    return response.json();
  },

  actualizar: async (id: string, datos: Partial<Pregunta>): Promise<Pregunta> => {
    const response = await fetch(`${API_URL}/estudio/preguntas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al actualizar la pregunta');
    return response.json();
  },

  eliminar: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/estudio/preguntas/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar la pregunta');
  },

  // NUEVAS FUNCIONES PARA LOS RESULTADOS
guardarResultado: async (datos: ResultadoEnvio): Promise<void> => {
    const response = await fetch(`${API_URL}/estudio/resultados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Detalle del error del backend:", errorData);
      throw new Error('Error al guardar el resultado');
    }
  },

  obtenerResultados: async (): Promise<ResultadoEstudio[]> => {
    const response = await fetch(`${API_URL}/estudio/resultados`);
    if (!response.ok) throw new Error('Error al cargar los resultados');
    return response.json();
  }
};