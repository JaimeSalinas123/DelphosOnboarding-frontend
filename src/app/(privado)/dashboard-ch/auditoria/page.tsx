'use client';

import { useEffect, useState } from 'react';
import { auditoriaService, type RegistroAuditoria } from '@/services/auditoriaService';
import type { Paginacion } from '@/lib/paginacion';
import Paginador from '@/components/global/Paginador';
import SessionExpired from '@/components/global/SessionExpired';
import ModalTarjeta from '@/components/global/ModalTarjeta';

const REGISTROS_POR_PAGINA = 10;

const formatoFecha = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 sm:mb-6">
      <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
      {children}
    </div>
  );
}

function EtiquetaAccion({ accion }: { accion: string }) {
  const estilos: Record<string, string> = {
    crear: 'bg-green-50 text-green-700 border-green-200',
    editar: 'bg-blue-50 text-blue-700 border-blue-200',
    eliminar: 'bg-red-50 text-red-700 border-red-200',
  };
  
  const clase = estilos[accion] || 'bg-gray-100 text-gray-700 border-gray-200';
  
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border shadow-sm ${clase}`}>
      {accion}
    </span>
  );
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [pagina, setPagina] = useState(1);
  const [moduloFiltro, setModuloFiltro] = useState('');
  const [accionFiltro, setAccionFiltro] = useState('');
  
  const hayFiltros = !!moduloFiltro || !!accionFiltro;

  // Estados del Modal de Rehacer
  const [registroARehacer, setRegistroARehacer] = useState<RegistroAuditoria | null>(null);
  const [procesandoRehacer, setProcesandoRehacer] = useState(false);
  const [alertModal, setAlertModal] = useState<{titulo: string, msj: string, tipo?: 'exito'|'error'} | null>(null);

  const cargarDatos = async (fondo = false) => {
    if (!fondo) setCargando(true);
    try {
      const data = await auditoriaService.listar({
        pagina,
        limite: REGISTROS_POR_PAGINA,
        modulo: moduloFiltro || undefined,
        accion: accionFiltro || undefined,
      });
      setRegistros(data.registros);
      setPaginacion(data.paginacion);
      setError(null);
    } catch (err: any) {
      if (!fondo) setError(err.message);
    } finally {
      if (!fondo) setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [pagina, moduloFiltro, accionFiltro]);

  const limpiarFiltros = () => {
    setModuloFiltro('');
    setAccionFiltro('');
    setPagina(1);
  };

  const confirmarRehacer = (registro: RegistroAuditoria) => {
    setRegistroARehacer(registro);
  };

  const ejecutarRehacer = async () => {
    if (!registroARehacer) return;
    setProcesandoRehacer(true);
    try {
      await auditoriaService.rehacerAccion(registroARehacer.id);
      setAlertModal({ titulo: '¡Acción Revertida!', msj: 'El elemento ha sido restaurado con éxito.', tipo: 'exito' });
      setRegistroARehacer(null);
      cargarDatos(true); // Recargar la tabla en fondo
    } catch (err: any) {
      setAlertModal({ titulo: 'Error', msj: err.message || 'No se pudo restaurar el elemento.', tipo: 'error' });
    } finally {
      setProcesandoRehacer(false);
    }
  };

  const esErrorSesion = error?.toLowerCase().includes('token') || error?.toLowerCase().includes('expirad');

  return (
    <div className="w-full flex-1 px-4 py-6 sm:py-8 sm:px-6 lg:px-10 xl:px-14 bg-[#f8f9fa] min-h-screen">
      <header className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-orange mb-2">
            Seguridad y Trazabilidad
          </p>
          {/* AJUSTE RESPONSIVE: Titulo escalable */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
            Auditoría
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500">
            Monitorea los cambios realizados en el sistema y restaura elementos eliminados por error.
          </p>
        </div>
      </header>

      {esErrorSesion ? (
        <div className="py-24 flex justify-center rounded-2xl sm:rounded-3xl bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
          <SessionExpired />
        </div>
      ) : (
        <section className="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden">
          <Eyebrow>Registro de Actividad</Eyebrow>

          {/* AJUSTE RESPONSIVE: Filtros ocupan w-full en móvil con padding compacto */}
          <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center">
            <select
              value={moduloFiltro}
              onChange={(e) => { setModuloFiltro(e.target.value); setPagina(1); }}
              className="w-full sm:w-48 rounded-xl border border-gray-200 bg-gray-50 py-2.5 sm:py-3 px-3 sm:px-4 text-[13px] sm:text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
            >
              <option value="">Todos los módulos</option>
              <option value="estudio">Estudio</option>
              <option value="encuestas">Encuestas</option>
              <option value="documentacion">Documentación IA</option>
              <option value="usuarios">Usuarios</option>
            </select>

            <select
              value={accionFiltro}
              onChange={(e) => { setAccionFiltro(e.target.value); setPagina(1); }}
              className="w-full sm:w-48 rounded-xl border border-gray-200 bg-gray-50 py-2.5 sm:py-3 px-3 sm:px-4 text-[13px] sm:text-sm font-medium text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
            >
              <option value="">Todas las acciones</option>
              <option value="crear">Creación</option>
              <option value="editar">Edición</option>
              <option value="eliminar">Eliminación</option>
            </select>

            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="self-start sm:self-auto text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-brand-orange px-2 pt-1 sm:pt-0"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {cargando ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24">
              <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
              <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando registros...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24 text-center px-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-sm sm:text-base font-bold text-gray-900">Error de conexión</p>
              <p className="max-w-sm text-xs sm:text-sm text-gray-500">{error}</p>
              <button onClick={() => cargarDatos()} className="mt-2 rounded-xl bg-gray-900 px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md">Reintentar</button>
            </div>
          ) : registros.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 sm:py-24 text-center px-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 mb-2 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m-9 5h12a2 2 0 002-2V6a2 2 0 00-2-2h-2.5a.5.5 0 00-.4.2l-.9 1.2a.5.5 0 01-.4.2h-2.4a.5.5 0 01-.4-.2l-.9-1.2a.5.5 0 00-.4-.2H6a2 2 0 00-2 2v13a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {hayFiltros ? 'Sin coincidencias' : 'Registro limpio'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
                {hayFiltros
                  ? 'No hay actividades que coincidan con los filtros aplicados.'
                  : 'Aún no se han registrado actividades administrativas en el sistema.'}
              </p>
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* VISTA MÓVIL: Formato de Tarjetas (Cards) para Auditoría */}
              {/* ========================================================= */}
              <div className="md:hidden flex flex-col gap-4 mt-2">
                {registros.map((reg) => (
                  <div key={reg.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-orange/40 rounded-l-2xl"></div>

                    {/* Encabezado: Nombre y Fecha */}
                    <div className="flex flex-col border-b border-gray-50 pb-3 pl-2">
                      <div className="flex justify-between items-start gap-2 mb-1">
                         <span className="font-extrabold text-gray-900 text-[14px]">{reg.usuario_nombre}</span>
                         <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap">{formatoFecha.format(new Date(reg.fecha))}</span>
                      </div>
                      <span className="text-[12px] text-gray-500 font-medium break-all">{reg.usuario_email}</span>
                    </div>

                    {/* Cuerpo: Módulo, Acción y Detalles */}
                    <div className="flex flex-col gap-2.5 pl-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Módulo</span>
                        <span className="font-bold text-gray-700 text-xs capitalize">{reg.modulo}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Acción</span>
                        <EtiquetaAccion accion={reg.accion} />
                      </div>
                      
                      <div className="flex flex-col gap-1.5 text-sm mt-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Detalles</span>
                        <p className="text-xs text-gray-600 leading-snug">{reg.detalles}</p>
                      </div>

                      <div className="mt-1 pt-3 border-t border-gray-50 text-right">
                        {reg.reversible ? (
                          <button
                            onClick={() => confirmarRehacer(reg)}
                            className="inline-flex w-full justify-center items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-brand-orange hover:text-orange-700 transition-colors bg-brand-orange/5 py-2 rounded-lg"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                            Rehacer Acción
                          </button>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-400 italic block text-center py-2">Esta acción no es reversible</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ========================================================= */}
              {/* VISTA ESCRITORIO: TABLA ORIGINAL INTACTA */}
              {/* ========================================================= */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Fecha</th>
                      <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Usuario</th>
                      <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Módulo</th>
                      <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Acción</th>
                      <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Detalles</th>
                      <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 text-right">Restaurar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {registros.map((reg, idx) => (
                      <tr key={reg.id} className={`transition-colors hover:bg-gray-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-4 py-4 font-medium text-gray-500 whitespace-nowrap">
                          {formatoFecha.format(new Date(reg.fecha))}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-gray-900">{reg.usuario_nombre}</p>
                          <p className="text-xs text-gray-500">{reg.usuario_email}</p>
                        </td>
                        <td className="px-4 py-4 font-bold text-gray-600 capitalize">
                          {reg.modulo}
                        </td>
                        <td className="px-4 py-4">
                          <EtiquetaAccion accion={reg.accion} />
                        </td>
                        <td className="px-4 py-4 text-gray-600 max-w-xs truncate" title={reg.detalles}>
                          {reg.detalles}
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          {reg.reversible ? (
                            <button
                              onClick={() => confirmarRehacer(reg)}
                              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-orange hover:text-orange-700 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                              </svg>
                              Rehacer
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-gray-400 italic">No reversible</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {paginacion && (
                <div className="mt-4 sm:mt-6 pt-5 border-t border-gray-100 flex justify-center sm:justify-end w-full">
                  <Paginador paginacion={paginacion} onCambiarPagina={setPagina} />
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Modal Confirmación Rehacer */}
      <ModalTarjeta
        isOpen={!!registroARehacer}
        onClose={() => setRegistroARehacer(null)}
        onConfirm={ejecutarRehacer}
        titulo="¿Deshacer esta acción?"
        descripcion={`Estás a punto de restaurar un elemento del módulo ${registroARehacer?.modulo}. Esta acción volverá a colocar los datos en su estado anterior. ¿Deseas continuar?`}
        textoConfirmar="Sí, restaurar"
        textoCancelar="Cancelar"
        cargando={procesandoRehacer}
        esDestructivo={false}
      />

      {/* Modal Alertas Exito/Error */}
      {alertModal && (
        <ModalTarjeta
          isOpen={!!alertModal}
          onClose={() => setAlertModal(null)}
          onConfirm={() => setAlertModal(null)}
          titulo={alertModal.titulo}
          descripcion={alertModal.msj}
          textoConfirmar="Aceptar"
          esDestructivo={alertModal.tipo === 'error'}
        />
      )}
    </div>
  );
}