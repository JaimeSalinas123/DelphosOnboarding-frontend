'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/global/Navbar";

export default function PublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si el sistema ya terminó de revisar la memoria y se da cuenta de que NO estás logueado,
    // te expulsa inmediatamente a la pantalla de login.
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // CASO 1: Le diste F5 (Refresh) a la página.
  // Mientras Next.js revisa el localStorage, mostramos una pantalla de carga.
  // Esto evita que veas la página por un microsegundo y luego te parpadee al redirigir.
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-primary">
        <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-brand-gray text-sm font-medium">Verificando entorno seguro...</p>
      </div>
    );
  }

  // CASO 2: Eres un intruso (o abriste una pestaña de incógnito).
  // Si no estás logueado, retornamos 'null' (pantalla en blanco) para no renderizar
  // absolutamente nada del ecosistema mientras el useEffect de arriba te empuja al login.
  if (!isAuthenticated) {
    return null; 
  }

  // CASO 3: Tienes credenciales válidas.
  // Te mostramos el Navbar y la sección a la que querías entrar (Ecosistema u Onboarding).
  return (
    <>
      <Navbar />
      {/* pt-16 empuja el contenido hacia abajo para que el Navbar fijo no lo tape */}
      <div className="flex flex-1 flex-col pt-16">
        {children}
      </div>
    </>
  );
}