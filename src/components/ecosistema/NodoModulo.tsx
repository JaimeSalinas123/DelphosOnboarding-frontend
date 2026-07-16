'use client';

import { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Html, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Modulo } from '@/data/modulos';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';

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
  const setHovered = useEcosistemaStore((s) => s.setHovered);
  const toggleSelect = useEcosistemaStore((s) => s.toggleSelect);

  const isSelected = selectedId === modulo.id;
  const isHovered = hoveredId === modulo.id;
  const isActive = isSelected || isHovered;
  const anySelected = selectedId !== null;
  const isDimmed = anySelected && !isSelected;

  const color = useMemo(() => new THREE.Color(modulo.color), [modulo.color]);

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
      const ro = isActive ? 1 : isDimmed ? 0.15 : 0.55;
      ringMatRef.current.opacity = THREE.MathUtils.damp(
        ringMatRef.current.opacity,
        ro,
        9.75,
        delta
      );
    }

    if (glowRef.current && glowMatRef.current) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(t * 4 + phase) * 0.06;
      const gTarget = isSelected ? 1.5 * pulse : isHovered ? 1.2 : 0.0001;
      glowRef.current.scale.setScalar(
        THREE.MathUtils.damp(glowRef.current.scale.x, gTarget, 9.75, delta)
      );
      const go = isActive ? 0.6 : 0;
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

  const R = 0.92;

  return (
    <group ref={outerRef} position={position}>
      <Billboard>
        <group ref={coinRef}>
          <mesh ref={glowRef} position={[0, 0, -0.05]} scale={0.0001}>
            <circleGeometry args={[R * 1.7, 48]} />
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

          <mesh ref={ringRef} position={[0, 0, -0.02]}>
            <ringGeometry args={[R * 1.02, R * 1.14, 64]} />
            <meshBasicMaterial
              ref={ringMatRef}
              color={color}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>

          <mesh onPointerOver={over} onPointerOut={out} onClick={click}>
            <circleGeometry args={[R, 64]} />
            <meshStandardMaterial
              color="#FFFFFF"
              metalness={0.1}
              roughness={0.55}
            />
          </mesh>

          <mesh position={[0, 0, 0.01]} raycast={() => null}>
            <planeGeometry args={[R * 1.5, R * 1.5]} />
            <meshBasicMaterial
              ref={logoMatRef}
              map={texture}
              transparent
              toneMapped={false}
            />
          </mesh>
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
              className="whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium text-white shadow-md"
              style={{ backgroundColor: modulo.color }}
            >
              {modulo.nombre}
            </div>
          </Html>
        )}
      </Billboard>
    </group>
  );
}
