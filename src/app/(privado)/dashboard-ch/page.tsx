'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { etiquetaRol } from '@/lib/roles';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';
import { usuarioService, type UsuarioListado } from '@/services/usuarioService';
import {
  encuestaService,
  type PreguntaSatisfaccion,
  type ResultadoEncuesta,
} from '@/services/encuestaService';
import { estudioService, type ResultadoEstudio } from '@/services/estudioService';

import SessionExpired from '@/components/global/SessionExpired';

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const FECHA_HOY = new Intl.DateTimeFormat('es-CR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

const formatoFechaCorta = new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' });

const COLORES = ['#d85a30', '#1f2937', '#f97316', '#9ca3af', '#fb923c'];

function IconoUsuarios() {
  return (
    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconoEstrella() {
  return (
    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 21.53a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function IconoLista() {
  return (
    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 sm:mb-6">
      <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
      {children}
    </div>
  );
}

interface TarjetaKpiProps {
  etiqueta: string;
  valor: string;
  detalle?: string;
  icono?: React.ReactNode;
}

function TarjetaKpi({ etiqueta, valor, detalle, icono }: TarjetaKpiProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="absolute -right-6 -top-6 h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-gradient-to-br from-brand-orange/20 to-transparent blur-2xl pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-500">{etiqueta}</p>
          <p className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">{valor}</p>
          {detalle && <p className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-bold text-gray-600">{detalle}</p>}
        </div>
        {icono && (
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 text-brand-orange shadow-inner">
            {icono}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardCH() {
  const { user } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [resultadosEncuestas, setResultadosEncuestas] = useState<ResultadoEncuesta[]>([]);
  const [resultadosEstudio, setResultadosEstudio] = useState<ResultadoEstudio[]>([]);
  const [preguntas, setPreguntas] = useState<PreguntaSatisfaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(0);
  
  const [seccionActiva, setSeccionActiva] = useState<string | null>(null);
  const [metodoActivo, setMetodoActivo] = useState<string | null>(null);

  // Polling silencioso
  useEffect(() => {
    let cancelado = false;
    
    const cargarDatos = async (fondo = false) => {
      if (!fondo) setCargando(true);
      try {
        const [datosUsuarios, datosResultadosEncuesta, datosPreguntas, datosEstudio] = await Promise.all([
          usuarioService.listarTodos(),
          encuestaService.obtenerTodosLosResultados(),
          encuestaService.listar(),
          estudioService.obtenerResultados()
        ]);
        if (!cancelado) {
          setUsuarios(datosUsuarios);
          setResultadosEncuestas(datosResultadosEncuesta);
          setPreguntas(datosPreguntas);
          setResultadosEstudio(datosEstudio);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelado && !fondo) setError(err.message);
      } finally {
        if (!cancelado && !fondo) setCargando(false);
      }
    };

    cargarDatos(false);
    const intId = setInterval(() => cargarDatos(true), 10000); 
    return () => { cancelado = true; clearInterval(intId); };
  }, [intentos]);

  // ==========================================
  // CÁLCULOS ESTUDIOS 
  // ==========================================
  const desempeñoPorMetodo = useMemo(() => {
    const methodMap: Record<string, string> = {
      'cuestionario': 'Cuestionarios',
      'verdadero_falso': 'Verdadero / Falso',
      'flashcard': 'Flashcards'
    };

    const stats: Record<string, any> = {
      'Cuestionarios': { totalScore: 0, totalMax: 0, count: 0, preguntas: {} },
      'Verdadero / Falso': { totalScore: 0, totalMax: 0, count: 0, preguntas: {} },
      'Flashcards': { totalVistas: 0, sesiones: 0 },
    };

    resultadosEstudio.forEach(r => {
      const seccion = methodMap[r.metodo];
      if (!seccion) return;

      if (r.metodo === 'flashcard') {
        stats['Flashcards'].totalVistas += (r.total_preguntas || 0);
        stats['Flashcards'].sesiones += 1;
      } else {
        if (r.puntuacion != null && r.total_preguntas) {
          stats[seccion].totalScore += r.puntuacion;
          stats[seccion].totalMax += r.total_preguntas;
          stats[seccion].count++;
        }

        if (r.respuestas_detalle && Array.isArray(r.respuestas_detalle)) {
          r.respuestas_detalle.forEach((detalle: any) => {
            const p = detalle.pregunta || 'Pregunta sin registrar';
            if (!stats[seccion].preguntas[p]) {
              stats[seccion].preguntas[p] = { correctas: 0, incorrectas: 0, total: 0 };
            }
            stats[seccion].preguntas[p].total++;
            if (detalle.es_correcta) {
              stats[seccion].preguntas[p].correctas++;
            } else {
              stats[seccion].preguntas[p].incorrectas++;
            }
          });
        }
      }
    });

    const resultadoFinal = [];

    ['Cuestionarios', 'Verdadero / Falso'].forEach(sec => {
      const data = stats[sec];
      if (data.count > 0 || Object.keys(data.preguntas).length > 0) {
        
        const items = Object.entries(data.preguntas).map(([pregunta, d]: [string, any]) => {
          const pctAcierto = d.total > 0 ? Math.round((d.correctas / d.total) * 100) : 0;
          const pctFallo = d.total > 0 ? Math.round((d.incorrectas / d.total) * 100) : 0;
          
          return {
            etiqueta: pregunta,
            pct: pctAcierto,
            pctFallo: pctFallo,
            textoDerecha: '', 
            textoAciertos: `${d.correctas} aciertos`,
            textoFallos: `${d.incorrectas} fallos`,
            isFlashcard: false
          };
        }).sort((a, b) => a.pct - b.pct);

        const promedioSeccion = data.totalMax > 0 ? Math.round((data.totalScore / data.totalMax) * 100) : 0;

        resultadoFinal.push({
          seccion: sec,
          promedioSeccion,
          items
        });
      }
    });

    if (stats['Flashcards'].sesiones > 0) {
      resultadoFinal.push({
        seccion: 'Flashcards',
        promedioSeccion: stats['Flashcards'].totalVistas,
        items: [
          {
            etiqueta: 'Tarjetas (Flashcards) repasadas en total',
            pct: 100,
            pctFallo: 0,
            textoDerecha: `${stats['Flashcards'].totalVistas} tarjetas`,
            textoAciertos: '', 
            textoFallos: '',   
            isFlashcard: true
          },
          {
            etiqueta: 'Sesiones de práctica libre completadas',
            pct: 100,
            pctFallo: 0,
            textoDerecha: `${stats['Flashcards'].sesiones} sesiones`,
            textoAciertos: '', 
            textoFallos: '',   
            isFlashcard: true
          }
        ]
      });
    }

    return resultadoFinal;
  }, [resultadosEstudio]);

  useEffect(() => {
    if (desempeñoPorMetodo.length > 0 && !metodoActivo) {
      setMetodoActivo(desempeñoPorMetodo[0].seccion);
    }
  }, [desempeñoPorMetodo, metodoActivo]);

  const metodoActual = desempeñoPorMetodo.find(m => m.seccion === metodoActivo);

  // ==========================================
  // CÁLCULOS ENCUESTAS Y USUARIOS
  // ==========================================
  const porDepartamento = useMemo(() => {
    const conteo = new Map<string, number>();
    usuarios.forEach((u) => {
      const dep = u.departamento || 'Sin departamento';
      conteo.set(dep, (conteo.get(dep) ?? 0) + 1);
    });
    return Array.from(conteo, ([nombre, valor]) => ({ nombre, valor }));
  }, [usuarios]);

  const porRol = useMemo(() => {
    const conteo = new Map<string, number>();
    usuarios.forEach((u) => {
      conteo.set(u.rol, (conteo.get(u.rol) ?? 0) + 1);
    });
    return Array.from(conteo, ([rol, valor]) => ({ nombre: etiquetaRol(rol), valor }));
  }, [usuarios]);

  const completadasPorDia = useMemo(() => {
    const conteo = new Map<string, number>();
    resultadosEncuestas.forEach((r) => {
      const clave = r.fecha_completado.slice(0, 10);
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    });
    return Array.from(conteo, ([fecha, valor]) => ({ fecha, valor }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((d) => ({ ...d, etiqueta: formatoFechaCorta.format(new Date(d.fecha)) }));
  }, [resultadosEncuestas]);

  const promedioPorPregunta = useMemo(() => {
    return preguntas
      .filter((p) => p.tipo_respuesta === 'escala' && p.escala_max)
      .map((p) => {
        const valores = resultadosEncuestas
          .flatMap((r) => r.respuestas)
          .filter((r) => r.pregunta.id === p.id && r.respuesta_numerica != null)
          .map((r) => r.respuesta_numerica as number);
        const promedio = valores.length
          ? valores.reduce((a, b) => a + b, 0) / valores.length
          : null;
        return {
          id: p.id,
          pregunta: p.pregunta,
          seccion: p.seccion,
          max: p.escala_max as number,
          promedio,
          respuestas: valores.length,
        };
      })
      .filter((p): p is typeof p & { promedio: number } => p.promedio !== null)
      .sort((a, b) => a.seccion.localeCompare(b.seccion, 'es'));
  }, [preguntas, resultadosEncuestas]);

  const promedioPorSeccion = useMemo(() => {
    const grupos = new Map<string, typeof promedioPorPregunta>();
    promedioPorPregunta.forEach((p) => {
      if (!grupos.has(p.seccion)) grupos.set(p.seccion, []);
      grupos.get(p.seccion)!.push(p);
    });
    return Array.from(grupos, ([seccion, preguntas]) => {
      const promedioSeccion = Math.round(
        (preguntas.reduce((acc, p) => acc + p.promedio / p.max, 0) / preguntas.length) * 100
      );
      return { seccion, preguntas, promedioSeccion };
    });
  }, [promedioPorPregunta]);

  useEffect(() => {
    if (promedioPorSeccion.length > 0 && !seccionActiva) {
      setSeccionActiva(promedioPorSeccion[0].seccion);
    }
  }, [promedioPorSeccion, seccionActiva]);

  const indiceSatisfaccion =
    promedioPorPregunta.length > 0
      ? Math.round(
          (promedioPorPregunta.reduce((acc, p) => acc + p.promedio / p.max, 0) /
            promedioPorPregunta.length) *
            100
        )
      : null;

  const tasaFinalizacion =
    usuarios.length > 0 ? Math.min(100, Math.round((resultadosEncuestas.length / usuarios.length) * 100)) : 0;

  // ==========================================
  // 🚀 LAZY LOADING PARA EL EXCEL (PERFORMANCE)
  // ==========================================
  const generarExcel = async () => {
    try {
      setDescargando(true);
      
      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');

      const workbook = new ExcelJS.Workbook();
      
      const sheet = workbook.addWorksheet('Métricas Delphos', {
        views: [{ showGridLines: false }] 
      });

      sheet.columns = [
        { header: '', key: 'col1', width: 45 },
        { header: '', key: 'col2', width: 60 },
        { header: '', key: 'col3', width: 20 },
        { header: '', key: 'col4', width: 20 }
      ];

      const colorNaranja = 'FFD85A30'; 
      const colorOscuro = 'FF1F2937';  
      const borderConfig: Partial<import('exceljs').Borders> = {
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };

      const crearTituloSeccion = (titulo: string) => {
        sheet.addRow([]); 
        const row = sheet.addRow([titulo]);
        sheet.mergeCells(`A${row.number}:D${row.number}`);
        row.height = 30;
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorOscuro } };
        row.getCell(1).font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        sheet.addRow([]); 
      };

      const crearCabeceraTabla = (headers: string[]) => {
        const row = sheet.addRow(headers);
        row.height = 25;
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          if(colNumber <= headers.length) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorNaranja } };
            cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: colNumber > 2 ? 'center' : 'left', wrapText: true };
          }
        });
      };

      let rowCounter = 0;
      const agregarFilaDato = (datos: any[], alignDerechaCenter = true) => {
        rowCounter++;
        const row = sheet.addRow(datos);
        const isPar = rowCounter % 2 === 0;
        
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber <= 4) {
            cell.font = { name: 'Calibri', size: 11, color: { argb: colNumber > 2 ? 'FF111827' : 'FF4B5563' }, bold: colNumber > 2 };
            cell.alignment = { 
              vertical: 'middle', 
              horizontal: (colNumber > 2 && alignDerechaCenter) ? 'center' : 'left', 
              wrapText: true 
            };
            cell.border = borderConfig;
            
            if (isPar) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
            }
          }
        });
      };

      const mainTitle = sheet.addRow(['REPORTE DE MÉTRICAS - CAPITAL HUMANO']);
      sheet.mergeCells('A1:D1');
      mainTitle.height = 40;
      mainTitle.getCell(1).font = { name: 'Calibri', size: 18, bold: true, color: { argb: colorNaranja } };
      mainTitle.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      
      const subTitle = sheet.addRow([`Generado el: ${new Date().toLocaleDateString()}`]);
      sheet.mergeCells('A2:D2');
      subTitle.getCell(1).font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF6B7280' } };
      subTitle.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      crearTituloSeccion('1. RESUMEN GLOBAL DE LA PLATAFORMA');
      crearCabeceraTabla(['Métrica', 'Valor Alcanzado']);
      
      rowCounter = 0; 
      agregarFilaDato(['Total de Usuarios Activos', usuarios.length]);
      agregarFilaDato(['Encuestas Completadas', resultadosEncuestas.length]);
      agregarFilaDato(['Satisfacción Global', `${indiceSatisfaccion ?? 0}%`]);
      agregarFilaDato(['Tasa de Finalización de Onboarding', `${tasaFinalizacion}%`]);

      crearTituloSeccion('2. DISTRIBUCIÓN DEL PERSONAL');
      crearCabeceraTabla(['Departamento', 'Cantidad de Usuarios', 'Rol', 'Cantidad']);
      
      rowCounter = 0;
      const maxRows = Math.max(porDepartamento.length, porRol.length);
      for (let i = 0; i < maxRows; i++) {
        const dep = porDepartamento[i] ? porDepartamento[i].nombre : '';
        const depVal = porDepartamento[i] ? porDepartamento[i].valor : '';
        const rol = porRol[i] ? porRol[i].nombre : '';
        const rolVal = porRol[i] ? porRol[i].valor : '';
        agregarFilaDato([dep, depVal, rol, rolVal], false); 
      }

      crearTituloSeccion('3. DESEMPEÑO EN MÓDULOS DE ESTUDIO (GRC)');
      crearCabeceraTabla(['Categoría Evaluada', 'Pregunta / Concepto', 'Aciertos / Vistas', 'Fallos / Sesiones']);
      
      rowCounter = 0;
      desempeñoPorMetodo.forEach(m => {
        m.items.forEach(item => {
          if (item.isFlashcard) {
            agregarFilaDato([m.seccion, item.etiqueta, item.textoDerecha, 'N/A']);
          } else {
            agregarFilaDato([m.seccion, item.etiqueta, item.textoAciertos, item.textoFallos]);
          }
        });
      });

      crearTituloSeccion('4. RESULTADOS DE SATISFACCIÓN (ENCUESTAS)');
      crearCabeceraTabla(['Área Evaluada', 'Pregunta Específica', 'Promedio Obtenido', 'Puntaje Máximo']);
      
      rowCounter = 0;
      promedioPorSeccion.forEach(s => {
        s.preguntas.forEach(p => {
          agregarFilaDato([s.seccion, p.pregunta, parseFloat(p.promedio.toFixed(2)), p.max]);
        });
      });

      crearTituloSeccion('5. TRÁFICO DE EVALUACIONES POR DÍA');
      crearCabeceraTabla(['Fecha de Evaluación', 'Encuestas Completadas']);
      rowCounter = 0;
      completadasPorDia.forEach(d => {
        agregarFilaDato([d.fecha, d.valor]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fechaArchivo = new Date().toISOString().split('T')[0];
      saveAs(blob, `Reporte_Metricas_Delphos_${fechaArchivo}.xlsx`);

    } catch (err) {
      console.error('Error generando Excel:', err);
      setError('No se pudo generar el archivo Excel.');
    } finally {
      setDescargando(false);
    }
  };

  const grupoActivo = promedioPorSeccion.find((g) => g.seccion === seccionActiva);
  const esErrorSesion = error?.toLowerCase().includes('token') || error?.toLowerCase().includes('expirad');

  if (!user) return null;

  return (
    <div className="w-full flex-1 px-4 py-6 sm:py-8 sm:px-6 lg:px-10 xl:px-14 bg-[#f8f9fa] min-h-screen">
      <header className="mb-6 sm:mb-10 text-center sm:text-left">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] text-brand-orange mb-1 sm:mb-2">
          {FECHA_HOY}
        </p>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
          Bienvenido, {user.nombre.split(' ')[0]}
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-500">
          Panel de Control de <span className="font-semibold text-gray-700">Capital Humano</span>
        </p>
      </header>

      {/* TARJETA OSCURA DE ADMINISTRADOR */}
      <section className="mb-8 sm:mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 sm:p-8 shadow-xl relative text-white">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-gray-700">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide text-left">Perfil del Administrador</h2>
          
          <button
            onClick={generarExcel}
            disabled={cargando || !!error || descargando}
            className="self-start sm:self-auto inline-flex items-center justify-center rounded-lg sm:rounded-xl bg-brand-orange px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:bg-[#d85a30] hover:scale-105 hover:shadow-lg focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
            title="Descargar reporte estructurado en Excel"
          >
            {descargando ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Generando...
              </div>
            ) : (
              <>
                <svg className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Descargar como Excel
              </>
            )}
          </button>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-700 text-left">
          <div className="pb-4 sm:pb-0 sm:pr-6">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-400">Usuario Activo</p>
            <p className="mt-1 sm:mt-2 text-base sm:text-lg font-semibold">{user.nombre}</p>
            <span className="inline-flex items-center mt-2 rounded-md bg-brand-orange/20 px-2 py-1 text-[11px] sm:text-xs font-medium text-brand-orange ring-1 ring-inset ring-brand-orange/30">
              {etiquetaRol(user.rol)}
            </span>
          </div>
          <div className="py-4 sm:py-0 sm:px-6">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-400">Correo Electrónico</p>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base font-medium break-all">{user.email}</p>
          </div>
          <div className="pt-4 sm:pt-0 sm:pl-6">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gray-400">Departamento</p>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base font-medium">{user.departamento ?? 'Sin asignar'}</p>
          </div>
        </div>
      </section>

      <section>
        <Eyebrow>Análisis de Rendimiento</Eyebrow>

        {cargando ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl sm:rounded-3xl bg-white py-16 sm:py-24 shadow-sm border border-gray-100">
            <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
            <p className="text-sm font-medium text-gray-500 animate-pulse">Sincronizando métricas...</p>
          </div>
        ) : error ? (
          esErrorSesion ? (
            <div className="py-8 sm:py-12 flex justify-center">
              <SessionExpired />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl bg-white py-16 sm:py-24 shadow-sm border border-red-100 text-center px-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-sm sm:text-base font-bold text-gray-900">Error de conexión</p>
              <p className="max-w-sm text-xs sm:text-sm text-gray-500">{error}</p>
              <button onClick={() => setIntentos((n) => n + 1)} className="mt-2 rounded-xl bg-gray-900 px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md">
                Reintentar
              </button>
            </div>
          )
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl sm:rounded-3xl bg-white py-16 sm:py-24 shadow-sm border border-gray-100 text-center px-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 mb-2 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <IconoUsuarios />
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-900">Sin datos registrados</p>
            <p className="text-xs sm:text-sm text-gray-500">Las métricas aparecerán cuando ingresen los primeros usuarios.</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            
            <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <TarjetaKpi etiqueta="Total Usuarios" valor={String(usuarios.length)} icono={<IconoUsuarios />} />
              <TarjetaKpi etiqueta="Completaron Encuesta" valor={String(resultadosEncuestas.length)} detalle={`${tasaFinalizacion}% de la plantilla`} icono={<IconoCheck />} />
              <TarjetaKpi etiqueta="Satisfacción Global" valor={indiceSatisfaccion !== null ? `${indiceSatisfaccion}%` : '—'} detalle="Basado en escala 1-5" icono={<IconoEstrella />} />
              <TarjetaKpi etiqueta="Preguntas Activas" valor={String(promedioPorPregunta.length)} icono={<IconoLista />} />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              <div className="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 mb-4 sm:mb-6">Usuarios por Departamento</h3>
                <div className="h-[240px] sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={porDepartamento} dataKey="valor" nameKey="nombre" innerRadius={60} outerRadius={90} paddingAngle={3}>
                        {porDepartamento.map((entry, index) => (
                          <Cell key={entry.nombre} fill={COLORES[index % COLORES.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(valor: any) => [`${valor} usuarios`, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '15px', fontWeight: '600', color: '#111827' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 mb-4 sm:mb-6">Distribución de Roles</h3>
                <div className="h-[240px] sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={porRol} dataKey="valor" nameKey="nombre" innerRadius={60} outerRadius={90} paddingAngle={3}>
                        {porRol.map((entry, index) => (
                          <Cell key={entry.nombre} fill={COLORES[index % COLORES.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(valor: any) => [`${valor} usuarios`, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '15px', fontWeight: '600', color: '#111827' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* =======================================================
                DESEMPEÑO EN APRENDIZAJE: ANÁLISIS DE ACIERTOS Y FALLOS
                ======================================================= */}
            <div className="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4 mb-5 sm:mb-8">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900">Desempeño en Aprendizaje</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">Tasa de acierto y error por pregunta para identificar áreas de refuerzo.</p>
                </div>
              </div>

              {desempeñoPorMetodo.length === 0 ? (
                <div className="py-8 sm:py-12 text-center bg-gray-50 rounded-xl sm:rounded-2xl border border-dashed border-gray-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Aún no hay datos de estudio suficientes para generar el reporte.</p>
                </div>
              ) : (
                <div className="w-full">
                  {/* AJUSTE RESPONSIVE: w-full y overflow-x-auto con contenedor interno w-max */}
                  <div className="w-full overflow-x-auto pb-4 sm:pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-max sm:w-full px-1">
                      {desempeñoPorMetodo.map((grupo) => {
                        const isActive = metodoActivo === grupo.seccion;
                        return (
                          <button
                            key={grupo.seccion}
                            onClick={() => setMetodoActivo(grupo.seccion)}
                            className={`shrink-0 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-[12px] sm:text-sm font-semibold transition-all duration-300 ease-out ${
                              isActive
                                ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20 sm:scale-105'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400 hover:text-gray-900'
                            }`}
                          >
                            {grupo.seccion}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {metodoActual && (
                    <div className="mt-2 sm:mt-6 rounded-xl bg-white p-4 sm:p-6 border border-gray-100 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-5 sm:mb-6">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900">
                          {metodoActual.seccion}
                        </h4>
                        <div className="flex items-center w-fit rounded-lg border border-gray-200 bg-white px-3 py-1.5">
                          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-gray-400 mr-2">
                            {metodoActual.seccion === 'Flashcards' ? 'Total Vistas' : 'Acierto Global'}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-[#d85a30]">
                            {metodoActual.promedioSeccion}{metodoActual.seccion === 'Flashcards' ? '' : '%'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-6 sm:space-y-6">
                        {metodoActual.items.length === 0 ? (
                           <p className="text-xs sm:text-sm text-gray-500 italic">No hay desglose de preguntas registrado para este método.</p>
                        ) : (
                          metodoActual.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1 sm:gap-4">
                                <p className="text-[13px] sm:text-sm font-medium text-gray-700 leading-snug">{item.etiqueta}</p>
                                
                                <span className="text-[12px] sm:text-sm font-bold shrink-0 self-start sm:self-auto mt-1 sm:mt-0">
                                  {item.isFlashcard ? null : (
                                    <>
                                      <span className="text-[#d85a30]">{item.pct}% <span className="hidden sm:inline">aciertan</span></span> 
                                      <span className="text-[#1f2937] ml-2">| {item.pctFallo}% <span className="hidden sm:inline">fallan</span></span>
                                    </>
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 sm:gap-4 mt-1">
                                <div className={`h-2 sm:h-2.5 flex-1 overflow-hidden rounded-full ${item.isFlashcard ? 'bg-gray-200' : 'bg-[#1f2937]'}`}>
                                  <div
                                    className={`h-full transition-all duration-500 ${item.isFlashcard ? 'bg-[#1f2937] rounded-full' : 'bg-[#d85a30]'}`}
                                    style={{ width: `${item.pct}%` }}
                                  />
                                </div>
                                <span className="shrink-0 text-right text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-gray-500">
                                  {item.isFlashcard ? item.textoDerecha : (
                                    <div className="flex justify-end items-center gap-1.5">
                                      <span className="text-[#d85a30]">{item.textoAciertos}</span>
                                      <span className="text-gray-300">|</span>
                                      <span className="text-[#1f2937]">{item.textoFallos}</span>
                                    </div>
                                  )}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SATISFACCIÓN DETALLADA (ENCUESTAS) */}
            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4 mb-5 sm:mb-8">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900">Satisfacción Detallada</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">Desglose de resultados por cada categoría evaluada.</p>
                </div>
              </div>

              {promedioPorSeccion.length === 0 ? (
                <div className="py-8 sm:py-12 text-center bg-gray-50 rounded-xl sm:rounded-2xl border border-dashed border-gray-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Aún no hay suficientes datos para generar el reporte.</p>
                </div>
              ) : (
                <div className="w-full">
                  {/* AJUSTE RESPONSIVE: w-full y overflow-x-auto con contenedor interno w-max */}
                  <div className="w-full overflow-x-auto pb-4 sm:pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-max sm:w-full px-1">
                      {promedioPorSeccion.map((grupo) => {
                        const isActive = seccionActiva === grupo.seccion;
                        return (
                          <button
                            key={grupo.seccion}
                            onClick={() => setSeccionActiva(grupo.seccion)}
                            className={`shrink-0 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-[12px] sm:text-sm font-semibold transition-all duration-300 ease-out ${
                              isActive
                                ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20 sm:scale-105'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400 hover:text-gray-900'
                            }`}
                          >
                            {grupo.seccion}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {grupoActivo && (
                    <div className="mt-2 sm:mt-6 rounded-xl bg-white p-4 sm:p-6 border border-gray-100 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 mb-5 sm:mb-6">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900">
                          {grupoActivo.seccion}
                        </h4>
                        <div className="flex items-center w-fit rounded-lg border border-gray-200 bg-white px-3 py-1.5">
                          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-gray-400 mr-2">Promedio</span>
                          <span className="text-xs sm:text-sm font-bold text-[#d85a30]">{grupoActivo.promedioSeccion}%</span>
                        </div>
                      </div>

                      <div className="space-y-6 sm:space-y-6">
                        {grupoActivo.preguntas.map((p) => {
                          const pct = Math.round((p.promedio / p.max) * 100);
                          return (
                            <div key={p.id} className="flex flex-col gap-1.5 sm:gap-2 pt-3 sm:pt-0 border-t border-gray-50 sm:border-0 first:border-0 first:pt-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1 sm:gap-3">
                                <p className="text-[13px] sm:text-sm font-medium text-gray-700 leading-snug pr-2">{p.pregunta}</p>
                                <span className="text-[13px] sm:text-sm font-bold text-gray-900 shrink-0 self-start sm:self-auto mt-1 sm:mt-0">{pct}%</span>
                              </div>
                              
                              <div className="flex items-center gap-3 sm:gap-4 mt-1">
                                <div className="h-2 sm:h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                                  <div
                                    className="h-full rounded-full bg-[#d85a30]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="shrink-0 text-right text-[10px] sm:text-[11px] font-bold text-gray-400">
                                  {p.promedio.toFixed(1)} / {p.max}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 mb-1 sm:mb-2">Tráfico de Evaluaciones</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Volumen de encuestas completadas por fecha.</p>
              
              {completadasPorDia.length === 0 ? (
                <div className="py-12 sm:py-16 text-center bg-gray-50 rounded-xl sm:rounded-2xl border border-dashed border-gray-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Esperando respuestas de los usuarios.</p>
                </div>
              ) : (
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completadasPorDia} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                          <stop offset="100%" stopColor="#d85a30" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      
                      <XAxis dataKey="etiqueta" stroke="#6b7280" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                      <YAxis allowDecimals={false} stroke="#6b7280" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
                      
                      <Tooltip 
                        formatter={(valor: any) => [`${valor} encuestas`, 'Completadas']} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold', color: '#111827', fontSize: '12px' }}
                        cursor={{ fill: '#f3f4f6' }}
                      />
                      <Bar 
                        dataKey="valor" 
                        fill="url(#barGradient)" 
                        radius={[6, 6, 0, 0]} 
                        maxBarSize={40} 
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>
        )}
      </section>
    </div>
  );
}