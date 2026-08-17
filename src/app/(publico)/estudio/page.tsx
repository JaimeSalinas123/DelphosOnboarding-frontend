'use client';

import React from 'react';
import Link from 'next/link';
import { motion, MotionConfig, Variants } from 'framer-motion';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const STUDY_CARDS = [
  {
    id: 'chatbot',
    title: 'Asistente 24/7',
    desc: 'Consulta cualquier detalle técnico o comercial sobre los módulos en tiempo real. Tu guía interactiva personal basada en la base de conocimiento de DEINSA.',
    href: '#', 
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    )
  },
  {
    id: 'cuestionarios',
    title: 'Evaluaciones Rápidas',
    desc: 'Mide tu nivel de comprensión con preguntas de opción múltiple diseñadas para simular escenarios y necesidades reales de clientes.',
    href: '/estudio/cuestionario',
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    )
  },
  {
    id: 'flashcards',
    title: 'Tarjetas Dinámicas',
    desc: 'El método clásico e infalible. Gira las tarjetas para memorizar conceptos clave, normativas y las ventajas de cada pilar de la plataforma.',
    href: '/estudio/flashcards',
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )
  },
  {
    id: 'vf',
    title: 'Retos de Agilidad',
    desc: 'Responde verdadero o falso en tiempo récord para pulir tus reflejos, evitar dudas y ganar seguridad frente a tu evaluador.',
    href: '/estudio/verdadero-falso',
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
];

export default function EstudioPage() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="w-full min-h-screen bg-white pb-16 sm:pb-20">
        {/* Ajuste Responsive: pt-8 en móvil (ya el layout tiene padding), pt-20 en PC */}
        <div className="mx-auto max-w-7xl px-5 sm:px-6 pt-8 md:pt-20">
          
          {/* Cabecera Principal */}
          <motion.div 
            className="mb-12 sm:mb-16 max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3 sm:mb-4">
              <span className="w-6 sm:w-8 h-[2px] bg-brand-orange"></span>
              MÉTODOS DE ESTUDIO
            </div>
            {/* Ajuste tipográfico móvil: text-[2.25rem] previene que se rompan palabras largas */}
            <h1 className="text-[2.25rem] sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight mb-4 sm:mb-6">
              Tu aprendizaje, <span className="text-brand-orange block sm:inline">a tu propio ritmo.</span>
            </h1>
            <p className="text-[15px] sm:text-lg text-gray-600 leading-relaxed">
              Este espacio está diseñado para que explores, asimiles y domines la suite Delphos sin presiones. Familiarízate con la terminología, entiende la arquitectura y refuerza tus debilidades antes de la presentación final.
            </p>
          </motion.div>

          {/* Grid de Métodos de Práctica */}
          {/* Ajuste Responsive: gap-4 en móvil para que las tarjetas fluyan mejor sin scroll excesivo */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-16 sm:mb-24"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {STUDY_CARDS.map((card, index) => (
              <motion.div key={card.id} variants={fadeUp} className="h-full">
                <Link href={card.href} className="block h-full group">
                  {/* Ajuste Responsive: p-5 en celular para dar más área de toque pero no robar espacio visual */}
                  <div className="h-full border border-gray-200 rounded-[1.25rem] sm:rounded-3xl p-5 sm:p-8 hover:border-gray-300 hover:shadow-lg transition-all duration-300 bg-slate-50/50 hover:bg-white relative overflow-hidden flex flex-col">
                    
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-orange/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shrink-0">
                      {card.icon}
                    </div>
                    
                    <h3 className="text-[1.15rem] sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3 group-hover:text-brand-orange transition-colors">
                      {card.title}
                    </h3>
                    
                    <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed mb-5 sm:mb-6 flex-grow">
                      {card.desc}
                    </p>

                    <div className="flex items-center text-[13px] sm:text-sm font-semibold text-brand-orange mt-auto">
                      <span>Practicar ahora</span>
                      <svg className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Sección Especial: Videos de Apoyo */}
          <motion.div 
            className="bg-[#111113] rounded-3xl sm:rounded-[2rem] overflow-hidden relative shadow-xl"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* Ajuste Responsive: px-6 py-10 en móvil, diseño flex-col para amontonar elementos limpiamente */}
            <div className="relative px-6 py-10 sm:px-8 sm:py-12 md:py-16 lg:px-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-10">
              <div className="max-w-2xl w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[10px] sm:text-xs font-semibold tracking-wider uppercase mb-4 sm:mb-5">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-orange"></span>
                  Material Exclusivo
                </div>
                <h2 className="text-[1.75rem] leading-[1.2] sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                  Acelera tu aprendizaje visualmente.
                </h2>
                <p className="text-[#9ca3af] text-[15px] sm:text-lg leading-relaxed">
                  Hemos preparado una biblioteca de videos detallados donde te explicamos el funcionamiento de la suite, casos de uso y tips para tu presentación. Todo el ecosistema de Delphos explicado paso a paso.
                </p>
              </div>

              <div className="flex-shrink-0 w-full lg:w-auto">
                <a 
                  href="https://drive.google.com/drive/folders/1u3HOv49mzSQt_yMdMIratzhBBBna-0gX?usp=drive_link"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-2.5 sm:gap-3 w-full lg:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-brand-orange hover:bg-orange-600 text-white text-[15px] sm:text-base font-bold rounded-xl shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <span>Ver biblioteca de videos</span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </motion.div>

        </div>
      </main>
    </MotionConfig>
  );
}