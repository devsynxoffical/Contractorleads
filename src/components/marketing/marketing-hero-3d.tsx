"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import type { Group, Mesh } from "three";

function LeadPins({ count = 28 }: { count?: number }) {
  const group = useRef<Group>(null);
  const pins = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 1.55;
      return {
        position: [
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi),
        ] as [number, number, number],
        scale: 0.035 + (i % 5) * 0.008,
        hue: i % 3,
      };
    });
  }, [count]);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.12;
  });

  return (
    <group ref={group}>
      {pins.map((p, i) => (
        <mesh key={i} position={p.position} scale={p.scale}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial
            color={p.hue === 0 ? "#ec4899" : p.hue === 1 ? "#d946ef" : "#a855f7"}
            emissive={p.hue === 0 ? "#ec4899" : p.hue === 1 ? "#d946ef" : "#a855f7"}
            emissiveIntensity={0.55}
            roughness={0.35}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function CoreOrb() {
  const mesh = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.y += dt * 0.18;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.55}>
      <Sphere ref={mesh} args={[1.15, 64, 64]}>
        <MeshDistortMaterial
          color="#1a0f2e"
          attach="material"
          distort={0.28}
          speed={1.6}
          roughness={0.25}
          metalness={0.55}
          emissive="#7c3aed"
          emissiveIntensity={0.22}
        />
      </Sphere>
      <Sphere args={[1.22, 32, 32]}>
        <meshBasicMaterial color="#d946ef" transparent opacity={0.08} wireframe />
      </Sphere>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[4, 3, 5]} intensity={1.4} color="#f0abfc" />
      <pointLight position={[-4, -2, -3]} intensity={0.9} color="#a855f7" />
      <CoreOrb />
      <LeadPins />
    </>
  );
}

export function MarketingHero3D() {
  return (
    <div className="marketing-hero-3d absolute inset-0 -z-0">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 70% 45%, rgba(217,70,239,0.18), transparent 60%), linear-gradient(180deg, transparent 55%, var(--canvas) 100%)",
        }}
      />
    </div>
  );
}
