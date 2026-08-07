'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  encuestaService,
  type DatosPregunta,
  type PreguntaSatisfaccion,
  type ResultadoEncuesta,
  type TipoRespuesta,
} from '@/services/encuestaService';
import type { Paginacion } from '@/lib/paginacion';
import ModalTarjeta from '@/components/global/ModalTarjeta';
import Paginador from '@/components/global/Paginador';
import SessionExpired from '@/components/global/SessionExpired';
import SelectorDepartamento from '@/components/global/SelectorDepartamento';

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const RESULTADOS_POR_PAGINA = 10;

const FORM_VACIO: DatosPregunta = {
  seccion: '',
  pregunta: '',
  tipo_respuesta: 'escala',
  escala_min: 1,
  escala_max: 5,
  orden: 1,
  obligatoria: true,
};

function aFormulario(p: PreguntaSatisfaccion): DatosPregunta {
  return {
    seccion: p.seccion,
    pregunta: p.pregunta,
    tipo_respuesta: p.tipo_respuesta,
    escala_min: p.escala_min,
    escala_max: p.escala_max,
    orden: p.orden,
    obligatoria: p.obligatoria,
  };
}

const formatoFecha = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function agruparPorSeccion(resultado: ResultadoEncuesta) {
  const ordenadas = resultado.respuestas
    .slice()
    .sort((a, b) => a.pregunta.orden - b.pregunta.orden);

  const secciones: { seccion: string; respuestas: typeof ordenadas }[] = [];
  for (const r of ordenadas) {
    let grupo = secciones.find((s) => s.seccion === r.pregunta.seccion);
    if (!grupo) {
      grupo = { seccion: r.pregunta.seccion, respuestas: [] };
      secciones.push(grupo);
    }
    grupo.respuestas.push(r);
  }
  return secciones;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">
      <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
      {children}
    </div>
  );
}

