"use client";

import React, { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import * as THREE from "three";
import { Canvas, useLoader, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html, Stars } from "@react-three/drei";
import { OBJLoader, PLYLoader } from "three-stdlib";
import { useGLTF } from "@react-three/drei";
import { ArrowLeft, Loader2, Maximize2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// ============================================================================
// Model Component
// ============================================================================

function ModelViewer({ modelName }: { modelName: string }) {
  // Determine material color based on the model
  const materialColor = useMemo(() => {
    switch (modelName) {
      case "her":
        return "#fda4af"; // Soft Rose Gold/Pink
      case "me":
        return "#f59e0b"; // Gold
      case "keychain":
        return "#111111"; // Black text
      case "pair":
        return "#f59e0b"; // Violet
      case "toy":
        return "#0f8bffff"; // White
      default:
        return "#399fffff";
    }
  }, [modelName]);

  if (modelName === "her") {
    return <GlbModel url="/3d/her.glb" color={materialColor} />;
  } else if (modelName === "keychain") {
    return <ObjModel url="/3d/model (1).obj" color={materialColor} rotation={[0, Math.PI, 0]} />;
  } else {
    return <ObjModel url={`/3d/${modelName}.obj`} color={materialColor} />;
  }
}

function GlbModel({ url, color }: { url: string; color: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const clone = scene.clone();
    
    clone.scale.setScalar(1);
    clone.position.set(0, 0, 0);

    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 5 / (maxDim || 1);
    
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    clone.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.8,
          roughness: 0.2,
          side: THREE.DoubleSide,
        });
      }
    });
    return clone;
  }, [scene, color]);

  return <primitive object={cloned} />;
}

function PlyModel({ url, color }: { url: string; color: string }) {
  const geometry = useLoader(PLYLoader, url);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (geometry) {
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      const box = geometry.boundingBox || new THREE.Box3();

      const size = new THREE.Vector3();
      box.getSize(size);

      geometry.center();

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / (maxDim || 1);

      if (meshRef.current) {
        meshRef.current.scale.setScalar(scale);
      }
    }
  }, [geometry]);

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        metalness={0.9}
        roughness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ObjModel({ url, color, rotation }: { url: string; color: string; rotation?: [number, number, number] }) {
  const obj = useLoader(OBJLoader, url);

  const cloned = useMemo(() => {
    const clone = obj.clone();
    
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 5 / (maxDim || 1);
    
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    
    clone.traverse((child: any) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.9,
          roughness: 0.1,
          side: THREE.DoubleSide,
        });
      }
    });
    return clone;
  }, [obj, color]);

  return (
    <group rotation={rotation || [0, 0, 0]}>
      <primitive object={cloned} />
    </group>
  );
}

// ============================================================================
// Rotating Lights Helper
// ============================================================================
function RotatingLights() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime() * 0.5;
      lightRef.current.position.x = Math.cos(t) * 10;
      lightRef.current.position.z = Math.sin(t) * 10;
    }
  });
  const useRefLight = lightRef as React.RefObject<THREE.DirectionalLight>;
  return <directionalLight ref={useRefLight} intensity={1.5} position={[5, 8, 5]} />;
}

// ============================================================================
// Main Viewer Content
// ============================================================================

