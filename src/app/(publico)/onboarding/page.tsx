'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, MotionConfig, AnimatePresence, type Variants } from 'framer-motion';
import { authService } from '@/services/authService';
import SessionExpired from '@/components/global/SessionExpired';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// =========================================================
// DATOS ESTÁTICOS
// =========================================================
const ONBOARDING_STAGES = [
  { id: 1, title: 'Bienvenida', desc: 'Conoce la historia de Delphos y tu punto de partida personalizado.' },
  { id: 2, title: 'Explora', desc: 'Recorre el ecosistema, los clientes reales y el Círculo Virtuoso.' },
  { id: 3, title: 'Practica', desc: 'Simulacros, flashcards y chatbot para pulir tu presentación.' },
  { id: 4, title: 'Preséntate', desc: 'Completa tu checklist y queda listo frente al evaluador.' },
];

// Barras de progreso ahora relacionadas 100% con las insignias
const PROGRESS_BARS = [
  { label: 'Mejorando mi Conocimiento', pct: 100 },
  { label: 'Maestro de la Suite', pct: 60 },
  { label: 'Listo para Presentar', pct: 15 },
];

// Nombres y estado de las insignias
const BADGES_DATA = [
  { label: 'Primer Día', earned: true },
  { label: 'Aprendiendo Delphos', earned: true },
  { label: 'Mejorando mi Conocimiento', earned: true },
  { label: 'Maestro de la Suite', earned: false },
  { label: 'Listo para Presentar', earned: false },
];

