"use client";
import { useEffect, useRef, useCallback, useState } from "react";

interface InkRevealProps {
  /** RGB color of the mask overlay, e.g. [252, 250, 248] */
  maskColor?: [number, number, number];
  /** Radius of each ink stamp in px */
  brushSize?: number;
  /** How long each stamp lives before fading (ms) */
  lifetime?: number;
  /** Initial radius before the stamp expands */
  rStart?: number;
  /** Random variation factor for stamp radius (0–1) */
  rVary?: number;
  /** Min pixel distance between stamps along a stroke */
  stampStep?: number;
  /** Max stamps alive at once (oldest are pruned) */
  maxStamps?: number;
  /** Number of segments on the wobble circle (higher = smoother) */
  segments?: number;
  /** Wobble amplitude weights [primary, secondary, tertiary] */
  wobble?: [number, number, number];
  /** Gradient inner-radius factor (0–1, relative to stamp radius) */
  gradientInnerRadius?: number;
  /** Gradient opacity stops [center, mid, edge] */
  gradientStops?: [number, number, number];
  /** Extra CSS class for the canvas element */
  className?: string;
  /** Extra inline styles for the canvas element */
  style?: React.CSSProperties;
  /** Duration of continuous mouse movement before auto-reveal (ms) */
  revealDelay?: number;
  /** CSS transition duration for canvas opacity fade-out */
  transitionDuration?: string;
}

interface Stamp {
  x: number;
  y: number;
  born: number;
  seed: number;
  rmax: number;
}

