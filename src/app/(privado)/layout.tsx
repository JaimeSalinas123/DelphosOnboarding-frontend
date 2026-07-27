'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PrivadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si ya terminó de cargar la verificación...
    if (!isLoading) {
      // 1. Si no hay sesión, patada al login
      if (!isAuthenticated) {
        router.push('/login');
      } 
      // 2. Si hay sesión, pero es un pasante (nuevo_integrante), patada al onboarding
      else if (user?.rol !== 'administrador' && user?.rol !== 'evaluador') {
        router.push('/onboarding');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Pantalla de carga mientras lee los datos del localstorage
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0c]">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin"></div>
        </div>
        <p className="mt-5 text-gray-500 text-sm font-medium tracking-widest uppercase animate-pulse">
          Verificando credenciales...
        </p>
      </div>
    );
  }

  // Si no está autenticado o no tiene los permisos, devolvemos null para no renderizar nada 
  // del panel secreto mientras el router lo redirige a otra pantalla.
  if (!isAuthenticated || (user?.rol !== 'administrador' && user?.rol !== 'evaluador')) {
    return null;
  }

  // Si sobrevive a todos los filtros, ¡es de Capital Humano! Le mostramos el contenido.
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 
        Nota: Aquí podrías importar un NavbarDistinto para el admin en el futuro,
        diferente al que usan los pasantes.
      */}
      <main className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}