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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        {/* Loader optimizado: Doble anillo con opacidades para un efecto más corporativo */}
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin"></div>
          <div className="absolute w-6 h-6 bg-brand-orange/10 rounded-full animate-pulse"></div>
        </div>
        <p className="mt-5 text-gray-500 text-sm font-medium tracking-widest uppercase animate-pulse">
          Verificando entorno...
        </p>
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
    // Agregamos min-h-screen al contenedor principal para evitar espacios en blanco debajo
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      {/* 
        1. Cambiamos <div> por <main> por buenas prácticas de semántica web y SEO.
        2. Usamos pt-[68px] exactos, ya que esa es la altura real de tu Navbar en CSS, 
           evitando que el contenido quede montado o muy despegado. 
      */}
      <main className="flex flex-1 flex-col pt-[68px]">
        {children}
      </main>
    </div>
  );
}