export default function InkReveal({
  maskColor = [252, 250, 248],
  brushSize = 128,
  lifetime = 600,
  rStart = 10,
  rVary = 0.45,
  stampStep = 10,
  maxStamps = 200,
  segments = 36,
  wobble = [0.14, 0.08, 0.05],
  gradientInnerRadius = 0.2,
  gradientStops = [0.95, 0.88, 0],
  revealDelay = 1000,
  transitionDuration = "1.2s",
  className,
  style,
}: InkRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const lastMoveTimeRef = useRef<number>(0);
  const movementStartRef = useRef<number>(0);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownTimeRef = useRef<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stampsRef = useRef<Stamp[]>([]);
  const runningRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const dimsRef = useRef({ w: 0, h: 0 });

  const mc = maskColor;

  const openReveal = useCallback((durationMs: number = 3000) => {
    setIsRevealed(true);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsRevealed(false);
    }, durationMs);
  }, []);

  const keepRevealOpen = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsRevealed(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    dimsRef.current = { w, h };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgb(${mc[0]},${mc[1]},${mc[2]})`;
    ctx.fillRect(0, 0, w, h);
  }, [mc]);

  const carveInk = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      seed: number,
      alpha: number
    ) => {
      const g = ctx.createRadialGradient(
        x, y, r * gradientInnerRadius,
        x, y, r
      );
      g.addColorStop(0, `rgba(0,0,0,${gradientStops[0] * alpha})`);
      g.addColorStop(0.5, `rgba(0,0,0,${gradientStops[1] * alpha})`);
      g.addColorStop(1, `rgba(0,0,0,${gradientStops[2] * alpha})`);
      ctx.fillStyle = g;

      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const wob =
          0.78 +
          wobble[0] * Math.sin(a * 3 + seed) +
          wobble[1] * Math.sin(a * 5 + seed * 2.1) +
          wobble[2] * Math.sin(a * 7 + seed * 0.7);
        const px = x + Math.cos(a) * r * wob;
        const py = y + Math.sin(a) * r * wob;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    },
    [segments, wobble, gradientInnerRadius, gradientStops]
  );

  const addStamp = useCallback(
    (x: number, y: number) => {
      const stamps = stampsRef.current;
      if (stamps.length >= maxStamps) stamps.shift();
      stamps.push({
        x,
        y,
        born: performance.now(),
        seed: Math.random() * Math.PI * 2,
        rmax: brushSize * (1 - rVary + Math.random() * rVary),
      });
    },
    [brushSize, rVary, maxStamps]
  );

  const stampAlong = useCallback(
    (x: number, y: number) => {
      const last = lastPosRef.current;
      if (!last) {
        addStamp(x, y);
      } else {
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.ceil(dist / stampStep));
        for (let i = 1; i <= steps; i++) {
          addStamp(last.x + (dx * i) / steps, last.y + (dy * i) / steps);
        }
      }
      lastPosRef.current = { x, y };
    },
    [addStamp, stampStep]
  );

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = dimsRef.current;
    const now = performance.now();
    const stamps = stampsRef.current;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgb(${mc[0]},${mc[1]},${mc[2]})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "destination-out";

    for (let i = stamps.length - 1; i >= 0; i--) {
      const t = (now - stamps[i].born) / lifetime;
      if (t >= 1) {
        stamps.splice(i, 1);
        continue;
      }
      const ease = 1 - Math.pow(1 - t, 3);
      const r = rStart + (stamps[i].rmax - rStart) * ease;
      const alpha = 1 - t * t;
      carveInk(ctx, stamps[i].x, stamps[i].y, r, stamps[i].seed, alpha);
    }

    if (stamps.length) {
      requestAnimationFrame(loop);
    } else {
      runningRef.current = false;
    }
  }, [carveInk, mc, lifetime, rStart]);

  const startLoop = useCallback(() => {
    if (!runningRef.current) {
      runningRef.current = true;
      requestAnimationFrame(loop);
    }
  }, [loop]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const getRelativePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getRelativeTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches.length === 0) return null;
    const touch = e.touches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        cursor: "none",
        transition: `opacity ${transitionDuration} cubic-bezier(0.25, 1, 0.5, 1)`,
        opacity: isRevealed ? 0 : 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        const pos = getRelativePos(e);
        lastPosRef.current = pos;
        const now = performance.now();
        lastMoveTimeRef.current = now;
        movementStartRef.current = now;
        if (isRevealed) {
          keepRevealOpen();
        }
        stampAlong(pos.x, pos.y);
        startLoop();
      }}
      onMouseMove={(e) => {
        const pos = getRelativePos(e);
        lastPosRef.current = pos;
        const now = performance.now();
        if (now - lastMoveTimeRef.current > 300) {
          movementStartRef.current = now;
        }
        lastMoveTimeRef.current = now;
        const elapsed = now - movementStartRef.current;
        if (elapsed >= revealDelay) {
          openReveal(3000);
        } else if (isRevealed) {
          keepRevealOpen();
        }
        stampAlong(pos.x, pos.y);
        startLoop();
      }}
      onMouseLeave={() => {
        lastPosRef.current = null;
        mouseDownPosRef.current = null;
        if (isRevealed) {
          keepRevealOpen();
        }
      }}
      onMouseDown={(e) => {
        const pos = getRelativePos(e);
        mouseDownPosRef.current = pos;
        mouseDownTimeRef.current = performance.now();
      }}
      onMouseUp={(e) => {
        const pos = getRelativePos(e);
        const now = performance.now();
        const elapsed = now - mouseDownTimeRef.current;
        let isClick = false;
        if (elapsed < 250 && mouseDownPosRef.current) {
          const dx = pos.x - mouseDownPosRef.current.x;
          const dy = pos.y - mouseDownPosRef.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 10) {
            isClick = true;
          }
        }
        if (isClick) {
          openReveal(3000);
        } else if (isRevealed) {
          keepRevealOpen();
        }
        mouseDownPosRef.current = null;
      }}
      onTouchStart={(e) => {
        const pos = getRelativeTouchPos(e);
        if (!pos) return;
        lastPosRef.current = pos;
        touchStartPosRef.current = pos;
        const now = performance.now();
        touchStartTimeRef.current = now;
        lastMoveTimeRef.current = now;
        movementStartRef.current = now;
        if (isRevealed) {
          keepRevealOpen();
        }
        stampAlong(pos.x, pos.y);
        startLoop();
      }}
      onTouchMove={(e) => {
        const pos = getRelativeTouchPos(e);
        if (!pos) return;
        lastPosRef.current = pos;
        const now = performance.now();
        if (now - lastMoveTimeRef.current > 300) {
          movementStartRef.current = now;
        }
        lastMoveTimeRef.current = now;
        const elapsed = now - movementStartRef.current;
        if (elapsed >= revealDelay) {
          openReveal(3000);
        } else if (isRevealed) {
          keepRevealOpen();
        }
        stampAlong(pos.x, pos.y);
        startLoop();
      }}
      onTouchEnd={(e) => {
        const now = performance.now();
        const elapsed = now - touchStartTimeRef.current;
        
        let isTap = false;
        if (elapsed < 250 && touchStartPosRef.current && lastPosRef.current) {
          const dx = lastPosRef.current.x - touchStartPosRef.current.x;
          const dy = lastPosRef.current.y - touchStartPosRef.current.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 15) {
            isTap = true;
          }
        }
        
        if (isTap) {
          openReveal(3000);
        } else if (isRevealed) {
          keepRevealOpen();
        }
        
        lastPosRef.current = null;
        touchStartPosRef.current = null;
      }}
    />
  );
}
