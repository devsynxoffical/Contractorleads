"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Float,
  Lightformer,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import type { Group, MeshBasicMaterial } from "three";
import { CanvasTexture, MathUtils, RepeatWrapping, SRGBColorSpace } from "three";

/**
 * Glass torus knot for the homepage hero.
 *
 * Two layers: an inner tube wrapped in an animated pink -> blue -> violet
 * gradient texture (the "light inside"), and an outer refracting glass shell
 * that picks up the gradient plus bright reflections from an in-scene
 * light environment. No network assets, no post-processing dependency.
 */

function createFlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
    // Seamless loop: first and last stops match.
    g.addColorStop(0.0, "#f0abfc");
    g.addColorStop(0.18, "#e879f9");
    g.addColorStop(0.36, "#a855f7");
    g.addColorStop(0.52, "#60a5fa");
    g.addColorStop(0.68, "#22d3ee");
    g.addColorStop(0.84, "#c084fc");
    g.addColorStop(1.0, "#f0abfc");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(2, 1);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function Knot({ reduced }: { reduced: boolean }) {
  const group = useRef<Group>(null);
  const flow = useMemo(() => createFlowTexture(), []);
  const coreMat = useRef<MeshBasicMaterial>(null);
  const { pointer } = useThree();

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (!reduced) {
      g.rotation.y += dt * 0.18;
      g.rotation.x += dt * 0.05;
      const map = coreMat.current?.map;
      if (map) map.offset.x -= dt * 0.06; // colour flows along the tube
    }
    const targetZ = -pointer.x * 0.3;
    const targetTilt = pointer.y * 0.18;
    g.rotation.z = MathUtils.lerp(g.rotation.z, targetZ, 0.05);
    g.position.y = MathUtils.lerp(g.position.y, targetTilt, 0.05);
  });

  return (
    <Float
      speed={reduced ? 0 : 1}
      rotationIntensity={reduced ? 0 : 0.2}
      floatIntensity={reduced ? 0 : 0.45}
    >
      <group ref={group} rotation={[0.55, 0.35, 0]}>
        {/* Inner light tube */}
        <mesh>
          <torusKnotGeometry args={[0.95, 0.21, 300, 32, 2, 3]} />
          <meshBasicMaterial ref={coreMat} map={flow} toneMapped={false} />
        </mesh>
        {/* Outer glass shell */}
        <mesh>
          <torusKnotGeometry args={[0.95, 0.33, 300, 48, 2, 3]} />
          <MeshTransmissionMaterial
            transmission={1}
            thickness={0.9}
            roughness={0.06}
            ior={1.35}
            chromaticAberration={0.08}
            anisotropicBlur={0.25}
            distortion={0.25}
            distortionScale={0.35}
            temporalDistortion={reduced ? 0 : 0.12}
            clearcoat={1}
            clearcoatRoughness={0.05}
            color="#f5e9ff"
            attenuationColor="#d8b4fe"
            attenuationDistance={1.6}
            samples={6}
            resolution={512}
            backside
            backsideThickness={0.4}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Sparks({ count = 48, reduced }: { count?: number; reduced: boolean }) {
  const group = useRef<Group>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const r = 2.1 + ((i * 7919) % 100) / 55;
        const y = (((i * 104729) % 100) / 100 - 0.5) * 3.4;
        return {
          pos: [Math.cos(a) * r, y, Math.sin(a) * r] as [number, number, number],
          s: 0.012 + ((i * 31) % 7) * 0.004,
          c: i % 4 === 0 ? "#f0abfc" : i % 4 === 1 ? "#93c5fd" : "#ffffff",
        };
      }),
    [count],
  );
  useFrame((_, dt) => {
    if (group.current && !reduced) group.current.rotation.y -= dt * 0.025;
  });
  return (
    <group ref={group}>
      {seeds.map((p, i) => (
        <mesh key={i} position={p.pos} scale={p.s}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color={p.c} transparent opacity={0.85} toneMapped={false} />
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
      {/* Procedural light environment: gives the glass its bright reflections */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="ring" intensity={6} color="#f0abfc" scale={6} position={[4, 3, -4]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={5} color="#93c5fd" scale={[8, 2, 1]} position={[-5, -2, -3]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={8} color="#ffffff" scale={[1.5, 6, 1]} position={[0, 5, 2]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={4} color="#c084fc" scale={4} position={[0, -5, -2]} target={[0, 0, 0]} />
      </Environment>
      <ambientLight intensity={0.2} />
      <pointLight position={[4, 3, 5]} intensity={30} color="#f472b6" />
      <pointLight position={[-5, -1, 3]} intensity={28} color="#38bdf8" />
      <Knot reduced={reduced} />
      <Sparks reduced={reduced} />
    </Canvas>
  );
}
