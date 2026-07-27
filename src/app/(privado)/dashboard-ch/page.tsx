'use client';

import { useAuth } from "@/context/AuthContext";

export default function DashboardCH() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Panel de Capital Humano</h1>
      <p className="text-brand-orange text-xl">
        Bienvenido Administrador: {user?.nombre}
      </p>
      <p className="text-gray-400 mt-2">
        Tu rol oficial es: <span className="font-mono text-white">{user?.rol}</span>
      </p>
    </div>
  );
}