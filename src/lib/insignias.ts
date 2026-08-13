import type { ProgresoPasante } from '@/services/progresoService';

export type FormaInsignia = 'escudo' | 'hexagono' | 'sello';

export interface Insignia {
  clave: keyof Pick<ProgresoPasante, 'porcentaje_ecosistema' | 'porcentaje_estudio' | 'porcentaje_encuesta'>;
  nombre: string;
  descripcion: string;
  forma: FormaInsignia;
}

/** Fuente única de verdad: se usa tanto en /perfil como en el dropdown del navbar. */
export const INSIGNIAS: Insignia[] = [
  {
    clave: 'porcentaje_ecosistema',
    nombre: 'Explorador del Ecosistema',
    descripcion: 'Recorriste los 8 módulos del Ecosistema Delphos.',
    forma: 'escudo',
  },
  {
    clave: 'porcentaje_estudio',
    nombre: 'Estudiante Aplicado',
    descripcion: 'Completaste los 3 métodos de estudio: cuestionario, flashcards y verdadero/falso.',
    forma: 'hexagono',
  },
  {
    clave: 'porcentaje_encuesta',
    nombre: 'Voz Escuchada',
    descripcion: 'Respondiste la encuesta de satisfacción del programa.',
    forma: 'sello',
  },
];

/** Un path de silueta distinto por insignia (viewBox 0 0 100 100), inspirado en las
 * insignias de logros de GitHub: cada logro tiene su propia forma, no solo su ícono. */
export const FORMA_PATH: Record<FormaInsignia, string> = {
  escudo: 'M50 4 C66 4 82 10 90 17 C90 48 81 79 50 96 C19 79 10 48 10 17 C18 10 34 4 50 4 Z',
  hexagono: 'M50 3 L91 26.5 L91 73.5 L50 97 L9 73.5 L9 26.5 Z',
  sello: 'M30 4 L70 4 L96 30 L96 70 L70 96 L30 96 L4 70 L4 30 Z',
};
