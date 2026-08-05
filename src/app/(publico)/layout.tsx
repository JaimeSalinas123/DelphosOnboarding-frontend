'use client';

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
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
  
  // Estado para controlar si mostramos la pantalla de inactividad
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);
  
  // Referencia para el temporizador de inactividad
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 30 minutos en milisegundos
  const TIEMPO_INACTIVIDAD_MS = 30 * 60 * 1000;

  // Función para reiniciar el cronómetro
  const resetearTemporizador = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      authService.logout(); 
      setSessionExpiredMsg(true); 
    }, TIEMPO_INACTIVIDAD_MS);
  };

  // Efecto para escuchar la actividad del usuario (mueve el mouse, teclea, etc.)
  useEffect(() => {
    if (isAuthenticated && !sessionExpiredMsg) {
      const eventosActividad = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      const manejarActividad = () => resetearTemporizador();

      resetearTemporizador(); // Arranca el reloj

      eventosActividad.forEach(evento => document.addEventListener(evento, manejarActividad));

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        eventosActividad.forEach(evento => document.removeEventListener(evento, manejarActividad));
      };
    }
  }, [isAuthenticated, sessionExpiredMsg]);

  // Si el sistema revisa la memoria y NO estás logueado (y no es por inactividad), expulsa al login.
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !sessionExpiredMsg) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router, sessionExpiredMsg]);

  // CASO 1: BLOQUEO POR INACTIVIDAD (Renderizamos el nuevo componente global)
  if (sessionExpiredMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <SessionExpired />
      </div>
    );
  }

  // CASO 2: PANTALLA DE CARGA (Refresh)
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

  // CASO 3: INTRUSO
  if (!isAuthenticated) {
    return null; 
  }

  // CASO 4: CREDENCIALES VÁLIDAS
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      <Navbar />
      
      <main className="flex flex-1 flex-col pt-[68px]">
        {children}
      </main>

      {mostrarFooter && <FooterPublico />}

      {/* El asistente virtual vive exclusivamente en las rutas protegidas */}
      <ChatbotFlotante />
    </div>
  );
}