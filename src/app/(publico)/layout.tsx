'use client';

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { useProgresoStore } from "@/lib/useProgresoStore";
import Navbar from "@/components/global/Navbar";
import ChatbotFlotante from "@/components/global/ChatbotFlotante";
import SessionExpired from "@/components/global/SessionExpired";
import FooterPublico from "@/components/global/FooterPublico";

export default function PublicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const mostrarFooter = pathname !== '/ecosistema';
  
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const TIEMPO_INACTIVIDAD_MS = 30 * 60 * 1000; // 30 minutos

  const resetearTemporizador = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      authService.logout();
      useProgresoStore.getState().resetear();
      setSessionExpiredMsg(true);
    }, TIEMPO_INACTIVIDAD_MS);
  };

  // =======================================================================
  // 🚀 OPTIMIZACIÓN DE RENDIMIENTO EXTREMA (Throttling)
  // =======================================================================
  useEffect(() => {
    if (isAuthenticated && !sessionExpiredMsg) {
      const eventosActividad = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      let ultimaActividad = Date.now();

      const manejarActividad = () => {
        const ahora = Date.now();
        // Solo ejecuta el reseteo si han pasado más de 5 segundos desde el último movimiento.
        // Esto ahorra miles de ejecuciones innecesarias de JavaScript en el navegador.
        if (ahora - ultimaActividad > 5000) {
          ultimaActividad = ahora;
          resetearTemporizador();
        }
      };

      resetearTemporizador(); // Arranca el reloj inicial

      // Usamos 'passive: true' para que el scroll no se trabe (Best practice de React)
      eventosActividad.forEach(evento => 
        document.addEventListener(evento, manejarActividad, { passive: true })
      );

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        eventosActividad.forEach(evento => 
          document.removeEventListener(evento, manejarActividad)
        );
      };
    }
  }, [isAuthenticated, sessionExpiredMsg]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !sessionExpiredMsg) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router, sessionExpiredMsg]);

  if (sessionExpiredMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <SessionExpired />
      </div>
    );
  }

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

  if (!isAuthenticated) {
    return null; 
  }

  return (
    <div className="min-h-screen flex flex-col bg-white relative">
      <Navbar />
      
      <main className="flex flex-1 flex-col pt-[72px] lg:pt-[84px] bg-white">
        {children}
      </main>

      {mostrarFooter && <FooterPublico />}

      <ChatbotFlotante />
    </div>
  );
}