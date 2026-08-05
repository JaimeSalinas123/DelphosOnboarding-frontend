'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  usuarioService,
  type RolEditable,
  type UsuarioListado,
} from '@/services/usuarioService';
import { progresoService, type ProgresoPasante } from '@/services/progresoService';
import { etiquetaRol } from '@/lib/roles';
import type { Paginacion } from '@/lib/paginacion';
import Paginador from '@/components/global/Paginador';
import SessionExpired from '@/components/global/SessionExpired';
import SelectorDepartamento from '@/components/global/SelectorDepartamento';

const USUARIOS_POR_PAGINA = 10;

// ============================================================================
// COMPONENTES AUXILIARES Y DE DISEÑO
// ============================================================================

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">
      <span className="h-[2px] w-6 shrink-0 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange/40" />
      {children}
    </div>
  );
}

/** Roles que el toggle de la tabla entiende */
function esRolEditable(rol: string): rol is RolEditable {
  return rol === 'nuevo_integrante' || rol === 'administrador';
}

function ToggleRol({
  usuario,
  cargando,
  esUsuarioActual,
  onCambiar,
}: {
  usuario: UsuarioListado;
  cargando: boolean;
  esUsuarioActual: boolean;
  onCambiar: (nuevoRol: RolEditable) => void;
}) {
  const esAdmin = usuario.rol === 'administrador';
  const deshabilitado = cargando || esUsuarioActual;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={esAdmin}
        aria-label={`Cambiar rol de ${usuario.nombre}`}
        title={esUsuarioActual ? 'No puedes cambiar tu propio rol' : undefined}
        disabled={deshabilitado}
        onClick={() => onCambiar(esAdmin ? 'nuevo_integrante' : 'administrador')}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:ring-offset-1 shadow-inner disabled:cursor-not-allowed disabled:opacity-40 ${
          esAdmin ? 'bg-brand-orange' : 'bg-gray-200'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out ${
            esAdmin ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-xs font-semibold text-gray-600">
        {cargando
          ? 'Actualizando…'
          : esUsuarioActual
            ? `${etiquetaRol(usuario.rol)} · Tú`
            : etiquetaRol(usuario.rol)}
      </span>
    </div>
  );
}

function BarraProgreso({ valor, alto = 'h-1.5' }: { valor: number; alto?: string }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-gray-100 ${alto}`}>
      <div
        className="h-full rounded-full bg-brand-orange transition-all"
        style={{ width: `${Math.min(100, Math.max(0, valor))}%` }}
      />
    </div>
  );
}

function CeldaProgreso({
  progreso,
  cargando,
  onVerDetalle,
}: {
  progreso: ProgresoPasante | undefined;
  cargando: boolean;
  onVerDetalle: (p: ProgresoPasante) => void;
}) {
  if (cargando) {
    return <span className="text-xs text-gray-400">Cargando…</span>;
  }
  if (!progreso) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  return (
    <button
      type="button"
      onClick={() => onVerDetalle(progreso)}
      className="group flex w-full max-w-[160px] flex-col gap-1.5 text-left"
    >
      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
        <span>{Math.round(progreso.porcentaje_total)}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-orange opacity-0 transition-opacity group-hover:opacity-100">
          Ver detalle
        </span>
      </div>
      <BarraProgreso valor={progreso.porcentaje_total} />
    </button>
  );
}

const ETAPAS_PROGRESO = [
  { clave: 'porcentaje_ecosistema' as const, etiqueta: 'Ecosistema' },
  { clave: 'porcentaje_estudio' as const, etiqueta: 'Estudio' },
  { clave: 'porcentaje_encuesta' as const, etiqueta: 'Encuesta' },
];

function ModalDetalleProgreso({
  progreso,
  onCerrar,
}: {
  progreso: ProgresoPasante;
  onCerrar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{progreso.nombre ?? 'Progreso'}</h2>
            {progreso.email && <p className="text-sm text-gray-500">{progreso.email}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {ETAPAS_PROGRESO.map((etapa) => (
            <div key={etapa.clave}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">{etapa.etiqueta}</span>
                <span className="text-gray-500">{Math.round(progreso[etapa.clave])}%</span>
              </div>
              <div className="mt-1.5">
                <BarraProgreso valor={progreso[etapa.clave]} alto="h-2" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-sm font-bold text-gray-900">Progreso total</span>
          <span className="text-lg font-black text-brand-orange">
            {Math.round(progreso.porcentaje_total)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function UsuariosPage() {
  const { user: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [errorFila, setErrorFila] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [departamentoFiltro, setDepartamentoFiltro] = useState('');
  const [intentos, setIntentos] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null);

  // Progreso por usuario (Ecosistema/Estudio/Encuesta), cruzado por usuario_id.
  // Se carga completo una sola vez porque pagina distinto a la tabla de usuarios.
  const [progresoPorUsuario, setProgresoPorUsuario] = useState<Map<string, ProgresoPasante>>(
    new Map()
  );
  const [cargandoProgreso, setCargandoProgreso] = useState(true);
  const [detalleProgreso, setDetalleProgreso] = useState<ProgresoPasante | null>(null);

  useEffect(() => {
    let cancelado = false;
    progresoService
      .listarTodoAdmin()
      .then((data) => {
        if (cancelado) return;
        setProgresoPorUsuario(new Map(data.map((p) => [p.usuario_id, p])));
      })
      .catch(() => {
        // El progreso es un dato complementario: si falla, la tabla de
        // usuarios sigue funcionando, solo se ve "—" en esa columna.
      })
      .finally(() => {
        if (!cancelado) setCargandoProgreso(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const puedeEditarRoles = usuarioActual?.rol === 'administrador';
  const hayFiltrosActivos = !!busqueda || !!departamentoFiltro;

  const esUsuarioActual = (usuario: UsuarioListado) =>
    !!usuarioActual &&
    usuarioActual.email.toLowerCase() === usuario.email.toLowerCase();

  // Espera a que el usuario deje de tipear antes de pegar al backend.
  useEffect(() => {
    const id = setTimeout(() => {
      setBusquedaDebounced(busqueda.trim());
      setPagina(1);
    }, 400);
    return () => clearTimeout(id);
  }, [busqueda]);

  // Recarga cuando cambia el filtro, página o tras reintentar.
  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    usuarioService
      .listar({
        nombre: busquedaDebounced || undefined,
        departamento: departamentoFiltro || undefined,
        pagina,
        limite: USUARIOS_POR_PAGINA,
      })
      .then((data) => {
        if (!cancelado) {
          setUsuarios(data.usuarios);
          setPaginacion(data.paginacion);
        }
      })
      .catch((err: Error) => {
        if (!cancelado) setError(err.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [busquedaDebounced, departamentoFiltro, pagina, intentos]);

  const cambiarDepartamentoFiltro = (valor: string) => {
    setDepartamentoFiltro(valor);
    setPagina(1);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setDepartamentoFiltro('');
    setPagina(1);
  };

  const cambiarRol = async (usuario: UsuarioListado, nuevoRol: RolEditable) => {
    if (esUsuarioActual(usuario)) return;

    const rolAnterior = usuario.rol;
    setActualizandoId(usuario.id);
    setErrorFila(null);
    
    // Optimista
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? { ...u, rol: nuevoRol } : u))
    );

    try {
      const actualizado = await usuarioService.actualizarRol(usuario.id, nuevoRol);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? actualizado : u))
      );
    } catch (err) {
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, rol: rolAnterior } : u))
      );
      setErrorFila((err as Error).message);
    } finally {
      setActualizandoId(null);
    }
  };

  // Administradores primero; dentro de cada grupo, orden alfabético por nombre.
  const usuariosOrdenados = [...usuarios].sort((a, b) => {
    const prioridad = (u: UsuarioListado) => (u.rol === 'administrador' ? 0 : 1);
    const diff = prioridad(a) - prioridad(b);
    return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre, 'es');
  });

  // Verificación de expiración de sesión
  const esErrorSesion = error?.toLowerCase().includes('token') || error?.toLowerCase().includes('expirad');

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div className="w-full flex-1 px-4 py-8 sm:px-6 lg:px-10 xl:px-14 bg-[#f8f9fa] min-h-screen">
      
      {/* HEADER ELEGANTE */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-orange mb-2">
            Gestión de Personal
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Usuarios
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Directorio y control de accesos de Delphos Onboarding.
          </p>
        </div>
        
        {!cargando && !error && paginacion && (
          <div className="flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-3">Total Registrados</span>
            <span className="text-base font-black text-gray-900">{paginacion.total}</span>
          </div>
        )}
      </header>

      {/* CONTENEDOR PRINCIPAL TIPO TARJETA */}
      <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100">
        <Eyebrow>Directorio</Eyebrow>

        {/* BARRA DE FILTROS */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all outline-none shadow-sm"
            />
          </div>
          
          <SelectorDepartamento value={departamentoFiltro} onChange={cambiarDepartamentoFiltro} />

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="text-xs font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-brand-orange px-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* ALERTA DE ERROR AL ACTUALIZAR FILA */}
        {errorFila && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-600 flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            No se pudo actualizar el rol: {errorFila}
          </div>
        )}

        {/* CONTENIDO (Tabla, Spinners o Errores) */}
        {cargando ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
            <p className="text-sm font-medium text-gray-500 animate-pulse">Cargando directorio...</p>
          </div>
        ) : error ? (
          esErrorSesion ? (
            <div className="py-12 flex justify-center">
              <SessionExpired />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-base font-bold text-gray-900">No se pudo cargar el listado</p>
              <p className="max-w-sm text-sm text-gray-500">{error}</p>
              <button
                type="button"
                onClick={() => setIntentos((n) => n + 1)}
                className="mt-2 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-md"
              >
                Reintentar
              </button>
            </div>
          )
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <div className="h-16 w-16 mb-2 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {hayFiltrosActivos ? 'Sin coincidencias' : 'Directorio vacío'}
            </p>
            <p className="text-sm text-gray-500 max-w-sm">
              {hayFiltrosActivos
                ? 'No encontramos ningún usuario que coincida con tu búsqueda. Intenta con otros filtros.'
                : 'Los nuevos usuarios registrados aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Nombre</th>
                  <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Correo Electrónico</th>
                  <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Departamento</th>
                  <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Progreso</th>
                  <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Rol & Accesos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuariosOrdenados.map((usuario) => (
                  <tr key={usuario.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-5 font-bold text-gray-900">{usuario.nombre}</td>
                    <td className="px-4 py-5 font-medium text-gray-500">{usuario.email}</td>
                    <td className="px-4 py-5 font-medium text-gray-500">
                      {usuario.departamento ? (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {usuario.departamento}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-5">
                      <CeldaProgreso
                        progreso={progresoPorUsuario.get(usuario.id)}
                        cargando={cargandoProgreso}
                        onVerDetalle={setDetalleProgreso}
                      />
                    </td>
                    <td className="px-4 py-5">
                      {puedeEditarRoles && esRolEditable(usuario.rol) ? (
                        <ToggleRol
                          usuario={usuario}
                          cargando={actualizandoId === usuario.id}
                          esUsuarioActual={esUsuarioActual(usuario)}
                          onCambiar={(nuevoRol) => cambiarRol(usuario, nuevoRol)}
                        />
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-bold text-brand-orange border border-brand-orange/20">
                          {etiquetaRol(usuario.rol)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINACIÓN E IMPORTACIÓN */}
        {!cargando && !error && paginacion && (
          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <Paginador paginacion={paginacion} onCambiarPagina={setPagina} />
          </div>
        )}
      </section>

      {detalleProgreso && (
        <ModalDetalleProgreso
          progreso={detalleProgreso}
          onCerrar={() => setDetalleProgreso(null)}
        />
      )}
    </div>
  );
}