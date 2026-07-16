// Contenido real del Círculo Virtuoso de Delphos (DEINSA Global).
// Editable sin tocar la UI. No inventar cifras, clientes ni funcionalidades.
//
// Nota: `logo` apunta a un ícono vectorial propio en /public/logos mientras
// se incorporan los renders PNG originales de cada módulo (ver README del
// grupo de rutas onboarding).

export interface Modulo {
  id: string;
  nombre: string;
  tagline: string;
  descripcion: string;
  capacidades: string[];
  diferencial: string;
  /** Color de firma del módulo (juego cromático de la rueda). */
  color: string;
  /** Nombre del archivo del logo en /public/logos. */
  logo: string;
  /** Ángulo en radianes dentro del anillo (0 = frente, sentido antihorario). */
  angulo: number;
}

const TAU = Math.PI * 2;
const paso = TAU / 8;

// Orden en el anillo. El índice define la posición angular.
export const modulos: Modulo[] = [
  {
    id: 'core',
    nombre: 'Delphos Core',
    tagline: 'El motor del sistema.',
    descripcion:
      'Base sobre la que operan los demás módulos: modelos de gestión, planes estratégicos y operativos, objetivos, indicadores y metas.',
    capacidades: [
      'Balanced Scorecard',
      'PEI / POI / PAO',
      'Cascada de objetivos',
      'Semáforos de cumplimiento',
    ],
    diferencial:
      'Es el núcleo que da coherencia a todo el ecosistema; sin Core los demás módulos no tienen de dónde alimentarse.',
    color: '#F2A517',
    logo: 'core.svg',
    angulo: 0 * paso,
  },
  {
    id: 'bi',
    nombre: 'Delphos BI',
    tagline: 'Inteligencia de negocios.',
    descripcion:
      'Cubos de datos y reportes multidimensionales sobre la información de gestión.',
    capacidades: [
      'Cubos OLAP',
      'Reportes multidimensionales',
      'Tableros analíticos',
      'Exploración drill-down',
    ],
    diferencial:
      'Convierte el dato operativo en lectura gerencial sin depender de herramientas externas.',
    color: '#E0413F',
    logo: 'bi.svg',
    angulo: 1 * paso,
  },
  {
    id: 'continuum',
    nombre: 'Delphos Continuum',
    tagline: 'Gestión de riesgos operativos y de TI.',
    descripcion:
      'Alineado a marcos internacionales: COBIT, ITIL, ISO 22301, ISO 27001, ISO 9001.',
    capacidades: [
      'Matriz de riesgos',
      'Controles',
      'Continuidad del negocio',
      'Cumplimiento normativo',
    ],
    diferencial:
      'Integra riesgo y cumplimiento dentro del mismo modelo de gestión, no como sistema aparte.',
    color: '#2FA65A',
    logo: 'continuum.svg',
    angulo: 2 * paso,
  },
  {
    id: 'elite',
    nombre: 'Delphos Elite',
    tagline: 'Gestión del desempeño individual.',
    descripcion:
      'Evaluación del desempeño alineada a la ley 9635 (Costa Rica).',
    capacidades: [
      'Evaluación por competencias y metas',
      'Ciclos de evaluación',
      'Retroalimentación',
    ],
    diferencial:
      'Conecta el desempeño de la persona con los objetivos institucionales del Core.',
    color: '#12B886',
    logo: 'elite.svg',
    angulo: 3 * paso,
  },
  {
    id: 'mobile',
    nombre: 'Delphos Mobile',
    tagline: 'Delphos en movimiento.',
    descripcion: 'Versión móvil de Elite.',
    capacidades: [
      'Acceso móvil al desempeño',
      'Evaluaciones desde el teléfono',
      'Seguimiento en movimiento',
    ],
    diferencial:
      'Elimina la dependencia del escritorio para los ciclos de evaluación.',
    color: '#12A5C9',
    logo: 'mobile.svg',
    angulo: 4 * paso,
  },
  {
    id: 'portal',
    nombre: 'Delphos Portal',
    tagline: 'La cara pública de la gestión.',
    descripcion:
      'Publicación y consulta de información de gestión hacia dentro y fuera de la organización.',
    capacidades: [
      'Publicación de resultados',
      'Transparencia',
      'Acceso segmentado por audiencia',
    ],
    diferencial:
      'Acerca la rendición de cuentas al ciudadano/stakeholder sin exponer el sistema completo.',
    color: '#3B6FE0',
    logo: 'portal.svg',
    angulo: 5 * paso,
  },
  {
    id: 'funciona',
    nombre: 'Delphos Funciona',
    tagline: 'Operación del día a día.',
    descripcion: 'Gestión operativa y seguimiento de la ejecución.',
    capacidades: [
      'Tareas',
      'Planes de acción',
      'Seguimiento de ejecución operativa',
    ],
    diferencial:
      'Cierra la brecha entre lo que se planea en el Core y lo que realmente se ejecuta.',
    color: '#F2683C',
    logo: 'funciona.svg',
    angulo: 6 * paso,
  },
  {
    id: 'ia',
    nombre: 'Delphos IA',
    tagline: 'Inteligencia artificial aplicada a la gestión.',
    descripcion:
      'Capacidades asistidas por IA sobre la información del ecosistema.',
    capacidades: [
      'Asistencia analítica',
      'Apoyo a la interpretación de resultados',
      'Automatización',
    ],
    diferencial:
      'Capa de inteligencia que se apoya en todo el dato ya estructurado por los demás módulos.',
    color: '#7C5CE0',
    logo: 'ia.svg',
    angulo: 7 * paso,
  },
];

export const getModuloById = (id: string | null): Modulo | undefined =>
  id ? modulos.find((m) => m.id === id) : undefined;

export const getModuloIndex = (id: string | null): number =>
  id ? modulos.findIndex((m) => m.id === id) : -1;
