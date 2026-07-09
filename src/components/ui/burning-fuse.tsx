"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Eraser, PenTool, Undo2, Redo2, Download } from "lucide-react";
import { createPortal } from "react-dom";
import { toPng, toJpeg } from 'html-to-image';

interface BurningFuseProps {
  images: string[];
}

export const BurningFuse: React.FC<BurningFuseProps> = ({ images }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  type Point = { x: number; y: number };
  type Stroke = {
    id: number;
    points: Point[];
    startPhoto: string | null;
    middlePhoto: string | null;
    endPhoto: string | null;
  };

  type HistoryState = { strokes: Stroke[]; usedPhotosCount: number };
  const [history, setHistory] = useState<HistoryState[]>([{ strokes: [], usedPhotosCount: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  interface SavedDrawing {
    id: number;
    name: string;
    history: HistoryState[];
    historyIndex: number;
  }
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [savedDrawings, setSavedDrawings] = useState<SavedDrawing[]>([]);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "jpg" | "json">("png");
  const [exportTransparent, setExportTransparent] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ignite-memories-gallery");
    if (saved) {
      try {
        setSavedDrawings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [sparkPos, setSparkPos] = useState<Point | null>(null);

  // New controls
  const [photoPlacements, setPhotoPlacements] = useState<string[]>(["end"]);
  const [maxPhotos, setMaxPhotos] = useState(60);
  const [tool, setTool] = useState<"draw" | "erase">("draw");

  // Derived state
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false); // default to false for SSR, hydrate to real value
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const currentState = history[historyIndex] || { strokes: [], usedPhotosCount: 0 };
  const strokes = currentState.strokes;
  const usedPhotosCount = currentState.usedPhotosCount;

  const duplicatedImages = useMemo(() => {
    if (images.length === 0) return [];
    const result = [];
    for (let i = 0; i < maxPhotos; i++) {
      result.push(images[i % images.length]);
    }
    return result;
  }, [images, maxPhotos]);

  useEffect(() => {
    const updateSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen || expandedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isModalOpen, expandedImage]);

  const commitHistory = (newStrokes: Stroke[], newUsedCount: number) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ strokes: newStrokes, usedPhotosCount: newUsedCount });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const performErase = (x: number, y: number) => {
    let photosFreed = 0;
    let erasedAny = false;

    const newStrokes = strokes.filter(stroke => {
      const hit = stroke.points.some(p => {
        return Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) < 30; // 30px erase radius
      });
      
      if (hit) {
        erasedAny = true;
        if (stroke.startPhoto) photosFreed++;
        if (stroke.middlePhoto) photosFreed++;
        if (stroke.endPhoto) photosFreed++;
        return false;
      }
      return true;
    });

    if (erasedAny) {
      commitHistory(newStrokes, Math.max(0, usedPhotosCount - photosFreed));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (tool === "draw") {
      setCurrentStroke([{ x, y }]);
      setSparkPos({ x, y });
    } else if (tool === "erase") {
      performErase(x, y);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === "erase") {
      if (e.buttons > 0 || e.type === 'touchmove') {
        performErase(x, y);
      }
      return;
    }

    if (currentStroke.length === 0 || tool !== "draw") return;
    if (e.buttons === 0 && e.type !== 'touchmove') return;

    setSparkPos({ x, y });
    
    setCurrentStroke(prev => {
      if (prev.length === 0) return [{ x, y }];
      const last = prev[prev.length - 1];
      const dist = Math.sqrt(Math.pow(x - last.x, 2) + Math.pow(y - last.y, 2));
      // Only add point if we moved far enough (smooths the curve)
      if (dist > 5) {
        return [...prev, { x, y }];
      }
      return prev;
    });
  };

  const handlePointerUp = () => {
    setSparkPos(null);
    
    if (currentStroke.length > 0 && tool === "draw") {
      let startPhoto = null;
      let middlePhoto = null;
      let endPhoto = null;
      let newUsedCount = usedPhotosCount;

      if (currentStroke.length > 0) {
        if (photoPlacements.includes("start") && newUsedCount < duplicatedImages.length) {
          startPhoto = duplicatedImages[newUsedCount];
          newUsedCount++;
        }
        if (photoPlacements.includes("middle") && newUsedCount < duplicatedImages.length) {
          middlePhoto = duplicatedImages[newUsedCount];
          newUsedCount++;
        }
        if (photoPlacements.includes("end") && newUsedCount < duplicatedImages.length) {
          endPhoto = duplicatedImages[newUsedCount];
          newUsedCount++;
        }
      }

      const newStroke: Stroke = {
        id: Date.now(),
        points: currentStroke,
        startPhoto,
        middlePhoto,
        endPhoto
      };

      commitHistory([...strokes, newStroke], newUsedCount);
      setCurrentStroke([]);
    }
  };


  const handleReset = () => {
    commitHistory([], 0);
  };

  const handleUndo = () => {
    if (historyIndex > 0) setHistoryIndex(prev => prev - 1);
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) setHistoryIndex(prev => prev + 1);
  };

  const handleSaveLocally = () => {
    setSaveName(`Drawing ${savedDrawings.length + 1}`);
    setIsSaveModalOpen(true);
  };

  const confirmSave = () => {
    if (!saveName.trim()) return;
    const newDrawing = {
      id: Date.now(),
      name: saveName.trim(),
      history,
      historyIndex
    };
    const newGallery = [newDrawing, ...savedDrawings];
    setSavedDrawings(newGallery);
    localStorage.setItem("ignite-memories-gallery", JSON.stringify(newGallery));
    setIsSaveModalOpen(false);
    showNotification("Drawing saved to gallery!");
  };

  const handleLoadDrawing = (drawing: SavedDrawing) => {
    setHistory(drawing.history);
    setHistoryIndex(drawing.historyIndex);
    setShowLoadMenu(false);
    showNotification(`Loaded ${drawing.name}`);
  };

  const handleDeleteDrawing = (id: number) => {
    if (!confirm("Delete this drawing forever?")) return;
    const newGallery = savedDrawings.filter(d => d.id !== id);
    setSavedDrawings(newGallery);
    localStorage.setItem("ignite-memories-gallery", JSON.stringify(newGallery));
  };

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const confirmExport = async () => {
    try {
      if (exportFormat === "json") {
        const dataStr = JSON.stringify({ history, historyIndex }, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `memory-drawing-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        if (!containerRef.current) return;
        
        const opts = {
          backgroundColor: exportTransparent ? 'transparent' : '#000000',
          pixelRatio: 2, // High resolution for perfect glow quality
          style: {
            background: exportTransparent ? 'transparent' : '#000000'
          }
        };
        
        const dataUrl = exportFormat === "png" 
          ? await toPng(containerRef.current, opts)
          : await toJpeg(containerRef.current, { ...opts, quality: 0.95 });
        
        const link = document.createElement("a");
        link.download = `memory-drawing-${Date.now()}.${exportFormat}`;
        link.href = dataUrl;
        link.click();
      }
      setIsExportModalOpen(false);
      showNotification("Drawing exported!");
    } catch (e) {
      console.error(e);
      showNotification("Export failed.");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.history && json.historyIndex !== undefined) {
          setHistory(json.history);
          setHistoryIndex(json.historyIndex);
          showNotification("Drawing imported successfully!");
        } else {
          showNotification("Invalid file format");
        }
      } catch (err) {
        showNotification("Failed to parse file");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canvasContent = (
    <>
      {/* Done Button for Mobile Modal */}
      {!isDesktop && (
        <button 
          onClick={() => setIsModalOpen(false)}
          className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-[150] px-8 py-3.5 flex items-center justify-center rounded-full bg-orange-600 text-white font-outfit font-bold tracking-widest text-xs uppercase shadow-[0_0_30px_rgba(255,100,0,0.5)] border border-orange-500/50 hover:bg-orange-500 hover:scale-105 transition-all"
        >
          Done Drawing
        </button>
      )}

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 border border-orange-500/50 text-orange-200 px-6 py-2.5 rounded-full shadow-[0_10px_30px_rgba(255,100,0,0.2)] flex items-center gap-2 pointer-events-none"
          >
            <Flame size={14} className="text-orange-500" />
            <span className="text-xs font-medium tracking-wide">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD & Title Bar at the top */}
      <div className="absolute top-4 sm:top-12 left-1/2 -translate-x-1/2 z-50 flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-between w-[95%] lg:w-max max-w-full bg-black/80 border border-orange-500/40 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-3 rounded-2xl sm:rounded-full shadow-[0_15px_40px_rgba(255,100,0,0.2)] pointer-events-auto gap-2 sm:gap-4">
        
        {/* Title - Hidden on mobile for space */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Flame size={18} className="text-orange-500 animate-pulse" />
          <h2 className="text-sm md:text-base font-playfair font-bold text-white tracking-wide m-0 leading-none mt-1 whitespace-nowrap">
            Ignite the Memories
          </h2>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Tool Selector */}
          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10 shrink-0">
            <button
              onClick={() => setTool("draw")}
              className={`p-1 sm:p-1.5 rounded-full transition-colors ${tool === "draw" ? "bg-orange-500 text-white" : "text-neutral-400 hover:text-white"}`}
              title="Draw Tool"
            >
              <PenTool size={14} />
            </button>
            <button
              onClick={() => setTool("erase")}
              className={`p-1 sm:p-1.5 rounded-full transition-colors ${tool === "erase" ? "bg-red-500 text-white" : "text-neutral-400 hover:text-white"}`}
              title="Eraser Tool"
            >
              <Eraser size={14} />
            </button>
          </div>

          {/* Photo Placement Selector (Compact) */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-orange-500/30 px-2 py-1 rounded-full shrink-0">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={photoPlacements.length === 0}
                onChange={(e) => {
                  if (e.target.checked) setPhotoPlacements([]);
                }}
                className="accent-orange-500 w-3 h-3 cursor-pointer"
              />
              <span className="text-orange-200 text-[10px] sm:text-xs capitalize">N<span className="hidden sm:inline">one</span></span>
            </label>
            {(["start", "middle", "end"] as const).map((pos) => {
              const isChecked = photoPlacements.includes(pos);
              return (
                <label key={pos} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPhotoPlacements(prev => [...prev, pos]);
                      } else {
                        setPhotoPlacements(prev => prev.filter(p => p !== pos));
                      }
                    }}
                    className="accent-orange-500 w-3 h-3 cursor-pointer"
                  />
                  <span className="text-orange-200 text-[10px] sm:text-xs capitalize">{pos.charAt(0)}<span className="hidden sm:inline">{pos.slice(1)}</span></span>
                </label>
              );
            })}
          </div>

          {/* Max Photos Input */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-orange-500/30 px-2 py-1 rounded-full shrink-0">
            <span className="text-[10px] sm:text-xs text-orange-200/70">Max:</span>
            <input 
              type="number" 
              value={maxPhotos}
              onChange={(e) => setMaxPhotos(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-transparent text-orange-200 text-[10px] sm:text-xs w-8 sm:w-10 outline-none"
              min={1}
            />
          </div>

          {/* Undo/Redo/Reset */}
          <div className="flex items-center gap-1 shrink-0">
            <button 
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-1 sm:p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <Undo2 size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button 
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-1 sm:p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <Redo2 size={14} className="sm:w-4 sm:h-4" />
            </button>
            <div className="w-px h-3 sm:h-4 bg-white/20 mx-0.5 sm:mx-1" />
            <button 
              onClick={handleReset}
              className="text-red-400 hover:text-red-300 text-[10px] sm:text-xs px-1 sm:px-2 py-1 font-medium transition-colors"
            >
              Reset
            </button>
            <div className="w-px h-3 sm:h-4 bg-white/20 mx-0.5 sm:mx-1" />
            <button 
              onClick={handleSaveLocally}
              className="text-green-400 hover:text-green-300 text-[10px] sm:text-xs px-1 sm:px-2 py-1 font-medium transition-colors"
              title="Save Drawing Locally"
            >
              Save
            </button>
            <div className="w-px h-3 sm:h-4 bg-white/20 mx-0.5 sm:mx-1" />
            <div className="relative flex items-center">
              <button 
                onClick={() => setShowLoadMenu(!showLoadMenu)}
                className="text-blue-400 hover:text-blue-300 text-[10px] sm:text-xs px-1 sm:px-2 py-1 font-medium transition-colors"
                title="Load Saved Drawing"
              >
                Load
              </button>

              <AnimatePresence>
                {showLoadMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-2 right-0 sm:right-auto bg-zinc-900 border border-orange-500/30 rounded-lg p-2 w-48 shadow-2xl z-[200] max-h-48 overflow-y-auto flex flex-col gap-1"
                  >
                    <div className="text-[10px] text-orange-200/50 mb-1 font-outfit uppercase tracking-wider px-1">Saved Drawings</div>
                    {savedDrawings.length === 0 ? (
                      <div className="text-xs text-neutral-500 px-1 py-2">No drawings saved yet.</div>
                    ) : (
                      savedDrawings.map(d => (
                        <div key={d.id} className="flex items-center justify-between group rounded hover:bg-white/10">
                          <button 
                            onClick={() => handleLoadDrawing(d)}
                            className="text-xs text-neutral-300 hover:text-white px-2 py-1.5 w-full text-left truncate"
                            title={d.name}
                          >
                            {d.name}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDrawing(d.id);
                            }}
                            className="text-red-500 hover:text-red-400 p-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title="Delete Drawing"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="w-px h-3 sm:h-4 bg-white/20 mx-0.5 sm:mx-1" />
            <button 
              onClick={handleExport}
              className="text-purple-400 hover:text-purple-300 text-[10px] sm:text-xs px-1 sm:px-2 py-1 font-medium transition-colors"
              title="Export Drawing to File"
            >
              Export
            </button>
            <div className="w-px h-3 sm:h-4 bg-white/20 mx-0.5 sm:mx-1" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-cyan-400 hover:text-cyan-300 text-[10px] sm:text-xs px-1 sm:px-2 py-1 font-medium transition-colors"
              title="Import Drawing from File"
            >
              Import
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json"
              onChange={handleImport}
            />
          </div>
          
          {/* Counter */}
          <span className="text-orange-200 text-[9px] sm:text-[10px] font-outfit uppercase tracking-wider font-semibold bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20 whitespace-nowrap shrink-0 hidden sm:inline-block">
            {Math.max(0, duplicatedImages.length - usedPhotosCount)} Left
          </span>

          {/* Mobile Close Button */}
          {!isDesktop && (
            <button 
              onClick={() => setIsModalOpen(false)}
              className="ml-1 sm:ml-2 p-1.5 rounded-full bg-red-500 text-white hover:scale-110 transition-transform shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
              title="Close Canvas"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Canvas Area */}
      <div 
        ref={containerRef}
        className={`absolute inset-0 w-full h-full touch-none ${tool === "erase" ? "cursor-crosshair" : "cursor-default"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >

        {/* Empty State Placeholder */}
        {strokes.length === 0 && currentStroke.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-4 text-neutral-500 font-outfit select-none"
            >
              <PenTool size={32} className="opacity-50" />
              <span className="uppercase tracking-[0.5em] text-sm sm:text-base font-semibold">Draw Here</span>
            </motion.div>
          </div>
        )}

        {/* Draw the burnt fuse lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="fuseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff0000" />
              <stop offset="50%" stopColor="#ff5500" />
              <stop offset="100%" stopColor="#ffaa00" />
            </linearGradient>
            
            {/* Thicker gradient for eraser hit area */}
            <linearGradient id="eraseHitArea" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Draw completed strokes */}
          {strokes.map((stroke) => (
            <g key={stroke.id}>
              {/* Visible path */}
              {stroke.points.length > 0 && (
                <motion.path
                  d={`M ${stroke.points[0].x},${stroke.points[0].y} ` + stroke.points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')}
                  fill="transparent"
                  stroke="url(#fuseGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 10px rgba(255, 60, 0, 0.8))", pointerEvents: "none" }}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </g>
          ))}

          {/* Draw current stroke being drawn */}
          {currentStroke.length > 0 && tool === "draw" && (
            <path
              d={`M ${currentStroke[0].x},${currentStroke[0].y} ` + currentStroke.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')}
              fill="transparent"
              stroke="url(#fuseGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 10px rgba(255, 60, 0, 0.8))" }}
            />
          )}
        </svg>

        {/* The Spark (Particle Effect) */}
        {sparkPos && tool === "draw" && (
          <motion.div
            className="absolute pointer-events-none z-50 flex items-center justify-center"
            style={{ left: sparkPos.x, top: sparkPos.y, translateX: "-50%", translateY: "-50%" }}
          >
            {/* Core spark */}
            <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_#fff,0_0_40px_#ffaa00,0_0_60px_#ff0000]" />
            {/* Smoke / Flare */}
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="absolute w-12 h-12 bg-orange-500/50 rounded-full blur-md"
            />
          </motion.div>
        )}

        {/* Placed Photos */}
        {strokes.map((stroke) => {
          const middleIndex = Math.floor(stroke.points.length / 2);
          return (
            <React.Fragment key={stroke.id}>
              {/* Start Photo */}
              {stroke.startPhoto && stroke.points.length > 0 && (
                <PhotoNode 
                  src={stroke.startPhoto} 
                  point={stroke.points[0]} 
                  rotation={(stroke.id % 20) - 10} 
                  onExpand={setExpandedImage}
                />
              )}

              {/* Middle Photo */}
              {stroke.middlePhoto && stroke.points.length > 0 && (
                <BeadNode 
                  src={stroke.middlePhoto} 
                  point={stroke.points[middleIndex]} 
                  onExpand={setExpandedImage}
                />
              )}

              {/* End Photo */}
              {stroke.endPhoto && stroke.points.length > 0 && (
                <PhotoNode 
                  src={stroke.endPhoto} 
                  point={stroke.points[stroke.points.length - 1]} 
                  rotation={-((stroke.id % 20) - 10)} 
                  onExpand={setExpandedImage}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Save Drawing Modal */}
        <AnimatePresence>
          {isSaveModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
              onClick={() => setIsSaveModalOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-orange-500/30 p-6 rounded-2xl shadow-[0_0_40px_rgba(255,100,0,0.2)] w-full max-w-sm flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h3 className="text-orange-100 font-playfair text-xl font-bold tracking-wide mb-1">Save Memory</h3>
                  <p className="text-neutral-400 text-xs font-outfit uppercase tracking-wider">Give this drawing a name</p>
                </div>
                
                <input 
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmSave();
                    if (e.key === 'Escape') setIsSaveModalOpen(false);
                  }}
                  className="bg-black/50 border border-orange-500/30 rounded-lg px-4 py-2.5 text-orange-50 text-sm font-outfit outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all w-full"
                  placeholder="Drawing Name"
                />

                <div className="flex justify-end gap-3 mt-2">
                  <button 
                    onClick={() => setIsSaveModalOpen(false)}
                    className="px-4 py-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-outfit uppercase tracking-widest font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmSave}
                    className="px-6 py-2 rounded-full bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-[0_0_15px_rgba(255,100,0,0.4)] text-xs font-outfit uppercase tracking-widest font-bold"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export Drawing Modal */}
        <AnimatePresence>
          {isExportModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
              onClick={() => setIsExportModalOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-orange-500/30 p-6 rounded-2xl shadow-[0_0_40px_rgba(255,100,0,0.2)] w-full max-w-sm flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h3 className="text-orange-100 font-playfair text-xl font-bold tracking-wide mb-1">Export Drawing</h3>
                  <p className="text-neutral-400 text-xs font-outfit uppercase tracking-wider">Download your masterpiece</p>
                </div>
                
                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setExportFormat("png")}
                      className={`flex-1 py-2 rounded-lg text-sm font-outfit uppercase tracking-wider font-bold transition-all ${exportFormat === "png" ? 'bg-orange-600 text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                    >PNG</button>
                    <button 
                      onClick={() => setExportFormat("jpg")}
                      className={`flex-1 py-2 rounded-lg text-sm font-outfit uppercase tracking-wider font-bold transition-all ${exportFormat === "jpg" ? 'bg-orange-600 text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                    >JPG</button>
                    <button 
                      onClick={() => setExportFormat("json")}
                      className={`flex-1 py-2 rounded-lg text-sm font-outfit uppercase tracking-wider font-bold transition-all ${exportFormat === "json" ? 'bg-orange-600 text-white' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                    >JSON</button>
                  </div>
                  
                  {exportFormat === "png" && (
                    <label className="flex items-center gap-2 cursor-pointer mt-2 group w-fit">
                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${!exportTransparent ? 'bg-orange-500 border border-orange-500' : 'border border-neutral-500 group-hover:border-orange-500/50'}`}>
                        {!exportTransparent && <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-white"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <input 
                        type="checkbox" 
                        checked={!exportTransparent} 
                        onChange={(e) => setExportTransparent(!e.target.checked)} 
                        className="hidden"
                      />
                      <span className="text-neutral-300 text-xs font-outfit uppercase tracking-wider">Black Background</span>
                    </label>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button 
                    onClick={() => setIsExportModalOpen(false)}
                    className="px-4 py-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-outfit uppercase tracking-widest font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmExport}
                    className="px-6 py-2 rounded-full bg-orange-600 hover:bg-orange-500 text-white transition-colors shadow-[0_0_15px_rgba(255,100,0,0.4)] text-xs font-outfit uppercase tracking-widest font-bold flex items-center gap-2"
                  >
                    <Download size={14} /> Export
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Image Overlay */}
        <AnimatePresence>
          {expandedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto cursor-auto"
              onClick={() => setExpandedImage(null)}
            >
              <motion.div 
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: "spring", damping: 15 }}
                className="bg-white p-3 sm:p-4 pb-12 sm:pb-16 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-full max-h-full flex flex-col relative rotate-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setExpandedImage(null)}
                  className="absolute -top-4 -right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white shadow-lg hover:scale-110 transition-transform"
                >
                  ✕
                </button>
                <div className="flex-1 overflow-hidden relative bg-neutral-900 border border-neutral-800">
                  <img 
                    src={expandedImage} 
                    alt="Expanded Memory"
                    className="w-auto h-auto max-w-[85vw] max-h-[75vh] object-contain mx-auto"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );

  return (
    <div className="w-full relative min-h-[75vh] sm:min-h-[80vh] flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Display Only Mode Canvas (Background) - Mobile Only */}
      {!isDesktop && (
        <div className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="fuseGradientStatic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="50%" stopColor="#ff5500" />
                <stop offset="100%" stopColor="#ffaa00" />
              </linearGradient>
            </defs>
            {strokes.map((stroke) => (
              <React.Fragment key={`static-${stroke.id}`}>
                {stroke.points.length > 0 && (
                  <path
                    d={`M ${stroke.points[0].x},${stroke.points[0].y} ` + stroke.points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')}
                    fill="transparent"
                    stroke="url(#fuseGradientStatic)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: "drop-shadow(0 0 10px rgba(255, 60, 0, 0.8))" }}
                  />
                )}
              </React.Fragment>
            ))}
          </svg>
        </div>
      )}

      {/* Button to open the Drawing Modal - Mobile Only */}
      {!isDesktop && (
        <div className="z-10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 px-6 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full backdrop-blur-md">
            <Flame className="text-orange-500 animate-pulse" size={18} />
            <span className="text-orange-200 font-outfit uppercase tracking-[0.2em] text-xs font-semibold">Interactive Canvas</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-playfair font-black text-white text-center">Ignite the Memories</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-8 py-4 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-outfit font-bold tracking-widest uppercase transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,100,0,0.4)] pointer-events-auto"
          >
            {strokes.length > 0 ? "Edit Memory Fuse" : "Draw The Fuse"}
          </button>
        </div>
      )}

      {/* Desktop Inline Rendering */}
      {isDesktop && (
        <div className="absolute inset-0 w-full h-full z-20 pointer-events-auto">
          {canvasContent}
        </div>
      )}

      {/* Mobile Modal Rendering */}
      {mounted && createPortal(
        <AnimatePresence>
          {!isDesktop && isModalOpen && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-0 z-[9999] bg-black flex flex-col pointer-events-auto touch-none overflow-hidden"
            >
              {canvasContent}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

// Extracted component for the photo node to keep things clean
const PhotoNode = ({ src, point, rotation, onExpand }: { src: string, point: { x: number, y: number }, rotation: number, onExpand: (src: string) => void }) => (
  <motion.div
    className="absolute pointer-events-auto"
    style={{
      left: point.x,
      top: point.y,
      translateX: "-50%",
      translateY: "-50%",
      rotate: rotation,
    }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", damping: 15, stiffness: 100 }}
  >
    <div 
      onClick={() => onExpand(src)}
      className="bg-white p-1 pb-4 sm:p-2 sm:pb-6 rounded-sm shadow-[0_15px_35px_rgba(0,0,0,0.8)] cursor-pointer hover:scale-110 transition-transform relative z-10"
    >
      <div className="w-10 h-14 sm:w-16 sm:h-20 bg-neutral-900 overflow-hidden relative select-none">
        <img 
          src={src} 
          alt="Memory"
          draggable={false}
          className="w-full h-full object-cover filter contrast-110 saturate-110 pointer-events-none"
          loading="lazy"
        />
      </div>
    </div>
    {/* Glowing anchor point connecting photo to string */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full blur-[4px] -z-10" />
  </motion.div>
);

const BeadNode = ({ src, point, onExpand }: { src: string, point: { x: number, y: number }, onExpand: (src: string) => void }) => (
  <motion.div
    className="absolute pointer-events-auto"
    style={{
      left: point.x,
      top: point.y,
      translateX: "-50%",
      translateY: "-50%",
    }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", damping: 15, stiffness: 100 }}
  >
    <div 
      onClick={() => onExpand(src)}
      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-orange-500 shadow-[0_0_15px_rgba(255,100,0,0.6)] z-20 bg-neutral-900 cursor-pointer hover:scale-125 transition-transform"
    >
      <img 
        src={src} 
        alt="Node"
        draggable={false}
        className="w-full h-full object-cover filter contrast-125 pointer-events-none"
        loading="lazy"
      />
    </div>
  </motion.div>
);

export default BurningFuse;
