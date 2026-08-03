'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/global/Navbar";
import ChatbotFlotante from "@/components/global/ChatbotFlotante"; // <-- Importado aquí correctamente

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
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
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
  if (!isAuthenticated) {
    return null; 
  }

  // CASO 3: Tienes credenciales válidas. Mostramos Navbar, contenido y el Chatbot Flotante.
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      <Navbar />
      
      <main className="flex flex-1 flex-col pt-[68px]">
        {children}
      </main>

      {/* El asistente virtual ahora vive exclusivamente en las rutas protegidas */}
      <ChatbotFlotante />
    </div>
  );
}