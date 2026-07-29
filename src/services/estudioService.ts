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

export const estudioService = {
  listar: async (): Promise<Pregunta[]> => {
    const response = await fetch(`${API_URL}/estudio/preguntas`);
    if (!response.ok) throw new Error('Error al cargar las preguntas');
    return response.json();
  },

  // NUEVO: Actualizar
  actualizar: async (id: string, datos: Partial<Pregunta>): Promise<Pregunta> => {
    const response = await fetch(`${API_URL}/estudio/preguntas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    if (!response.ok) throw new Error('Error al actualizar la pregunta');
    return response.json();
  },

  // NUEVO: Eliminar
  eliminar: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/estudio/preguntas/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar la pregunta');
  }
};