// src/app/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

/**
 * Perfil del usuario autenticado. `rol` se deja como `string` (no un union
 * estricto) porque el backend es la fuente de verdad: agregar un rol nuevo
 * ahí no debe romper el build del frontend. Los componentes que necesiten
 * restringir por rol deben comparar contra una lista explícita (ver
 * `ROLES_CON_ACCESO` en `(privado)/layout.tsx`), no confiar en el tipo.
 */
export interface Usuario {
  id?: string;
  nombre: string;
  email: string;
  rol: string;
  departamento?: string;
  primer_ingreso?: boolean;
}

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificación segura: solo corre en el cliente
    const storedUser = authService.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setUser(data.usuario);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) { // Cambié undefined por !context para ser más robusto
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
