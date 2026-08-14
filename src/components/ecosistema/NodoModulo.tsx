'use client';

import { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Modulo } from '@/data/modulos';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';
import { useProgresoStore } from '@/lib/useProgresoStore';
import { BRAND_ORANGE } from '@/lib/theme';

// ============================================================================
// 🚀 OPTIMIZACIÓN EXTREMA DE MEMORIA (INSTANCING)
// Al definir las geometrías y materiales estáticos FUERA del componente, 
// evitamos que Three.js cree 8 copias idénticas en la memoria de la tarjeta 
// gráfica (GPU). Todos los nodos reciclarán la misma geometría.
// ============================================================================
const R = 0.92;
const geomGlow = new THREE.CircleGeometry(R * 1.7, 48);
const geomRing = new THREE.RingGeometry(R * 1.02, R * 1.14, 64);
const geomBase = new THREE.CircleGeometry(R, 64);
const geomPlane = new THREE.PlaneGeometry(R * 1.5, R * 1.5);
const geomBadgeOut = new THREE.CircleGeometry(0.17, 24);
const geomBadgeIn = new THREE.CircleGeometry(0.1, 24);

const matBase = new THREE.MeshStandardMaterial({
  color: '#171717',
  metalness: 0.25,
  roughness: 0.45,
});
const matBadgeOut = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });

interface NodoModuloProps {
  modulo: Modulo;
  radius: number;
  reducedMotion: boolean;
  phase: number;
}

export default function NodoModulo({
  modulo,
  radius,
  reducedMotion,
  phase,
}: NodoModuloProps) {
  const outerRef = useRef<THREE.Group>(null);
  const coinRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const logoMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const badgeRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(1);
  const velRef = useRef(0);

  const texture = useTexture(`/logos/${modulo.logo}`);
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, [texture]);

  const hoveredId = useEcosistemaStore((s) => s.hoveredId);
  const selectedId = useEcosistemaStore((s) => s.selectedId);
  const modulosVistos = useProgresoStore((s) => s.modulosVistos);
  const setHovered = useEcosistemaStore((s) => s.setHovered);
  const toggleSelect = useEcosistemaStore((s) => s.toggleSelect);
  const visited = modulosVistos.includes(modulo.id);

  const isSelected = selectedId === modulo.id;
  const isHovered = hoveredId === modulo.id;
  const isActive = isSelected || isHovered;
  const anySelected = selectedId !== null;
  const isDimmed = anySelected && !isSelected;

  const color = useMemo(() => new THREE.Color(BRAND_ORANGE), []);

  const position = useMemo<[number, number, number]>(
    () => [
      Math.cos(modulo.angulo) * radius,
      0,
      Math.sin(modulo.angulo) * radius,
    ],
    [modulo.angulo, radius]
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const outer = outerRef.current;
    if (!outer) return;

    const bob = reducedMotion ? 0 : Math.sin(t * 1.6 + phase) * 0.16;
    outer.position.y = bob + (isActive ? 0.5 : 0);

    let target = 1;
    if (isHovered) target = 1.32;
    if (isSelected) target = 1.42;
    if (isDimmed) target = 0.82;
    const k = 140;
    const damp = 18;
    const x = scaleRef.current;
    const a = (target - x) * k - velRef.current * damp;
    const dt = Math.min(delta, 0.033);
    velRef.current += a * dt;
    scaleRef.current += velRef.current * dt;
    if (coinRef.current) coinRef.current.scale.setScalar(scaleRef.current);

    if (ringRef.current && ringMatRef.current) {
      if (!reducedMotion) ringRef.current.rotation.z += delta * 1.4;
      const ro = isActive ? 1 : isDimmed ? 0.15 : 0.9;
      ringMatRef.current.opacity = THREE.MathUtils.damp(
        ringMatRef.current.opacity,
        ro,
        9.75,
        delta
      );
    }

    if (glowRef.current && glowMatRef.current) {
      const hoverOnly = isHovered && !isSelected;
      const pulse = reducedMotion ? 1 : 1 + Math.sin(t * 4 + phase) * 0.04;
      const gTarget = hoverOnly ? 1.05 * pulse : 0.0001;
      glowRef.current.scale.setScalar(
        THREE.MathUtils.damp(glowRef.current.scale.x, gTarget, 9.75, delta)
      );
      const go = hoverOnly ? 0.6 : 0;
      glowMatRef.current.opacity = THREE.MathUtils.damp(
        glowMatRef.current.opacity,
        go,
        9.75,
        delta
      );
    }

    if (logoMatRef.current) {
      logoMatRef.current.opacity = THREE.MathUtils.damp(
        logoMatRef.current.opacity,
        isDimmed ? 0.45 : 1,
        9.75,
        delta
      );
    }

    if (badgeRef.current) {
      const bTarget = visited ? 1 : 0.0001;
      badgeRef.current.scale.setScalar(
        THREE.MathUtils.damp(badgeRef.current.scale.x, bTarget, 9, delta)
      );
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(modulo.id);
    document.body.style.cursor = 'pointer';
  };
  const out = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(null);
    document.body.style.cursor = 'auto';
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    toggleSelect(modulo.id);
  };

  return (
    <group ref={outerRef} position={position}>
      <Billboard>
        <group ref={coinRef}>
          <mesh ref={glowRef} geometry={geomGlow} position={[0, 0, -0.05]} scale={0.0001}>
            <meshBasicMaterial
              ref={glowMatRef}
              color={color}
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>

          <mesh ref={ringRef} geometry={geomRing} position={[0, 0, -0.02]}>
            <meshBasicMaterial
              ref={ringMatRef}
              color={color}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>

          <mesh geometry={geomBase} material={matBase} onPointerOver={over} onPointerOut={out} onClick={click} />

          <mesh geometry={geomPlane} position={[0, 0, 0.01]} raycast={() => null}>
            <meshBasicMaterial
              ref={logoMatRef}
              map={texture}
              transparent
              toneMapped={false}
            />
          </mesh>

          <group ref={badgeRef} position={[R * 0.74, R * 0.74, 0.04]} scale={0.0001}>
            <mesh geometry={geomBadgeOut} material={matBadgeOut} raycast={() => null} />
            <mesh geometry={geomBadgeIn} position={[0, 0, 0.001]} raycast={() => null}>
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          </group>
        </group>

        {isHovered && !isSelected && (
          <Html
            center
            distanceFactor={9}
            position={[0, R * 1.7, 0]}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[20, 0]}
          >
            <div
              className="whitespace-nowrap rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-[13px] font-medium text-white shadow-md"
              style={{ backgroundColor: BRAND_ORANGE }}
            >
              {modulo.nombre}
            </div>
          </Html>
        )}
      </Billboard>
    </group>
  );
}