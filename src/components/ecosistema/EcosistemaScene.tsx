'use client';

import { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import CirculoVirtuoso from './CirculoVirtuoso';
import { useEcosistemaStore } from '@/lib/useEcosistemaStore';

interface EcosistemaSceneProps {
  reducedMotion: boolean;
  lowPower: boolean;
  isDesktop: boolean;
}

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
    const selectedX = isDesktop ? -2.3 : -0.35;
    const targetX = selectedId ? selectedX : baseX;
    g.position.x = THREE.MathUtils.damp(g.position.x, targetX, 4.5, delta);

    const targetScale = selectedId ? (isDesktop ? 0.82 : 0.9) : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, targetScale, 4.5, delta));

    const rx = reducedMotion ? 0.18 : 0.18 - pointer.y * 0.28;
    const ry = reducedMotion ? 0 : pointer.x * 0.34;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, rx, 3.7, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, ry, 3.7, delta);
  });

  return <group ref={groupRef}>{children}</group>;
}

const BASE_FOV = 42;
const BASE_DISTANCE = 10.5;
const BASE_ELEVATION_RATIO = 2.9 / 10.5;
const TARGET_HALF_WIDTH = 4.2;

function CamaraResponsiva() {
  const { camera, size } = useThree();

  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;

    if (aspect >= 1) {
      persp.fov = BASE_FOV;
      persp.position.z = BASE_DISTANCE;
      persp.position.y = BASE_DISTANCE * BASE_ELEVATION_RATIO;
    } else {
      const fovDeg = THREE.MathUtils.clamp(
        BASE_FOV + (1 - aspect) * 24,
        BASE_FOV,
        62
      );
      const fovRad = THREE.MathUtils.degToRad(fovDeg);
      const distance = THREE.MathUtils.clamp(
        TARGET_HALF_WIDTH / (aspect * Math.tan(fovRad / 2)),
        BASE_DISTANCE,
        22
      );
      persp.fov = fovDeg;
      persp.position.z = distance;
      persp.position.y = distance * BASE_ELEVATION_RATIO;
    }
    persp.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

const PARTICLE_COUNT = 160;
const ATTRACT_POINT = new THREE.Vector3(-1.8, 0.5, 2.6);

function PolvoAmbiental({ reducedMotion }: { reducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const selectedId = useEcosistemaStore((s) => s.selectedId);

  const homePositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 5.5 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = Math.abs(r * Math.cos(phi) * 0.55) + 0.4;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) - 2.5;
    }
    return arr;
  }, []);

  const livePositions = useMemo(
    () => homePositions.slice(),
    [homePositions]
  );

  useFrame((_, delta) => {
    if (pointsRef.current && !reducedMotion) {
      pointsRef.current.rotation.y += delta * 0.02;
    }

    const posAttr = pointsRef.current?.geometry.attributes.position as
      | THREE.BufferAttribute
      | undefined;
    if (!posAttr) return;

    const pull = selectedId ? 0.16 : 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;
      const targetX = THREE.MathUtils.lerp(homePositions[ix], ATTRACT_POINT.x, pull);
      const targetY = THREE.MathUtils.lerp(homePositions[iy], ATTRACT_POINT.y, pull);
      const targetZ = THREE.MathUtils.lerp(homePositions[iz], ATTRACT_POINT.z, pull);
      
      livePositions[ix] = THREE.MathUtils.damp(livePositions[ix], targetX, 2, delta);
      livePositions[iy] = THREE.MathUtils.damp(livePositions[iy], targetY, 2, delta);
      livePositions[iz] = THREE.MathUtils.damp(livePositions[iz], targetZ, 2, delta);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[livePositions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#d85a30"
        size={0.045}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

// OPTIMIZACIÓN: Extraer geometría masiva de plano
const backgroundPlaneGeo = new THREE.PlaneGeometry(120, 120);
const backgroundPlaneMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

function BackgroundDeselect() {
  const deselect = useEcosistemaStore((s) => s.deselect);
  return (
    <mesh
      geometry={backgroundPlaneGeo}
      material={backgroundPlaneMat}
      position={[0, 0, -8]}
      onClick={(e) => {
        e.stopPropagation();
        deselect();
      }}
    />
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
      gl={{ antialias: !lowPower, alpha: true }}
    >
      <CamaraResponsiva />

      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 9, 6]} intensity={1.1} />
      <directionalLight position={[-6, 4, 3]} intensity={0.5} />
      <directionalLight position={[0, 2, -6]} intensity={0.4} />

      <BackgroundDeselect />
      {!lowPower && <PolvoAmbiental reducedMotion={reducedMotion} />}

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