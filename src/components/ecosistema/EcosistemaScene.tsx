'use client';

import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows, OrbitControls, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import CirculoVirtuoso from './CirculoVirtuoso';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';

interface EcosistemaSceneProps {
  reducedMotion: boolean;
  lowPower: boolean;
}

/**
 * Parallax fuerte siguiendo el mouse + dolly-in con tilt al seleccionar.
 * Se aplica sobre un grupo contenedor para no pelear con OrbitControls.
 */
function SceneRig({
  reducedMotion,
  children,
}: {
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const selectedId = useEcosistemaStore((s) => s.selectedId);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    // Constantes de amortiguación independientes del framerate (THREE.MathUtils.damp).
    const targetScale = selectedId ? 1.12 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 4.5, delta));
    g.position.z = THREE.MathUtils.damp(g.position.z, selectedId ? 1.1 : 0, 4.5, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, selectedId ? 0.3 : 0, 4.5, delta);

    // Parallax fuerte (hypermotion).
    const rx = reducedMotion ? 0.18 : 0.18 - pointer.y * 0.28;
    const ry = reducedMotion ? 0 : pointer.x * 0.34;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, rx, 3.7, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ry, 3.7, delta);
  });

  return <group ref={groupRef}>{children}</group>;
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
      shadows={!lowPower}
      dpr={lowPower ? 1 : [1, 2]}
      camera={{ position: [0, 2.4, 8.6], fov: 42 }}
      gl={{ antialias: !lowPower, alpha: true }}
    >
      {/* Fondo blanco */}
      <color attach="background" args={['#FFFFFF']} />

      {/* Iluminación de estudio (brillante, para fondo blanco) */}
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[5, 9, 6]}
        intensity={1.1}
        castShadow={!lowPower}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-6, 4, 3]} intensity={0.5} />
      <directionalLight position={[0, 2, -6]} intensity={0.4} />

      <BackgroundDeselect />

      <Suspense fallback={null}>
        <SceneRig reducedMotion={reducedMotion}>
          <CirculoVirtuoso reducedMotion={reducedMotion} />

          {!lowPower && (
            <ContactShadows
              position={[0, -1.7, 0]}
              opacity={0.22}
              scale={18}
              blur={2.8}
              far={6}
              resolution={512}
              color="#3A3A55"
            />
          )}
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
        enableZoom
        minDistance={6.5}
        maxDistance={12}
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
