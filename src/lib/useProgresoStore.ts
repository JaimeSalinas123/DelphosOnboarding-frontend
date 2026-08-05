import { create } from 'zustand';
import { progresoService, type ProgresoPasante } from '@/services/progresoService';

const PROGRESO_VACIO: ProgresoPasante = {
  usuario_id: '',
  porcentaje_ecosistema: 0,
  porcentaje_estudio: 0,
  porcentaje_encuesta: 0,
  porcentaje_total: 0,
};

interface ProgresoState {
  progreso: ProgresoPasante;
  /** Única fuente de verdad de qué módulos del ecosistema ya se vieron (sesión + backend). */
  modulosVistos: string[];
  cargando: boolean;
  cargado: boolean;

  /** Trae el progreso real del backend. Segura de llamar varias veces (ej. al terminar Estudio/Encuesta, para refrescar). */
  cargar: () => Promise<void>;
  /** El pasante visitó un módulo del ecosistema: actualiza optimista y persiste en el backend. */
  registrarModulo: (modulo: string) => Promise<void>;
}

export const useProgresoStore = create<ProgresoState>((set, get) => ({
  progreso: PROGRESO_VACIO,
  modulosVistos: [],
  cargando: false,
  cargado: false,

  cargar: async () => {
    if (get().cargando) return;
    set({ cargando: true });
    try {
      const data = await progresoService.obtenerMio();
      set((state) => {
        // Merge, no overwrite: si mientras este pedido viajaba el usuario ya
        // visitó un módulo nuevo (optimista), no lo pisamos con una respuesta
        // vieja que todavía no lo incluye — así nunca "retrocede" en pantalla.
        const modulosVistos = Array.from(new Set([...state.modulosVistos, ...data.modulosVistos]));
        const porcentajeEcosistema = (modulosVistos.length / 8) * 100;
        const porcentajeEstudio = Math.max(state.progreso.porcentaje_estudio, data.progreso.porcentaje_estudio);
        const porcentajeEncuesta = Math.max(state.progreso.porcentaje_encuesta, data.progreso.porcentaje_encuesta);
        return {
          modulosVistos,
          progreso: {
            ...data.progreso,
            porcentaje_ecosistema: porcentajeEcosistema,
            porcentaje_estudio: porcentajeEstudio,
            porcentaje_encuesta: porcentajeEncuesta,
            porcentaje_total: (porcentajeEcosistema + porcentajeEstudio + porcentajeEncuesta) / 3,
          },
          cargado: true,
        };
      });
    } catch {
      // El progreso es un dato visual complementario: si falla, no interrumpe
      // la navegación ni muestra un error bloqueante.
    } finally {
      set({ cargando: false });
    }
  },

  registrarModulo: async (modulo) => {
    const anterior = get();
    if (anterior.modulosVistos.includes(modulo)) return;

    // Optimista: sumamos el módulo ya y recalculamos ecosistema/total,
    // y lo revertimos si el backend lo rechaza.
    const nuevosVistos = [...anterior.modulosVistos, modulo];
    const porcentajeEcosistema = (nuevosVistos.length / 8) * 100;
    const porcentajeTotal =
      (porcentajeEcosistema +
        anterior.progreso.porcentaje_estudio +
        anterior.progreso.porcentaje_encuesta) /
      3;

    set({
      modulosVistos: nuevosVistos,
      progreso: {
        ...anterior.progreso,
        porcentaje_ecosistema: porcentajeEcosistema,
        porcentaje_total: porcentajeTotal,
      },
    });

    try {
      await progresoService.registrarModuloEcosistema(modulo);
    } catch {
      set({ modulosVistos: anterior.modulosVistos, progreso: anterior.progreso });
    }
  },
}));
