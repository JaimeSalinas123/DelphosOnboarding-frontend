'use client';

import { useState, useRef, useEffect } from 'react';

interface Mensaje {
  rol: 'usuario' | 'bot';
  texto: string;
}

export default function ChatbotFlotante() {
  const [abierto, setAbierto] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [historialCargado, setHistorialCargado] = useState(false);

  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Función auxiliar ESCÁNER EXTREMO para cazar el token donde sea que esté
  const obtenerTokenSeguro = (): string => {
    if (typeof window === 'undefined') return '';
    
    // 1. Búsqueda Directa
    let token = localStorage.getItem('token');
    if (token) return token;

    // 2. Búsqueda profunda en LocalStorage (Por si Supabase lo guardó ahí)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const rawData = localStorage.getItem(key) || '';
      
      // Si el valor es directamente un token JWT (siempre empiezan con eyJ)
      if (rawData.startsWith('eyJ')) return rawData;
      
      // Si es un objeto de Supabase (sb-xxx-auth-token)
      if (key.includes('supabase') || key.includes('sb-') || key.includes('token')) {
        try {
          const parsed = JSON.parse(rawData);
          if (parsed.access_token) return parsed.access_token;
          if (parsed.session?.access_token) return parsed.session.access_token;
        } catch (e) {
          // Si no es un JSON, lo ignoramos
        }
      }
    }

    // 3. Búsqueda profunda en Cookies (Típico en Next.js SSR)
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      const value = cookie.substring(cookie.indexOf('=') + 1);
      const decodedValue = decodeURIComponent(value);
      
      // Si la cookie es directamente el token
      if (decodedValue.startsWith('eyJ')) return decodedValue;
      
      // Si la cookie es el JSON de sesión de Supabase
      try {
        const parsed = JSON.parse(decodedValue);
        if (parsed.access_token) return parsed.access_token;
      } catch (e) {
        // Si no es un JSON, lo ignoramos
      }
    }
    
    console.error("⚠️ ALERTA: No se encontró ningún token en LocalStorage ni en Cookies. El chat se enviará sin credenciales.");
    return '';
  };

  // Auto-scroll
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando, abierto, expandido]);

  // Cargar historial al montar el componente
  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const token = obtenerTokenSeguro();

        if (!token) {
          setMensajes([{ rol: 'bot', texto: '¡Hola! Soy el asistente de Delphos. ¿En qué te puedo ayudar hoy?' }]);
          setHistorialCargado(true);
          return;
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${url}/chat/historial`, { headers });
        const data = await res.json();
        
        if (res.ok && data.historial && data.historial.length > 0) {
          setMensajes(data.historial.map((m: any) => ({
            rol: m.rol,
            texto: m.texto
          })));
        } else {
          setMensajes([{ rol: 'bot', texto: '¡Hola! Soy el asistente de Delphos. ¿En qué te puedo ayudar hoy?' }]);
        }
      } catch (err) {
        console.error("No se pudo cargar el historial del chat", err);
        setMensajes([{ rol: 'bot', texto: '¡Hola! Soy el asistente de Delphos. ¿En qué te puedo ayudar hoy?' }]);
      } finally {
        setHistorialCargado(true);
      }
    };

    cargarHistorial();
  }, []);

  const enviarPregunta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const textoUsuario = input.trim();
    setMensajes((prev) => [...prev, { rol: 'usuario', texto: textoUsuario }]);
    setInput('');
    setCargando(true);

    try {
      const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = obtenerTokenSeguro();

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${url}/chat/preguntar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ pregunta: textoUsuario }),
      });

      const data = await res.json();
      
      setMensajes((prev) => [
        ...prev,
        { 
          rol: 'bot', 
          texto: data.respuesta || data.error || 'Lo siento, ocurrió un error procesando la respuesta.' 
        }
      ]);
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        { rol: 'bot', texto: 'No me pude conectar con el servidor. Verifica tu conexión.' }
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* TARJETA PERSISTENTE DEL CHAT */}
      {abierto && (
        <div 
          className={`flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 ${
            expandido 
              ? 'fixed inset-0 z-[100] h-full w-full rounded-none border-none' 
              : 'mb-4 h-[36rem] w-[22rem] md:w-[26rem]' 
          }`}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between bg-brand-orange px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <img 
                src="/images/logo.svg" 
                alt="Logo Delphos" 
                className="h-6 w-auto object-contain brightness-0 invert" 
              />
              <h3 className="font-semibold text-sm">Asistente Delphos</h3>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => setExpandido(!expandido)} className="hover:opacity-80 transition-opacity" title={expandido ? "Restaurar tamaño" : "Pantalla completa"}>
                {expandido ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15h-4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>
              
              <button onClick={() => { setAbierto(false); setExpandido(false); }} className="hover:opacity-80 transition-opacity" title="Cerrar chat">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ÁREA DE MENSAJES */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50">
            <div className={`mx-auto ${expandido ? 'max-w-4xl' : 'w-full'} space-y-6`}>
              {!historialCargado ? (
                 <div className="flex justify-center p-4">
                   <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent"></div>
                 </div>
              ) : (
                mensajes.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                    {msg.rol === 'usuario' ? (
                      <div className="max-w-[85%] rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
                        <div className="mb-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">TÚ</div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{msg.texto}</div>
                      </div>
                    ) : (
                      <div className="max-w-[85%] rounded-2xl border border-orange-100 bg-[#FDF5F2] px-5 py-3 shadow-sm">
                        <div className="mb-1 text-[10px] font-bold tracking-widest text-brand-orange uppercase">ASISTENTE DELPHOS</div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{msg.texto}</div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {cargando && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl border border-orange-100 bg-[#FDF5F2] px-5 py-4 shadow-sm flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-bounce"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-orange animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={mensajesEndRef} />
            </div>
          </div>

          {/* INPUT FORM */}
          <form onSubmit={enviarPregunta} className={`border-t border-gray-200 bg-white p-4 ${expandido ? 'flex justify-center' : 'flex'}`}>
            <div className={`${expandido ? 'w-full max-w-4xl flex' : 'w-full flex'}`}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu duda aquí..."
                className="flex-1 rounded-l-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-brand-orange bg-gray-50 focus:bg-white"
                disabled={cargando || !historialCargado}
              />
              <button
                type="submit"
                disabled={cargando || !input.trim() || !historialCargado}
                className="flex items-center justify-center rounded-r-xl bg-brand-orange px-5 text-white transition-all hover:bg-brand-orange/90 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BOTÓN FLOTANTE PRINCIPAL */}
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange text-white shadow-xl transition-all hover:scale-105 active:scale-95 hover:shadow-brand-orange/30"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
        </button>
      )}
    </div>
  );
}