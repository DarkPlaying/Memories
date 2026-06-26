"use client";

import * as React from "react";
import { useRef, useMemo, useCallback, useState, useEffect, Suspense } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FlowButton } from "@/components/ui/flow-button";
import { Heart } from "lucide-react";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ButterflyProps {
  id: number;
  image: string;
  className: string;
}

export interface FloatingIconsHeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  images: string[];
}

// ============================================================================
// Floating Butterfly Component (Repelling & Flapping Real Images)
// ============================================================================

const Butterfly = ({
  mouseX,
  mouseY,
  butterflyData,
  index,
}: {
  mouseX: React.MutableRefObject<number>;
  mouseY: React.MutableRefObject<number>;
  butterflyData: ButterflyProps;
  index: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 22 });
  const springY = useSpring(y, { stiffness: 220, damping: 22 });

  useEffect(() => {
    const handleMouseMove = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(mouseX.current - (rect.left + rect.width / 2), 2) +
            Math.pow(mouseY.current - (rect.top + rect.height / 2), 2)
        );

        if (distance < 160) {
          const angle = Math.atan2(
            mouseY.current - (rect.top + rect.height / 2),
            mouseX.current - (rect.left + rect.width / 2)
          );
          const force = (1 - distance / 160) * 65;
          x.set(-Math.cos(angle) * force);
          y.set(-Math.sin(angle) * force);
        } else {
          x.set(0);
          y.set(0);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [x, y, mouseX, mouseY]);

  const flapDuration = useMemo(() => 0.18 + Math.random() * 0.12, []);

  return (
    <motion.div
      ref={ref}
      key={butterflyData.id}
      style={{
        x: springX,
        y: springY,
      }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: index * 0.04,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn("absolute z-20 pointer-events-auto", butterflyData.className)}
    >
      <motion.div
        className="cursor-pointer select-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        animate={{
          y: [0, -12, 0, 12, 0],
          x: [0, 8, 0, -8, 0],
          rotate: [0, 7, 0, -7, 0],
        }}
        transition={{
          duration: 4 + Math.random() * 4,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        <img
          src={butterflyData.image}
          alt="Butterfly"
          className="w-10 h-10 md:w-12 md:h-12 object-contain pointer-events-none select-none mix-blend-screen"
          style={{
            animation: butterflyData.image.endsWith(".gif") ? "none" : `an-image-flap ${flapDuration}s infinite ease-in-out`
          }}
        />
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// 3D Infinite Gallery Shader Material & Logic
// ============================================================================

type ImageItem = string | { src: string; alt?: string };

interface FadeSettings {
  fadeIn: { start: number; end: number };
  fadeOut: { start: number; end: number };
}

interface BlurSettings {
  blurIn: { start: number; end: number };
  blurOut: { start: number; end: number };
  maxBlur: number;
}

interface InfiniteGalleryProps {
  images: ImageItem[];
  speed?: number;
  visibleCount?: number;
  fadeSettings?: FadeSettings;
  blurSettings?: BlurSettings;
  className?: string;
  style?: React.CSSProperties;
  isImageControlActive: boolean;
}

interface PlaneData {
  index: number;
  z: number;
  imageIndex: number;
  x: number;
  y: number;
}

const DEFAULT_DEPTH_RANGE = 50;
const MAX_HORIZONTAL_OFFSET = 8;
const MAX_VERTICAL_OFFSET = 8;

const createClothMaterial = () => {
  return new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      map: { value: null },
      opacity: { value: 1.0 },
      blurAmount: { value: 0.0 },
      scrollForce: { value: 0.0 },
      time: { value: 0.0 },
      isHovered: { value: 0.0 },
    },
    vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vNormal = normal;
        
        vec3 pos = position;
        float curveIntensity = scrollForce * 0.3;
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;
        
        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;
        
        float flagWave = 0.0;
        if (isHovered > 0.5) {
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float waveAmplitude = sin(wavePhase) * 0.1;
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = waveAmplitude * dampening;
          
          float secondaryWave = sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
          flagWave += secondaryWave;
        }
        
        pos.z -= (curve + clothEffect + flagWave);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vec4 color = texture2D(map, vUv);
        
        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;
          
          for (float x = -1.0; x <= 1.0; x += 1.0) {
            for (float y = -1.0; y <= 1.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount * 2.0;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }
        
        float curveHighlight = abs(scrollForce) * 0.05;
        color.rgb += vec3(curveHighlight * 0.1);
        
        gl_FragColor = vec4(color.rgb, color.a * opacity);
        
        // Convert from Linear back to sRGB for display to fix dark contrast!
        gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0 / 2.2));
      }
    `,
  });
};

const ImagePlane = ({
  planeIndex,
  planesData,
  texturesRef,
  materials,
  depthRange,
  fadeSettings,
  blurSettings,
}: {
  planeIndex: number;
  planesData: React.MutableRefObject<PlaneData[]>;
  texturesRef: React.MutableRefObject<THREE.Texture[]>;
  materials: THREE.ShaderMaterial[];
  depthRange: number;
  fadeSettings: FadeSettings;
  blurSettings: BlurSettings;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  const material = materials[planeIndex];

  useEffect(() => {
    if (material && material.uniforms) {
      material.uniforms.isHovered.value = isHovered ? 1.0 : 0.0;
    }
  }, [material, isHovered]);

  useFrame((state, delta) => {
    if (!meshRef.current || !material) return;
    const plane = planesData.current[planeIndex];
    if (!plane) return;

    // Update position directly (ultra-smooth rendering bypasses React re-render)
    const worldZ = plane.z - depthRange / 2;
    meshRef.current.position.set(plane.x, plane.y, worldZ);

    // Update scale and texture dynamically based on image loading
    const texture = texturesRef.current[plane.imageIndex];
    if (texture && texture.image) {
      meshRef.current.visible = true;
      const aspect = (texture.image as any).width / (texture.image as any).height;
      const scale: [number, number, number] =
        aspect > 1 ? [3.8 * aspect, 3.8, 1] : [3.8, 3.8 / aspect, 1];
      meshRef.current.scale.set(...scale);

      if (material.uniforms && material.uniforms.map) {
        material.uniforms.map.value = texture;
      }
    } else {
      meshRef.current.visible = false;
    }

    // Calculate opacity based on fade settings
    const totalRange = depthRange;
    const normalizedPosition = plane.z / totalRange; // 0 to 1
    let opacity = 1;

    if (
      normalizedPosition >= fadeSettings.fadeIn.start &&
      normalizedPosition <= fadeSettings.fadeIn.end
    ) {
      const fadeInProgress =
        (normalizedPosition - fadeSettings.fadeIn.start) /
        (fadeSettings.fadeIn.end - fadeSettings.fadeIn.start);
      opacity = fadeInProgress;
    } else if (normalizedPosition < fadeSettings.fadeIn.start) {
      opacity = 0;
    } else if (
      normalizedPosition >= fadeSettings.fadeOut.start &&
      normalizedPosition <= fadeSettings.fadeOut.end
    ) {
      const fadeOutProgress =
        (normalizedPosition - fadeSettings.fadeOut.start) /
        (fadeSettings.fadeOut.end - fadeSettings.fadeOut.start);
      opacity = 1 - fadeOutProgress;
    } else if (normalizedPosition > fadeSettings.fadeOut.end) {
      opacity = 0;
    }

    // Max opacity (fully opaque, remove transparency cap)
    opacity = Math.max(0, Math.min(1, opacity));

    // Calculate blur based on blur settings
    let blur = 0;

    if (
      normalizedPosition >= blurSettings.blurIn.start &&
      normalizedPosition <= blurSettings.blurIn.end
    ) {
      const blurInProgress =
        (normalizedPosition - blurSettings.blurIn.start) /
        (blurSettings.blurIn.end - blurSettings.blurIn.start);
      blur = blurSettings.maxBlur * (1 - blurInProgress);
    } else if (normalizedPosition < blurSettings.blurIn.start) {
      blur = blurSettings.maxBlur;
    } else if (
      normalizedPosition >= blurSettings.blurOut.start &&
      normalizedPosition <= blurSettings.blurOut.end
    ) {
      const blurOutProgress =
        (normalizedPosition - blurSettings.blurOut.start) /
        (blurSettings.blurOut.end - blurSettings.blurOut.start);
      blur = blurSettings.maxBlur * blurOutProgress;
    } else if (normalizedPosition > blurSettings.blurOut.end) {
      blur = blurSettings.maxBlur;
    }

    blur = Math.max(0, Math.min(blurSettings.maxBlur, blur));

    if (material.uniforms) {
      material.uniforms.opacity.value = opacity;
      material.uniforms.blurAmount.value = blur;
    }
  });

  return (
    <mesh
      ref={meshRef}
      material={material}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <planeGeometry args={[1, 1, 32, 32]} />
    </mesh>
  );
};

function GalleryScene({
  images,
  speed = 1,
  visibleCount = 12,
  fadeSettings = {
    fadeIn: { start: 0.05, end: 0.15 },
    fadeOut: { start: 0.85, end: 0.95 },
  },
  blurSettings = {
    blurIn: { start: 0.0, end: 0.1 },
    blurOut: { start: 0.85, end: 0.95 },
    maxBlur: 3.0,
  },
  isImageControlActive,
}: Omit<InfiniteGalleryProps, "className" | "style">) {
  const lastInteraction = useRef(Date.now());

  const scrollVelocityRef = useRef(0);
  const targetVelocityRef = useRef(0.4);

  const normalizedImages = useMemo(
    () =>
      images
        .filter((img) => {
          const src = typeof img === "string" ? img : img.src;
          return !src.match(/\.(mp4|mov)$/i);
        })
        .map((img) =>
          typeof img === "string" ? { src: img, alt: "" } : img
        ),
    [images]
  );

  const texturesRef = useRef<THREE.Texture[]>([]);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const allDomImages = Array.from(document.querySelectorAll("img"));

    normalizedImages.forEach((imgObj, index) => {
      const encodedUrl = encodeURI(imgObj.src);
      
      const applyTextureSettings = (texture: THREE.Texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        texturesRef.current[index] = texture;
      };

      // Find if this image is already in the DOM (e.g. from ArcGalleryHero)
      const domImg = allDomImages.find(
        (img) => img.src.endsWith(encodedUrl) || img.getAttribute("src") === imgObj.src
      );

      if (domImg) {
        if (domImg.complete && domImg.naturalWidth > 0) {
          // Create texture instantly from already-decoded bitmap memory!
          const texture = new THREE.Texture(domImg);
          applyTextureSettings(texture);
        } else {
          // Wait for the DOM image to finish loading and then instantly use its decoded bitmap
          domImg.addEventListener("load", () => {
            const texture = new THREE.Texture(domImg);
            applyTextureSettings(texture);
          }, { once: true });
        }
      } else {
        // Fallback to standard Three.js loader
        loader.load(
          encodedUrl,
          applyTextureSettings,
          undefined,
          (err) => console.error("Error loading texture in 3D Gallery:", imgObj.src, err)
        );
      }
    });

    return () => {
      texturesRef.current.forEach((t) => t?.dispose());
    };
  }, [normalizedImages]);

  const materials = useMemo(
    () => Array.from({ length: visibleCount }, () => createClothMaterial()),
    [visibleCount]
  );

  // Distribute planes keeping the center clear of images (legibility of title text)
  const spatialPositions = useMemo(() => {
    const positions: { x: number; y: number }[] = [];
    const maxHorizontalOffset = MAX_HORIZONTAL_OFFSET;
    const maxVerticalOffset = MAX_VERTICAL_OFFSET;

    for (let i = 0; i < visibleCount; i++) {
      const horizontalAngle = (i * 2.618) % (Math.PI * 2);
      const verticalAngle = (i * 1.618 + Math.PI / 3) % (Math.PI * 2);

      const horizontalRadius = (i % 3) * 1.2;
      const verticalRadius = ((i + 1) % 4) * 0.8;

      let x =
        (Math.sin(horizontalAngle) * horizontalRadius * maxHorizontalOffset) /
        3;
      
      // PUSH IMAGES OUTSIDE OF CENTRAL TEXT COLUMN [-3.5, 3.5]
      if (Math.abs(x) < 3.5) {
        x = Math.sign(x || 1) * (3.5 + Math.abs(x) * 0.5);
      }

      const y =
        (Math.cos(verticalAngle) * verticalRadius * maxVerticalOffset) / 4;

      positions.push({ x, y });
    }

    return positions;
  }, [visibleCount]);

  const totalImages = normalizedImages.length;
  const depthRange = DEFAULT_DEPTH_RANGE;

  const planesData = useRef<PlaneData[]>(
    Array.from({ length: visibleCount }, (_, i) => ({
      index: i,
      z: visibleCount > 0 ? ((depthRange / visibleCount) * i) % depthRange : 0,
      imageIndex: totalImages > 0 ? i % totalImages : 0,
      x: spatialPositions[i]?.x ?? 0,
      y: spatialPositions[i]?.y ?? 0,
    }))
  );

  useEffect(() => {
    planesData.current = Array.from({ length: visibleCount }, (_, i) => ({
      index: i,
      z:
        visibleCount > 0
          ? ((depthRange / Math.max(visibleCount, 1)) * i) % depthRange
          : 0,
      imageIndex: totalImages > 0 ? i % totalImages : 0,
      x: spatialPositions[i]?.x ?? 0,
      y: spatialPositions[i]?.y ?? 0,
    }));
  }, [depthRange, spatialPositions, totalImages, visibleCount]);

  // Viewport scroll lock speed control
  useEffect(() => {
    if (!isImageControlActive) return;

    // Capture and lock body/html overflow to prevent page scrolling on mobile/desktop
    const originalBodyOverflow = document.body.style.overflow;
    const originalDocOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const preventDefaultScroll = (e: WheelEvent) => {
      e.preventDefault(); // Stop page scrolling
      targetVelocityRef.current += e.deltaY * 0.006;
      lastInteraction.current = Date.now();
    };

    const preventDefaultTouch = (e: TouchEvent) => {
      e.preventDefault(); // Stop page scrolling
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Stop any bounce/page scrolling
      const touchY = e.touches[0].clientY;
      if (touchStartY === 0) {
        touchStartY = touchY;
        return;
      }
      const diffY = touchStartY - touchY;
      targetVelocityRef.current += diffY * 0.025;
      touchStartY = touchY;
      lastInteraction.current = Date.now();
    };

    window.addEventListener("wheel", preventDefaultScroll, { passive: false });
    document.addEventListener("touchmove", preventDefaultTouch, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      // Restore original body/html overflow scroll settings on deactivate/unmount
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocOverflow;

      window.removeEventListener("wheel", preventDefaultScroll);
      document.removeEventListener("touchmove", preventDefaultTouch);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isImageControlActive]);

  useFrame((state, delta) => {
    const clampedDelta = Math.min(delta, 0.1);

    // Smooth LERP (lerp actual velocity towards target velocity)
    const lerpAlpha = 1 - Math.exp(-7 * clampedDelta);
    scrollVelocityRef.current += (targetVelocityRef.current - scrollVelocityRef.current) * lerpAlpha;

    // Decay target velocity towards base speed (0.4 if autoplay, 0 if control speed active)
    const baseTarget = isImageControlActive ? 0 : 0.4;
    targetVelocityRef.current = targetVelocityRef.current * 0.95 + baseTarget * 0.05;

    const time = state.clock.getElapsedTime();
    materials.forEach((material) => {
      if (material && material.uniforms) {
        material.uniforms.time.value = time;
        material.uniforms.scrollForce.value = scrollVelocityRef.current;
      }
    });

    const imageAdvance =
      totalImages > 0 ? visibleCount % totalImages || totalImages : 0;
    const totalRange = depthRange;

    planesData.current.forEach((plane, i) => {
      let newZ = plane.z + scrollVelocityRef.current * clampedDelta * 10;
      let wrapsForward = 0;
      let wrapsBackward = 0;

      if (newZ >= totalRange) {
        wrapsForward = Math.floor(newZ / totalRange);
        newZ -= totalRange * wrapsForward;
      } else if (newZ < 0) {
        wrapsBackward = Math.ceil(-newZ / totalRange);
        newZ += totalRange * wrapsBackward;
      }

      if (wrapsForward > 0 && imageAdvance > 0 && totalImages > 0) {
        plane.imageIndex =
          (plane.imageIndex + wrapsForward * imageAdvance) % totalImages;
      }

      if (wrapsBackward > 0 && imageAdvance > 0 && totalImages > 0) {
        const step = plane.imageIndex - wrapsBackward * imageAdvance;
        plane.imageIndex = ((step % totalImages) + totalImages) % totalImages;
      }

      plane.z = ((newZ % totalRange) + totalRange) % totalRange;
      plane.x = spatialPositions[i]?.x ?? 0;
      plane.y = spatialPositions[i]?.y ?? 0;
    });
  });

  if (normalizedImages.length === 0) return null;

  return (
    <>
      {planesData.current.map((plane, i) => {
        const material = materials[i];

        if (!material) return null;

        return (
          <ImagePlane
            key={plane.index}
            planeIndex={i}
            planesData={planesData}
            texturesRef={texturesRef}
            materials={materials}
            depthRange={depthRange}
            fadeSettings={fadeSettings}
            blurSettings={blurSettings}
          />
        );
      })}
    </>
  );
}

function FallbackGallery({ images }: { images: ImageItem[] }) {
  const normalizedImages = useMemo(
    () =>
      images
        .filter((img) => {
          const src = typeof img === "string" ? img : img.src;
          return !src.match(/\.(mp4|mov)$/i);
        })
        .map((img) =>
          typeof img === "string" ? { src: img, alt: "" } : img
        ),
    [images]
  );

  return (
    <div className="flex flex-col items-center justify-center h-full bg-neutral-900/40 p-4 rounded-xl border border-white/5 backdrop-blur-md">
      <p className="text-gray-400 text-xs mb-4">
        WebGL not supported. Showing image list:
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {normalizedImages.map((img, i) => (
          <img
            key={i}
            src={img.src || "/placeholder.svg"}
            alt={img.alt}
            className="w-full h-24 object-cover rounded-lg border border-white/10"
          />
        ))}
      </div>
    </div>
  );
}

export function InfiniteGallery({
  images,
  className = "h-96 w-full",
  style,
  fadeSettings = {
    fadeIn: { start: 0.05, end: 0.15 },
    fadeOut: { start: 0.85, end: 0.95 },
  },
  blurSettings = {
    blurIn: { start: 0.0, end: 0.1 },
    blurOut: { start: 0.85, end: 0.95 },
    maxBlur: 3.0,
  },
  isImageControlActive,
}: InfiniteGalleryProps) {
  const [webglSupported, setWebglSupported] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
      }
    } catch (e) {
      setWebglSupported(false);
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!webglSupported) {
    return (
      <div className={className} style={style}>
        <FallbackGallery images={images} />
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <Canvas
        camera={{ position: [0, 0, 0], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <GalleryScene
            images={images}
            fadeSettings={fadeSettings}
            blurSettings={blurSettings}
            isImageControlActive={isImageControlActive}
            visibleCount={isMobile ? 6 : 12}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// ============================================================================
// Main Hero Section (Memorial Parts)
// ============================================================================

const REAL_BUTTERFLIES: ButterflyProps[] = [
  // Top Area (Safe from text)
  { id: 1, image: "/pink_butterfly.png", className: "top-[3%] left-[32%]" },
  { id: 2, image: "/blue_butterfly.png", className: "top-[8%] left-[40%]" },
  { id: 3, image: "/gold_butterfly.png", className: "top-[4%] left-[55%]" },
  { id: 4, image: "/pink_butterfly.png", className: "top-[7%] left-[65%]" },
  { id: 5, image: "/blue_butterfly.png", className: "top-[3%] left-[75%]" },

  // Left Flank (Organically spread horizontally up to 22%)
  { id: 6, image: "/pink_butterfly.png", className: "top-[6%] left-[4%]" },
  { id: 7, image: "/blue_butterfly.png", className: "top-[14%] left-[18%]" },
  { id: 8, image: "/gold_butterfly.png", className: "top-[22%] left-[8%]" },
  { id: 9, image: "/pink_butterfly.png", className: "top-[30%] left-[21%]" },
  { id: 10, image: "/blue_butterfly.png", className: "top-[38%] left-[5%]" },
  { id: 11, image: "/gold_butterfly.png", className: "top-[46%] left-[17%]" },
  { id: 12, image: "/pink_butterfly.png", className: "top-[54%] left-[9%]" },
  { id: 13, image: "/blue_butterfly.png", className: "top-[62%] left-[22%]" },
  { id: 14, image: "/gold_butterfly.png", className: "top-[70%] left-[6%]" },
  { id: 15, image: "/pink_butterfly.png", className: "top-[78%] left-[19%]" },
  { id: 16, image: "/blue_butterfly.png", className: "top-[86%] left-[8%]" },
  { id: 17, image: "/gold_butterfly.png", className: "top-[93%] left-[16%]" },

  // Right Flank (Organically spread horizontally up to 22%)
  { id: 18, image: "/pink_butterfly.png", className: "top-[8%] right-[5%]" },
  { id: 19, image: "/blue_butterfly.png", className: "top-[16%] right-[19%]" },
  { id: 20, image: "/gold_butterfly.png", className: "top-[24%] right-[7%]" },
  { id: 21, image: "/pink_butterfly.png", className: "top-[32%] right-[21%]" },
  { id: 22, image: "/blue_butterfly.png", className: "top-[40%] right-[6%]" },
  { id: 23, image: "/gold_butterfly.png", className: "top-[48%] right-[18%]" },
  { id: 24, image: "/pink_butterfly.png", className: "top-[56%] right-[8%]" },
  { id: 25, image: "/blue_butterfly.png", className: "top-[64%] right-[22%]" },
  { id: 26, image: "/gold_butterfly.png", className: "top-[72%] right-[5%]" },
  { id: 27, image: "/pink_butterfly.png", className: "top-[80%] right-[19%]" },
  { id: 28, image: "/blue_butterfly.png", className: "top-[88%] right-[7%]" },
  { id: 29, image: "/gold_butterfly.png", className: "top-[94%] right-[15%]" },

  // Bottom Area (Safe from text)
  { id: 30, image: "/gold_butterfly.png", className: "bottom-[4%] left-[30%]" },
  { id: 31, image: "/pink_butterfly.png", className: "bottom-[9%] left-[38%]" },
  { id: 32, image: "/blue_butterfly.png", className: "bottom-[5%] left-[52%]" },
  { id: 33, image: "/gold_butterfly.png", className: "bottom-[8%] left-[62%]" },
];

const BUTTERFLY_GIFS = [
  "/butterflies/Butterfly Lottie Animation.gif",
  "/butterflies/Butterfly Lottie Animation (1).gif",
  "/butterflies/butterfly rotated.gif"
];

const FloatingIconsHero = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & FloatingIconsHeroProps
>(({ className, title, subtitle, ctaText, ctaHref, onCtaClick, images, ...props }, ref) => {
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  const [isImageControlActive, setIsImageControlActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    mouseX.current = event.clientX;
    mouseY.current = event.clientY;
  };

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative w-full h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden bg-transparent rounded-none border-y border-white/5 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {/* Background 3D Infinite Gallery (Full opacity for images) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-100">
        {images && images.length > 0 && (
          <InfiniteGallery
            images={images}
            className="w-full h-full"
            isImageControlActive={isImageControlActive}
          />
        )}
      </div>

      {/* Dark Overlay Vignette over 3D background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,transparent_85%)] z-10 pointer-events-none" />

      {/* Container for the background floating icons (Flapping Butterflies) */}
      {!isMobile && (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
          {REAL_BUTTERFLIES.map((butterflyData, index) => {
            const gifImage = BUTTERFLY_GIFS[index % BUTTERFLY_GIFS.length];
            const dataWithGif = { ...butterflyData, image: gifImage };
            return (
              <Butterfly
                key={butterflyData.id}
                mouseX={mouseX}
                mouseY={mouseY}
                butterflyData={dataWithGif}
                index={index}
              />
            );
          })}
        </div>
      )}

      {/* Container for the foreground content */}
      <div className="relative z-30 text-center px-6 max-w-2xl pointer-events-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-3 shadow-[inset_0_0_10px_rgba(255,0,80,0.05)]">
          <Heart size={10} className="text-rose-500 fill-current animate-pulse" />
          <span className="text-[9px] font-outfit uppercase tracking-[0.2em] text-pink-200">✦ memories ✦</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-black tracking-tight bg-gradient-to-b from-white via-white to-gray-400 text-transparent bg-clip-text drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
          {title}
        </h2>
        <p className="mt-4 max-w-md mx-auto text-xs sm:text-sm md:text-base font-outfit text-gray-300 font-light leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {subtitle}
        </p>

        {/* View Love Chronicles CTA Button */}
        <div className="mt-8">
          {onCtaClick ? (
            <FlowButton text={ctaText} onClick={onCtaClick} />
          ) : (
            <FlowButton text={ctaText} href={ctaHref} />
          )}
        </div>

        {/* Interactive "Control Image" Scroll-Lock Button */}
        <button
          onClick={() => setIsImageControlActive(!isImageControlActive)}
          className={cn(
            "mt-5 px-5 py-2.5 text-[10px] font-outfit uppercase tracking-widest rounded-full border transition-all duration-300 flex items-center gap-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer select-none",
            isImageControlActive
              ? "bg-pink-600/30 border-pink-500/80 text-pink-300 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
              : "bg-black/60 border-white/10 text-white/70 hover:border-pink-500/40 hover:text-white"
          )}
        >
          <div className={cn(
            "w-3 h-3 rounded flex items-center justify-center border transition-all",
            isImageControlActive
              ? "bg-pink-500 border-pink-500 text-white"
              : "border-white/30 bg-transparent"
          )}>
            {isImageControlActive && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="font-semibold">Control Image Speed</span>
        </button>
      </div>

      {/* Inject custom CSS keyframes for butterfly wing flapping */}
      <style>{`
        @keyframes an-image-flap {
          0%, 100% {
            transform: scaleX(1);
          }
          50% {
            transform: scaleX(0.18);
          }
        }
      `}</style>
    </section>
  );
});

FloatingIconsHero.displayName = "FloatingIconsHero";

export { FloatingIconsHero };
export default FloatingIconsHero;
