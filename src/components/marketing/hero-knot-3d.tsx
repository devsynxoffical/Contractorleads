"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { MathUtils } from "three";

/**
 * Glowing torus knot for the homepage hero. Slow idle rotation, gentle float,
 * and a pointer-driven tilt so the object feels alive without being busy.
 * Honors prefers-reduced-motion by freezing rotation and float.
 */
function Knot({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null);
  const inner = useRef<Mesh>(null);
  const { pointer } = useThree();

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (!reduced) {
      g.rotation.y += dt * 0.22;
      g.rotation.x += dt * 0.07;
      if (inner.current) inner.current.rotation.z -= dt * 0.12;
    }
    // Pointer parallax: ease toward the cursor, never snap.
    const targetX = pointer.y * 0.35;
    const targetZ = -pointer.x * 0.35;
    g.rotation.x = MathUtils.lerp(g.rotation.x, g.rotation.x + targetX * 0.02, 0.1);
    g.rotation.z = MathUtils.lerp(g.rotation.z, targetZ, 0.04);
  });

  return (
    <Float
      speed={reduced ? 0 : 1.1}
      rotationIntensity={reduced ? 0 : 0.25}
      floatIntensity={reduced ? 0 : 0.5}
    >
      <group ref={group} rotation={[0.6, 0.2, 0]}>
        {/* Core glossy body */}
        <mesh>
          <torusKnotGeometry args={[0.95, 0.3, 260, 40, 2, 3]} />
          <meshPhysicalMaterial
            color="#3b0764"
            emissive="#a21caf"
            emissiveIntensity={0.32}
            metalness={0.85}
            roughness={0.22}
            clearcoat={1}
            clearcoatRoughness={0.08}
            iridescence={1}
            iridescenceIOR={1.6}
            iridescenceThicknessRange={[120, 560]}
            sheen={0.6}
            sheenColor="#f0abfc"
          />
        </mesh>
        {/* Inner light-blue filament for the two-tone glow */}
        <mesh ref={inner} scale={0.985}>
          <torusKnotGeometry args={[0.95, 0.17, 220, 24, 2, 3]} />
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#38bdf8"
            emissiveIntensity={1.4}
            transparent
            opacity={0.55}
            roughness={0.4}
          />
        </mesh>
        {/* Soft outer halo */}
        <mesh scale={1.06}>
          <torusKnotGeometry args={[0.95, 0.33, 140, 16, 2, 3]} />
          <meshBasicMaterial color="#e879f9" transparent opacity={0.07} wireframe />
        </mesh>
      </group>
    </Float>
  );
}

function Particles({ count = 60, reduced }: { count?: number; reduced: boolean }) {
  const group = useRef<Group>(null);
  const seeds = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const r = 2.2 + ((i * 7919) % 100) / 60;
    const y = (((i * 104729) % 100) / 100 - 0.5) * 3.2;
    return { pos: [Math.cos(a) * r, y, Math.sin(a) * r] as [number, number, number], s: 0.012 + ((i * 31) % 7) * 0.003 };
  });
  useFrame((_, dt) => {
    if (group.current && !reduced) group.current.rotation.y -= dt * 0.03;
  });
  return (
    <group ref={group}>
      {seeds.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.s}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color={i % 3 === 0 ? "#f0abfc" : "#a5b4fc"} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export function HeroKnot3D({ reduced = false }: { reduced?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 36 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      frameloop={reduced ? "demand" : "always"}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[4, 3, 5]} intensity={40} color="#f472b6" />
      <pointLight position={[-5, -2, 3]} intensity={36} color="#38bdf8" />
      <pointLight position={[0, -4, -3]} intensity={18} color="#a855f7" />
      <pointLight position={[2, 5, -4]} intensity={22} color="#c4b5fd" />
      <spotLight position={[0, 6, 3]} angle={0.5} penumbra={1} intensity={30} color="#ffffff" />
      <Knot reduced={reduced} />
      <Particles reduced={reduced} />
    </Canvas>
  );
}