export default function EncuestasPage() {
  const [vista, setVista] = useState<'preguntas' | 'resultados'>('preguntas');

  const [preguntas, setPreguntas] = useState<PreguntaSatisfaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seccionActiva, setSeccionActiva] = useState('todas');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<DatosPregunta>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [preguntaAEliminar, setPreguntaAEliminar] = useState<PreguntaSatisfaccion | null>(null);
  const [eliminandoPregunta, setEliminandoPregunta] = useState(false);
  const [alertModal, setAlertModal] = useState<string | null>(null);

  const [resultados, setResultados] = useState<ResultadoEncuesta[]>([]);
  const [paginacionResultados, setPaginacionResultados] = useState<Paginacion | null>(null);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [errorResultados, setErrorResultados] = useState<string | null>(null);
  const [intentosResultados, setIntentosResultados] = useState(0);
  const [paginaResultados, setPaginaResultados] = useState(1);
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState<ResultadoEncuesta | null>(null);
  const [seccionDetalle, setSeccionDetalle] = useState('todas');

  const [descargandoGeneral, setDescargandoGeneral] = useState(false);
  const [descargandoUsuario, setDescargandoUsuario] = useState(false);

  const [departamentoResultados, setDepartamentoResultados] = useState('');
  const [fechaDesdeResultados, setFechaDesdeResultados] = useState('');
  const [fechaHastaResultados, setFechaHastaResultados] = useState('');
  const hayFiltrosResultados = !!departamentoResultados || !!fechaDesdeResultados || !!fechaHastaResultados;

  // Código de acceso de la encuesta (el que el pasante tiene que ingresar en /encuesta).
  const [modalCodigoAbierto, setModalCodigoAbierto] = useState(false);
  const [codigoActual, setCodigoActual] = useState<string | null>(null);
  const [codigoEditado, setCodigoEditado] = useState('');
  const [cargandoCodigo, setCargandoCodigo] = useState(false);
  const [guardandoCodigo, setGuardandoCodigo] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [codigoGuardadoOk, setCodigoGuardadoOk] = useState(false);

  // Carga de preguntas con Polling Silencioso
  useEffect(() => {
    let cancelado = false;
    const fetchPreguntas = async (fondo = false) => {
      if (!fondo) setCargando(true);
      try {
        const data = await encuestaService.listar();
        if (!cancelado) {
          setPreguntas(data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelado && !fondo) setError(err.message);
      } finally {
        if (!cancelado && !fondo) setCargando(false);
      }
    };

    fetchPreguntas(false);
    const intId = setInterval(() => fetchPreguntas(true), 10000); 
    return () => { cancelado = true; clearInterval(intId); };
  }, []);

  useEffect(() => {
    if (vista !== 'resultados') return;
    let cancelado = false;
    
    const fetchResultados = async (fondo = false) => {
      if (!fondo) setCargandoResultados(true);
      try {
        const data = await encuestaService.obtenerResultados({
          pagina: paginaResultados,
          limite: RESULTADOS_POR_PAGINA,
          departamento: departamentoResultados || undefined,
          fechaDesde: fechaDesdeResultados || undefined,
          fechaHasta: fechaHastaResultados || undefined,
        });
        if (!cancelado) {
          setResultados(data.resultados);
          setPaginacionResultados(data.paginacion);
          setErrorResultados(null);
        }
      } catch (err: any) {
        if (!cancelado && !fondo) setErrorResultados(err.message);
      } finally {
        if (!cancelado && !fondo) setCargandoResultados(false);
      }
    };

    fetchResultados(false);
    const intId = setInterval(() => fetchResultados(true), 10000); 
    return () => { cancelado = true; clearInterval(intId); };
  }, [
    vista,
    paginaResultados,
    intentosResultados,
    departamentoResultados,
    fechaDesdeResultados,
    fechaHastaResultados,
  ]);

  const cambiarDepartamentoResultados = (valor: string) => {
    setDepartamentoResultados(valor);
    setPaginaResultados(1);
  };

  const cambiarFechaDesdeResultados = (valor: string) => {
    setFechaDesdeResultados(valor);
    setPaginaResultados(1);
  };

  const cambiarFechaHastaResultados = (valor: string) => {
    setFechaHastaResultados(valor);
    setPaginaResultados(1);
  };

  const limpiarFiltrosResultados = () => {
    setDepartamentoResultados('');
    setFechaDesdeResultados('');
    setFechaHastaResultados('');
    setPaginaResultados(1);
  };

  const abrirDetalleResultado = (r: ResultadoEncuesta) => {
    setResultadoSeleccionado(r);
    setSeccionDetalle('todas');
  };

  const secciones = useMemo(
    () => Array.from(new Set(preguntas.map((p) => p.seccion))),
    [preguntas]
  );

  const preguntasFiltradas =
    seccionActiva === 'todas'
      ? preguntas
      : preguntas.filter((p) => p.seccion === seccionActiva);

  const abrirCrear = () => {
    setEditandoId(null);
    setFormulario({
      ...FORM_VACIO,
      seccion: seccionActiva !== 'todas' ? seccionActiva : '',
      orden: preguntas.length + 1,
    });
    setErrorModal(null);
    setModalAbierto(true);
  };

  const abrirEditar = (p: PreguntaSatisfaccion) => {
    setEditandoId(p.id);
    setFormulario(aFormulario(p));
    setErrorModal(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
  };

  const cambiarTipoRespuesta = (tipo: TipoRespuesta) => {
    setFormulario((prev) => ({
      ...prev,
      tipo_respuesta: tipo,
      escala_min: tipo === 'escala' ? (prev.escala_min ?? 1) : null,
      escala_max: tipo === 'escala' ? (prev.escala_max ?? 5) : null,
    }));
  };

  const handleGuardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true);
    setErrorModal(null);
    try {
      if (editandoId) {
        await encuestaService.actualizar(editandoId, formulario);
      } else {
        await encuestaService.crear(formulario);
      }
      setModalAbierto(false);
      const data = await encuestaService.listar();
      setPreguntas(data);
    } catch (err) {
      setErrorModal((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (p: PreguntaSatisfaccion) => {
    setPreguntaAEliminar(p);
  };

  const ejecutarEliminacion = async () => {
    if (!preguntaAEliminar) return;
    setEliminandoPregunta(true);
    try {
      await encuestaService.eliminar(preguntaAEliminar.id);
      setPreguntas((prev) => prev.filter((preg) => preg.id !== preguntaAEliminar.id));
      setPreguntaAEliminar(null);
    } catch (err) {
      setAlertModal(`No se pudo eliminar: ${(err as Error).message}`);
    } finally {
      setEliminandoPregunta(false);
    }
  };

  // ==========================================
  // FUNCIÓN: GENERAR EXCEL GENERAL DE ENCUESTAS
  // ==========================================
  const generarExcelGeneral = async () => {
    try {
      setDescargandoGeneral(true);
      
      const todosLosResultados = await encuestaService.obtenerTodosLosResultados();
      
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Encuestas Completadas', { views: [{ showGridLines: false }] });

      sheet.columns = [
        { header: '', key: 'nombre', width: 35 },
        { header: '', key: 'email', width: 40 },
        { header: '', key: 'departamento', width: 25 },
        { header: '', key: 'fecha', width: 25 },
        { header: '', key: 'total_preg', width: 20 }
      ];

      const titleRow = sheet.addRow([`REPORTE GENERAL DE ENCUESTAS DE SATISFACCIÓN`]);
      sheet.mergeCells('A1:E1');
      titleRow.height = 35;
      titleRow.getCell(1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFD85A30' } };
      titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      const subTitle = sheet.addRow([`Generado el: ${new Date().toLocaleDateString()}`]);
      sheet.mergeCells('A2:E2');
      subTitle.getCell(1).font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF6B7280' } };
      subTitle.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.addRow([]);

      const headerRow = sheet.addRow(['Colaborador', 'Correo Electrónico', 'Departamento', 'Fecha de Envío', 'Respuestas Registradas']);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD85A30' } };
        cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      let rowCounter = 0;
      todosLosResultados.forEach(r => {
        rowCounter++;
        const isPar = rowCounter % 2 === 0;
        const fechaStr = formatoFecha.format(new Date(r.fecha_completado));

        const row = sheet.addRow([r.usuario.nombre, r.usuario.email, r.usuario.departamento || 'Sin asignar', fechaStr, r.respuestas.length]);
        row.eachCell((cell, colNum) => {
          cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF374151' } };
          cell.alignment = { vertical: 'middle', horizontal: colNum >= 5 ? 'center' : 'left' };
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
          if (isPar) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Reporte_General_Encuestas_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (error) {
      console.error(error);
      setAlertModal('No se pudo generar el Excel general.');
    } finally {
      setDescargandoGeneral(false);
    }
  };

  // ==========================================
  // FUNCIÓN: GENERAR EXCEL ESPECÍFICO (USUARIO)
  // ==========================================
  const generarExcelUsuario = async (resultado: ResultadoEncuesta) => {
    try {
      setDescargandoUsuario(true);
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(`Encuesta_${resultado.usuario.nombre.split(' ')[0]}`, {
        views: [{ showGridLines: false }]
      });

      sheet.columns = [
        { header: '', key: 'seccion', width: 30 }, 
        { header: '', key: 'pregunta', width: 60 }, 
        { header: '', key: 'tipo', width: 25 }, 
        { header: '', key: 'respuesta', width: 35 }, 
      ];

      const titleRow = sheet.addRow([`ENCUESTA DE SATISFACCIÓN: ${resultado.usuario.nombre.toUpperCase()}`]);
      sheet.mergeCells('A1:D1');
      titleRow.height = 35;
      titleRow.getCell(1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFD85A30' } };
      titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      const subTitle = sheet.addRow([`${resultado.usuario.departamento || 'Sin departamento'} | Enviado: ${formatoFecha.format(new Date(resultado.fecha_completado))}`]);
      sheet.mergeCells('A2:D2');
      subTitle.getCell(1).font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF6B7280' } };
      subTitle.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      sheet.addRow([]);

      const grupos = agruparPorSeccion(resultado);

      grupos.forEach((grupo) => {
        const headerGrupo = sheet.addRow([`SECCIÓN: ${grupo.seccion.toUpperCase()}`]);
        sheet.mergeCells(`A${headerGrupo.number}:D${headerGrupo.number}`);
        headerGrupo.height = 25;
        headerGrupo.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
        headerGrupo.getCell(1).font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
        headerGrupo.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        const headerTabla = sheet.addRow(['Sección', 'Pregunta Evaluada', 'Tipo', 'Respuesta Brindada']);
        headerTabla.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD85A30' } };
          cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        grupo.respuestas.forEach((resp, i) => {
          // CORRECCIÓN APLICADA AQUÍ: bypass de TS usando as any
          const escalaMax = (resp.pregunta as any).escala_max ?? 5;
          const valor = resp.pregunta.tipo_respuesta === 'texto' 
            ? resp.respuesta_texto || 'Sin respuesta' 
            : `${resp.respuesta_numerica} / ${escalaMax}`;
            
          const filaData = sheet.addRow([
            resp.pregunta.seccion,
            resp.pregunta.pregunta, 
            resp.pregunta.tipo_respuesta === 'escala' ? 'Escala Numérica' : 'Texto Libre',
            valor
          ]);
          
          const isPar = i % 2 === 0;
          filaData.eachCell((cell, colNumber) => {
            cell.font = { name: 'Calibri', size: 11, color: { argb: colNumber === 4 && resp.pregunta.tipo_respuesta === 'escala' ? 'FF16A34A' : 'FF374151' }, bold: colNumber === 4 };
            cell.alignment = { vertical: 'middle', horizontal: colNumber === 4 && resp.pregunta.tipo_respuesta === 'escala' ? 'center' : 'left', wrapText: true };
            cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
            if (isPar) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
          });
        });
        sheet.addRow([]); 
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fechaArchivo = new Date().toISOString().split('T')[0];
      saveAs(blob, `Encuesta_${resultado.usuario.nombre.replace(/\s+/g, '_')}_${fechaArchivo}.xlsx`);

    } catch (error) {
      console.error(error);
      setAlertModal('No se pudo generar el reporte de la encuesta del usuario.');
    } finally {
      setDescargandoUsuario(false);
  const abrirModalCodigo = () => {
    setModalCodigoAbierto(true);
    setErrorCodigo(null);
    setCodigoGuardadoOk(false);
    setCargandoCodigo(true);
    encuestaService
      .obtenerCodigo()
      .then((data) => {
        setCodigoActual(data.codigo);
        setCodigoEditado(data.codigo);
      })
      .catch((err: Error) => setErrorCodigo(err.message))
      .finally(() => setCargandoCodigo(false));
  };

  const handleGuardarCodigo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardandoCodigo(true);
    setErrorCodigo(null);
    setCodigoGuardadoOk(false);
    try {
      const data = await encuestaService.actualizarCodigo(codigoEditado.trim());
      setCodigoActual(data.codigo);
      setCodigoGuardadoOk(true);
    } catch (err) {
      setErrorCodigo((err as Error).message);
    } finally {
      setGuardandoCodigo(false);
    }
  };

  const esErrorSesionPreguntas = error?.toLowerCase().includes('token') || error?.toLowerCase().includes('expirad');
  const esErrorSesionResultados = errorResultados?.toLowerCase().includes('token') || errorResultados?.toLowerCase().includes('expirad');
  const sesionExpirada = esErrorSesionPreguntas || esErrorSesionResultados;

  return (
    <div className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-10 xl:px-14 bg-[#f8f9fa] min-h-screen">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-orange mb-2">
            Gestión de Satisfacción
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Encuestas
          </h1>
          <p className="mt-2 text-base text-gray-500">
            {vista === 'preguntas'
              ? 'Configura las preguntas de la evaluación de satisfacción.'
              : 'Revisa las respuestas enviadas por los usuarios.'}
          </p>
        </div>

        {!sesionExpirada && (
          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm shrink-0">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center shrink-0">
          <button
            onClick={abrirModalCodigo}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
              />
            </svg>
            Código de acceso
          </button>

          <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setVista('preguntas')}
              className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
                vista === 'preguntas'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Preguntas
            </button>
            <button
              onClick={() => setVista('resultados')}
              className={`rounded-lg px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
                vista === 'resultados'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Resultados
            </button>
          </div>
        )}
        </div>
      </header>

      {sesionExpirada ? (
        <div className="py-24 flex justify-center rounded-3xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <SessionExpired />
        </div>
      ) : vista === 'preguntas' ? (
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <Eyebrow>Diseño del Formulario</Eyebrow>
            <button
              onClick={abrirCrear}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-orange to-[#f97316] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand-orange/20"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar Pregunta
            </button>
          </div>

          <div className="flex flex-wrap w-full pb-6 gap-2.5">
            {['todas', ...secciones].map((seccion) => {
              const isActive = seccionActiva === seccion;
              return (
                <button
                  key={seccion}
                  onClick={() => setSeccionActiva(seccion)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-out ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20 scale-105'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  {seccion === 'todas' ? 'Todas' : seccion}
                </button>
              );
            })}
          </div>

          {cargando ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
              <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando preguntas...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-base font-bold text-gray-900">Error al cargar preguntas</p>
              <p className="max-w-sm text-sm text-gray-500">{error}</p>
              <button onClick={() => setCargando(true)} className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md">Reintentar</button>
            </div>
          ) : preguntasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <div className="h-16 w-16 mb-2 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-lg font-bold text-gray-900">Sin preguntas registradas</p>
              <p className="text-sm text-gray-500">Haz clic en "Agregar pregunta" para comenzar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-center">Orden</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Sección</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Pregunta</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Tipo</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Obligatoria</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preguntasFiltradas
                    .slice()
                    .sort((a, b) => a.orden - b.orden)
                    .map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-4 py-5 text-gray-500 font-bold text-center">{p.orden}</td>
                        <td className="px-4 py-5 font-bold text-gray-900 whitespace-nowrap">{p.seccion}</td>
                        <td className="px-4 py-5 font-medium text-gray-600 max-w-md">{p.pregunta}</td>
                        <td className="px-4 py-5">
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 capitalize">
                            {p.tipo_respuesta} {p.tipo_respuesta === 'escala' && `(${p.escala_min}-${p.escala_max})`}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <span className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-bold shadow-sm ${
                            p.obligatoria ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {p.obligatoria ? 'Sí' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-right whitespace-nowrap">
                          <button onClick={() => abrirEditar(p)} className="text-sm font-bold text-brand-orange hover:text-orange-700 mr-4 transition-colors">Editar</button>
                          <button onClick={() => handleEliminar(p)} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <Eyebrow>Registro de Evaluaciones</Eyebrow>

            {!cargandoResultados && !errorResultados && resultados.length > 0 && (
              <button
                onClick={generarExcelGeneral}
                disabled={descargandoGeneral}
                className="inline-flex items-center justify-center rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#d85a30] hover:scale-105 hover:shadow-lg focus:outline-none disabled:opacity-50"
              >
                {descargandoGeneral ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Generando...
                  </div>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Descargar Reporte General
                  </>
                )}
              </button>
            )}
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <SelectorDepartamento
              value={departamentoResultados}
              onChange={cambiarDepartamentoResultados}
              className="w-full sm:w-56 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
            />

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Desde</label>
              <input
                type="date"
                value={fechaDesdeResultados}
                onChange={(e) => cambiarFechaDesdeResultados(e.target.value)}
                max={fechaHastaResultados || undefined}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Hasta</label>
              <input
                type="date"
                value={fechaHastaResultados}
                onChange={(e) => cambiarFechaHastaResultados(e.target.value)}
                min={fechaDesdeResultados || undefined}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
              />
            </div>

            {hayFiltrosResultados && (
              <button
                type="button"
                onClick={limpiarFiltrosResultados}
                className="text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-brand-orange px-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {cargandoResultados ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
              <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando respuestas...</p>
            </div>
          ) : errorResultados ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-base font-bold text-gray-900">Error al cargar resultados</p>
              <p className="max-w-sm text-sm text-gray-500">{errorResultados}</p>
              <button
                onClick={() => setIntentosResultados((n) => n + 1)}
                className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md"
              >
                Reintentar
              </button>
            </div>
          ) : resultados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <div className="h-16 w-16 mb-2 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m-9 5h12a2 2 0 002-2V6a2 2 0 00-2-2h-2.5a.5.5 0 00-.4.2l-.9 1.2a.5.5 0 01-.4.2h-2.4a.5.5 0 01-.4-.2l-.9-1.2a.5.5 0 00-.4-.2H6a2 2 0 00-2 2v13a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {hayFiltrosResultados ? 'Sin coincidencias' : 'Sin encuestas completadas'}
              </p>
              <p className="text-sm text-gray-500">
                {hayFiltrosResultados
                  ? 'Ningún resultado coincide con estos filtros. Probá con otro departamento o rango de fecha.'
                  : 'Cuando un usuario responda la encuesta, aparecerá aquí.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Usuario</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Departamento</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Completada el</th>
                    <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {resultados.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-4 py-5">
                        <p className="font-bold text-gray-900">{r.usuario.nombre}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{r.usuario.email}</p>
                      </td>
                      <td className="px-4 py-5 font-medium text-gray-600">
                        {r.usuario.departamento ? (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {r.usuario.departamento}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-5 font-medium text-gray-500 whitespace-nowrap">
                        {formatoFecha.format(new Date(r.fecha_completado))}
                      </td>
                      <td className="px-4 py-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => abrirDetalleResultado(r)}
                          className="text-sm font-bold text-brand-orange hover:text-orange-700 transition-colors"
                        >
                          Ver respuestas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!cargandoResultados && !errorResultados && paginacionResultados && (
            <div className="mt-4 pt-5 border-t border-gray-100 w-full">
              <Paginador paginacion={paginacionResultados} onCambiarPagina={setPaginaResultados} />
            </div>
          )}
        </section>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl overflow-hidden">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
              {editandoId ? 'Editar Pregunta' : 'Nueva Pregunta'}
            </h2>

            {errorModal && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-600 flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errorModal}
              </div>
            )}

            <form onSubmit={handleGuardar} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Sección</label>
                <input
                  type="text"
                  list="secciones-existentes"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                  value={formulario.seccion}
                  onChange={(e) => setFormulario({ ...formulario, seccion: e.target.value })}
                  placeholder="Ej. Ambiente laboral"
                  required
                />
                <datalist id="secciones-existentes">
                  {secciones.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pregunta</label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                  rows={3}
                  value={formulario.pregunta}
                  onChange={(e) => setFormulario({ ...formulario, pregunta: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tipo de respuesta</label>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                    value={formulario.tipo_respuesta}
                    onChange={(e) => cambiarTipoRespuesta(e.target.value as TipoRespuesta)}
                  >
                    <option value="escala">Escala Numérica</option>
                    <option value="texto">Texto Libre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Orden</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                    value={formulario.orden}
                    onChange={(e) => setFormulario({ ...formulario, orden: Number(e.target.value) })}
                    min={1}
                    required
                  />
                </div>
              </div>

              {formulario.tipo_respuesta === 'escala' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">Escala Mínima</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                      value={formulario.escala_min ?? ''}
                      onChange={(e) => setFormulario({ ...formulario, escala_min: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-2">Escala Máxima</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                      value={formulario.escala_max ?? ''}
                      onChange={(e) => setFormulario({ ...formulario, escala_max: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={formulario.obligatoria}
                      onChange={(e) => setFormulario({ ...formulario, obligatoria: e.target.checked })}
                    />
                    <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:bg-brand-orange peer-checked:border-brand-orange transition-all"></div>
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">Esta pregunta es obligatoria</span>
                </label>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="rounded-xl px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors w-full sm:w-auto"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-brand-orange to-[#f97316] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all w-full sm:w-auto disabled:opacity-50"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar Pregunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!sesionExpirada && (
        <ModalTarjeta
          isOpen={!!preguntaAEliminar}
          onClose={() => setPreguntaAEliminar(null)}
          onConfirm={ejecutarEliminacion}
          titulo={preguntaAEliminar ? `¿Eliminar la pregunta "${preguntaAEliminar.pregunta}"?` : '¿Eliminar pregunta?'}
          descripcion="Quedará oculta, no se borra del historial."
          textoConfirmar="Eliminar"
          textoCancelar="Cancelar"
          cargando={eliminandoPregunta}
          esDestructivo={true}
        />
      )}

      {!sesionExpirada && (
        <ModalTarjeta
          isOpen={!!alertModal}
          onClose={() => setAlertModal(null)}
          onConfirm={() => setAlertModal(null)}
          titulo="Error"
          descripcion={alertModal ?? ''}
          textoConfirmar="Aceptar"
          textoCancelar="Cerrar"
        />
      )}

      {!sesionExpirada && resultadoSeleccionado && (
      <ModalTarjeta
        isOpen={!!preguntaAEliminar}
        onClose={() => setPreguntaAEliminar(null)}
        onConfirm={ejecutarEliminacion}
        titulo={preguntaAEliminar ? `¿Eliminar la pregunta "${preguntaAEliminar.pregunta}"?` : '¿Eliminar pregunta?'}
        descripcion="Quedará oculta, no se borra del historial."
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        cargando={eliminandoPregunta}
        esDestructivo={true}
      />

      <ModalTarjeta
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        onConfirm={() => setAlertModal(null)}
        titulo="Error"
        descripcion={alertModal ?? ''}
        textoConfirmar="Aceptar"
        textoCancelar="Cerrar"
      />

      {modalCodigoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
          onClick={() => setModalCodigoAbierto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
          >
            <h2 className="text-xl font-extrabold text-gray-900">Código de acceso</h2>
            <p className="mt-1.5 text-sm text-gray-500">
              El pasante tiene que ingresar este código en <span className="font-mono">/encuesta</span>{' '}
              antes de poder responderla. Cambialo cuando arranque una nueva cohorte.
            </p>

            {cargandoCodigo ? (
              <div className="mt-6 flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
              </div>
            ) : (
              <form onSubmit={handleGuardarCodigo} className="mt-6 flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Código vigente
                  </label>
                  <input
                    type="text"
                    value={codigoEditado}
                    onChange={(e) => setCodigoEditado(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-center text-sm font-bold uppercase tracking-widest text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
                    required
                  />
                </div>

                {errorCodigo && (
                  <p className="text-xs font-medium text-red-600">{errorCodigo}</p>
                )}
                {codigoGuardadoOk && (
                  <p className="text-xs font-medium text-green-600">
                    Código actualizado. Los pasantes ya lo pueden usar.
                  </p>
                )}
                {codigoActual && (
                  <p className="text-[11px] text-gray-400">Código actual: {codigoActual}</p>
                )}

                <div className="mt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalCodigoAbierto(false)}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoCodigo || !codigoEditado.trim()}
                    className="rounded-xl bg-gradient-to-r from-brand-orange to-[#f97316] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {guardandoCodigo ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {resultadoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-8 bg-white z-10">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{resultadoSeleccionado.usuario.nombre}</h2>
                <p className="text-sm font-medium text-gray-500 mb-2">{resultadoSeleccionado.usuario.email}</p>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                    {resultadoSeleccionado.usuario.departamento || 'Sin departamento'}
                  </span>
                  <span className="text-xs font-medium text-gray-400">
                    Enviado el {formatoFecha.format(new Date(resultadoSeleccionado.fecha_completado))}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => generarExcelUsuario(resultadoSeleccionado)}
                  disabled={descargandoUsuario}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-[#d85a30] hover:scale-105 hover:shadow-lg focus:outline-none disabled:opacity-50"
                >
                  {descargandoUsuario ? (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      Generando...
                    </div>
                  ) : (
                    <>
                      <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Descargar Respuestas
                    </>
                  )}
                </button>
                <button
                  onClick={() => setResultadoSeleccionado(null)}
                  className="rounded-full p-2 text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  aria-label="Cerrar"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 border-b border-gray-100 bg-white px-8 py-4">
              {['todas', ...agruparPorSeccion(resultadoSeleccionado).map((g) => g.seccion)].map(
                (seccion) => {
                  const isActive = seccionDetalle === seccion;
                  return (
                    <button
                      key={seccion}
                      onClick={() => setSeccionDetalle(seccion)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ease-out ${
                        isActive
                          ? 'bg-gray-900 text-white shadow-md shadow-gray-900/20'
                          : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-900'
                      }`}
                    >
                      {seccion === 'todas' ? 'Todas' : seccion}
                    </button>
                  );
                }
              )}
            </div>

            <div className="deinsa-scroll overflow-y-auto p-8 bg-[#f8f9fa]">
              {agruparPorSeccion(resultadoSeleccionado)
                .filter((grupo) => seccionDetalle === 'todas' || grupo.seccion === seccionDetalle)
                .map((grupo) => (
                <div key={grupo.seccion} className="mb-10 last:mb-0">
                  <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-orange mb-4">
                    <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
                    {grupo.seccion}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {grupo.respuestas.map((r) => (
                      <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <p className="text-base font-bold text-gray-900 mb-4">{r.pregunta.pregunta}</p>
                        
                        {r.pregunta.tipo_respuesta === 'texto' ? (
                          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                            <p className="text-sm text-gray-700 italic">
                              "{r.respuesta_texto || 'No se proporcionó respuesta.'}"
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="flex items-center gap-4">
                              <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100 shadow-inner">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-brand-orange to-[#f97316]"
                                  style={{ width: `${Math.round(((r.respuesta_numerica ?? 0) / ((r.pregunta as any).escala_max ?? 5)) * 100)}%` }}
                                />
                              </div>
                              <span className="w-16 shrink-0 text-right text-sm font-black text-gray-900">
                                {r.respuesta_numerica ?? 0} <span className="text-xs font-bold text-gray-400">/ {(r.pregunta as any).escala_max ?? 5}</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}