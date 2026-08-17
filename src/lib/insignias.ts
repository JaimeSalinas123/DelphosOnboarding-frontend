import type { ProgresoPasante } from '@/services/progresoService';

export interface Insignia {
  id: string;
  nombre: string;
  descripcion: string;
  /** Qué porcentaje del progreso hay que mirar para saber si está ganada.
   * `null` = no depende del progreso (ej. la de bienvenida, se gana con solo
   * iniciar sesión). */
  clave: keyof Pick<ProgresoPasante, 'porcentaje_ecosistema' | 'porcentaje_estudio' | 'porcentaje_encuesta'> | null;
}

/** Fuente única de verdad: se usa tanto en /perfil como en el dropdown del navbar. */
export const INSIGNIAS: Insignia[] = [
  {
    id: 'bienvenida',
    nombre: 'Bienvenida a Delphos',
    descripcion: 'Iniciaste sesión por primera vez en la plataforma de onboarding.',
    clave: null,
  },
  {
    id: 'ecosistema',
    nombre: 'Explorador del Ecosistema',
    descripcion: 'Recorriste los 8 módulos del Ecosistema Delphos.',
    clave: 'porcentaje_ecosistema',
  },
  {
    id: 'estudio',
    nombre: 'Estudiante Aplicado',
    descripcion: 'Completaste los 3 métodos de estudio: cuestionario, flashcards y verdadero/falso.',
    clave: 'porcentaje_estudio',
  },
  {
    id: 'onboarding-completo',
    nombre: 'Onboarding Completo',
    descripcion: 'Respondiste la encuesta de satisfacción y completaste todo tu recorrido de onboarding.',
    clave: 'porcentaje_encuesta',
  },
];

/** Silueta del hexágono, viewBox 0 0 100 100. Todas las insignias comparten esta forma. */
export const HEXAGONO_PATH = 'M50 3 L91 26.5 L91 73.5 L50 97 L9 73.5 L9 26.5 Z';

export function insigniaDesbloqueada(insignia: Insignia, progreso: ProgresoPasante): boolean {
  if (insignia.clave === null) return true;
  return progreso[insignia.clave] >= 100;
}
