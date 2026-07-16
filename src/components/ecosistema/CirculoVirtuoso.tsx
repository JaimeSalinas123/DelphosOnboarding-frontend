'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { modulos } from '@/data/modulos';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';
import NodoModulo from './NodoModulo';
import ConexionAnillo from './ConexionAnillo';

interface CirculoVirtuosoProps {
  reducedMotion: boolean;
}

const RADIUS = 3.2;
const FRONT_ANGLE = Math.PI / 2;

export default function CirculoVirtuoso({
  reducedMotion,
}: CirculoVirtuosoProps) {
  const ringRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);

  const selectedId = useEcosistemaStore((s) => s.selectedId);
  const userInteracting = useEcosistemaStore((s) => s.userInteracting);

  useEffect(() => {
    if (!selectedId) return;
    const mod = modulos.find((m) => m.id === selectedId);
    if (!mod) return;
    const current = targetRotation.current;
    const desired = FRONT_ANGLE - mod.angulo;
    const TAU = Math.PI * 2;
    let delta = (((desired - current) % TAU) + TAU) % TAU;
    if (delta > Math.PI) delta -= TAU;
    targetRotation.current = current + delta;
  }, [selectedId]);

  useFrame((_, delta) => {
    const ring = ringRef.current;
    if (!ring) return;

    if (selectedId) {
      ring.rotation.y = THREE.MathUtils.damp(
        ring.rotation.y,
        targetRotation.current,
        6.3,
        delta
      );
    } else if (!reducedMotion && !userInteracting) {
      ring.rotation.y += delta * 0.2;
      targetRotation.current = ring.rotation.y;
    }
  });

  return (
    <group ref={ringRef}>
      <ConexionAnillo radius={RADIUS} reducedMotion={reducedMotion} />
      {modulos.map((modulo, i) => (
        <NodoModulo
          key={modulo.id}
          modulo={modulo}
          radius={RADIUS}
          reducedMotion={reducedMotion}
          phase={(i / modulos.length) * Math.PI * 2}
        />
      ))}
    </group>
  );
}
