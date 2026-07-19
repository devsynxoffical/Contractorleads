"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Stars } from "@react-three/drei";
import type { Group, Mesh } from "three";
import { motion } from "framer-motion";

function LeadPins({ count = 36 }: { count?: number }) {
  const group = useRef<Group>(null);
  const pins = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const r = 1.62;
      return {
        position: [
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi),
        ] as [number, number, number],
        scale: 0.03 + (i % 5) * 0.007,
        hue: i % 3,
      };
    });
  }, [count]);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.1;
  });

  return (
    <group ref={group}>
      {pins.map((p, i) => (
        <mesh key={i} position={p.position} scale={p.scale}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial
            color={p.hue === 0 ? "#ec4899" : p.hue === 1 ? "#d946ef" : "#a855f7"}
            emissive={
              p.hue === 0 ? "#ec4899" : p.hue === 1 ? "#d946ef" : "#a855f7"
            }
            emissiveIntensity={0.6}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function CoreOrb() {
  const mesh = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.y += dt * 0.15;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <Sphere ref={mesh} args={[1.18, 64, 64]}>
        <MeshDistortMaterial
          color="#140a22"
          distort={0.32}
          speed={1.8}
          roughness={0.2}
          metalness={0.65}
          emissive="#7c3aed"
          emissiveIntensity={0.28}
        />
      </Sphere>
      <Sphere args={[1.28, 28, 28]}>
        <meshBasicMaterial color="#ec4899" transparent opacity={0.07} wireframe />
      </Sphere>
      <Sphere args={[1.45, 24, 24]}>
        <meshBasicMaterial color="#a855f7" transparent opacity={0.04} wireframe />
      </Sphere>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#00000000"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 4, 6]} intensity={1.6} color="#f9a8d4" />
      <pointLight position={[-5, -3, -4]} intensity={1.1} color="#a855f7" />
      <Stars radius={40} depth={30} count={800} factor={2} fade speed={0.4} />
      <CoreOrb />
      <LeadPins />
    </>
  );
}

export function MarketingHero3D() {
  return (
    <div className="marketing-hero-3d absolute inset-0 -z-0">
      <Canvas
        camera={{ position: [0, 0.15, 4.4], fov: 40 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 72% 42%, rgba(217,70,239,0.22), transparent 58%), radial-gradient(ellipse 40% 35% at 20% 70%, rgba(236,72,153,0.12), transparent 55%), linear-gradient(180deg, transparent 50%, var(--canvas) 100%)",
        }}
      />
      {/* Animated grid */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(217,70,239,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(217,70,239,0.35) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 65% 40%, black, transparent)",
        }}
        animate={{ backgroundPosition: ["0px 0px", "56px 56px"] }}
        transition={{ duration: 28, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}
