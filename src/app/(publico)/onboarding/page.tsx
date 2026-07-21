'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { authService } from '@/services/authService';

// Definimos las etapas fuera del componente para mantener el código limpio
const ONBOARDING_STAGES = [
  { id: 1, title: 'Bienvenida', desc: 'Conoce la historia de Delphos y tu punto de partida personalizado.' },
  { id: 2, title: 'Explora', desc: 'Recorre el ecosistema, los clientes reales y el Círculo Virtuoso.' },
  { id: 3, title: 'Practica', desc: 'Simulacros, flashcards y chatbot para pulir tu presentación.' },
  { id: 4, title: 'Preséntate', desc: 'Completa tu checklist y queda listo frente al evaluador.' },
];

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null);
  
  // Estados para controlar la lógica de la primera vez
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoadingTransition, setIsLoadingTransition] = useState(false);
  
  // Estado para controlar la animación CSS (fade-in / fade-out)
  const [showAnimation, setShowAnimation] = useState(false);

  // Nuevo estado para saber qué etapa está activa (El puntito naranja)
  const [activeStage, setActiveStage] = useState(1);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);

      // =========================================================
      // LÓGICA DE DÍAS (FRONTEND) PARA MOVER EL PUNTITO NARANJA
      // =========================================================
      // Buscamos la fecha de registro (ajusta el nombre del campo según tu BD)
      const dateString = currentUser.created_at || currentUser.fecha_registro;
      
      if (dateString) {
        // Si tenemos la fecha, calculamos cuántos días han pasado
        const start = new Date(dateString);
        start.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) setActiveStage(1); // Día 1
        else if (diffDays === 1) setActiveStage(2); // Día 2
        else if (diffDays === 2 || diffDays === 3) setActiveStage(3); // Día 3 y 4
        else setActiveStage(4); // Día 5 o más
      } else {
        // PLAN B: Si no hay fecha de registro, nos basamos en el día actual de la semana
        // (0 = Dom, 1 = Lun, 2 = Mar, 3 = Mié, 4 = Jue, 5 = Vie, 6 = Sáb)
        const currentDay = new Date().getDay(); 
        if (currentDay <= 1) setActiveStage(1); // Lunes o Domingo
        else if (currentDay === 2) setActiveStage(2); // Martes
        else if (currentDay === 3 || currentDay === 4) setActiveStage(3); // Miércoles y Jueves
        else setActiveStage(4); // Viernes y Sábado
      }

      // Lógica para mostrar la pantalla de bienvenida completa (Pantalla 1)
      if (!authService.haVistoBienvenida(currentUser.email)) {
        setIsFirstLogin(true);
        setTimeout(() => setShowAnimation(true), 150);
      }
    }
  }, []);

  const handleComenzar = async () => {
    setIsLoadingTransition(true);

    try {
      if (user?.email) {
        authService.marcarBienvenidaVista(user.email);
      }
      // await authService.completarPrimerIngreso(user.email);

      setShowAnimation(false);

      setTimeout(() => {
        setIsFirstLogin(false);
      }, 500);

    } catch (error) {
      console.error("Error al actualizar el estado de onboarding:", error);
      setIsFirstLogin(false);
    } finally {
      setIsLoadingTransition(false);
    }
  };

  // ============================================================================
  // PANTALLA 1: ANIMACIÓN DE BIENVENIDA 
  // ============================================================================
  if (isFirstLogin) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob-float absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-orange/10 blur-3xl" />
          <div className="animate-blob-float-delayed absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-brand-orange/10 blur-3xl" />
          <div className="animate-blob-float absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-brand-black/5 blur-3xl" />
        </div>

        <div className="relative flex min-h-full flex-col items-center justify-center px-6 py-16">
          <div className="w-full max-w-2xl text-center">
            <div
              className={`mx-auto mb-8 flex justify-center transition-all duration-700 ease-out ${
                showAnimation ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-4 scale-95 opacity-0'
              }`}
            >
              <Image
                src="/images/logo.svg"
                alt="Delphos Logo"
                width={190}
                height={60}
                priority
                style={{ width: 'auto', height: '56px' }}
              />
            </div>

            <div
              className={`mb-6 inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-orange transition-all delay-150 duration-700 ease-out ${
                showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
              Primer ingreso
            </div>

            <h1
              className={`text-4xl font-extrabold tracking-tight text-brand-black transition-all delay-300 duration-700 ease-out md:text-6xl ${
                showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
            >
              ¡Bienvenido, <span className="text-brand-orange">{user?.nombre || 'Integrante'}</span>!
            </h1>

            <div
              className={`mx-auto mt-6 h-1 rounded-full bg-brand-orange transition-all delay-500 duration-700 ease-out ${
                showAnimation ? 'w-24 opacity-100' : 'w-0 opacity-0'
              }`}
            />

            <p
              className={`mx-auto mt-8 max-w-xl text-lg leading-relaxed text-brand-gray transition-all delay-500 duration-700 ease-out ${
                showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
            >
              Esta será tu primera semana en{' '}
              <span className="font-semibold text-brand-black">Deinsa Global Intelligence</span>, donde harás
              tu presentación de Delphos. Esta página ha sido creada para ti, para que puedas aprender más
              sobre el ecosistema.
            </p>

            <div
              className={`mt-12 transition-all delay-700 duration-700 ease-out ${
                showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
            >
              <button
                onClick={handleComenzar}
                disabled={isLoadingTransition}
                className={`group inline-flex items-center gap-2 rounded-full px-10 py-4 text-lg font-bold text-white shadow-[0_10px_30px_rgba(216,90,48,0.35)] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-brand-orange/30 ${
                  isLoadingTransition
                    ? 'cursor-not-allowed bg-brand-gray-light'
                    : 'bg-brand-orange hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(216,90,48,0.45)]'
                }`}
              >
                {isLoadingTransition ? 'Preparando tu espacio...' : 'Comenzar'}
                {!isLoadingTransition && (
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // PANTALLA 2: DASHBOARD PRINCIPAL 
  // ============================================================================
  return (
    <main className="w-full bg-white">
      {/* SECCIÓN 1: Hero Principal (Nodos y Textos) */}
      <section className="min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">
          
          {/* Lado Izquierdo - Textos */}
          <div className="space-y-6 md:space-y-8">
            <div className="flex items-center gap-4 text-xs font-semibold tracking-widest text-gray-500 uppercase">
              <span className="w-8 h-[2px] bg-brand-orange"></span>
              ONBOARDING INTERACTIVO · DEINSA GLOBAL
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-black leading-[1.1] tracking-tight">
              Prepárate para presentar <span className="text-brand-orange block lg:inline">Delphos</span> en tu primera semana.
            </h2>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed">
              Un recorrido guiado que te lleva de la bienvenida a la práctica y al dominio de la suite de gestión corporativa. Contenido, simulacros y seguimiento de tu avance, en un solo lugar.
            </p>

            {/* Botón Versión Computadora */}
            <div className="hidden lg:flex items-center gap-4 pt-4">
              <Link href="/ecosistema" className="px-8 py-4 bg-brand-orange text-white font-bold rounded-lg shadow-[0_8px_20px_rgba(216,90,48,0.25)] hover:bg-orange-600 hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(216,90,48,0.35)] transition-all duration-300 flex items-center justify-center gap-2">
                Ver Ecosistema Delphos
              </Link>
            </div>
          </div>

          {/* Lado Derecho - Gráfico Interactivo (Nodos) */}
          <div className="relative w-full aspect-square max-w-[320px] sm:max-w-[400px] lg:max-w-[500px] mx-auto flex items-center justify-center lg:ml-auto">
            
            {/* Círculo punteado exterior */}
            <div className="absolute inset-2 sm:inset-0 rounded-full border border-dashed border-gray-200"></div>
            
            {/* Círculo sólido interior (órbita) */}
            <div className="absolute inset-12 sm:inset-16 lg:inset-20 rounded-full border border-gray-100 bg-slate-50/30">
              
              {/* Líneas Radiales */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <div className="absolute h-full w-[1px] bg-gray-200"></div>
                <div className="absolute h-full w-[1px] bg-gray-200 rotate-[60deg]"></div>
                <div className="absolute h-full w-[1px] bg-gray-200 rotate-[120deg]"></div>
              </div>

              {/* Nodos Satélite Estáticos */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="absolute -top-6 text-[10px] text-gray-400 font-mono tracking-wider whitespace-nowrap hidden sm:block">Delphos Continumm</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-orange border-[3px] border-white shadow-sm z-10"></div>
              </div>

              <div className="absolute top-[13.4%] -right-3 flex items-center translate-x-1/2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-[3px] border-gray-200 z-10"></div>
                <span className="absolute left-8 text-[10px] text-gray-400 font-mono tracking-wider whitespace-nowrap hidden sm:block">Delphos Core</span>
              </div>

              <div className="absolute bottom-[13.4%] -right-3 flex items-center translate-x-1/2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-[3px] border-gray-200 z-10"></div>
                <span className="absolute left-8 text-[10px] text-gray-400 font-mono tracking-wider whitespace-nowrap hidden sm:block">Delphos Porta</span>
              </div>

              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-[3px] border-gray-200 z-10"></div>
                <span className="absolute top-8 text-[10px] text-gray-400 font-mono tracking-wider whitespace-nowrap hidden sm:block">Delphos Funciona</span>
              </div>

              <div className="absolute bottom-[13.4%] -left-3 flex items-center -translate-x-1/2">
                <span className="absolute right-8 text-[10px] text-gray-400 font-mono tracking-wider whitespace-nowrap hidden sm:block">Delphos BI</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-[3px] border-gray-200 z-10"></div>
              </div>

              <div className="absolute top-[13.4%] -left-3 flex items-center -translate-x-1/2">
                <span className="absolute right-8 text-[10px] text-gray-400 font-mono tracking-wider whitespace-nowrap hidden sm:block">Delphos Elite</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-[3px] border-gray-200 z-10"></div>
              </div>
            </div>

            {/* Nodo Central */}
            <div className="relative z-20 bg-[#0f0f0f] text-white w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Delphos</span>
              <span className="text-[9px] sm:text-[10px] lg:text-[10px] text-gray-400 tracking-[0.25em] mt-2 font-mono">ONBOARDING</span>
            </div>

          </div>

          {/* Botón Versión Celular */}
          <div className="flex lg:hidden w-full pt-6 justify-center">
            <Link href="/ecosistema" className="w-full sm:w-auto px-8 py-4 bg-brand-orange text-white font-bold rounded-lg shadow-lg hover:bg-orange-600 transition-colors flex items-center justify-center text-center">
              Ver Ecosistema Delphos
            </Link>
          </div>

        </div>
      </section>

      {/* SECCIÓN 2: El Recorrido (4 Etapas - Dinámicas) */}
      <section className="bg-slate-50/50 border-t border-gray-100 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mb-14 lg:mb-20">
            <div className="flex items-center gap-4 text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">
              <span className="w-8 h-[2px] bg-brand-orange"></span>
              EL RECORRIDO
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black leading-tight tracking-tight mb-5">
              Cuatro etapas, de tu primer día a listo para presentar.
            </h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl">
              Cada etapa combina contenido y práctica, y se va guiando automáticamente a medida que avanzas en la semana.
            </p>
          </div>

          {/* Cuadrícula de las 4 etapas dinámicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-0">
            {ONBOARDING_STAGES.map((stage, index) => {
              const isActive = activeStage === stage.id;
              
              return (
                <div key={stage.id} className={`lg:px-8 ${index === 0 ? 'lg:pr-8 lg:px-0' : 'lg:border-l lg:border-gray-200'}`}>
                  {/* Número siempre en naranja como en la imagen */}
                  <span className="text-brand-orange font-mono text-sm font-semibold tracking-wider">
                    0{stage.id}
                  </span>
                  
                  <div className="mt-5 mb-6">
                    {/* Renderizado condicional del puntito: Si es activo, bolita naranja con sombra. Si no, aro gris vacío */}
                    {isActive ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-brand-orange shadow-[0_0_12px_rgba(216,90,48,0.5)] transition-all duration-300"></div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 transition-all duration-300"></div>
                    )}
                  </div>
                  
                  {/* Títulos y textos siempre en sus colores estándar de acuerdo al diseño base */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}