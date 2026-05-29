"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState, createContext, useContext } from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import {
  OrbitControls,
  Environment,
  Html,
  Plane,
  Sphere,
} from "@react-three/drei"
import { Download, Heart, X, ArrowLeft } from "lucide-react"
import Link from "next/link"

/**
 * Single-file Stellar Card Gallery
 * - Context, Starfield, Galaxy, FloatingCard, Modal, and Page in one.
 */

/* =========================
   Card Context (inlined)
   ========================= */

type Card = {
  id: string
  imageUrl: string
  alt: string
  title: string
}

type CardContextType = {
  selectedCard: Card | null
  setSelectedCard: (card: Card | null) => void
  cards: Card[]
}

const CardContext = createContext<CardContextType | undefined>(undefined)

function useCard() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error("useCard must be used within CardProvider")
  return ctx
}

function CardProvider({ children }: { children: React.ReactNode }) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [cards, setCards] = useState<Card[]>([])

  useEffect(() => {
    async function loadCards() {
      try {
        const res = await fetch("/api/memories")
        const data = await res.json()
        if (Array.isArray(data)) {
          // Map all 50 memories dynamically to display them in our floating spherical constellation
          const mappedCards = data.slice(0, 50).map((img, idx) => {
            // Extract the filename without extension to use as title dynamically
            const filenameWithExt = img.split("/").pop() || img
            const filenameWithoutExt = filenameWithExt.substring(0, filenameWithExt.lastIndexOf('.')) || filenameWithExt
            const title = filenameWithoutExt
              .replace(/\s+/g, ' ')
              .trim()
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')

            return {
              id: String(idx + 1),
              imageUrl: `/memories/${img}`,
              alt: title,
              title: title
            }
          })
          setCards(mappedCards)
        }
      } catch (err) {
        console.error("Failed to load dynamic memories cards:", err)
      }
    }
    loadCards()
  }, [])

  return (
    <CardContext.Provider value={{ selectedCard, setSelectedCard, cards }}>
      {children}
    </CardContext.Provider>
  )
}

/* =========================
   Starfield Background (inlined)
   ========================= */

function StarfieldBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 1)
    mountRef.current.appendChild(renderer.domElement)

    const starsGeometry = new THREE.BufferGeometry()
    const starsCount = 10000
    const positions = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true })
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    camera.position.z = 10

    let animationId = 0
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      stars.rotation.y += 0.0001
      stars.rotation.x += 0.00005
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      starsGeometry.dispose()
      starsMaterial.dispose()
    }
  }, [])

  return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full z-0 bg-black" />
}

/* =========================
   Floating Card (inlined)
   ========================= */

