// Contenido real del Círculo Virtuoso de Delphos (DEINSA Global).
// Editable sin tocar la UI. Fuente: "Manual de Delphos", "Círculo virtuoso de
// Delphos" y las fichas oficiales de cada módulo (DEINSA Global). No agregar
// cifras, clientes o funcionalidades que no vengan de esas fuentes.
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
    tagline: 'El motor central de la planificación institucional.',
    descripcion:
      'Delphos Core es la plataforma base del ecosistema: gestiona la planificación estratégica de largo plazo (3 a 6 años), los planes operativos anuales y la cartera de proyectos de la organización. Alinea objetivos, acciones, indicadores y presupuestos con trazabilidad total y flujos automatizados, permitiendo administrar PEI, POI, PAO, PETIC o cualquier otro plan institucional.',
    capacidades: [
      'Planificación estratégica con metodologías como Balanced Scorecard (BSC), GpRD, PND y PEM',
      'Planes operativos anuales por unidad, vinculados a objetivos y presupuestos',
      'Portafolios de proyectos con seguimiento de ejecución, alertas y prioridades',
      'Indicadores estratégicos y operativos con semáforos de cumplimiento en tiempo real',
    ],
    diferencial:
      'Es el núcleo que da coherencia a todo el ecosistema: sin Core, los demás módulos no tienen de dónde alimentarse ni con qué trazar el avance real frente a lo planeado.',
    color: '#F2A517',
    logo: 'core.svg',
    angulo: 0 * paso,
  },
  {
    id: 'bi',
    nombre: 'Delphos BI',
    tagline: 'Inteligencia institucional para decisiones basadas en datos.',
    descripcion:
      'Delphos BI permite crear tableros gerenciales, cubos multidimensionales y reportes dinámicos a partir de datos de una base transaccional, de la propia base de Delphos o de fuentes externas como SQL Server o Excel. A diferencia de herramientas como Power BI o Tableau, en Delphos BI no solo se visualizan los datos: también se gestionan directamente desde la plataforma.',
    capacidades: [
      'Cubos multidimensionales: pivotea datos de múltiples fuentes y crea filtros y pronósticos',
      'Tableros gerenciales y reportes dinámicos en tiempo real',
      'Conexión a bases de datos transaccionales, SQL Server, Excel o datos internos de Delphos',
      'Análisis predictivo y evaluación de desempeño para apoyar la toma de decisiones',
    ],
    diferencial:
      'Convierte el dato operativo en lectura gerencial sin depender de herramientas externas: además de visualizar la información, permite gestionarla y pivotearla desde la misma plataforma.',
    color: '#E0413F',
    logo: 'bi.svg',
    angulo: 1 * paso,
  },
  {
    id: 'continuum',
    nombre: 'Delphos Continuum',
    tagline: 'Riesgos, continuidad y cumplimiento normativo en una sola plataforma.',
    descripcion:
      'Delphos Continuum permite implementar y mantener un sistema de gestión de riesgos, continuidad operativa y seguridad de la información, alineado a marcos como COBIT 2019, ITIL, ISO 22301, ISO 27001, ISO 31000 e ISO 9001. Incluye vulnerabilidades de TI precargadas (basadas en un estándar español) que se pueden modificar, agregar o eliminar, y permite aplicar probabilidad, severidad y nivel de riesgo a cada una, además de controles y tratamientos para mitigar su materialización.',
    capacidades: [
      'Matriz de riesgos estratégicos, operativos y normativos, con controles y tratamientos',
      'Análisis de impacto al negocio (BIA) y planes de continuidad (BCP) y recuperación (DRP)',
      'Autoevaluaciones normativas (ISO, SEVRI) y normas técnicas del MICITT precargadas para el sector público de Costa Rica',
      'Gestión de activos sensibles: infraestructura, activos informáticos, reputación y más',
      'Apoyo de inteligencia artificial para el análisis de riesgos y la generación de estrategias',
    ],
    diferencial:
      'Integra riesgo, continuidad y cumplimiento dentro del mismo modelo de gestión, con trazabilidad total entre riesgos, controles, procesos y activos críticos — no como sistemas aislados.',
    color: '#2FA65A',
    logo: 'continuum.svg',
    angulo: 2 * paso,
  },
  {
    id: 'elite',
    nombre: 'Delphos Elite',
    tagline: 'Alto rendimiento con evaluación estratégica del desempeño.',
    descripcion:
      'Delphos Elite gestiona el desempeño institucional, de equipos y de personas, alineando los objetivos estratégicos con los resultados reales. Cada colaborador cuenta con un panel personal donde se asocian sus tareas, indicadores, objetivos, competencias (lo que necesita saber para su puesto) y capacitaciones. Cumple con los lineamientos de la Ley 9635 de Fortalecimiento de las Finanzas Públicas de Costa Rica.',
    capacidades: [
      'Panel personal por colaborador: tareas, indicadores, objetivos, competencias y capacitaciones',
      'Evaluación por competencias y metas, con ciclos de evaluación configurables',
      'Retroalimentación continua y seguimiento de resultados',
      'Cumplimiento de la Ley 9635 (Costa Rica), de forma objetiva y trazable',
    ],
    diferencial:
      'Conecta el desempeño de la persona con los objetivos institucionales definidos en Core, mejorando la rendición de cuentas y fortaleciendo la toma de decisiones en recursos humanos.',
    color: '#12B886',
    logo: 'elite.svg',
    angulo: 3 * paso,
  },
  {
    id: 'mobile',
    nombre: 'Delphos Mobile',
    tagline: 'La gestión institucional en la palma de la mano.',
    descripcion:
      'Delphos Mobile permite a funcionarios y líderes acceder, visualizar y actualizar información clave desde cualquier lugar y en tiempo real. Compatible con Android y iOS, facilita el seguimiento de indicadores, tareas, alertas, riesgos, proyectos y acuerdos, manteniendo la trazabilidad y el control desde el dispositivo móvil — ideal para entornos de campo, sesiones remotas o supervisión ejecutiva.',
    capacidades: [
      'Compatible con Android y iOS',
      'Seguimiento de indicadores, tareas y alertas en tiempo real',
      'Acceso a riesgos, proyectos y acuerdos desde cualquier lugar',
      'Pensado para trabajo de campo, sesiones remotas y supervisión ejecutiva',
    ],
    diferencial:
      'Extiende las capacidades de todo el ecosistema Delphos a cada colaborador sin depender del escritorio, fortaleciendo la eficiencia y la oportunidad en la toma de decisiones.',
    color: '#12A5C9',
    logo: 'core.svg',
    angulo: 4 * paso,
  },
  {
    id: 'portal',
    nombre: 'Delphos Portal',
    tagline: 'Experiencias digitales personalizadas para cada institución.',
    descripcion:
      'Delphos Portal permite crear portales institucionales a la medida, adaptados al diseño, estructura y necesidades de cada organización. Se integra con todos los módulos de Delphos para ofrecer acceso centralizado a tareas, indicadores, alertas, documentos y reportes clave, mostrando a cada usuario solo la información y las herramientas que necesita según su perfil y nivel jerárquico.',
    capacidades: [
      'Portales institucionales a la medida del diseño y estructura de cada organización',
      'Acceso centralizado a tareas, indicadores, alertas, documentos y reportes',
      'Contenido personalizado según el perfil y nivel jerárquico del usuario',
      'Integración con todos los módulos de Delphos',
    ],
    diferencial:
      'Acerca la rendición de cuentas al ciudadano o stakeholder sin exponer el sistema completo, reforzando la identidad institucional y aumentando la adopción del sistema.',
    color: '#3B6FE0',
    logo: 'portal.svg',
    angulo: 5 * paso,
  },
  {
    id: 'funciona',
    nombre: 'Delphos Funcion@',
    tagline: 'Simule, proyecte y pronostique con precisión y flexibilidad.',
    descripcion:
      'Delphos Funcion@ es el módulo analítico de simulación y pronóstico de Delphos. Permite crear modelos personalizados, evaluar escenarios, aplicar métodos estadísticos y realizar simulaciones dinámicas para apoyar decisiones estratégicas, operativas o presupuestarias. Su entorno de cálculo es similar al de una hoja electrónica, pero sin sus limitaciones.',
    capacidades: [
      'Más de 13 métodos de pronóstico automático, elegidos por precisión',
      'Modelos personalizados y evaluación de escenarios',
      'Aplicable a planificación, riesgos, finanzas, desempeño, continuidad y cumplimiento',
      'Visualización de proyecciones para anticiparse a tendencias',
    ],
    diferencial:
      'Ideal para instituciones públicas y entidades reguladas que necesitan evaluar el impacto de variables y optimizar recursos con una potencia analítica que una hoja de cálculo tradicional no ofrece.',
    color: '#F2683C',
    logo: 'funciona.svg',
    angulo: 6 * paso,
  },
  {
    id: 'ia',
    nombre: 'Delphos IA',
    tagline: 'Inteligencia artificial aplicada a la gestión institucional.',
    descripcion:
      'Delphos IA aplica inteligencia artificial sobre la información ya estructurada por el resto del ecosistema — desde el análisis de riesgos en Continuum hasta las proyecciones de Funcion@ — para apoyar el análisis, la interpretación de resultados y la generación de estrategias.',
    capacidades: [
      'Asistencia analítica sobre indicadores, riesgos y resultados de gestión',
      'Apoyo a la interpretación de resultados y a la generación de estrategias',
      'Automatización de tareas repetitivas de análisis',
    ],
    diferencial:
      'No es un módulo aislado: es una capa de inteligencia que se apoya en todo el dato ya estructurado por los demás módulos de Delphos.',
    color: '#7C5CE0',
    logo: 'ia.svg',
    angulo: 7 * paso,
  },
];

export const getModuloById = (id: string | null): Modulo | undefined =>
  id ? modulos.find((m) => m.id === id) : undefined;

export const getModuloIndex = (id: string | null): number =>
  id ? modulos.findIndex((m) => m.id === id) : -1;
