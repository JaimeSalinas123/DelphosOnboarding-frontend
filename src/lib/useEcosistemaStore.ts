import { create } from 'zustand';
import { getModuloIndex, modulos } from '@/data/modulos';

interface EcosistemaState {
  /** Módulo actualmente seleccionado (panel abierto), o null si ninguno. */
  selectedId: string | null;
  /** Módulo bajo el cursor/foco, para el hover del nodo y el pulso del anillo. */
  hoveredId: string | null;
  /** true mientras el usuario arrastra OrbitControls: pausa la rotación idle. */
  userInteracting: boolean;

  select: (id: string) => void;
  deselect: () => void;
  toggleSelect: (id: string) => void;
  setHovered: (id: string | null) => void;
  setUserInteracting: (value: boolean) => void;
  /** Navegación por teclado: mueve la selección al módulo siguiente/anterior. */
  step: (direction: 1 | -1) => void;
}

export const useEcosistemaStore = create<EcosistemaState>((set, get) => ({
  selectedId: null,
  hoveredId: null,
  userInteracting: false,

  select: (id) => set({ selectedId: id }),
  deselect: () => set({ selectedId: null }),
  toggleSelect: (id) =>
    set((state) => ({ selectedId: state.selectedId === id ? null : id })),
  setHovered: (id) => set({ hoveredId: id }),
  setUserInteracting: (value) => set({ userInteracting: value }),
  step: (direction) => {
    const { selectedId } = get();
    const currentIndex = getModuloIndex(selectedId);
    const total = modulos.length;
    const nextIndex = (currentIndex + direction + total) % total;
    set({ selectedId: modulos[nextIndex].id });
  },
}));