function ViewerContent() {
  const searchParams = useSearchParams();
  const modelName = searchParams.get("model") || "her";
  const [mounted, setMounted] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    const duration = 1200;
    const intervalTime = 15;
    const steps = duration / intervalTime;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const nextProgress = Math.min(100, Math.round((step / steps) * 100));
      setLoadingProgress(nextProgress);
      if (step >= steps) {
        clearInterval(timer);
        setIsPageLoading(false);
      }
    }, intervalTime);
    return () => clearInterval(timer);
  }, []);

  const MODELS = useMemo(() => ["her", "me", "keychain", "pair", "toy"], []);
  const currentIndex = useMemo(() => {
    const idx = MODELS.indexOf(modelName);
    return idx === -1 ? 0 : idx;
  }, [modelName, MODELS]);

  const prevModel = useMemo(() => {
    const prevIdx = (currentIndex - 1 + MODELS.length) % MODELS.length;
    return MODELS[prevIdx];
  }, [currentIndex, MODELS]);

  const nextModel = useMemo(() => {
    const nextIdx = (currentIndex + 1) % MODELS.length;
    return MODELS[nextIdx];
  }, [currentIndex, MODELS]);

  const modelTitle = useMemo(() => {
    switch (modelName) {
      case "her":
        return "Her 3D Memory 🌸";
      case "me":
        return "My 3D Bust ⚡";
      case "keychain":
        return "Keychain Keeper 🔑";
      case "pair":
        return "Connected Souls 💞";
      case "toy":
        return "Toy Companion 🧸";
      default:
        return "Interactive 3D Memory";
    }
  }, [modelName]);

  const modelDesc = useMemo(() => {
    switch (modelName) {
      case "her":
        return "A beautiful 3D model representing her presence, rendered in real-time GLB space.";
      case "me":
        return "An artistic 3D sculpture of myself, styled with a polished gold finish.";
      case "keychain":
        return "A golden keychain memory holding our tokens of affection together.";
      case "pair":
        return "An elegant, matching duo sculpture, finished in warm polished rose gold.";
      case "toy":
        return "A whimsical, metallic-ceramic green companion sculpture, representing our playful side.";
      default:
        return "Interact, pan, rotate, and zoom around this memory in 3D space.";
    }
  }, [modelName]);

  if (!mounted || isPageLoading) {
    return (
      <main className="relative min-h-screen w-full bg-[#030308] text-white flex flex-col items-center justify-center p-4">
        {/* Soft pink/purple ambient light in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-purple-900/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="flex flex-col items-center justify-center relative z-10">
          <img 
            src="/loader.gif" 
            alt="Loading..." 
            className="w-32 h-32 sm:w-44 sm:h-44 object-contain filter drop-shadow-[0_0_12px_rgba(168,85,247,0.25)]" 
          />
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <p className="text-purple-400/90 text-[10px] sm:text-xs font-outfit uppercase tracking-[0.25em] font-semibold animate-pulse">
              Entering 3D Space...
            </p>
            <span className="text-white/80 font-mono text-xs sm:text-sm font-bold">
              {loadingProgress}%
            </span>
            {/* Ambient Progress Bar */}
            <div className="w-28 sm:w-36 h-[3px] bg-white/5 rounded-full overflow-hidden mt-1 border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75 ease-out" 
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.05)_0%,transparent_80%)] pointer-events-none z-0" />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.5} />
        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-xs font-outfit uppercase tracking-widest text-gray-400 whitespace-nowrap">Loading 3D Mesh...</span>
              </div>
            </Html>
          }
        >
          <RotatingLights />
          <pointLight position={[-8, -8, -8]} intensity={0.5} />
          <ModelViewer modelName={modelName} />
          <Environment preset="studio" />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            enableDamping={true}
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={15}
            makeDefault
          />
        </Suspense>
      </Canvas>

      {/* Floating Header */}
      <div className="absolute top-8 left-8 right-8 z-20 flex justify-between items-center pointer-events-none">
        <a
          href="/reveal"
          className="pointer-events-auto px-5 py-2.5 rounded-full bg-black/55 border border-white/10 backdrop-blur-md text-white font-extrabold font-outfit text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={12} />
          <span>Back to Memories</span>
        </a>

        <div className="hidden md:flex pointer-events-auto px-4 py-2 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm items-center gap-4 text-[10px] font-outfit text-gray-400 uppercase tracking-wider">
          <span>Drag to Rotate</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span>Scroll to Zoom</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span>Right-Click drag to Pan</span>
        </div>
      </div>

      {/* Navigation Arrows */}
      <a
        href={`/3d?model=${prevModel}`}
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 bg-black/65 border border-white/15 hover:bg-rose-500 hover:border-rose-500 p-3 sm:p-4 rounded-full text-white transition-all cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.7)] hover:scale-110 active:scale-95 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] flex items-center justify-center"
      >
        <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
      </a>

      <a
        href={`/3d?model=${nextModel}`}
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 bg-black/65 border border-white/15 hover:bg-rose-500 hover:border-rose-500 p-3 sm:p-4 rounded-full text-white transition-all cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.7)] hover:scale-110 active:scale-95 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] flex items-center justify-center"
      >
        <ChevronRight size={20} className="sm:w-6 sm:h-6" />
      </a>

      {/* Bottom Info Sheet */}
      <div className="absolute bottom-8 left-8 right-8 md:max-w-md z-20 pointer-events-none">
        <div className="pointer-events-auto p-6 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-2">
          <span className="text-[9px] font-outfit uppercase tracking-[0.2em] font-semibold text-rose-400">
            Interactive 3D Opener
          </span>
          <h1 className="text-white text-lg sm:text-xl font-playfair font-bold">
            {modelTitle}
          </h1>
          <p className="text-gray-300 text-xs font-outfit font-light leading-relaxed">
            {modelDesc}
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrap search params component in Suspense boundary for Next.js build compliance
export default function Page3DViewer() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      }
    >
      <ViewerContent />
    </Suspense>
  );
}
