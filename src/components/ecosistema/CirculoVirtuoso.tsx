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
// El aro conector es un poco más chico que el radio de los nodos: así pasa
// por detrás de cada uno en vez de coincidir exactamente con su borde.
const RING_RADIUS = RADIUS - 0.18;
const FRONT_ANGLE = Math.PI / 2;

export default function CirculoVirtuoso({
  reducedMotion,
}: CirculoVirtuosoProps) {
  const ringRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(0);

  const selectedId = useEcosistemaStore((s) => s.selectedId);
  const userInteracting = useEcosistemaStore((s) => s.userInteracting);
  const hoveredId = useEcosistemaStore((s) => s.hoveredId);

  useEffect(() => {
    if (!selectedId) return;
    const mod = modulos.find((m) => m.id === selectedId);
    if (!mod) return;
    const current = targetRotation.current;
    const desired = mod.angulo - FRONT_ANGLE;
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
    } else if (!reducedMotion && !userInteracting && !hoveredId) {
      ring.rotation.y += delta * 0.2;
      targetRotation.current = ring.rotation.y;
    }
  });

  return (
    <group ref={ringRef}>
      <ConexionAnillo radius={RING_RADIUS} reducedMotion={reducedMotion} />
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
