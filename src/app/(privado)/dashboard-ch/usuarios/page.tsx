'use client';

import { useEffect, useState } from 'react';
import { usuarioService, type UsuarioListado } from '@/services/usuarioService';
import { etiquetaRol } from '@/lib/roles';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioListado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = () => {
    setCargando(true);
    setError(null);
    usuarioService
      .listar()
      .then(setUsuarios)
      .catch((err: Error) => setError(err.message))
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  return (
    <div className="mx-auto w-full max-w-screen-xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl">Usuarios</h1>
          <p className="mt-1 text-sm text-body">
            Usuarios registrados en Delphos Onboarding.
          </p>
        </div>
        {!cargando && !error && (
          <span className="rounded-full bg-neutral-secondary px-3 py-1 text-xs font-medium text-body">
            {usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}
          </span>
        )}
      </header>

      <section className="mt-6 overflow-hidden rounded-2xl border border-default bg-neutral-primary shadow-sm">
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
              onClick={cargar}
              className="mt-1 rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              Reintentar
            </button>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
            <p className="text-sm font-medium text-heading">
              Todavía no hay usuarios registrados
            </p>
            <p className="text-xs text-body">
              Los nuevos registros van a aparecer acá.
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
                {usuarios.map((usuario) => (
                  <tr key={usuario.id} className="transition-colors hover:bg-neutral-secondary/40">
                    <td className="px-5 py-3 font-medium text-heading">{usuario.nombre}</td>
                    <td className="px-5 py-3 text-body">{usuario.email}</td>
                    <td className="px-5 py-3 text-body">{usuario.departamento || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-brand-orange/10 px-2.5 py-1 text-xs font-medium text-brand-orange">
                        {etiquetaRol(usuario.rol)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
