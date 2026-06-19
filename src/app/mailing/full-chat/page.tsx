"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { ArrowLeft, Loader2, Send, Phone, Video, MoreVertical, Wifi, Battery, Bookmark, RotateCcw, ChevronUp, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ============================================================================
// Chat Client Screen (The embedded scrollable UI)
// ============================================================================
interface ChatMessage {
  id: string;
  date: string;
  time: string;
  sender: string;
  content: string;
}

interface ChatScreenProps {
  messages: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  timeStr: string;
}

function ChatScreen({ messages, loading, hasMore, onScroll, timeStr }: ChatScreenProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Group messages to insert date separators dynamically
  const renderedItems = useMemo(() => {
    const items: any[] = [];
    let lastDate = "";
    messages.forEach((msg) => {
      if (msg.date !== lastDate) {
        items.push({ type: "date-separator", date: msg.date, id: `date-${msg.date}-${msg.id}` });
        lastDate = msg.date;
      }
      items.push({ type: "message", msg });
    });
    return items;
  }, [messages]);

  return (
    <div className="w-full h-[620px] bg-[#FAF6F0] flex flex-col text-neutral-800 select-none relative">
      {/* Top Status Bar with Dynamic Realtime Clock */}
      <div className="h-6 bg-[#FAF6F0] text-neutral-800 flex justify-between items-center px-6 text-[9px] font-semibold font-outfit select-none shrink-0 pt-1.5">
        <span>{timeStr}</span>
        <div className="flex items-center gap-1.5">
          <Wifi size={10} />
          <Battery size={12} className="rotate-90 origin-center" />
          <span>80%</span>
        </div>
      </div>

      {/* WhatsApp Chat Header (Using website stamp logo and renamed to Our Story'26) */}
      <div className="bg-[#FAF6F0] border-b border-[#ede6df] px-4 py-2.5 flex items-center justify-between shrink-0 select-none z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#ede6df]/85 bg-neutral-900 flex items-center justify-center relative">
            <img 
              src="/stamp.png" 
              alt="Website Stamp Logo" 
              className="w-full h-full object-cover p-1.5 filter brightness-95" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-neutral-800 font-outfit leading-tight">Our Story'26</span>
            <span className="text-[8px] text-green-600 font-medium font-outfit">online</span>
          </div>
        </div>
        <div className="flex items-center gap-3.5 text-neutral-700">
          <Video size={14} className="hover:text-neutral-900 cursor-pointer" />
          <Phone size={13} className="hover:text-neutral-900 cursor-pointer" />
          <MoreVertical size={14} className="hover:text-neutral-900 cursor-pointer" />
        </div>
      </div>

      {/* Chat Messages Body */}
      <div 
        ref={listRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#FAF6F0] scrollbar-none"
        style={{
          backgroundImage: "radial-gradient(rgba(176,149,129,0.06) 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px"
        }}
      >
        {messages.length === 0 && loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center py-10">
            <img src="/loader.gif" alt="Loading chat..." className="w-16 h-16 object-contain" />
            <p className="text-[10px] text-[#8c7e74] font-semibold font-outfit mt-3 animate-pulse uppercase tracking-widest">
              Loading chat...
            </p>
          </div>
        ) : (
          <>
            {renderedItems.map((item) => {
              if (item.type === "date-separator") {
                return (
                  <div key={item.id} className="flex justify-center my-3 select-none">
                    <span className="px-3.5 py-1 rounded-full bg-[#ede6df]/60 border border-[#ede6df]/40 text-[9px] font-semibold text-[#8c7e74] font-outfit uppercase tracking-wider shadow-sm">
                      {item.date}
                    </span>
                  </div>
                );
              }

              const msg = item.msg;
              const isRight = msg.sender.toLowerCase().includes("sanjay");
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex w-full ${isRight ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-[18px] px-3.5 py-2 text-xs font-outfit leading-relaxed shadow-sm ${
                      isRight 
                        ? "bg-[#b09581] text-white rounded-tr-none" 
                        : "bg-white text-[#40352f] border border-[#ede6df] rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`text-[8px] mt-1 text-right select-none ${isRight ? "text-white/70" : "text-neutral-400"}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-center py-1">
                <img src="/loader.gif" alt="Loading..." className="w-10 h-10 object-contain" />
              </div>
            )}
          </>
        )}
      </div>

      {/* WhatsApp Chat Footer Input Mockup */}
      <div className="bg-[#FAF6F0] p-3 border-t border-[#ede6df] flex items-center gap-2 shrink-0 select-none">
        <div className="flex-1 bg-white rounded-full border border-[#ede6df] px-3 py-1.5 text-[10px] text-neutral-400 font-outfit flex items-center justify-between">
          <span>Type a message...</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#b09581] text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-[#a08571] transition-colors shrink-0">
          <Send size={11} className="ml-0.5" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page component
// ============================================================================
export default function FullChatPage() {
  const [mounted, setMounted] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [stars, setStars] = useState<{ x: number; y: number; size: number; duration: number }[]>([]);
  const [timeStr, setTimeStr] = useState("12:00 PM");

  // Chat Data & Navigation State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);

  // Date lists for dropdown
  const [datesList, setDatesList] = useState<{ date: string; index: number }[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);

  // Firestore Reading Point Sync
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [savedReadingIndex, setSavedReadingIndex] = useState<number | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);



  // Dynamic Realtime Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      setTimeStr(`${hours}:${minutes} ${ampm}`);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 10000);
    return () => clearInterval(clockInterval);
  }, []);

  // Fetch unique dates list
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await fetch("/api/chat?action=dates");
        const data = await res.json();
        if (data.dates) {
          setDatesList(data.dates);
        }
      } catch (err) {
        console.error("Failed to load unique chat dates:", err);
      }
    };
    fetchDates();
  }, []);

  // Fetch messages starting from a specific index
  const fetchMessagesFromIndex = async (idxVal: number) => {
    if (loading) return;
    setLoading(true);
    setCurrentStartIndex(idxVal);
    try {
      const res = await fetch(`/api/chat?startIndex=${idxVal}&limit=40`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch next batch (infinite scroll)
  const fetchMoreMessages = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const idxVal = currentStartIndex + messages.length;
    try {
      const res = await fetch(`/api/chat?startIndex=${idxVal}&limit=40`);
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const filteredNew = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
          return [...prev, ...filteredNew];
        });
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch more messages:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Reading Point from Firestore
  useEffect(() => {
    setMounted(true);
    
    // Generate stars
    const generatedStars = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      duration: Math.random() * 4 + 2,
    }));
    setStars(generatedStars);

    // Initial page load spinner progress
    const duration = 600;
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

    // Load Reading Point index from Firestore
    const userId = sessionStorage.getItem("logged_in_user_id");
    if (userId) {
      setLoggedInUserId(userId);
      const loadReadingPoint = async () => {
        try {
          const profileRef = doc(db, "profiles", userId);
          const snap = await getDoc(profileRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.fullChatReadingIndex !== undefined && data.fullChatReadingIndex !== null) {
              const idx = Number(data.fullChatReadingIndex);
              setSavedReadingIndex(idx);
              setCurrentStartIndex(idx);
              fetchMessagesFromIndex(idx);
            } else {
              fetchMessagesFromIndex(0);
            }
          } else {
            fetchMessagesFromIndex(0);
          }
        } catch (err) {
          console.error("Failed to load reading point from Firebase:", err);
          fetchMessagesFromIndex(0);
        }
      };
      loadReadingPoint();
    } else {
      fetchMessagesFromIndex(0);
    }

    return () => clearInterval(timer);
  }, []);

  // Match the date dropdown to the current scroll position / starting index
  const matchDateToIndex = (index: number, dates: { date: string; index: number }[]) => {
    let matchedIdx = 0;
    for (let i = 0; i < dates.length; i++) {
      if (dates[i].index <= index) {
        matchedIdx = i;
      } else {
        break;
      }
    }
    return matchedIdx;
  };

  useEffect(() => {
    if (datesList.length > 0) {
      const matched = matchDateToIndex(currentStartIndex, datesList);
      setCurrentDateIndex(matched);
    }
  }, [datesList, currentStartIndex]);

  // Jump to selected date index
  const jumpToDateIndex = (idx: number) => {
    if (idx < 0 || idx >= datesList.length) return;
    const targetIndex = datesList[idx].index;
    setMessages([]);
    setHasMore(true);
    fetchMessagesFromIndex(targetIndex);
  };

  const handlePrevDate = () => {
    if (currentDateIndex > 0) {
      const nextIdx = currentDateIndex - 1;
      setCurrentDateIndex(nextIdx);
      jumpToDateIndex(nextIdx);
    }
  };

  const handleNextDate = () => {
    if (currentDateIndex < datesList.length - 1) {
      const nextIdx = currentDateIndex + 1;
      setCurrentDateIndex(nextIdx);
      jumpToDateIndex(nextIdx);
    }
  };

  // Scroll handler for Chat screen
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (
      container.scrollHeight - container.scrollTop - container.clientHeight < 150 &&
      hasMore &&
      !loading
    ) {
      fetchMoreMessages();
    }
  };

  // Save/Unmark Reading Point
  const handleSaveReadingPoint = async () => {
    if (!loggedInUserId) return;
    try {
      const profileRef = doc(db, "profiles", loggedInUserId);
      await updateDoc(profileRef, {
        fullChatReadingIndex: currentStartIndex
      });
      setSavedReadingIndex(currentStartIndex);
      setSaveNotification("Reading point marked successfully!");
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (err) {
      console.error("Failed to save reading point:", err);
    }
  };

  const handleUnmarkReadingPoint = async () => {
    if (!loggedInUserId) return;
    try {
      const profileRef = doc(db, "profiles", loggedInUserId);
      await updateDoc(profileRef, {
        fullChatReadingIndex: null
      });
      setSavedReadingIndex(null);
      setSaveNotification("Reading point cleared!");
      setTimeout(() => setSaveNotification(null), 3000);
    } catch (err) {
      console.error("Failed to clear reading point:", err);
    }
  };

  // Go to saved reading point
  const handleGoToReadingPoint = () => {
    if (savedReadingIndex !== null) {
      setMessages([]);
      setHasMore(true);
      fetchMessagesFromIndex(savedReadingIndex);
    }
  };



  if (!mounted || isPageLoading) {
    return (
      <main className="relative min-h-screen w-full bg-[#030308] text-white flex flex-col items-center justify-center p-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-purple-900/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="flex flex-col items-center justify-center relative z-10">
          <img 
            src="/loader.gif" 
            alt="Loading..." 
            className="w-32 h-32 sm:w-44 sm:h-44 object-contain filter drop-shadow-[0_0_12px_rgba(168,85,247,0.25)]" 
          />
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <p className="text-purple-400/90 text-[10px] sm:text-xs font-outfit uppercase tracking-[0.25em] font-semibold animate-pulse">
              Generating Phone Simulator...
            </p>
            <span className="text-white/80 font-mono text-xs sm:text-sm font-bold">
              {loadingProgress}%
            </span>
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
    <div 
      className="relative w-full h-screen overflow-hidden bg-black font-sans select-none flex items-center justify-center"
      style={{ perspective: "1000px" }}
    >
      {/* Immersive space backdrop with blinking stars */}
      <div className="absolute inset-0 bg-[#030308] z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] sm:w-[550px] sm:h-[550px] bg-purple-900/5 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-pink-900/5 rounded-full blur-[130px] pointer-events-none" />
        
        {stars.map((star, idx) => (
          <div
            key={idx}
            className="absolute bg-white rounded-full opacity-40 animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Main Interactive Phone Container */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center p-4 max-h-screen"
      >
        <div 
          className="relative w-[365px] bg-[#1a1a1e] rounded-[52px] p-3 pt-12 pb-12 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95),_0_0_50px_rgba(168,85,247,0.1)] border-[4px] border-[#2c2c2e] flex flex-col items-center justify-center"
        >
          {/* Top Bezel: Camera & Speaker */}
          <div className="absolute top-4 left-0 right-0 flex flex-col items-center justify-center gap-1.5 z-20">
            {/* Front Camera */}
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-950 border border-neutral-800/80 flex items-center justify-center">
              <div className="w-0.5 h-0.5 rounded-full bg-blue-900" />
            </div>
            {/* Speaker Grille */}
            <div className="w-14 h-1 bg-neutral-800/70 rounded-full" />
          </div>

          {/* Screen Wrapper */}
          <div className="w-full rounded-[24px] overflow-hidden relative border border-neutral-950/20 shadow-inner">
            <ChatScreen 
              messages={messages} 
              loading={loading} 
              hasMore={hasMore} 
              onScroll={handleScroll}
              timeStr={timeStr}
            />
          </div>

          {/* Bottom Bezel: Home Button */}
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center z-20">
            <div className="w-9 h-9 rounded-full border border-[#2c2c2e] bg-[#111] flex items-center justify-center shadow-inner cursor-pointer hover:border-neutral-700 active:scale-95 transition-all">
              <div className="w-4 h-4 rounded-md border border-[#2c2c2e]/45" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating date selector and Reading Point navigation bar at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-neutral-950/80 border border-neutral-850 px-4 py-2.5 rounded-full backdrop-blur-md shadow-2xl pointer-events-auto">
        {/* Date drop down selection */}
        <select
          value={currentDateIndex}
          onChange={(e) => {
            const idx = parseInt(e.target.value, 10);
            setCurrentDateIndex(idx);
            jumpToDateIndex(idx);
          }}
          className="bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1.5 text-[10px] font-semibold text-neutral-300 font-outfit outline-none cursor-pointer hover:border-neutral-700 max-w-[120px] truncate"
        >
          {datesList.map((item, idx) => (
            <option key={idx} value={idx}>
              {item.date}
            </option>
          ))}
        </select>

        {/* Up/Down date navigators */}
        <div className="flex items-center gap-1.5 border-l border-neutral-800 pl-3">
          <button
            onClick={handlePrevDate}
            disabled={currentDateIndex === 0}
            className="p-1 bg-neutral-900 border border-neutral-800 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-850 text-white flex items-center justify-center size-7 cursor-pointer transition shadow-md"
            aria-label="Previous Day"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={handleNextDate}
            disabled={currentDateIndex >= datesList.length - 1}
            className="p-1 bg-neutral-900 border border-neutral-800 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-850 text-white flex items-center justify-center size-7 cursor-pointer transition shadow-md"
            aria-label="Next Day"
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Mark Reading Point toggle */}
        <div className="flex items-center gap-2 border-l border-neutral-800 pl-3">
          <button
            onClick={savedReadingIndex === currentStartIndex ? handleUnmarkReadingPoint : handleSaveReadingPoint}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-bold font-outfit transition cursor-pointer shadow-md ${
              savedReadingIndex === currentStartIndex
                ? "border-red-500/30 bg-red-950/20 hover:bg-red-900/40 text-red-300"
                : "border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300"
            }`}
          >
            <Bookmark size={10} />
            <span>{savedReadingIndex === currentStartIndex ? "Unmark Point" : "Mark Point"}</span>
          </button>

          {/* Jump to marked reading point button if exists */}
          {savedReadingIndex !== null && savedReadingIndex !== currentStartIndex && (
            <button
              onClick={handleGoToReadingPoint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 text-[10px] font-bold text-neutral-300 font-outfit transition cursor-pointer shadow-md"
              title="Return to Marked Reading Point"
            >
              <RotateCcw size={10} className="text-neutral-400" />
              <span>Go to Point</span>
            </button>
          )}
        </div>
      </div>

      {/* Back button */}
      <div className="absolute top-8 left-8 z-20 flex items-center">
        <Link
          href="/mailing?state=chat-world"
          className="px-5 py-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 backdrop-blur-md text-white font-extrabold font-outfit text-[10px] uppercase tracking-widest hover:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <ArrowLeft size={12} />
          <span>Back to Chat World</span>
        </Link>
      </div>

      {/* Toast Notification */}
      {saveNotification && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-purple-900/90 border border-purple-500/30 text-purple-200 px-4 py-1.5 rounded-full text-xs font-semibold font-outfit shadow-xl z-50 whitespace-nowrap animate-bounce">
          {saveNotification}
        </div>
      )}

      {/* Info Label */}
      <div className="absolute bottom-8 right-8 z-20 hidden lg:flex px-4 py-2.5 rounded-full bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-sm items-center gap-4 text-[9px] font-semibold font-outfit text-neutral-400 uppercase tracking-wider shadow-md">
        <span>Scroll inside simulator to read chat</span>
      </div>
    </div>
  );
}
