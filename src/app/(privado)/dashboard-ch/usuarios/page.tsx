'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  usuarioService,
  type RolEditable,
  type UsuarioListado,
} from '@/services/usuarioService';
import { etiquetaRol } from '@/lib/roles';
import { DEPARTAMENTOS } from '@/lib/departamentos';
import type { Paginacion } from '@/lib/paginacion';
import Paginador from '@/components/global/Paginador';

const USUARIOS_POR_PAGINA = 10;

/** Roles que el toggle de la tabla entiende; todo lo demás (ej. 'evaluador') se ve como badge fijo. */
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
        title={esUsuarioActual ? 'No podés cambiar tu propio rol' : undefined}
        disabled={deshabilitado}
        onClick={() => onCambiar(esAdmin ? 'nuevo_integrante' : 'administrador')}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 ${
          esAdmin ? 'bg-brand-orange' : 'bg-slate-300'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            esAdmin ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-xs font-medium text-body">
        {cargando
          ? 'Actualizando…'
          : esUsuarioActual
            ? `${etiquetaRol(usuario.rol)} · tú`
            : etiquetaRol(usuario.rol)}
      </span>
    </div>
  );
}

const selectClass =
  'rounded-lg border border-default bg-neutral-primary px-4 py-2.5 text-sm text-heading outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20';

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

  const puedeEditarRoles = usuarioActual?.rol === 'administrador';
  const hayFiltrosActivos = !!busqueda || !!departamentoFiltro;

  const esUsuarioActual = (usuario: UsuarioListado) =>
    !!usuarioActual &&
    usuarioActual.email.toLowerCase() === usuario.email.toLowerCase();

  // Espera a que el usuario deje de tipear antes de pegarle al backend.
  useEffect(() => {
    const id = setTimeout(() => {
      setBusquedaDebounced(busqueda.trim());
      setPagina(1);
    }, 400);
    return () => clearTimeout(id);
  }, [busqueda]);

  // Recarga cuando cambia el filtro por departamento, la búsqueda (ya
  // debounced), la página o cuando se pide reintentar tras un error.
  useEffect(() => {
    let cancelado = false;
    // El flag de carga/error se resetea al iniciar cada pedido: es el
    // patrón estándar de fetch-con-spinner (react.dev/learn/synchronizing-with-effects#fetching-data);
    // la regla nueva de React Compiler lo marca como "derived state" pero acá es intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // Defensa extra: aunque el switch ya viene deshabilitado para tu propia
    // fila, no permitir el cambio si de alguna forma se llega a llamar igual.
    if (esUsuarioActual(usuario)) return;

    const rolAnterior = usuario.rol;
    setActualizandoId(usuario.id);
    setErrorFila(null);
    // Optimista: refleja el cambio ya, y lo revierte si el backend lo rechaza.
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

  return (
    <div className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl">Usuarios</h1>
          <p className="mt-1 text-sm text-body">
            Usuarios registrados en Delphos Onboarding.
          </p>
        </div>
        {!cargando && !error && paginacion && (
          <span className="rounded-full bg-neutral-secondary px-3 py-1 text-xs font-medium text-body">
            {paginacion.total} {paginacion.total === 1 ? 'usuario' : 'usuarios'}
          </span>
        )}
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre..."
          className="flex-1 rounded-lg border border-default bg-neutral-primary px-4 py-2.5 text-sm text-heading placeholder:text-body/50 outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
        />
        <select
          value={departamentoFiltro}
          onChange={(e) => cambiarDepartamentoFiltro(e.target.value)}
          className={`${selectClass} sm:w-56`}
        >
          <option value="">Todos los departamentos</option>
          {DEPARTAMENTOS.map((dep) => (
            <option key={dep} value={dep}>
              {dep}
            </option>
          ))}
        </select>
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="text-xs font-medium text-brand-gray transition-colors hover:text-brand-orange"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {errorFila && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
          No se pudo actualizar el rol: {errorFila}
        </div>
      )}

      <section className="mt-4 overflow-hidden rounded-2xl border border-default bg-neutral-primary shadow-sm">
        {cargando ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
            <p className="text-sm text-body">Cargando usuarios...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm font-medium text-heading">
              No se pudo cargar el listado
            </p>
            <p className="max-w-sm text-xs text-body">{error}</p>
            <button
              type="button"
              onClick={() => setIntentos((n) => n + 1)}
              className="mt-1 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              Reintentar
            </button>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
            <p className="text-sm font-medium text-heading">
              {hayFiltrosActivos
                ? 'Ningún usuario coincide con el filtro'
                : 'Todavía no hay usuarios registrados'}
            </p>
            <p className="text-xs text-body">
              {hayFiltrosActivos
                ? 'Probá con otro nombre o departamento.'
                : 'Los nuevos registros van a aparecer acá.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-default bg-neutral-secondary/60 text-xs uppercase tracking-wide text-brand-gray">
                  <th className="px-5 py-3 font-semibold">Nombre</th>
                  <th className="px-5 py-3 font-semibold">Correo</th>
                  <th className="px-5 py-3 font-semibold">Departamento</th>
                  <th className="px-5 py-3 font-semibold">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default">
                {usuariosOrdenados.map((usuario) => (
                  <tr key={usuario.id} className="transition-colors hover:bg-neutral-secondary/40">
                    <td className="px-5 py-3 font-medium text-heading">{usuario.nombre}</td>
                    <td className="px-5 py-3 text-body">{usuario.email}</td>
                    <td className="px-5 py-3 text-body">{usuario.departamento || '—'}</td>
                    <td className="px-5 py-3">
                      {puedeEditarRoles && esRolEditable(usuario.rol) ? (
                        <ToggleRol
                          usuario={usuario}
                          cargando={actualizandoId === usuario.id}
                          esUsuarioActual={esUsuarioActual(usuario)}
                          onCambiar={(nuevoRol) => cambiarRol(usuario, nuevoRol)}
                        />
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-brand-orange/10 px-2.5 py-1 text-xs font-medium text-brand-orange">
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
        {!cargando && !error && paginacion && (
          <Paginador paginacion={paginacion} onCambiarPagina={setPagina} />
        )}
      </section>
    </div>
  );
}