function FloatingCard({
  card,
  position,
}: {
  card: Card
  position: { x: number; y: number; z: number; rotationX: number; rotationY: number; rotationZ: number }
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { setSelectedCard } = useCard()

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    setSelectedCard(card)
  }
  const handlePointerOver = (e: any) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = "pointer"
  }
  const handlePointerOut = (e: any) => {
    e.stopPropagation()
    setHovered(false)
    document.body.style.cursor = "auto"
  }

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      <Plane
        ref={meshRef}
        args={[4.5, 6]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshBasicMaterial transparent opacity={0} />
      </Plane>

      <Html
        transform
        distanceFactor={10}
        position={[0, 0, 0.01]}
        style={{
          transition: "all 0.3s ease",
          transform: hovered ? "scale(1.15)" : "scale(1)",
          pointerEvents: "none",
        }}
      >
        <div
          className="w-40 h-52 rounded-lg overflow-hidden shadow-2xl bg-[#1c1c1e] p-3 select-none flex flex-col items-center justify-between"
          style={{
            boxShadow: hovered
              ? "0 25px 50px rgba(244, 63, 94, 0.5), 0 0 30px rgba(244, 63, 94, 0.3)"
              : "0 15px 30px rgba(0, 0, 0, 0.6)",
            border: hovered ? "2px solid rgba(244, 63, 94, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <img
            src={card.imageUrl || "/placeholder.svg"}
            alt={card.alt}
            className="w-full h-[145px] object-cover rounded-md"
            loading="lazy"
            draggable={false}
          />
          <div className="mt-1.5 text-center w-full">
            <p className="text-white text-[10px] font-outfit uppercase tracking-widest font-semibold truncate px-1">
              {card.title}
            </p>
          </div>
        </div>
      </Html>
    </group>
  )
}

/* =========================
   Card Modal (inlined)
   ========================= */

function CardModal() {
  const { selectedCard, setSelectedCard } = useCard()
  const [isFavorited, setIsFavorited] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  if (!selectedCard) return null

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 15
    const rotateY = (centerX - x) / 15
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
  }

  const handleMouseEnter = () => { }
  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.5s ease-out"
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)"
    }
  }

  const toggleFavorite = () => setIsFavorited((v) => !v)
  const handleClose = () => setSelectedCard(null)
  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md" onClick={handleBackdropClick}>
      <div className="relative max-w-md w-full mx-4">
        <button onClick={handleClose} className="absolute -top-12 right-0 text-white hover:text-rose-500 transition-colors z-10">
          <X className="w-8 h-8" />
        </button>

        <div style={{ perspective: "1000px" }} className="w-full">
          <div
            ref={cardRef}
            className="relative cursor-pointer rounded-[24px] bg-[#1c1c1e] p-4 transition-all duration-500 ease-out w-full border border-white/10"
            style={{
              transformStyle: "preserve-3d",
              boxShadow: "0 30px 100px rgba(0,0,0,0.8), 0 0 50px rgba(255,0,80,0.06)",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative w-full mb-4" style={{ aspectRatio: "3 / 4" }}>
              <img
                loading="lazy"
                className="absolute inset-0 h-full w-full rounded-[18px] bg-black object-cover"
                alt={selectedCard.alt}
                src={selectedCard.imageUrl || "/placeholder.svg"}
                style={{ boxShadow: "rgba(0, 0, 0, 0.4) 0px 10px 30px 0px", opacity: 1 }}
              />
            </div>

            <h3 className="text-white text-lg font-outfit uppercase tracking-widest font-bold mb-4 text-center">{selectedCard.title}</h3>

            <div className="flex gap-2">
              <a
                href={selectedCard.imageUrl}
                download={selectedCard.title}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-extrabold uppercase tracking-widest text-black outline-none transition duration-300 ease-out hover:opacity-80 active:scale-[0.97] bg-white cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Download className="h-4 w-4" strokeWidth={2} />
                  <span>Download</span>
                </div>
              </a>
              <button
                type="button"
                onClick={toggleFavorite}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white outline-none transition duration-300 ease-out hover:bg-rose-500 hover:text-white border border-white/10 active:scale-[0.97]"
              >
                <Heart className="h-4 w-4 text-rose-500" strokeWidth={2} fill={isFavorited ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================
   Card Galaxy (inlined)
   ========================= */

function CardGalaxy() {
  const { cards } = useCard()

  const cardPositions = useMemo(() => {
    const positions: {
      x: number
      y: number
      z: number
      rotationX: number
      rotationY: number
      rotationZ: number
    }[] = []
    const numCards = cards.length
    const goldenRatio = (1 + Math.sqrt(5)) / 2

    for (let i = 0; i < numCards; i++) {
      const y = 1 - (i / (numCards - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = (2 * Math.PI * i) / goldenRatio
      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY
      const layerRadius = 12 + (i % 3) * 4

      positions.push({
        x: x * layerRadius,
        y: y * layerRadius,
        z: z * layerRadius,
        rotationX: Math.atan2(z, Math.sqrt(x * x + y * y)),
        rotationY: Math.atan2(x, z),
        rotationZ: (Math.random() - 0.5) * 0.2,
      })
    }
    return positions
  }, [cards.length])

  return (
    <>
      <Sphere args={[2, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.15} wireframe />
      </Sphere>
      <Sphere args={[12, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ff0050" transparent opacity={0.05} wireframe />
      </Sphere>
      <Sphere args={[16, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ff0050" transparent opacity={0.03} wireframe />
      </Sphere>
      <Sphere args={[20, 32, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ff0050" transparent opacity={0.02} wireframe />
      </Sphere>

      {cards.map((card, i) => (
        <FloatingCard key={card.id} card={card} position={cardPositions[i]} />
      ))}
    </>
  )
}

/* =========================
   Page/Component Export
   ========================= */

export default function StellarCardGallerySingle() {
  return (
    <CardProvider>
      <div className="w-full h-screen relative overflow-hidden bg-black font-sans">
        <StarfieldBackground />

        {/* Ambient top glowing circles */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,80,0.06)_0%,transparent_85%)] pointer-events-none z-10" />

        <Canvas
          camera={{ position: [0, 0, 16], fov: 60 }}
          className="absolute inset-0 z-10"
          onCreated={({ gl }) => {
            gl.domElement.style.pointerEvents = "auto"
          }}
        >
          <Suspense fallback={null}>
            <Environment preset="night" />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />
            <CardGalaxy />
            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={5}
              maxDistance={40}
              autoRotate={true}
              autoRotateSpeed={0.16} // slow cosmic orbit
              rotateSpeed={0.5}
              zoomSpeed={1.2}
              panSpeed={0.8}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>

        <CardModal />

        {/* Home Back Button */}
        <Link
          href="/?unlocked=true"
          className="absolute top-6 left-6 z-40 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white font-extrabold font-outfit text-[10px] uppercase tracking-widest hover:bg-[#ff0050] hover:border-[#ff0050] hover:text-white hover:shadow-[0_0_15px_rgba(255,0,80,0.6)] flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 pointer-events-auto"
        >
          <ArrowLeft size={12} />
          <span>Back to Story</span>
        </Link>

        <div className="absolute bottom-6 left-6 right-6 md:left-10 md:bottom-10 z-20 text-white pointer-events-none">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-playfair font-black mb-2 tracking-wide drop-shadow-md text-rose-300">
            Our 3D Cosmic World
          </h1>
          <p className="text-[10px] sm:text-xs font-outfit uppercase tracking-[0.25em] opacity-80 leading-relaxed max-w-md">
            Drag to orbit around our memory sphere • Scroll to zoom in & out • Click floating cards to open details • View our beautiful journey in 3D space
          </p>
        </div>
      </div>
    </CardProvider>
  )
}
