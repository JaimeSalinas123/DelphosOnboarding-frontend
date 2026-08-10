// src/services/auditoriaService.ts

export interface RegistroAuditoria {
  id: string;
  usuario_nombre: string;
  usuario_email: string;
  modulo: 'estudio' | 'encuestas' | 'documentacion' | 'usuarios';
  accion: 'crear' | 'editar' | 'eliminar';
  detalles: string;
  fecha: string;
  reversible: boolean; // El backend nos dirá si se puede deshacer
}

interface AuditoriaRespuesta {
  registros: RegistroAuditoria[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

// Escáner infalible para encontrar el token de Supabase donde sea que esté escondido
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
    
    if (rawData.startsWith('eyJ')) return rawData;
    
    if (key.includes('supabase') || key.includes('sb-') || key.includes('token')) {
      try {
        const parsed = JSON.parse(rawData);
        if (parsed.access_token) return parsed.access_token;
        if (parsed.session?.access_token) return parsed.session.access_token;
      } catch (e) { }
    }
  }

  // 3. Búsqueda profunda en Cookies
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    const value = cookie.substring(cookie.indexOf('=') + 1);
    const decodedValue = decodeURIComponent(value);
    
    if (decodedValue.startsWith('eyJ')) return decodedValue;
    
    try {
      const parsed = JSON.parse(decodedValue);
      if (parsed.access_token) return parsed.access_token;
    } catch (e) { }
  }
  
  return '';
};

export const auditoriaService = {
  async listar(filtros: { pagina?: number; limite?: number; modulo?: string; accion?: string } = {}): Promise<AuditoriaRespuesta> {
    const urlParams = new URLSearchParams();
    if (filtros.pagina) urlParams.append('pagina', filtros.pagina.toString());
    if (filtros.limite) urlParams.append('limite', filtros.limite.toString());
    if (filtros.modulo) urlParams.append('modulo', filtros.modulo);
    if (filtros.accion) urlParams.append('accion', filtros.accion);

    const token = obtenerTokenSeguro();
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    
    const response = await fetch(`${url}/auditoria?${urlParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al obtener el registro de auditoría');
    }

    return response.json();
  },

  async rehacerAccion(id: string): Promise<{ mensaje: string }> {
    const token = obtenerTokenSeguro();
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    const response = await fetch(`${url}/auditoria/${id}/rehacer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al intentar deshacer la acción');
    }

    return response.json();
  },
};