const STUDY_METHODS = [
  {
    id: 'chatbot',
    label: 'Chatbot',
    title: 'Resuelve dudas al instante',
    desc: 'Un asistente entrenado en la suite Delphos responde tus preguntas y te enlaza al contenido relevante.',
    feats: ['Respuestas contextualizadas', 'Enlaces a módulos y clientes', 'Disponible en todo el recorrido'],
    renderVisual: () => (
      <div className="flex flex-col gap-3 w-full font-sans">
        <div className="self-end bg-white border border-gray-200 rounded-2xl rounded-br-sm px-4 py-3 text-sm shadow-sm max-w-[85%] lg:max-w-[75%]">
          <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1">Tú</div>
          <p className="text-slate-700">¿Qué módulo cubre la facturación electrónica?</p>
        </div>
        <div className="self-start bg-brand-orange/10 border border-brand-orange/20 rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow-sm max-w-[85%] lg:max-w-[75%]">
          <div className="text-[10px] text-brand-orange font-mono uppercase tracking-widest mb-1">Asistente Delphos</div>
          <p className="text-slate-800">El módulo de Finanzas. ¿Quieres ver un cliente real que lo use?</p>
        </div>
        <div className="self-end bg-white border border-gray-200 rounded-2xl rounded-br-sm px-4 py-3 text-sm shadow-sm max-w-[85%] lg:max-w-[75%]">
          <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mb-1">Tú</div>
          <p className="text-slate-700">Sí, muéstrame uno del sector retail.</p>
        </div>
      </div>
    )
  },
  {
    id: 'cuestionarios',
    label: 'Cuestionarios',
    title: 'Mide lo que ya dominas',
    desc: 'Preguntas de opción múltiple por tema para detectar qué necesitas reforzar antes de presentar.',
    feats: ['Por módulo y por dificultad', 'Resultado inmediato', 'Repite hasta afinar'],
    renderVisual: () => (
      <div className="flex flex-col gap-3 w-full font-sans">
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border-2 border-brand-orange bg-brand-orange/5 shadow-sm transition-all">
          <div className="w-5 h-5 rounded-full border-4 border-brand-orange bg-white flex-shrink-0"></div>
          <span className="text-sm font-semibold text-brand-orange leading-tight">Gestión integral de procesos corporativos</span>
        </div>
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-gray-200 bg-white shadow-sm transition-all opacity-70">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex-shrink-0"></div>
          <span className="text-sm font-medium text-gray-600 leading-tight">Solo control de inventario</span>
        </div>
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-gray-200 bg-white shadow-sm transition-all opacity-70">
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex-shrink-0"></div>
          <span className="text-sm font-medium text-gray-600 leading-tight">Una hoja de cálculo avanzada</span>
        </div>
      </div>
    )
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    title: 'Repaso rápido de conceptos',
    desc: 'Tarjetas de concepto y definición para memorizar los términos clave de Delphos en minutos.',
    feats: ['Concepto / definición', 'Baraja por tema', 'Ideal para repaso previo'],
    renderVisual: () => (
      <div className="w-full flex justify-center perspective-[1000px]">
        <div className="w-full max-w-[280px] bg-white border border-gray-200 rounded-2xl shadow-lg p-6 h-48 sm:h-56 flex flex-col items-center justify-center relative hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-pointer">
          <span className="absolute top-4 left-5 text-[10px] sm:text-xs font-mono text-gray-400 tracking-widest">03 / 20</span>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-800 text-center tracking-tight">Círculo Virtuoso</h4>
          <span className="absolute bottom-4 right-5 text-[10px] sm:text-xs font-bold text-brand-orange tracking-wider">Toca para revelar &rarr;</span>
        </div>
      </div>
    )
  },
  {
    id: 'v_f',
    label: 'Verdadero / Falso',
    title: 'Refuerza con decisiones rápidas',
    desc: 'Afirmaciones sobre la suite que respondes al momento, para fijar los detalles que más se preguntan.',
    feats: ['Respuesta inmediata', 'Enfoque en detalles clave', 'Ritmo ágil'],
    renderVisual: () => (
      <div className="w-full flex flex-col gap-6 sm:gap-8 justify-center h-full">
        <p className="text-base sm:text-lg lg:text-xl font-semibold text-slate-800 text-center px-4 leading-relaxed">
          "Delphos permite seguir el avance de cada usuario en tiempo real."
        </p>
        <div className="flex gap-3 sm:gap-4 w-full max-w-sm mx-auto">
          <button className="flex-1 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-bold text-brand-orange bg-brand-orange/10 border-2 border-brand-orange shadow-sm hover:bg-brand-orange/20 transition-colors">
            Verdadero
          </button>
          <button className="flex-1 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-bold text-gray-500 bg-white border-2 border-gray-200 shadow-sm hover:border-gray-300 hover:text-gray-700 transition-colors">
            Falso
          </button>
        </div>
      </div>
    )
  }
];

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null);
  
  // Estados para la bienvenida
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoadingTransition, setIsLoadingTransition] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  // Estados para secciones de la página
  const [activeStage, setActiveStage] = useState(1);
  const [activeMethod, setActiveMethod] = useState(STUDY_METHODS[0].id);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);

      // LÓGICA DE DÍAS (FRONTEND) PARA MOVER EL PUNTITO NARANJA
      const dateString = currentUser.created_at || currentUser.fecha_registro;
      
      if (dateString) {
        const start = new Date(dateString);
        start.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) setActiveStage(1);
        else if (diffDays === 1) setActiveStage(2);
        else if (diffDays === 2 || diffDays === 3) setActiveStage(3);
        else setActiveStage(4);
      } else {
        const currentDay = new Date().getDay(); 
        if (currentDay <= 1) setActiveStage(1);
        else if (currentDay === 2) setActiveStage(2);
        else if (currentDay === 3 || currentDay === 4) setActiveStage(3);
        else setActiveStage(4);
      }

      // Mostrar Bienvenida si es necesario
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
      setShowAnimation(false);
      setTimeout(() => setIsFirstLogin(false), 500);
    } catch (error) {
      console.error("Error al actualizar el estado de onboarding:", error);
      setIsFirstLogin(false);
    } finally {
      setIsLoadingTransition(false);
    }
  };

  // Obtenemos los datos del método activo
  const currentMethodData = STUDY_METHODS.find(m => m.id === activeMethod) || STUDY_METHODS[0];

  // Componente auxiliar para las insignias
  const renderBadge = (badge: typeof BADGES_DATA[0], key: number) => {
    const color = badge.earned ? "#ff5a1f" : "#3a3a40"; 
    const bg = badge.earned ? "rgba(255,90,31,0.14)" : "transparent";
    
    return (
      <div key={key} className={`flex flex-col items-center gap-2.5 w-[80px] sm:w-[90px] ${badge.earned ? '' : 'opacity-70'}`}>
        <div className="w-[54px] h-[60px] sm:w-[60px] sm:h-[66px] flex items-center justify-center relative">
          <svg viewBox="0 0 60 66" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <path d="M30 4 L8 12 v20 c0 14 11 24 22 30 c11-6 22-16 22-30 V12 L30 4 Z" fill={bg} />
            {badge.earned ? (
              <path d="M21 31 l6 6 l12-13" stroke="#ff5a1f" fill="none" strokeWidth="2.4" />
            ) : (
              <path d="M24 30 h12 M24 36 h9" stroke="#3a3a40" fill="none" strokeWidth="1.6" />
            )}
          </svg>
        </div>
        <span className="text-center text-[10px] sm:text-[11px] font-medium text-[#8f8c85] leading-tight">
          {badge.label}
        </span>
      </div>
    );
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
    <MotionConfig reducedMotion="user">
    <main className="w-full bg-white">
      {/* SECCIÓN 1: Hero Principal (Nodos y Textos) */}
      <section className="min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">

          {/* Lado Izquierdo - Textos */}
          <motion.div
            className="space-y-6 md:space-y-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
          >
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
          </motion.div>

          {/* Lado Derecho - Gráfico Interactivo (Nodos) */}
          <motion.div
            className="relative w-full aspect-square max-w-[320px] sm:max-w-[400px] lg:max-w-[500px] mx-auto flex items-center justify-center lg:ml-auto"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          >
            
            {/* Círculo punteado exterior */}
            <div className="absolute inset-2 sm:inset-0 rounded-full border-2 border-dashed border-brand-orange/50"></div>

            {/* Círculo sólido interior (órbita) */}
            <div className="absolute inset-12 sm:inset-16 lg:inset-20 rounded-full border-2 border-brand-orange/30 bg-slate-50/30">

              {/* Líneas Radiales */}
              <div className="absolute inset-0 flex items-center justify-center opacity-40">
                <div className="absolute h-full w-[2px] bg-brand-orange"></div>
                <div className="absolute h-full w-[2px] bg-brand-orange rotate-[60deg]"></div>
                <div className="absolute h-full w-[2px] bg-brand-orange rotate-[120deg]"></div>
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

          </motion.div>

          {/* Botón Versión Celular */}
          <div className="flex lg:hidden w-full pt-6 justify-center">
            <Link href="/ecosistema" className="w-full sm:w-auto px-8 py-4 bg-brand-orange text-white font-bold rounded-lg shadow-lg hover:bg-orange-600 transition-colors flex items-center justify-center text-center">
              Ver Ecosistema Delphos
            </Link>
          </div>

        </div>
      </section>

      {/* SECCIÓN 2: El Recorrido */}
      <section className="bg-slate-50 border-t border-b border-gray-100 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          
          <motion.div
            className="max-w-3xl mb-14 lg:mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
          >
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
          </motion.div>

          {/* Cuadrícula de las 4 etapas dinámicas */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-0"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            {ONBOARDING_STAGES.map((stage, index) => {
              const isActive = activeStage === stage.id;

              return (
                <motion.div
                  key={stage.id}
                  variants={fadeUp}
                  className={`lg:px-8 ${index === 0 ? 'lg:pr-8 lg:px-0' : 'lg:border-l lg:border-gray-200'}`}
                >
                  <span className="text-brand-orange font-mono text-sm font-semibold tracking-wider">
                    0{stage.id}
                  </span>
                  
                  <div className="mt-5 mb-6">
                    {isActive ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-brand-orange shadow-[0_0_12px_rgba(216,90,48,0.5)] transition-all duration-300"></div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 transition-all duration-300"></div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {stage.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {stage.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN 3: Progreso e Insignias (Dark Mode unificado) */}
      <section className="bg-[#0b0b0c] text-white py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Lado Izquierdo - Textos e Insignias */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
            className="space-y-4"
          >
            <div className="flex items-center gap-4 text-xs font-semibold tracking-widest text-[#b8b5ae] uppercase mb-2">
              <span className="w-8 h-[2px] bg-brand-orange"></span>
              PROGRESO Y RECONOCIMIENTOS
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[42px] font-extrabold leading-[1.1] tracking-tight mb-5">
              Tu avance, <span className="text-brand-orange">siempre visible.</span>
            </h2>
            
            <p className="text-base md:text-lg text-[#b8b5ae] leading-relaxed max-w-xl">
              Cada sección completada suma a tu progreso y desbloquea insignias de dominio de la suite.
            </p>

            {/* Caja de explicación de la certificación solicitada */}
            <div className="mt-6 mb-8 flex items-start gap-3 bg-[#17171a] border border-[#232327] p-4 rounded-xl max-w-xl">
              <svg className="w-6 h-6 text-brand-orange flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p className="text-[13.5px] text-[#b8b5ae] leading-relaxed">
                La obtención de la insignia final <strong className="text-white font-semibold">certifica oficialmente que estás preparado</strong> para realizar tu presentación de Delphos frente al evaluador.
              </p>
            </div>
            
            <div className="flex gap-4 sm:gap-6 flex-wrap pt-2 justify-center lg:justify-start">
              {BADGES_DATA.map((badge, i) => renderBadge(badge, i))}
            </div>
          </motion.div>

          {/* Lado Derecho - Tarjeta de Progreso de Insignias */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
            className="bg-[#17171a] border border-[#232327] rounded-[18px] p-6 sm:p-8 lg:p-10 shadow-2xl"
          >
            {/* Gráfico circular y textos relacionados con Insignias */}
            <div className="flex items-center gap-6 sm:gap-8">
              <div className="relative w-24 h-24 sm:w-[118px] sm:h-[118px] flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#232327" strokeWidth="11" />
                  <motion.circle 
                    cx="60" cy="60" r="50" 
                    fill="none" 
                    stroke="#ff5a1f" 
                    strokeWidth="11" 
                    strokeLinecap="round" 
                    strokeDasharray="314.159" 
                    initial={{ strokeDashoffset: 314.159 }}
                    whileInView={{ strokeDashoffset: 125.66 }} // 60% exacto para 3 de 5 insignias
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight">60%</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg sm:text-[18px] font-semibold mb-1 tracking-tight">Colección de Insignias</h3>
                <p className="text-sm text-[#b8b5ae]">3 de 5 insignias desbloqueadas</p>
              </div>
            </div>

            {/* Barras de progreso hacia las insignias */}
            <div className="mt-8 sm:mt-10 space-y-4 sm:space-y-5">
              {PROGRESS_BARS.map((bar, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[13.5px] font-medium text-white">{bar.label}</span>
                    <span className="text-[13.5px] font-mono text-[#b8b5ae]">
                      {bar.pct === 100 ? 'Desbloqueada' : `${bar.pct}%`}
                    </span>
                  </div>
                  <div className="h-[7px] w-full bg-[#232327] rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-brand-orange rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${bar.pct}%` }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.6 + (i * 0.15) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* SECCIÓN 4: Métodos de Estudio */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          
          <motion.div
            className="max-w-3xl mb-12 lg:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
          >
            <div className="flex items-center gap-4 text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">
              <span className="w-8 h-[2px] bg-brand-orange"></span>
              MÉTODOS DE ESTUDIO
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black leading-tight tracking-tight mb-5">
              Cuatro formas de practicar. Elige la tuya.
            </h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl">
              Alterna entre métodos según cómo aprendas mejor. Todos alimentan el mismo seguimiento de avance.
            </p>
          </motion.div>

          {/* Pestañas (Tabs) Responsivas */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 border-b border-gray-100 pb-5 mb-8 md:mb-12">
            {STUDY_METHODS.map((method, idx) => {
              const isActive = activeMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setActiveMethod(method.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                    isActive 
                      ? 'bg-brand-orange border-brand-orange text-white shadow-md' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span className={`font-mono text-xs opacity-70 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    0{idx + 1}
                  </span>
                  {method.label}
                </button>
              );
            })}
          </div>

          {/* Contenido del Método (Animado y en 2 Columnas) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[320px]">
            
            {/* Columna Izquierda: Textos y Características */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMethod + '-text'}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  {currentMethodData.title}
                </h3>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg">
                  {currentMethodData.desc}
                </p>
                
                <ul className="flex flex-col gap-3 pt-2">
                  {currentMethodData.feats.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-gray-600 font-medium">
                      <span className="text-brand-orange font-bold mt-0.5">&rarr;</span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>

            {/* Columna Derecha: Representación Visual */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMethod + '-visual'}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full min-h-[260px] sm:min-h-[300px] bg-slate-50 border border-gray-100 rounded-3xl p-6 sm:p-8 flex items-center justify-center shadow-inner"
              >
                {currentMethodData.renderVisual()}
              </motion.div>
            </AnimatePresence>

          </div>

        </div>
      </section>

    </main>
    </MotionConfig>
  );
}