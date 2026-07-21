'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import CirculoVirtuoso from './CirculoVirtuoso';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';

interface EcosistemaSceneProps {
  reducedMotion: boolean;
  lowPower: boolean;
  /** true en viewports md+ (panel lateral); en mobile el panel es un bottom sheet. */
  isDesktop: boolean;
}

/**
 * Parallax sutil siguiendo el mouse. Se aplica sobre un grupo contenedor
 * para no pelear con OrbitControls. Sin dolly-in/zoom al seleccionar: la
 * distancia de cámara se mantiene siempre fija.
 *
 * Desplaza el anillo hacia la izquierda: un poco siempre (deja aire a la
 * tarjeta de info) y bastante más al seleccionar un módulo, para que el
 * anillo quede centrado en el espacio libre y no debajo del panel derecho.
 */
function SceneRig({
  reducedMotion,
  isDesktop,
  children,
}: {
  reducedMotion: boolean;
  isDesktop: boolean;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const selectedId = useEcosistemaStore((s) => s.selectedId);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const baseX = isDesktop ? -0.7 : -0.25;
    const selectedX = isDesktop ? -1.55 : -0.25;
    const targetX = selectedId ? selectedX : baseX;
    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 4.5, delta);

    // Parallax sutil (sin dolly ni escalado: la cámara nunca "se acerca").
    const rx = reducedMotion ? 0.18 : 0.18 - pointer.y * 0.28;
    const ry = reducedMotion ? 0 : pointer.x * 0.34;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, rx, 3.7, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ry, 3.7, delta);
  });

  return <group ref={groupRef}>{children}</group>;
}

const SELECTED_BG = new THREE.Color('#FFFFFF').lerp(
  new THREE.Color('#DD6544'),
  0.4
);

/**
 * Fondo sólido de la escena (no CSS): se tiñe de naranja al seleccionar
 * cualquier módulo (mismo color para todos, no depende de cuál sea) y
 * vuelve a blanco al deseleccionar. Al ser el propio `scene.background`
 * (no un canvas transparente) cubre todo el rectángulo de forma pareja.
 */
function AnimatedBackground() {
  const { scene } = useThree();
  const selectedId = useEcosistemaStore((s) => s.selectedId);

  const targetColor = selectedId ? SELECTED_BG : new THREE.Color('#FFFFFF');

  useEffect(() => {
    if (!(scene.background instanceof THREE.Color)) {
      scene.background = new THREE.Color('#FFFFFF');
    }
  }, [scene]);

  useFrame((_, delta) => {
    const bg = scene.background;
    if (bg instanceof THREE.Color) {
      bg.lerp(targetColor, 1 - Math.exp(-3.2 * delta));
    }
  });

  return null;
}

function BackgroundDeselect() {
  const deselect = useEcosistemaStore((s) => s.deselect);
  return (
    <mesh
      position={[0, 0, -8]}
      onClick={(e) => {
        e.stopPropagation();
        deselect();
      }}
    >
      <planeGeometry args={[120, 120]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export default function EcosistemaScene({
  reducedMotion,
  lowPower,
  isDesktop,
}: EcosistemaSceneProps) {
  const setUserInteracting = useEcosistemaStore((s) => s.setUserInteracting);
  const enableBloom = !lowPower && !reducedMotion;

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <Canvas
      dpr={lowPower ? 1 : [1, 2]}
      camera={{ position: [0, 2.9, 10.5], fov: 42 }}
      gl={{ antialias: !lowPower, alpha: false }}
    >
      <AnimatedBackground />

      {/* Iluminación de estudio (brillante, funciona igual sobre el fondo claro) */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 9, 6]} intensity={1.1} />
      <directionalLight position={[-6, 4, 3]} intensity={0.5} />
      <directionalLight position={[0, 2, -6]} intensity={0.4} />

      <BackgroundDeselect />

      <Suspense fallback={null}>
        <SceneRig reducedMotion={reducedMotion} isDesktop={isDesktop}>
          <CirculoVirtuoso reducedMotion={reducedMotion} />
        </SceneRig>

        {enableBloom && (
          <EffectComposer>
            <Bloom
              intensity={0.55}
              luminanceThreshold={0.85}
              luminanceSmoothing={0.3}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 1.9}
        enableDamping
        dampingFactor={0.08}
        onStart={() => setUserInteracting(true)}
        onEnd={() => setUserInteracting(false)}
        makeDefault
      />

      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
