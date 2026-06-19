"use client";
import React, { useEffect, useState, useMemo, useRef, Suspense, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Send, Phone, Video, MoreVertical, Wifi, Battery, Bookmark, RotateCcw, ChevronUp, ChevronDown, Check, Clock, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { hashPassword } from "@/lib/password-security";
import ProfileCard from "@/components/ui/profile-card";

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

interface WordInfo {
  msgId: string;
  wordIndex: number;
  wordText: string;
  globalIndex?: number;
}

function MessageContent({ content }: { content: string }) {
  return <span className="whitespace-pre-wrap break-words">{content}</span>;
}

interface ChatScreenProps {
  messages: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  timeStr: string;
  selectedDate?: string;
  isSelectingMarkPoint: boolean;
  tempSelectedWordInfo: WordInfo | null;
  onSelectWord: (info: (WordInfo & { globalIndex: number }) | null) => void;
  savedMarkedWordInfo: WordInfo | null;
  savedReadingIndex: number | null;
  scrollTargetIntent: "date" | "marked-word" | null;
  currentStartIndex: number;
}

interface ChatScreenRef {
  getFirstVisibleMessage: () => { msgId: string; wordText: string; globalIndex: number } | null;
}

const ChatScreen = React.forwardRef<ChatScreenRef, ChatScreenProps>(({
  messages,
  loading,
  hasMore,
  onScroll,
  timeStr,
  selectedDate,
  isSelectingMarkPoint,
  tempSelectedWordInfo,
  onSelectWord,
  savedMarkedWordInfo,
  savedReadingIndex,
  scrollTargetIntent,
  currentStartIndex
}, ref) => {
  const listRef = useRef<HTMLDivElement>(null);
  const hasScrolledToDateRef = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    getFirstVisibleMessage: () => {
      if (!listRef.current || messages.length === 0) return null;
      const container = listRef.current;
      const containerScrollTop = container.scrollTop;

      const bubbleElements = container.querySelectorAll('[data-message-bubble="true"]');
      for (let i = 0; i < bubbleElements.length; i++) {
        const el = bubbleElements[i] as HTMLElement;
        if (el.offsetTop >= containerScrollTop - 15) {
          const msgId = el.getAttribute('data-msg-id');
          if (msgId) {
            const msgIdx = messages.findIndex(m => m.id === msgId);
            if (msgIdx !== -1) {
              const msg = messages[msgIdx];
              return {
                msgId: msg.id,
                wordText: msg.content.length > 30 ? msg.content.substring(0, 30) + "..." : msg.content,
                globalIndex: currentStartIndex + msgIdx
              };
            }
          }
        }
      }
      return {
        msgId: messages[0].id,
        wordText: messages[0].content.length > 30 ? messages[0].content.substring(0, 30) + "..." : messages[0].content,
        globalIndex: currentStartIndex
      };
    }
  }), [messages, currentStartIndex]);

  // Reset scroll lock when messages list is cleared (e.g. on new date selection)
  useEffect(() => {
    if (messages.length === 0) {
      hasScrolledToDateRef.current = null;
    }
  }, [messages]);

  // Scroll to selected date separator OR saved marked message word
  useEffect(() => {
    if (listRef.current) {
      const container = listRef.current;
      const timer = setTimeout(() => {
        // 1. Center the marked message if the intent is marked-word
        if (scrollTargetIntent === "marked-word") {
          let attempts = 0;
          const tryScroll = () => {
            const markedMsgEl = container.querySelector('[data-marked-message="true"]') as HTMLElement;
            if (markedMsgEl) {
              if (hasScrolledToDateRef.current !== "marked-word") {
                const scrollPos = markedMsgEl.offsetTop - 10;
                container.scrollTo({ top: Math.max(0, scrollPos), behavior: "smooth" });
                hasScrolledToDateRef.current = "marked-word";
              }
            } else if (attempts < 8) {
              attempts++;
              setTimeout(tryScroll, 100);
            }
          };
          tryScroll();
        }
        // 2. Scroll to selected date separator if intent is date
        else if (scrollTargetIntent === "date" && selectedDate) {
          if (hasScrolledToDateRef.current === selectedDate) {
            return;
          }
          let attempts = 0;
          const tryScrollDate = () => {
            const target = container.querySelector(`[data-date-separator="${selectedDate}"]`) as HTMLElement;
            if (target) {
              container.scrollTo({ top: target.offsetTop - 10, behavior: "smooth" });
              hasScrolledToDateRef.current = selectedDate;
            } else if (attempts < 8) {
              attempts++;
              setTimeout(tryScrollDate, 100);
            }
          };
          tryScrollDate();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages, selectedDate, scrollTargetIntent, savedMarkedWordInfo]);

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
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#FAF6F0] scrollbar-none relative"
        style={{
          backgroundImage: "radial-gradient(rgba(176,149,129,0.06) 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px"
        }}
      >
        {messages.length === 0 ? (
          loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center py-10">
              <img src="/loader.gif" alt="Loading chat..." className="w-16 h-16 object-contain" />
              <p className="text-[10px] text-[#8c7e74] font-semibold font-outfit mt-3 animate-pulse uppercase tracking-widest">
                Loading chat...
              </p>
            </div>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center py-10 px-6 text-center select-text">
              <p className="text-xs text-[#8c7e74] font-bold font-outfit leading-normal">
                No chat messages found.
              </p>
              <p className="text-[10px] text-neutral-400 font-outfit mt-1 max-w-[200px] leading-relaxed">
                Please ensure the chat history database is properly initialized in the project directory.
              </p>
            </div>
          )
        ) : (
          <>
            {renderedItems.map((item) => {
              if (item.type === "date-separator") {
                return (
                  <div key={item.id} data-date-separator={item.date} className="flex justify-center my-3 select-none">
                    <span className="px-3.5 py-1 rounded-full bg-[#ede6df]/60 border border-[#ede6df]/40 text-[9px] font-semibold text-[#8c7e74] font-outfit uppercase tracking-wider shadow-sm">
                      {item.date}
                    </span>
                  </div>
                );
              }

              const msg = item.msg;
              const isRight = msg.sender.toLowerCase().includes("sanjay");
              const globalIndex = currentStartIndex + (messages.findIndex(m => m.id === msg.id));
              const isMsgSaved = (savedMarkedWordInfo && savedMarkedWordInfo.msgId === msg.id) || (savedReadingIndex !== null && globalIndex === savedReadingIndex);
              const isMsgTempSelected = tempSelectedWordInfo && tempSelectedWordInfo.msgId === msg.id;

              return (
                <div
                  key={msg.id}
                  data-message-bubble="true"
                  data-msg-id={msg.id}
                  data-marked-message={isMsgSaved ? "true" : undefined}
                  className={`flex w-full ${isRight ? "justify-end" : "justify-start"}`}
                >
                  <div
                    onClick={(e) => {
                      if (isSelectingMarkPoint) {
                        e.stopPropagation();
                        onSelectWord({
                          msgId: msg.id,
                          wordIndex: 0,
                          wordText: msg.content.length > 30 ? msg.content.substring(0, 30) + "..." : msg.content,
                          globalIndex
                        });
                      }
                    }}
                    className={`max-w-[80%] rounded-[18px] px-3.5 py-2 text-xs font-outfit leading-relaxed shadow-sm transition-all ${isSelectingMarkPoint ? "cursor-pointer" : ""
                      } ${isRight
                        ? "bg-[#b09581] text-white rounded-tr-none"
                        : "bg-white text-[#40352f] border border-[#ede6df] rounded-tl-none"
                      } ${isMsgTempSelected
                        ? "ring-2 ring-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.45)]"
                        : isMsgSaved
                          ? "ring-2 ring-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                          : ""
                      }`}
                  >
                    <MessageContent content={msg.content} />
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
});

ChatScreen.displayName = "ChatScreen";

const formatTimeLeft = (seconds: number) => {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h.toString().padStart(2, "0"),
    m.toString().padStart(2, "0"),
    s.toString().padStart(2, "0")
  ].join(":");
};

// ============================================================================
// Main Page Content component
// ============================================================================
function FullChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const [mounted, setMounted] = useState(false);
  const hasInitializedRef = useRef(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [stars, setStars] = useState<{ x: number; y: number; size: number; duration: number }[]>([]);
  const [timeStr, setTimeStr] = useState("12:00 PM");
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);

  // Password Verification State
  const [isAuthorized, setIsAuthorized] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("full_chat_authorized") === "true";
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const hashedInput = await hashPassword(passwordInput);
      const defaultChatPasswordHash = "160fba6868d2070e5ae03ce0fb9988d58231c4a56b8a94b4e9b5133cbf17d922";

      let isMatch = hashedInput === defaultChatPasswordHash;

      const userId = sessionStorage.getItem("logged_in_user_id");
      if (userId) {
        const profileRef = doc(db, "profiles", userId);
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.chatPassword) {
            isMatch = hashedInput === data.chatPassword;
          }
        }
      }

      if (isMatch) {
        sessionStorage.setItem("full_chat_authorized", "true");
        setIsAuthorized(true);
        setPasswordError(false);
      } else {
        setPasswordError(true);
        setTimeout(() => setPasswordError(false), 2000);
      }
    } catch (err) {
      console.error("Password verification error:", err);
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  };

  // Chat Data & Navigation State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentStartIndex, setCurrentStartIndex] = useState(0);

  // Date lists for dropdown
  const [datesList, setDatesList] = useState<{ date: string; index: number; isMatched?: boolean }[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isManualSelecting, setIsManualSelecting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Word selection and scroll intent states
  const [isSelectingMarkPoint, setIsSelectingMarkPoint] = useState(false);
  const [tempSelectedWordInfo, setTempSelectedWordInfo] = useState<WordInfo | null>(null);
  const [savedMarkedWordInfo, setSavedMarkedWordInfo] = useState<WordInfo | null>(null);
  const [scrollTargetIntent, setScrollTargetIntent] = useState<"date" | "marked-word" | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Firestore Reading Point Sync
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<any | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  const [savedReadingIndex, setSavedReadingIndex] = useState<number | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const chatScreenRef = useRef<ChatScreenRef>(null);

  // Session Expiry & Timer Countdown
  useEffect(() => {
    if (!loggedInUserId) {
      setSessionTimeLeft(null);
      return;
    }

    const sessionKey = `session_expiry_${loggedInUserId}`;
    let expiry = localStorage.getItem(sessionKey);
    let expiryTime = expiry ? parseInt(expiry, 10) : 0;
    const now = Date.now();

    if (!expiry || expiryTime <= now || (expiryTime - now) > 2 * 60 * 60 * 1000) {
      expiryTime = now + 2 * 60 * 60 * 1000; // 2 hours
      localStorage.setItem(sessionKey, expiryTime.toString());
    }

    const updateTimer = () => {
      const current = Date.now();
      const diff = Math.max(0, Math.floor((expiryTime - current) / 1000));
      setSessionTimeLeft(diff);

      if (diff <= 0) {
        sessionStorage.removeItem("full_chat_authorized");
        sessionStorage.removeItem("logged_in_user_id");
        localStorage.removeItem(sessionKey);
        localStorage.removeItem("shared_letter_lock_time");
        setIsAuthorized(false);
        setLoggedInUser(null);
        router.push("/mailing?state=chat-world");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [loggedInUserId, router]);



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

  // Fetch messages starting from a specific index with an optional minimum 1-second loader duration for initial load
  const fetchMessagesFromIndex = async (idxVal: number, isInitial = false, customLimit = 40) => {
    let cleanIdx = Number(idxVal);
    if (isNaN(cleanIdx) || cleanIdx < 0) {
      cleanIdx = 0;
    }
    if (loading) return;
    setLoading(true);
    setCurrentStartIndex(cleanIdx);
    try {
      const fetchPromise = fetch(`/api/chat?startIndex=${cleanIdx}&limit=${customLimit}`);
      const res = await fetchPromise;

      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
        setHasMore(data.hasMore);
      } else {
        if (cleanIdx !== 0) {
          console.warn(`No messages found at index ${cleanIdx}, falling back to index 0`);
          setLoading(false);
          await fetchMessagesFromIndex(0, isInitial);
        } else {
          setMessages([]);
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      if (cleanIdx !== 0) {
        setLoading(false);
        await fetchMessagesFromIndex(0, isInitial);
      } else {
        setMessages([]);
        setHasMore(false);
      }
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

  // Initial mount configurations (Stars and fake progress)
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
    const duration = 150;
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

  // Load Reading Point and initialize messages/redirection after authorization and dates list are loaded
  useEffect(() => {
    if (!isAuthorized || datesList.length === 0 || hasInitializedRef.current) return;

    const userId = sessionStorage.getItem("logged_in_user_id");
    setLoggedInUserId(userId);

    const initializeChat = async () => {
      hasInitializedRef.current = true;
      try {
        let firestoreIndex: number | null = null;
        let firestoreWordInfo: any = null;

        // 1. Try to read from localStorage synchronously to fetch immediately
        if (userId) {
          const localIndexKey = `full_chat_reading_index_${userId}`;
          const localWordInfoKey = `full_chat_marked_word_info_${userId}`;
          const localIdx = localStorage.getItem(localIndexKey);
          const localWord = localStorage.getItem(localWordInfoKey);

          if (localIdx !== null) {
            firestoreIndex = Number(localIdx);
            if (isNaN(firestoreIndex)) firestoreIndex = null;
            if (localWord) {
              try {
                firestoreWordInfo = JSON.parse(localWord);
              } catch (e) { }
            }
          }
        }

        // 2. Start initial fetch immediately if we found a local index
        if (firestoreIndex !== null) {
          setSavedReadingIndex(firestoreIndex);
          setSavedMarkedWordInfo(firestoreWordInfo);
          setScrollTargetIntent("marked-word");

          const matched = matchDateToIndex(firestoreIndex, datesList);
          setCurrentDateIndex(matched);

          let fetchIndex = firestoreIndex;
          let limit = 100;
          if (matched > 0) {
            fetchIndex = datesList[matched - 1].index;
            const diff = firestoreIndex - fetchIndex;
            limit = Math.max(100, diff + 100);
          } else {
            limit = Math.max(100, firestoreIndex + 100);
          }
          fetchMessagesFromIndex(fetchIndex, true, limit);
        } else {
          // Fallback to dateParam if present
          if (dateParam) {
            const foundIdx = datesList.findIndex(d => d.date === dateParam);
            if (foundIdx !== -1) {
              setCurrentDateIndex(foundIdx);
              setScrollTargetIntent("date");

              let fetchIndex = datesList[foundIdx].index;
              let limit = 40;

              if (foundIdx > 0) {
                fetchIndex = datesList[foundIdx - 1].index;
                if (foundIdx + 1 < datesList.length) {
                  limit = datesList[foundIdx + 1].index - fetchIndex;
                } else {
                  limit = 100;
                }
              } else {
                if (foundIdx + 1 < datesList.length) {
                  limit = datesList[foundIdx + 1].index - fetchIndex;
                }
              }
              limit = Math.max(100, limit + 50); // Large buffer
              fetchMessagesFromIndex(fetchIndex, true, limit);
            } else {
              setScrollTargetIntent(null);
              fetchMessagesFromIndex(0, true);
            }
          } else {
            setScrollTargetIntent(null);
            fetchMessagesFromIndex(0, true);
          }
        }

        // 3. Query Firestore in the background for profile details and latest marked point
        if (userId) {
          const profileRef = doc(db, "profiles", userId);
          getDoc(profileRef).then((snap) => {
            if (snap && snap.exists()) {
              const data = snap.data();
              setLoggedInUser({
                id: userId,
                name: data.name || "Partner",
                avatarUrl: data.avatarUrl || "/stamp.png",
                title: data.title || "User",
                socials: data.socials || {},
                avatarAdjust: data.avatarAdjust || { scale: 1, x: 0, y: 0 }
              });

              if (data.fullChatReadingIndex !== undefined && data.fullChatReadingIndex !== null) {
                const fsIndex = Number(data.fullChatReadingIndex);
                if (!isNaN(fsIndex)) {
                  const fsWordInfo = data.fullChatMarkedWordInfo || null;

                  const localIndexKey = `full_chat_reading_index_${userId}`;
                  const localWordInfoKey = `full_chat_marked_word_info_${userId}`;
                  const localIdx = localStorage.getItem(localIndexKey);

                  // If Firestore has a different index, we sync and update state/messages
                  if (localIdx === null || Number(localIdx) !== fsIndex) {
                    localStorage.setItem(localIndexKey, String(fsIndex));
                    if (fsWordInfo) {
                      localStorage.setItem(localWordInfoKey, JSON.stringify(fsWordInfo));
                    } else {
                      localStorage.removeItem(localWordInfoKey);
                    }

                    setSavedReadingIndex(fsIndex);
                    setSavedMarkedWordInfo(fsWordInfo);
                    setScrollTargetIntent("marked-word");
                    const matched = matchDateToIndex(fsIndex, datesList);
                    setCurrentDateIndex(matched);

                    let fetchIndex = fsIndex;
                    let limit = 100;
                    if (matched > 0) {
                      fetchIndex = datesList[matched - 1].index;
                      const diff = fsIndex - fetchIndex;
                      limit = Math.max(100, diff + 100);
                    } else {
                      limit = Math.max(100, fsIndex + 100);
                    }
                    fetchMessagesFromIndex(fetchIndex, true, limit);
                  }
                }
              } else if (data.fullChatReadingIndex === null) {
                const localIndexKey = `full_chat_reading_index_${userId}`;
                const localWordInfoKey = `full_chat_marked_word_info_${userId}`;
                if (localStorage.getItem(localIndexKey) !== null) {
                  localStorage.removeItem(localIndexKey);
                  localStorage.removeItem(localWordInfoKey);
                  setSavedReadingIndex(null);
                  setSavedMarkedWordInfo(null);
                }
              }
            }
          }).catch((err) => {
            console.error("Failed to load profile in background:", err);
          });
        }
      } catch (err) {
        console.error("Initialization failed:", err);
        setScrollTargetIntent(null);
        fetchMessagesFromIndex(0, true);
      }
    };

    initializeChat();
  }, [isAuthorized, datesList, dateParam]);

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
      if (isManualSelecting) {
        setIsManualSelecting(false);
        return;
      }
      const matched = matchDateToIndex(currentStartIndex, datesList);
      setCurrentDateIndex(matched);
    }
  }, [datesList, currentStartIndex]);

  // Jump to selected date index
  const jumpToDateIndex = (idx: number) => {
    if (idx < 0 || idx >= datesList.length) return;
    setIsManualSelecting(true);
    setCurrentDateIndex(idx);
    setScrollTargetIntent("date");

    let fetchIndex = datesList[idx].index;
    let limit = 40;

    if (idx > 0) {
      fetchIndex = datesList[idx - 1].index;
      if (idx + 1 < datesList.length) {
        limit = datesList[idx + 1].index - fetchIndex;
      } else {
        limit = 100; // Last day, load rest of the chat
      }
    } else {
      if (idx + 1 < datesList.length) {
        limit = datesList[idx + 1].index - fetchIndex;
      }
    }

    // Add buffer
    limit = Math.max(100, limit + 50);

    setMessages([]);
    setHasMore(true);
    fetchMessagesFromIndex(fetchIndex, false, limit);
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
  const handleSaveReadingPoint = () => {
    if (!loggedInUserId) return;

    let targetMsg: WordInfo | null = null;
    if (chatScreenRef.current) {
      const firstVisible = chatScreenRef.current.getFirstVisibleMessage();
      if (firstVisible) {
        targetMsg = {
          msgId: firstVisible.msgId,
          wordIndex: 0,
          wordText: firstVisible.wordText,
          globalIndex: firstVisible.globalIndex
        };
      }
    }

    if (!targetMsg && messages.length > 0) {
      targetMsg = {
        msgId: messages[0].id,
        wordIndex: 0,
        wordText: messages[0].content.length > 30 ? messages[0].content.substring(0, 30) + "..." : messages[0].content,
        globalIndex: currentStartIndex
      };
    }

    if (!targetMsg) return;

    // Optimistically save locally for instant UI update
    const localIndexKey = `full_chat_reading_index_${loggedInUserId}`;
    const localWordInfoKey = `full_chat_marked_word_info_${loggedInUserId}`;
    localStorage.setItem(localIndexKey, String(targetMsg.globalIndex));
    localStorage.setItem(localWordInfoKey, JSON.stringify({
      msgId: targetMsg.msgId,
      wordIndex: targetMsg.wordIndex,
      wordText: targetMsg.wordText
    }));

    setSavedReadingIndex(targetMsg.globalIndex ?? null);
    setSavedMarkedWordInfo({
      msgId: targetMsg.msgId,
      wordIndex: targetMsg.wordIndex,
      wordText: targetMsg.wordText
    });

    setSaveNotification("Reading point marked successfully!");
    setTimeout(() => setSaveNotification(null), 3000);

    // Save to Firestore in background
    const profileRef = doc(db, "profiles", loggedInUserId);
    setDoc(profileRef, {
      fullChatReadingIndex: targetMsg.globalIndex,
      fullChatMarkedWordInfo: {
        msgId: targetMsg.msgId,
        wordIndex: targetMsg.wordIndex,
        wordText: targetMsg.wordText
      }
    }, { merge: true }).catch((err) => {
      console.error("Failed to save marked word to Firestore in background:", err);
    });
  };

  const handleUnmarkReadingPoint = () => {
    if (!loggedInUserId) return;

    // Optimistically remove locally for instant UI update
    const localIndexKey = `full_chat_reading_index_${loggedInUserId}`;
    const localWordInfoKey = `full_chat_marked_word_info_${loggedInUserId}`;
    localStorage.removeItem(localIndexKey);
    localStorage.removeItem(localWordInfoKey);

    setSavedReadingIndex(null);
    setSavedMarkedWordInfo(null);
    setSaveNotification("Reading point cleared!");
    setTimeout(() => setSaveNotification(null), 3000);

    // Remove from Firestore in background
    const profileRef = doc(db, "profiles", loggedInUserId);
    setDoc(profileRef, {
      fullChatReadingIndex: null,
      fullChatMarkedWordInfo: null
    }, { merge: true }).catch((err) => {
      console.error("Failed to clear reading point in Firestore in background:", err);
    });
  };

  // Go to saved reading point
  const handleGoToReadingPoint = () => {
    if (savedReadingIndex !== null) {
      setScrollTargetIntent("marked-word");
      setMessages([]);
      setHasMore(true);

      const matched = matchDateToIndex(savedReadingIndex, datesList);
      let fetchIndex = savedReadingIndex;
      let limit = 100;
      if (matched > 0) {
        fetchIndex = datesList[matched - 1].index;
        const diff = savedReadingIndex - fetchIndex;
        limit = Math.max(100, diff + 100);
      } else {
        limit = Math.max(100, savedReadingIndex + 100);
      }

      fetchMessagesFromIndex(fetchIndex, false, limit);
    }
  };



  if (!isAuthorized) {
    return (
      <main className="relative min-h-screen w-full bg-[#030308] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none font-sans">
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            75% { transform: translateX(6px); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out;
          }
        ` }} />

        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] bg-pink-900/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Blinking stars background */}
        <div className="absolute inset-0 bg-[#030308] z-0 overflow-hidden pointer-events-none">
          {stars.map((star, idx) => (
            <div
              key={idx}
              className="absolute bg-white rounded-full opacity-35 animate-pulse"
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

        {/* Lock Screen Card */}
        <div className={`relative z-10 w-full max-w-[340px] bg-neutral-900/60 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 ${passwordError ? "animate-shake" : ""}`}>
          <div className="flex flex-col items-center text-center">
            {/* Stamp Logo Circle */}
            <div className="w-16 h-16 rounded-full border border-purple-500/20 bg-neutral-950 flex items-center justify-center relative shadow-[0_0_20px_rgba(168,85,247,0.15)] mb-4">
              <img
                src="/stamp.png"
                alt="Stamp"
                className="w-10 h-10 object-contain p-0.5 filter brightness-95"
              />
              <div className="absolute inset-0 rounded-full border border-purple-500/10 animate-ping opacity-75" />
            </div>

            {/* Header */}
            <h2 className="text-sm sm:text-base font-bold text-white font-outfit uppercase tracking-widest flex items-center gap-1.5">
              <span>✦</span> Unlock Memories <span>✦</span>
            </h2>
            <p className="text-[10px] text-neutral-400 font-outfit mt-1.5 max-w-[280px] leading-relaxed">
              This section is password protected to preserve our sweetest memories.
            </p>

            {/* Form */}
            <form onSubmit={handlePasswordSubmit} className="w-full mt-6 space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter secret password..."
                  className={`w-full bg-white/5 border rounded-full py-2.5 px-4 text-xs text-white placeholder-neutral-500 font-outfit outline-none transition-all ${passwordError
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
                    }`}
                  autoFocus
                />
              </div>

              {passwordError && (
                <p className="text-[9px] text-red-400 font-semibold font-outfit uppercase tracking-wider animate-bounce">
                  Incorrect secret password
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold font-outfit text-[10px] uppercase tracking-widest py-3 rounded-full shadow-lg hover:shadow-purple-500/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Unlock Chat</span>
              </button>
            </form>

            <Link
              href="/mailing?state=chat-world"
              className="mt-4 text-[9px] font-semibold text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
            >
              Go Back
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
            <div className="w-28 sm:w-36 h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)] rounded-full"
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
      className="relative w-full h-screen overflow-hidden bg-black font-sans select-none flex items-start justify-center pt-2 sm:pt-4"
      style={{ perspective: "1000px" }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-height: 950px) {
          .phone-simulator-container {
            transform: scale(1.08) !important;
          }
        }
        @media (max-height: 850px) {
          .phone-simulator-container {
            transform: scale(1.0) !important;
          }
        }
        @media (max-height: 750px) {
          .phone-simulator-container {
            transform: scale(0.92) !important;
          }
        }
        @media (max-height: 650px) {
          .phone-simulator-container {
            transform: scale(0.82) !important;
          }
        }
      ` }} />

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
        className="relative z-10 flex flex-col items-center justify-start pt-1 sm:pt-2 p-2 max-h-screen"
      >
        <div
          className="phone-simulator-container relative w-[365px] bg-[#1a1a1e] rounded-[52px] p-3 pt-12 pb-12 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95),_0_0_50px_rgba(168,85,247,0.15)] border-[4px] border-[#2c2c2e] flex flex-col items-center justify-center scale-[0.78] min-[370px]:scale-[0.85] min-[400px]:scale-100 origin-top transition-transform"
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
              ref={chatScreenRef}
              messages={messages}
              loading={loading}
              hasMore={hasMore}
              onScroll={handleScroll}
              timeStr={timeStr}
              selectedDate={datesList[currentDateIndex]?.date}
              isSelectingMarkPoint={isSelectingMarkPoint}
              tempSelectedWordInfo={tempSelectedWordInfo}
              onSelectWord={setTempSelectedWordInfo}
              savedMarkedWordInfo={savedMarkedWordInfo}
              savedReadingIndex={savedReadingIndex}
              scrollTargetIntent={scrollTargetIntent}
              currentStartIndex={currentStartIndex}
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
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-3 bg-neutral-950/80 border border-neutral-850 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full backdrop-blur-md shadow-2xl pointer-events-auto max-w-[95%] sm:max-w-none scale-[0.82] sm:scale-100 origin-bottom transition-all">
        {/* Date drop down selection */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1.5 text-[10px] font-semibold text-neutral-300 font-outfit outline-none cursor-pointer hover:border-neutral-700 hover:text-white transition-all flex items-center gap-1.5 min-w-[110px] justify-between shadow-inner"
          >
            <div className="flex items-center gap-1.5 truncate">
              {datesList[currentDateIndex]?.isMatched && (
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
              )}
              <span className="truncate">{datesList[currentDateIndex]?.date || "Select Date"}</span>
            </div>
            <ChevronUp size={10} className={`text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 w-36 max-h-48 overflow-y-auto bg-neutral-950/95 border border-neutral-800 rounded-xl py-1 shadow-2xl z-30 scrollbar-none flex flex-col backdrop-blur-md">
              {datesList.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentDateIndex(idx);
                    jumpToDateIndex(idx);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[10px] font-outfit font-medium hover:bg-neutral-800/80 transition-colors flex items-center gap-1.5 ${idx === currentDateIndex ? "text-purple-400 bg-purple-950/20" : "text-neutral-300"
                    }`}
                >
                  {item.isMatched && (
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                  )}
                  {!item.isMatched && (
                    <span className="w-1.5 h-1.5 shrink-0 opacity-0" />
                  )}
                  <span>{item.date}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
            onClick={savedReadingIndex !== null ? handleUnmarkReadingPoint : handleSaveReadingPoint}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-[10px] font-bold font-outfit transition cursor-pointer shadow-md ${savedReadingIndex !== null
              ? "border-red-500/30 bg-red-950/20 hover:bg-red-900/40 text-red-300"
              : "border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300"
              }`}
          >
            <Bookmark size={10} />
            <span>{savedReadingIndex !== null ? "Unmark Point" : "Mark Point"}</span>
          </button>

          {/* Jump to marked reading point button if exists */}
          {savedReadingIndex !== null && (
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
      <div className="absolute top-3 left-3 sm:top-8 sm:left-8 z-20 flex items-center">
        <Link
          href="/mailing?state=chat-world"
          className="px-5 py-2.5 rounded-full bg-neutral-900/80 border border-neutral-800 backdrop-blur-md text-white font-extrabold font-outfit text-[10px] uppercase tracking-widest hover:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <ArrowLeft size={12} />
          <span>Back to Chat World</span>
        </Link>
      </div>

      {/* Profile and Session timer in top right */}
      {loggedInUser && (
        <div className="absolute top-3 right-3 sm:top-8 sm:right-8 z-20 flex items-center gap-3">
          {sessionTimeLeft !== null && (
            <div className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-800 rounded-full px-3.5 py-2 text-xs sm:text-sm font-bold font-mono text-purple-300 shadow-md animate-pulse pointer-events-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping shrink-0" />
              <span>Session: {formatTimeLeft(sessionTimeLeft)}</span>
            </div>
          )}
          <div className="pointer-events-auto">
            <ProfileCard
              imageSrc={loggedInUser.avatarUrl}
              name={loggedInUser.name}
              role={loggedInUser.title}
              socials={{ github: loggedInUser.socials?.github }}
              avatarAdjust={loggedInUser.avatarAdjust}
            />
          </div>
          <motion.button
            onClick={() => {
              sessionStorage.removeItem("full_chat_authorized");
              sessionStorage.removeItem("logged_in_user_id");
              if (loggedInUserId) {
                const sessionKey = `session_expiry_${loggedInUserId}`;
                localStorage.removeItem(sessionKey);
              }
              localStorage.removeItem("shared_letter_lock_time");
              setLoggedInUser(null);
              setIsAuthorized(false);
              router.push("/mailing?state=chat-world");
            }}
            onMouseEnter={() => setIsLogoutHovered(true)}
            onMouseLeave={() => setIsLogoutHovered(false)}
            layout
            initial={{ width: 52, height: 52, borderRadius: 26 }}
            animate={{ width: isLogoutHovered ? "auto" : 52 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="h-[52px] flex items-center justify-start overflow-hidden border border-red-500/30 bg-red-950/30 hover:bg-red-900/50 hover:border-red-500/60 text-red-300 cursor-pointer shadow-lg hover:shadow-red-500/10 pointer-events-auto shrink-0 select-none pl-[17px] gap-2 rounded-full"
            title="Logout Profile"
          >
            <LogOut size={18} className="shrink-0" />
            <AnimatePresence>
              {isLogoutHovered && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="font-outfit text-[11px] sm:text-xs font-semibold whitespace-nowrap overflow-hidden pr-3.5"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}

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

export default function FullChatPage() {
  return (
    <Suspense fallback={
      <main className="relative min-h-screen w-full bg-[#030308] text-white flex flex-col items-center justify-center p-4">
        <p className="text-purple-400 text-xs font-outfit uppercase tracking-widest animate-pulse font-semibold">Loading Chat...</p>
      </main>
    }>
      <FullChatContent />
    </Suspense>
  );
}
