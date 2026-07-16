'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getModuloById } from '@/data/modulos';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';

interface ConexionAnilloProps {
  radius: number;
  reducedMotion: boolean;
}

const BASE = new THREE.Color('#D9D9E0');
const DEFAULT_ACCENT = new THREE.Color('#9AA0AA');

/**
 * Anillo base gris claro (sobre blanco) + varios pulsos que recorren el círculo
 * en el color del módulo activo. Refuerza el "círculo virtuoso": el flujo no se
 * detiene. Máximo hypermotion: 3 pulsos + estela.
 */
const NUM_PULSES = 3;

export default function ConexionAnillo({
  radius,
  reducedMotion,
}: ConexionAnilloProps) {
  const baseMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const pulseRefs = useRef<Array<THREE.Mesh | null>>([]);
  const pulseMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);

  const selectedId = useEcosistemaStore((s) => s.selectedId);
  const hoveredId = useEcosistemaStore((s) => s.hoveredId);
  const activeId = selectedId ?? hoveredId;
  const active = activeId !== null;

  const accent = useMemo(() => {
    const m = getModuloById(activeId);
    return m ? new THREE.Color(m.color) : DEFAULT_ACCENT.clone();
  }, [activeId]);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (baseMatRef.current) {
      const target = active ? 0.35 : 0;
      baseMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        baseMatRef.current.emissiveIntensity,
        target,
        5,
        delta
      );
      baseMatRef.current.emissive.lerp(accent, 1 - Math.exp(-6.3 * delta));
    }

    for (let i = 0; i < NUM_PULSES; i++) {
      const mesh = pulseRefs.current[i];
      const mat = pulseMatRefs.current[i];
      if (!mesh || !mat) continue;
      const speed = reducedMotion ? 0 : 1.5;
      const angle = t * speed + (i / NUM_PULSES) * Math.PI * 2;
      tmp.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      mesh.position.copy(tmp);
      mat.color.lerp(accent, 1 - Math.exp(-13.4 * delta));
      const to = active && !reducedMotion ? 1 : 0;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, to, 7.7, delta);
    }
  });

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <torusGeometry args={[radius, 0.022, 16, 200]} />
        <meshStandardMaterial
          ref={baseMatRef}
          color={BASE}
          emissive={DEFAULT_ACCENT}
          emissiveIntensity={0}
          metalness={0.2}
          roughness={0.7}
        />
      </mesh>

      {Array.from({ length: NUM_PULSES }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (pulseRefs.current[i] = el)}
        >
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshBasicMaterial
            ref={(el) => (pulseMatRefs.current[i] = el)}
            color={DEFAULT_ACCENT}
            transparent
            opacity={0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
