'use client';

import { useState, useEffect, useMemo } from 'react';
import SessionExpired from '@/components/global/SessionExpired';
import ModalTarjeta from '@/components/global/ModalTarjeta';
import { nuevoConocimientoService } from '@/services/nuevoConocimientoService';

interface ModuloIA {
  id: string;
  titulo: string;
  contenido: string;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-4 sm:mb-6">
      <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
      {children}
    </div>
  );
}

export default function NuevoConocimientoPage() {
  const [modulos, setModulos] = useState<ModuloIA[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Estados para eliminación
  const [moduloAEliminar, setModuloAEliminar] = useState<ModuloIA | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [alertModal, setAlertModal] = useState<string | null>(null);

  // Sincronización automática con el backend
  useEffect(() => {
    let cancelado = false;
    
    const cargarDocumentacion = async (fondo = false) => {
      if (!fondo) setCargando(true);
      try {
        const data = await nuevoConocimientoService.obtenerTexto();
        if (!cancelado) {
          parsearTexto(data.contenido);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelado && !fondo) setError(err.message);
      } finally {
        if (!cancelado && !fondo) setCargando(false);
      }
    };

    cargarDocumentacion(false);
    const intId = setInterval(() => cargarDocumentacion(true), 10000); 
    
    return () => { 
      cancelado = true; 
      clearInterval(intId); 
    };
  }, []);

  const parsearTexto = (textoBruto: string) => {
    if (!textoBruto || textoBruto.trim() === '') {
      setModulos([]);
      return;
    }

    // Cortamos el texto usando 10 o más signos de igual como divisores exactos
    const partes = textoBruto.split(/={10,}/);
    const nuevosModulos: ModuloIA[] = [];

    for (let i = 0; i < partes.length; i++) {
      const parteLimpia = partes[i].trim();
      if (!parteLimpia) continue;

      // -------------------------------------------------------------
      // CASO 1: FORMATO ANTIGUO (FECHA: ... PREGUNTA NO DOCUMENTADA:)
      // -------------------------------------------------------------
      if (parteLimpia.includes('PREGUNTA NO DOCUMENTADA:')) {
        const lineas = parteLimpia.split('\n').map(l => l.trim());
        let fecha = 'Sin fecha';
        let pregunta = 'Pregunta desconocida';

        lineas.forEach(l => {
          if (l.startsWith('FECHA:')) {
            fecha = l.replace('FECHA:', '').trim();
          } else if (l.startsWith('PREGUNTA NO DOCUMENTADA:')) {
            pregunta = l.replace('PREGUNTA NO DOCUMENTADA:', '').trim();
          }
        });

        nuevosModulos.push({
          id: Math.random().toString(36).substring(2, 9),
          titulo: pregunta,
          contenido: `Fecha de captura: ${fecha}`
        });
      }
      // -------------------------------------------------------------
      // CASO 2: FORMATO NUEVO (El que tu backend actual genera con ##)
      // -------------------------------------------------------------
      else if (parteLimpia.startsWith('##')) {
        const titulo = parteLimpia.substring(2).trim(); // Quita el "##"
        const contenido = partes[i + 1] ? partes[i + 1].trim() : '';
        
        nuevosModulos.push({
          id: Math.random().toString(36).substring(2, 9),
          titulo,
          contenido
        });
        
        i++; // Saltamos la siguiente parte porque ya la usamos como contenido
      }
    }
    
    setModulos(nuevosModulos.reverse());
  };

  const ejecutarEliminacion = async () => {
    if (!moduloAEliminar) return;
    setEliminando(true);
    
    try {
      const actualizados = modulos.filter(m => m.id !== moduloAEliminar.id);
      let textoFinal = '';
      
      const modulosParaGuardar = [...actualizados].reverse();

      // Al reescribir, sanamos el archivo al Formato Nuevo automáticamente
      modulosParaGuardar.forEach((mod) => {
        textoFinal += `===============================================================================\n`;
        textoFinal += `## ${mod.titulo}\n`;
        textoFinal += `===============================================================================\n`;
        textoFinal += `${mod.contenido}\n\n`;
      });

      await nuevoConocimientoService.guardarTexto(textoFinal);
      setModulos(actualizados);
      setModuloAEliminar(null);
    } catch (err: any) {
      setAlertModal(err.message || 'Hubo un error al eliminar el registro.');
    } finally {
      setEliminando(false);
    }
  };

  const modulosFiltrados = useMemo(() => {
    if (!busqueda) return modulos;
    const lower = busqueda.toLowerCase();
    return modulos.filter(m => m.titulo.toLowerCase().includes(lower) || m.contenido.toLowerCase().includes(lower));
  }, [modulos, busqueda]);

  const esErrorSesion = error?.toLowerCase().includes('token') || error?.toLowerCase().includes('expirad');

  return (
    <div className="w-full flex-1 px-4 py-6 sm:py-8 sm:px-6 lg:px-10 xl:px-14 bg-[#f8f9fa] min-h-screen">
      <header className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-orange mb-2">
            Base de Conocimiento Dinámica
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
            Aprendizaje IA
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500">
            Revisa el historial de preguntas que la IA no pudo responder. Estos registros son de solo lectura.
          </p>
        </div>
      </header>

      <section className="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 sm:mb-8">
          <Eyebrow>Bandeja de Entrada de IA</Eyebrow>
        </div>

        <div className="mb-6 sm:mb-8 relative w-full md:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en el registro de IA..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 sm:py-3 pl-10 sm:pl-11 pr-4 text-[13px] sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
          />
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24">
            <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
            <p className="text-sm font-medium text-gray-500 animate-pulse">Sincronizando con la IA...</p>
          </div>
        ) : error ? (
          esErrorSesion ? (
            <div className="py-12 flex justify-center"><SessionExpired /></div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24 text-center px-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-base font-bold text-gray-900">Error al leer los conocimientos</p>
              <p className="max-w-sm text-xs sm:text-sm text-gray-500">{error}</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {modulosFiltrados.map((mod) => (
              <div key={mod.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-brand-orange/30">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-200 transition-colors duration-300 group-hover:bg-brand-orange"></div>
                
                <div className="p-5 sm:p-6 md:p-8 pl-7 sm:pl-8 md:pl-10">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 text-brand-orange shadow-inner">
                        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.829 1.58-2.083a4.501 4.501 0 10-7.66 0c.922.254 1.58 1.1 1.58 2.083v.192" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-xl font-extrabold text-gray-900 leading-tight pr-2">{mod.titulo}</h3>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Pregunta sin respuesta oficial</p>
                      </div>
                    </div>
                    
                    {/* BOTÓN ELIMINAR */}
                    <div className="flex items-center shrink-0 self-end sm:self-auto">
                      <button 
                        onClick={() => setModuloAEliminar(mod)} 
                        className="inline-flex items-center justify-center rounded-lg bg-gray-50 p-2 sm:p-2.5 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 focus:outline-none"
                        title="Descartar registro"
                      >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 sm:p-5">
                    <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-gray-700 leading-relaxed max-h-60 overflow-y-auto deinsa-scroll">
                      {mod.contenido}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
            
            {modulosFiltrados.length === 0 && (
              <div className="py-12 sm:py-16 text-center text-gray-500 text-xs sm:text-sm">
                El registro está limpio. No hay conocimientos pendientes revisados por la IA.
              </div>
            )}
          </div>
        )}
      </section>

      <ModalTarjeta
        isOpen={!!moduloAEliminar}
        onClose={() => setModuloAEliminar(null)}
        onConfirm={ejecutarEliminacion}
        titulo="¿Descartar este registro?"
        descripcion={`¿Estás seguro de que deseas eliminar la pregunta "${moduloAEliminar?.titulo}"? Esta acción borrará el registro de forma permanente del archivo de la IA.`}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        cargando={eliminando}
        esDestructivo={true}
      />

      <ModalTarjeta
        isOpen={!!alertModal}
        onClose={() => setAlertModal(null)}
        onConfirm={() => setAlertModal(null)}
        titulo="Aviso"
        descripcion={alertModal ?? ''}
        textoConfirmar="Aceptar"
        textoCancelar="Cerrar"
      />
    </div>
  );
}