'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NavbarPrivado from "@/components/global/NavbarPrivado";
import SidebarPrivado from "@/components/global/SidebarPrivado";

/** Roles con acceso al panel privado. Único lugar donde se define esta lista. */
const ROLES_CON_ACCESO = ['administrador', 'evaluador'];

function tieneAcceso(rol: string | undefined) {
  return !!rol && ROLES_CON_ACCESO.includes(rol);
}

export default function PrivadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si ya terminó de cargar la verificación...
    if (isLoading) return;
    // 1. Si no hay sesión, patada al login.
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    // 2. Si hay sesión pero el rol no tiene acceso (ej. nuevo_integrante), patada al onboarding.
    if (!tieneAcceso(user?.rol)) {
      router.push('/onboarding');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Pantalla de carga mientras lee los datos del localStorage. Mismo fondo
  // blanco que el panel ya cargado, para no parpadear de oscuro a claro.
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-primary">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange/20 border-t-brand-orange" />
        <p className="mt-4 text-sm font-medium uppercase tracking-widest text-brand-gray">
          Verificando credenciales...
        </p>
      </div>
    );
  }

  // Si no está autenticado o el rol no tiene acceso, no renderizamos nada del
  // panel mientras el useEffect de arriba redirige a otra pantalla.
  if (!isAuthenticated || !tieneAcceso(user?.rol) || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-secondary">
      <NavbarPrivado user={user} />
      <div className="flex flex-1 flex-col md:flex-row">
        <SidebarPrivado />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
