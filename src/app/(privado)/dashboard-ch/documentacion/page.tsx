'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { documentacionService } from '@/services/documentacionService';
import SessionExpired from '@/components/global/SessionExpired';
import ModalTarjeta from '@/components/global/ModalTarjeta';

interface ModuloIA {
  id: string; 
  titulo: string;
  contenido: string;
}

const SEPARADOR_LINEA = '===============================================================================';
const PREFIJO_TITULO = '## ';

const TEXTO_EJEMPLO = `===============================================================================
## 1. NOMBRE DEL MÓDULO DE EJEMPLO
===============================================================================

Aquí puedes escribir la información general o el propósito de este módulo. 
La IA leerá este texto exactamente como lo estructures.

Puedes usar listas para ser más claro:
- Característica de ejemplo A.
- Característica de ejemplo B.
- Característica de ejemplo C.

Recuerda que no debes borrar las líneas de "===" ni los "##" del título, ya que el sistema los usa para saber dónde empieza y termina cada tema.

===============================================================================
## 2. OTRO MÓDULO DE EJEMPLO
===============================================================================

Este es otro ejemplo de cómo se separa un módulo del anterior. 
Simplemente copias la línea de iguales, pones "## " seguido de tu nuevo título, cierras con otra línea de iguales y comienzas a escribir tu nuevo contenido.
`;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">
      <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
      {children}
    </div>
  );
}

