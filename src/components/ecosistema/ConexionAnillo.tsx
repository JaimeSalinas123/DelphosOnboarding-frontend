'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';
import { BRAND_ORANGE } from '@/lib/theme';

interface ConexionAnilloProps {
  radius: number;
  reducedMotion: boolean;
}

const BASE = new THREE.Color(BRAND_ORANGE);

/**
 * Anillo base naranja de marca (sobre blanco) que conecta los módulos.
 * Se intensifica un poco al pasar el mouse o seleccionar algo.
 */
export default function ConexionAnillo({ radius }: ConexionAnilloProps) {
  const baseMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const selectedId = useEcosistemaStore((s) => s.selectedId);
  const hoveredId = useEcosistemaStore((s) => s.hoveredId);
  const active = selectedId !== null || hoveredId !== null;

  const accent = useMemo(() => new THREE.Color(BRAND_ORANGE), []);

  useFrame((_, delta) => {
    if (!baseMatRef.current) return;
    const target = active ? 0.5 : 0.22;
    baseMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
      baseMatRef.current.emissiveIntensity,
      target,
      5,
      delta
    );
    baseMatRef.current.emissive.lerp(accent, 1 - Math.exp(-6.3 * delta));
  });

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.022, 16, 200]} />
      <meshStandardMaterial
        ref={baseMatRef}
        color={BASE}
        emissive={BASE}
        emissiveIntensity={0.22}
        metalness={0.2}
        roughness={0.6}
      />
    </mesh>
  );
}
