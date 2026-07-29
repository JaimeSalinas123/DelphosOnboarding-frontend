'use client';

import { useState, useEffect } from 'react';
import { estudioService, type Pregunta } from '@/services/estudioService';

type ModoEstudio = 'cuestionario' | 'flashcard' | 'verdadero_falso';

export default function EstudioPage() {
  const [modoActivo, setModoActivo] = useState<ModoEstudio>('cuestionario');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el Modal de Edición
  const [preguntaEditando, setPreguntaEditando] = useState<Pregunta | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarPreguntas();
  }, []);

  const cargarPreguntas = () => {
    setCargando(true);
    estudioService.listar()
      .then(setPreguntas)
      .catch((err: Error) => setError(err.message))
      .finally(() => setCargando(false));
  };

  // --- FUNCIONES DE ACCIÓN ---
  const handleEliminar = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta pregunta del sistema? (Se mantendrá oculta en el historial)')) return;
    try {
      await estudioService.eliminar(id);
      cargarPreguntas(); // Recargar la tabla
    } catch (error) {
      alert('Hubo un error al eliminar');
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!preguntaEditando) return;
    
    setGuardando(true);
    try {
      // Mandamos a actualizar (solo los campos que nos importan)
      await estudioService.actualizar(preguntaEditando.id, {
        pregunta: preguntaEditando.pregunta,
        respuesta_correcta: preguntaEditando.respuesta_correcta,
        opcion_a: preguntaEditando.opcion_a,
        opcion_b: preguntaEditando.opcion_b,
        opcion_c: preguntaEditando.opcion_c,
        opcion_d: preguntaEditando.opcion_d,
      });
      setPreguntaEditando(null); // Cerrar modal
      cargarPreguntas(); // Recargar tabla
    } catch (error) {
      alert('Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const preguntasFiltradas = preguntas.filter(p => p.tipo === modoActivo);

  return (
    <div className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6 lg:px-8 relative">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl">Estudio</h1>
          <p className="mt-1 text-sm text-body">
            Gestiona las preguntas y respuestas de los diferentes métodos de aprendizaje.
          </p>
        </div>
        
        <button className="inline-flex items-center justify-center rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-orange/90">
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar Pregunta
        </button>
      </header>

      {/* PESTAÑAS */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {['cuestionario', 'flashcard', 'verdadero_falso'].map((modo) => (
          <button
            key={modo}
            onClick={() => setModoActivo(modo as ModoEstudio)}
            className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition-all ${
              modoActivo === modo
                ? 'border-brand-orange bg-brand-orange text-white'
                : 'border-default bg-white text-heading hover:border-brand-orange/50'
            }`}
          >
            {modo === 'cuestionario' ? 'Cuestionarios' : modo === 'flashcard' ? 'Flashcards' : 'Verdadero / Falso'}
          </button>
        ))}
      </div>

      {/* TABLA DE DATOS */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-default bg-neutral-primary shadow-sm">
        {cargando ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" /></div>
        ) : preguntasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-body">
            No hay preguntas registradas aquí.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-default bg-neutral-secondary/60 text-xs uppercase tracking-wide text-brand-gray">
                  <th className="px-5 py-3 font-semibold">Nivel</th>
                  <th className="px-5 py-3 font-semibold">Pregunta</th>
                  <th className="px-5 py-3 font-semibold">Respuesta Correcta</th>
                  <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {preguntasFiltradas.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-neutral-secondary/40">
                    <td className="px-5 py-4 text-body font-medium whitespace-nowrap">{p.nivel || 'General'}</td>
                    <td className="px-5 py-4 text-heading max-w-md">{p.pregunta}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 border border-green-200">
                        {p.respuesta_correcta}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {/* Botón Editar */}
                      <button 
                        onClick={() => setPreguntaEditando(p)}
                        className="text-brand-orange hover:text-brand-orange/80 mr-3 font-medium"
                      >
                        Editar
                      </button>
                      {/* Botón Eliminar */}
                      <button 
                        onClick={() => handleEliminar(p.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL DE EDICIÓN */}
      {preguntaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-heading mb-4">Editar Pregunta</h2>
            <form onSubmit={handleGuardarEdicion} className="flex flex-col gap-4">
              
              <div>
                <label className="block text-sm font-medium text-heading mb-1">Pregunta</label>
                <textarea
                  className="w-full rounded-lg border border-default p-2.5 text-sm outline-none focus:border-brand-orange"
                  rows={3}
                  value={preguntaEditando.pregunta}
                  onChange={(e) => setPreguntaEditando({ ...preguntaEditando, pregunta: e.target.value })}
                  required
                />
              </div>

              {/* Si es cuestionario, mostramos las 4 opciones */}
              {preguntaEditando.tipo === 'cuestionario' && (
                <div className="grid grid-cols-2 gap-4">
                  {(['a', 'b', 'c', 'd'] as const).map(letra => (
                    <div key={letra}>
                      <label className="block text-xs font-medium text-heading mb-1 uppercase">Opción {letra}</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-default p-2 text-sm outline-none focus:border-brand-orange"
                        value={preguntaEditando[`opcion_${letra}`] || ''}
                        onChange={(e) => setPreguntaEditando({ ...preguntaEditando, [`opcion_${letra}`]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-heading mb-1">Respuesta Correcta</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-default p-2.5 text-sm outline-none focus:border-brand-orange"
                  value={preguntaEditando.respuesta_correcta}
                  onChange={(e) => setPreguntaEditando({ ...preguntaEditando, respuesta_correcta: e.target.value })}
                  required
                  placeholder={preguntaEditando.tipo === 'cuestionario' ? 'A, B, C o D' : 'Texto exacto'}
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPreguntaEditando(null)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-body hover:bg-neutral-secondary"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange/90 disabled:opacity-50"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}