export default function DocumentacionPage() {
  const [modulos, setModulos] = useState<ModuloIA[]>([]);
  const [encabezadoTxt, setEncabezadoTxt] = useState(''); 
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [busqueda, setBusqueda] = useState('');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState({ titulo: '', contenido: '' });
  const [alertModal, setAlertModal] = useState<string | null>(null);

  const [moduloAEliminar, setModuloAEliminar] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const [modalSubidaAbierto, setModalSubidaAbierto] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarDocumentacion = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await documentacionService.obtenerTexto();
      parsearTexto(data.contenido);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDocumentacion();
  }, []);

  const parsearTexto = (textoBruto: string) => {
    // Escáner Indestructible (Soporta \r\n de Windows y largos variables de "=")
    const primerMatchIndex = textoBruto.search(/={5,}/);
    if (primerMatchIndex !== -1) {
      setEncabezadoTxt(textoBruto.substring(0, primerMatchIndex));
    } else {
      setEncabezadoTxt(textoBruto);
    }

    const regexSeccion = /={5,}\r?\n##\s*(.*?)\r?\n={5,}\r?\n([\s\S]*?)(?=\r?\n={5,}|$)/g;
    
    let match;
    const nuevosModulos: ModuloIA[] = [];

    while ((match = regexSeccion.exec(textoBruto)) !== null) {
      nuevosModulos.push({
        id: Math.random().toString(36).substring(2, 9),
        titulo: match[1].trim(),
        contenido: match[2].trim(),
      });
    }

    setModulos(nuevosModulos);
  };

  const guardarEnBackend = async (modulosActualizados: ModuloIA[]) => {
    try {
      let textoFinal = encabezadoTxt;
      if (textoFinal && !textoFinal.endsWith('\n\n')) textoFinal += '\n\n';

      modulosActualizados.forEach((mod) => {
        textoFinal += `${SEPARADOR_LINEA}\n`;
        textoFinal += `${PREFIJO_TITULO}${mod.titulo}\n`;
        textoFinal += `${SEPARADOR_LINEA}\n\n`;
        textoFinal += `${mod.contenido}\n\n`;
      });

      await documentacionService.guardarTexto(textoFinal);
      setModulos(modulosActualizados);
      return true; 
    } catch (err: any) {
      setAlertModal(`Error al guardar: ${err.message}`);
      return false; 
    }
  };

  const abrirCrear = () => {
    setEditandoId(null);
    setFormulario({ 
      titulo: `${modulos.length + 1}. NUEVO MÓDULO`, 
      contenido: '' 
    });
    setModalAbierto(true);
  };

  const abrirEditar = (mod: ModuloIA) => {
    setEditandoId(mod.id);
    setFormulario({ titulo: mod.titulo, contenido: mod.contenido });
    setModalAbierto(true);
  };

  const confirmarEliminar = (id: string) => {
    setModuloAEliminar(id);
  };

  const ejecutarEliminacion = async () => {
    if (!moduloAEliminar) return;
    setEliminando(true);
    
    const actualizados = modulos.filter(m => m.id !== moduloAEliminar);
    const exito = await guardarEnBackend(actualizados);
    
    setEliminando(false);
    if (exito) {
      setModuloAEliminar(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    
    let exito = false;
    if (editandoId) {
      const actualizados = modulos.map(m => m.id === editandoId ? { ...m, ...formulario } : m);
      exito = await guardarEnBackend(actualizados);
    } else {
      const nuevoModulo = { id: Math.random().toString(36).substring(2, 9), ...formulario };
      const actualizados = [...modulos, nuevoModulo]; 
      exito = await guardarEnBackend(actualizados);
    }
    
    setGuardando(false);
    if (exito) {
      setModalAbierto(false);
    }
  };

  const descargarEjemplo = () => {
    const blob = new Blob([TEXTO_EJEMPLO], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ejemplo_entrenamiento_ia.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const procesarArchivoSubido = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendoArchivo(true);
    try {
      const textoImportado = await file.text();
      const regexSeccion = /={5,}\r?\n##\s*(.*?)\r?\n={5,}\r?\n([\s\S]*?)(?=\r?\n={5,}|$)/g;
      
      let match;
      const nuevosModulosArchivo: ModuloIA[] = [];
      
      while ((match = regexSeccion.exec(textoImportado)) !== null) {
        nuevosModulosArchivo.push({
          id: Math.random().toString(36).substring(2, 9),
          titulo: match[1].trim(),
          contenido: match[2].trim(),
        });
      }

      if (nuevosModulosArchivo.length === 0) {
        setAlertModal('No se detectó ningún módulo en el archivo. Asegúrate de usar exactamente los separadores (====) y el título (## ).');
      } else {
        const actualizados = [...modulos, ...nuevosModulosArchivo];
        const exito = await guardarEnBackend(actualizados);
        if (exito) {
          setAlertModal(`¡Éxito! Se agregaron ${nuevosModulosArchivo.length} módulos nuevos a la base de conocimiento.`);
        }
      }
    } catch (err: any) {
      setAlertModal(`Hubo un error al leer el archivo: ${err.message}`);
    } finally {
      setSubiendoArchivo(false);
      setModalSubidaAbierto(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const modulosFiltrados = useMemo(() => {
    if (!busqueda) return modulos;
    const lower = busqueda.toLowerCase();
    return modulos.filter(m => m.titulo.toLowerCase().includes(lower) || m.contenido.toLowerCase().includes(lower));
  }, [modulos, busqueda]);

  const esErrorSesion = error?.toLowerCase().includes('token') || error?.toLowerCase().includes('expirad');

  return (
    <div className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-10 xl:px-14 bg-[#f8f9fa] min-h-screen">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-orange mb-2">
            Base de Conocimiento
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Documentación IA
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Administra y entrena el cerebro de Delphos AI. (Modificar estos datos afectará las respuestas del Chatbot).
          </p>
        </div>
      </header>

      <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
          <Eyebrow>Módulos de Entrenamiento</Eyebrow>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={descargarEjemplo}
              className="inline-flex items-center justify-center rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-brand-orange"
            >
              <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Ejemplo
            </button>

            <input 
              type="file" 
              accept=".txt" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={procesarArchivoSubido}
            />

            <button 
              onClick={() => setModalSubidaAbierto(true)}
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-gray-800 hover:shadow-lg"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Subir TXT
            </button>

            <button 
              onClick={abrirCrear}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-orange to-[#f97316] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg hover:shadow-brand-orange/20"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar Pregunta
            </button>
          </div>
        </div>

        <div className="mb-8 relative max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en la documentación (Ctrl+F)..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
          />
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
            <p className="text-sm font-medium text-gray-500 animate-pulse">Leyendo archivo maestro...</p>
          </div>
        ) : error ? (
          esErrorSesion ? (
            <div className="py-12 flex justify-center"><SessionExpired /></div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-base font-bold text-gray-900">Error al leer la documentación</p>
              <p className="max-w-sm text-sm text-gray-500">{error}</p>
              <button onClick={cargarDocumentacion} className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800">Reintentar</button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {modulosFiltrados.map((mod) => (
              <div key={mod.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-orange/30">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-200 transition-colors duration-300 group-hover:bg-brand-orange"></div>
                
                <div className="p-6 sm:p-8 pl-8 sm:pl-10">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 text-brand-orange shadow-inner">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{mod.titulo}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Módulo de IA</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => abrirEditar(mod)} 
                        className="inline-flex items-center justify-center rounded-lg bg-gray-50 p-2.5 text-gray-500 transition-all hover:bg-brand-orange/10 hover:text-brand-orange focus:outline-none"
                        title="Editar"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => confirmarEliminar(mod.id)} 
                        className="inline-flex items-center justify-center rounded-lg bg-gray-50 p-2.5 text-gray-500 transition-all hover:bg-red-50 hover:text-red-500 focus:outline-none"
                        title="Eliminar"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-5">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed max-h-60 overflow-y-auto deinsa-scroll">
                      {mod.contenido}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
            
            {modulosFiltrados.length === 0 && (
              <div className="py-12 text-center text-gray-500 text-sm">
                No se encontraron módulos que coincidan con la búsqueda.
              </div>
            )}
          </div>
        )}
      </section>

      {/* MODAL DE EDICIÓN / CREACIÓN MANUAL */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between border-b border-gray-100 bg-white p-6 sm:p-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 text-brand-orange shadow-inner">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                    {editandoId ? 'Editar Módulo' : 'Nuevo Módulo de IA'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Alimenta el cerebro de la IA con información clara y estructurada.</p>
                </div>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="rounded-full p-2 text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                title="Cerrar"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto deinsa-scroll flex-1 bg-gray-50/50">
              <form id="form-doc" onSubmit={handleSubmit} className="flex flex-col gap-6 h-full">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Título del Módulo</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 px-4 text-sm font-bold text-gray-900 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none"
                    value={formulario.titulo}
                    onChange={(e) => setFormulario({ ...formulario, titulo: e.target.value })}
                    placeholder="Ej. 18. NUEVO TEMA..."
                    required
                  />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Contenido de Entrenamiento</label>
                    <span className="inline-flex w-max text-[10px] font-semibold text-brand-orange bg-brand-orange/10 px-2 py-1 rounded-md">Formato texto libre</span>
                  </div>
                  <textarea
                    className="w-full h-full min-h-[30vh] rounded-xl border border-gray-200 bg-gray-50 py-4 px-4 text-sm font-medium text-gray-700 leading-relaxed focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none resize-none deinsa-scroll"
                    value={formulario.contenido}
                    onChange={(e) => setFormulario({ ...formulario, contenido: e.target.value })}
                    placeholder="- Escribe aquí la información detallada para que la IA la aprenda..."
                    required
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 bg-white relative z-10">
              <button 
                type="button" 
                onClick={() => setModalAbierto(false)} 
                className="rounded-xl px-6 py-3 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors w-full sm:w-auto"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="form-doc"
                className="rounded-xl bg-gradient-to-r from-brand-orange to-[#f97316] px-8 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                disabled={guardando}
              >
                {guardando ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : 'Guardar en Base de Conocimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADVERTENCIA SUBIDA (Reutilizando ModalTarjeta) */}
      <ModalTarjeta
        isOpen={modalSubidaAbierto}
        onClose={() => setModalSubidaAbierto(false)}
        onConfirm={() => fileInputRef.current?.click()}
        titulo="Atención al Formato"
        descripcion="Para que el sistema lea el documento correctamente, el archivo debe contener los separadores (======) y los títulos (## ). Si no estás seguro, te recomendamos descargar el ejemplo primero o usar el botón 'Agregar Pregunta'."
        textoConfirmar="Seleccionar archivo"
        textoCancelar="Cancelar"
        cargando={subiendoArchivo}
        esDestructivo={false}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ModalTarjeta
        isOpen={!!moduloAEliminar}
        onClose={() => setModuloAEliminar(null)}
        onConfirm={ejecutarEliminacion}
        titulo="¿Eliminar módulo?"
        descripcion="Estás a punto de eliminar este módulo de la base de conocimiento de la IA. Esta acción es permanente y afectará cómo responde el Chatbot a los usuarios. ¿Deseas continuar?"
        textoConfirmar="Sí, eliminar"
        cargando={eliminando}
        esDestructivo={true}
      />

      {/* MODAL DE ALERTA GENERAL */}
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