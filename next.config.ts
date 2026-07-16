import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acceder al servidor de desarrollo desde la IP de red local
  // (p.ej. al abrir la app desde otro dispositivo en la misma LAN).
  allowedDevOrigins: ['172.16.0.2'],
};

export default nextConfig;
