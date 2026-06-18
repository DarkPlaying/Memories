"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Mail, Calendar, FileText, Trash2, Download, Eye, EyeOff, LogOut, Globe } from "lucide-react";
import { Github, Linkedin, Twitter } from "@/components/ui/brand-icons";
import { collection, addDoc, getDocs, orderBy, query, doc, updateDoc, deleteDoc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MailboxFullState } from "@/components/ui/state";
import { PopoverForm } from "@/components/ui/popover-form";
import SignaturePadComponent from "@/components/ui/signature-pad";
import { InteractiveTravelCard } from "@/components/ui/3d-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";

import { ProfileSelector, ProfileIcon } from "@/components/ui/profile-selector";
import { AssistedPasswordConfirmation } from "@/components/ui/assisted-password-confirmation";
import ProfileCard from "@/components/ui/profile-card";
import { GlassmorphismProfileCard } from "@/components/ui/profile-card-1";
import { EventCountdownCard } from "@/components/ui/event-countdown-card";
import { AlertCard } from "@/components/ui/alert-card";
import { MorphingCardStack } from "@/components/ui/morphing-card-stack";
import ImageCropper from "@/components/ui/image-cropper";
import { hashPassword } from "@/lib/password-security";


type PageState = "landing" | "visit" | "loading-visit";
type FormState = "idle" | "loading" | "success";

interface Attachment {
  id: string;
  src: string;
  x: number;
  y: number;
  width?: number;
}

interface Letter {
  id: string;
  content: string;
  signature: string | null;
  salutation?: string;
  createdAt: any;
  attachments?: Attachment[];
  isEternal?: boolean;
  recipientId?: string;
  senderId?: string;
  textareaRows?: number;
}

interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  title: string;
  bio: string;
  socials: { github?: string; linkedin?: string; twitter?: string };
  actionButton: { text: string; href: string };
  password?: string;
  avatarAdjust?: { scale: number; x: number; y: number };
  avatarCrop?: { x: number; y: number; width: number; height: number; zoom: number; rotation: number };
}

const getLetterLockTargetTime = (letter?: any) => {
  return new Date("May 23, 2031 00:00:00").getTime();
};

const getLinesOfText = (text: string, font: string = "400 14.5px 'Outfit', sans-serif", width: number = 440): string[] => {
  // Strip highlights so they don't count towards the character widths of visual lines
  const cleanText = text
    .replace(/\[hl-(yellow|pink|green|blue)\]/gi, "")
    .replace(/\[\/hl-(yellow|pink|green|blue)\]/gi, "");

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return cleanText.split('\n');
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return cleanText.split('\n');
  ctx.font = font;

  const paragraphs = cleanText.split('\n');
  const allLines: string[] = [];

  paragraphs.forEach((para) => {
    if (para === '') {
      allLines.push('');
      return;
    }

    const words = para.split(' ');
    let currentLine: string | null = null;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine: string = currentLine !== null ? currentLine + ' ' + word : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > width) {
        if (currentLine !== null) {
          allLines.push(currentLine);
          currentLine = word;
        } else {
          // Force split a word that is wider than the width
          let wordPart = '';
          for (let j = 0; j < word.length; j++) {
            const char = word[j];
            const testWordPart = wordPart + char;
            if (ctx.measureText(testWordPart).width > width) {
              if (wordPart) {
                allLines.push(wordPart);
                wordPart = char;
              } else {
                allLines.push(char);
                wordPart = '';
              }
            } else {
              wordPart = testWordPart;
            }
          }
          currentLine = wordPart;
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine !== null) {
      allLines.push(currentLine);
    }
  });

  return allLines;
};

const convertTagsToHtml = (text: string): string => {
  if (!text) return "";
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  const markerColors = ["yellow", "pink", "green", "blue"];
  markerColors.forEach(color => {
    const regex = new RegExp(`\\[hl-${color}\\]([\\s\\S]*?)\\[\\/hl-${color}\\]`, "gi");
    escaped = escaped.replace(regex, `<mark class="hl-${color}">$1</mark>`);
  });

  // Strip any remaining unmatched or malformed tags
  escaped = escaped
    .replace(/\[hl-(yellow|pink|green|blue)\]/gi, "")
    .replace(/\[\/hl-(yellow|pink|green|blue)\]/gi, "");

  return escaped;
};

const convertHtmlToTags = (html: string): string => {
  if (!html) return "";
  if (typeof document === 'undefined') return html;
  
  const temp = document.createElement("div");
  temp.innerHTML = html;
  
  let text = "";
  
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      
      if (tagName === "mark") {
        // Skip empty marks
        if (!el.textContent?.trim()) {
          el.childNodes.forEach(walk);
          return;
        }

        let color = "yellow";
        if (el.className.includes("hl-pink")) color = "pink";
        else if (el.className.includes("hl-green")) color = "green";
        else if (el.className.includes("hl-blue")) color = "blue";
        
        text += `[hl-${color}]`;
        el.childNodes.forEach(walk);
        text += `[/hl-${color}]`;
      } else if (tagName === "br") {
        text += "\n";
      } else if (tagName === "div" || tagName === "p") {
        const hasText = el.textContent || el.querySelector("br");
        if (hasText) {
          if (text.length > 0 && !text.endsWith("\n")) {
            text += "\n";
          }
          el.childNodes.forEach(walk);
        } else {
          text += "\n";
        }
      } else {
        el.childNodes.forEach(walk);
      }
    }
  };
  
  temp.childNodes.forEach(walk);
  
  const decoder = document.createElement("textarea");
  decoder.innerHTML = text;
  return decoder.value;
};

export default function MailingPage() {
  const [readerScale, setReaderScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 536) { // 512px (max-w-lg) + 24px margins
        setReaderScale((window.innerWidth - 24) / 512);
      } else {
        setReaderScale(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [composerScale, setComposerScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 536) { // 512px + 24px margins
        setComposerScale((window.innerWidth - 24) / 512);
      } else {
        setComposerScale(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [pageState, setPageState] = useState<PageState>("landing");
  const [formState, setFormState] = useState<FormState>("idle");
  const [openWritePopover, setOpenWritePopover] = useState(false);
  const [letterContent, setLetterContent] = useState("");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [textareaRows, setTextareaRows] = useState(6);
  const [letters, setLetters] = useState<Letter[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cached_letters");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {
          console.error("Error parsing cached letters on init:", e);
        }
      }
      try {
        const local = localStorage.getItem("local_letters");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });
  const [activeLetter, setActiveLetter] = useState<Letter | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [letterToDelete, setLetterToDelete] = useState<Letter | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cached_letters") || localStorage.getItem("local_letters");
      if (cached) return true;
    }
    return false;
  });
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
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

  const [salutation, setSalutation] = useState("Your Lovely");
  const [isDefaultSet, setIsDefaultSet] = useState(false);
  const [isDefaultSignatureSet, setIsDefaultSignatureSet] = useState(false);

  // Profile selection & login state hooks
  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(() => {
    if (typeof window !== "undefined") {
      const savedProfiles = localStorage.getItem("user_profiles");
      const savedUserId = sessionStorage.getItem("logged_in_user_id");
      if (savedProfiles && savedUserId) {
        try {
          const parsed = JSON.parse(savedProfiles) as UserProfile[];
          return parsed.find(p => p.id === savedUserId) || null;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_profiles");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loginState, setLoginState] = useState<"select-profile" | "enter-password" | "set-password-enter" | "set-password-confirm" | "master-password" | "add-profile" | "reset-password-master" | "reset-password-new">("select-profile");

  const [tempNewPassword, setTempNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState("");
  const [masterPasswordError, setMasterPasswordError] = useState("");
  const [loginPasswordInput, setLoginPasswordInput] = useState("");
  const [loginPasswordError, setLoginPasswordError] = useState("");

  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileTitle, setNewProfileTitle] = useState("");
  const [newProfileBio, setNewProfileBio] = useState("");
  const [newProfileAvatar, setNewProfileAvatar] = useState("");
  const [newProfilePassword, setNewProfilePassword] = useState("");
  const [isNewProfileConfirming, setIsNewProfileConfirming] = useState(false);
  const [newProfileGithub, setNewProfileGithub] = useState("");
  const [newProfileLinkedin, setNewProfileLinkedin] = useState("");
  const [newProfileTwitter, setNewProfileTwitter] = useState("");
  const [newProfileBtnText, setNewProfileBtnText] = useState("Contact Me");
  const [newProfileBtnHref, setNewProfileBtnHref] = useState("#");
  const [newProfileCrop, setNewProfileCrop] = useState<{ x: number; y: number; width: number; height: number; zoom: number; rotation: number } | undefined>(undefined);
  const [showCreateCropModal, setShowCreateCropModal] = useState(false);
  const [createUploadImageSrc, setCreateUploadImageSrc] = useState<string | null>(null);

  const [isDetailedCardOpen, setIsDetailedCardOpen] = useState(false);

  // Eternal Letter and recipient states
  const [isEternalComposer, setIsEternalComposer] = useState(true);
  const [recipientId, setRecipientId] = useState("");
  const [lockedLetter, setLockedLetter] = useState<Letter | null>(null);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showNoMessageAlert, setShowNoMessageAlert] = useState(false);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);
  const [showStackModal, setShowStackModal] = useState(false);
  const [countdownSource, setCountdownSource] = useState<"landing" | "grid" | null>(null);
  const [activeLetterSource, setActiveLetterSource] = useState<"vault" | "grid" | null>(null);

  // Filter letters to only show letters sent by or received by the loggedInUser, or legacy letters (no senderId and recipientId)
  const filteredLetters = letters.filter(l => 
    !loggedInUser || 
    l.senderId === loggedInUser.id || 
    l.recipientId === loggedInUser.id ||
    (!l.senderId && !l.recipientId)
  );

  // Pagination boundary guard
  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredLetters.length / 3) - 1);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredLetters.length, currentPage]);

  // Initialize contenteditable editor HTML when popover opens or editingLetterId changes
  useEffect(() => {
    if (openWritePopover) {
      const timer = setTimeout(() => {
        const editor = document.getElementById("letter-textarea");
        if (editor) {
          editor.innerHTML = convertTagsToHtml(letterContent);
          const lines = getLinesOfText(letterContent);
          setTextareaRows(Math.max(6, lines.length));
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [openWritePopover, editingLetterId]);

  // Dynamic starry background stars
  const [stars, setStars] = useState<{ x: number; y: number; size: number; duration: number }[]>([]);

  const handleEditLetter = (letter: Letter) => {
    const targetTime = getLetterLockTargetTime(letter);
    const isLocked = letter.isEternal && (Date.now() < targetTime) && (letter.senderId ? letter.senderId !== loggedInUser?.id : false);
    if (isLocked) {
      setLockedLetter(letter);
      setCountdownSource("grid");
      setShowCountdownModal(true);
      return;
    }
    setEditingLetterId(letter.id);
    setLetterContent(letter.content);
    setSignatureUrl(letter.signature);
    setAttachments(letter.attachments || []);
    setSalutation(letter.salutation || localStorage.getItem("default_salutation") || "Your Lovely");
    setIsEternalComposer(!!letter.isEternal);
    setRecipientId(letter.recipientId || "");
    setTextareaRows(letter.textareaRows || 6);
    setPageState("landing");
    setOpenWritePopover(true);
  };

  const handleDeleteLetter = async (id: string) => {
    try {
      if (id.startsWith("local-")) {
        const localMails = JSON.parse(localStorage.getItem("local_letters") || "[]");
        const filtered = localMails.filter((m: any) => m.id !== id);
        localStorage.setItem("local_letters", JSON.stringify(filtered));
      } else {
        await deleteDoc(doc(db, "letters", id));
      }
      setLetters(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error("Error deleting letter:", error);
      alert("Failed to delete letter from database.");
    }
  };

  const handleCloseWritePopover = (isOpen: boolean) => {
    setOpenWritePopover(isOpen);
    if (!isOpen) {
      if (editingLetterId) {
        setPageState("visit");
      }
      setEditingLetterId(null);
      setLetterContent("");
      setSignatureUrl(localStorage.getItem("default_signature") || null);
      setAttachments([]);
      setSalutation(localStorage.getItem("default_salutation") || "Your Lovely");
      setIsEternalComposer(true);
      setRecipientId("");
      setTextareaRows(6);
    }
  };

  // Define a function to validate master password in Firebase
  const validateMasterPasswordInFirebase = async (passwordInput: string): Promise<boolean> => {
    try {
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const verifyRef = doc(db, "validation", `check_${uniqueId}`);
      await setDoc(verifyRef, { password: passwordInput });
      await deleteDoc(verifyRef);
      return true;
    } catch (error) {
      console.error("Master password validation failed in Firebase:", error);
      return false;
    }
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);

    const savedSalutation = localStorage.getItem("default_salutation");
    if (savedSalutation) {
      setSalutation(savedSalutation);
    }

    const savedSignature = localStorage.getItem("default_signature");
    if (savedSignature) {
      setSignatureUrl(savedSignature);
    }

    const generatedStars = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 4 + 2,
    }));
    setStars(generatedStars);

    // Initialize/Retrieve User Profiles and Master Password from Firestore
    const initializeProfilesAndSecurity = async () => {
      try {
        // 1. Initialize Master Password in Firestore if not present (non-blocking background task)
        const configRef = doc(db, "config", "security");
        setDoc(configRef, { masterPassword: "Dark1123@#" }).then(() => {
          console.log("Initialized default master password in Firestore.");
        }).catch((e) => {
          console.log("Master password document already exists or is locked.");
        });

        // 2. Load Profiles
        const querySnapshot = await getDocs(collection(db, "profiles"));
        let fetchedProfiles: UserProfile[] = [];
        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            fetchedProfiles.push({ id: doc.id, ...doc.data() } as UserProfile);
          });
        } else {
          // Initialize with default profiles
          const defaultProfiles: UserProfile[] = [
            {
              id: "sanjay",
              name: "Sanjay M",
              avatarUrl: "/3d images/me.png",
              title: "Software Developer & Cybersecurity",
              bio: "Software Developer & Cybersecurity Enthusiast with practical experience in React, Python, and security bug hunting.",
              socials: { 
                github: "https://github.com/DarkPlaying", 
                linkedin: "https://www.linkedin.com/in/m-sanjay-105623258/" 
              },
              actionButton: { text: "Contact Me", href: "mailto:sanjaymofficialmail@gmail.com" }
            },
            {
              id: "divya",
              name: "Divya Bharathi S",
              avatarUrl: "/3d images/her.jpeg",
              title: "Learner | Coder | Creator",
              bio: "Dedicated student pursuing B.Sc. Computer Science at Vel Tech. Passionate about coding, learning, and collaborating on meaningful projects.",
              socials: { 
                github: "https://github.com/", 
                linkedin: "" 
              },
              actionButton: { text: "Email Me", href: "mailto:divya20051123@gmail.com" }
            }
          ];
          for (const p of defaultProfiles) {
            const { id, ...data } = p;
            await setDoc(doc(db, "profiles", id), data);
          }
          fetchedProfiles = defaultProfiles;
        }

        // Apply migrations to fetchedProfiles if necessary
        fetchedProfiles = fetchedProfiles.map(p => {
          if (p.id === "sanjay") {
            if (p.title === "Aspiring Software Developer & Cybersecurity Enthusiast" || p.title === "ASPIRING SOFTWARE DEVELOPER & CYBERSECUI") {
              p.title = "Software Developer & Cybersecurity";
            }
            if (p.bio.startsWith("Aspiring Software Developer & Cybersecurity Enthusiast")) {
              p.bio = "Software Developer & Cybersecurity Enthusiast with practical experience in React, Python, and security bug hunting.";
            }
          }
          if (p.id === "divya") {
            if (p.bio.startsWith("Dedicated and hardworking student")) {
              p.bio = "Dedicated student pursuing B.Sc. Computer Science at Vel Tech. Passionate about coding, learning, and collaborating on meaningful projects.";
            }
          }
          return p;
        });

        setProfiles(fetchedProfiles);
        localStorage.setItem("user_profiles", JSON.stringify(fetchedProfiles));

        // Load active session
        const savedUserId = sessionStorage.getItem("logged_in_user_id");
        if (savedUserId) {
          const user = fetchedProfiles.find(p => p.id === savedUserId);
          if (user) {
            setLoggedInUser(user);
          }
        }
      } catch (error) {
        console.error("Error initializing profiles/config from firestore:", error);
        // Fallback to local storage
        const savedProfilesStr = localStorage.getItem("user_profiles");
        if (savedProfilesStr) {
          const localParsed = JSON.parse(savedProfilesStr);
          setProfiles(localParsed);
          const savedUserId = sessionStorage.getItem("logged_in_user_id");
          if (savedUserId) {
            const user = localParsed.find((p: any) => p.id === savedUserId);
            if (user) setLoggedInUser(user);
          }
        }
      }
    };
    initializeProfilesAndSecurity();

    // Background prefetch letters on mount
    const prefetchLetters = async () => {
      try {
        const q = query(collection(db, "letters"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetched: Letter[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetched.push({
            id: doc.id,
            content: data.content,
            signature: data.signature || null,
            salutation: data.salutation || "Your Lovely",
            createdAt: data.createdAt,
            attachments: data.attachments || [],
            isEternal: true,
            recipientId: data.recipientId || "",
            senderId: data.senderId || "",
          });
        });
        const localMails = JSON.parse(localStorage.getItem("local_letters") || "[]");
        const merged = [...fetched];
        localMails.forEach((local: any) => {
          if (!merged.some(m => m.id === local.id)) {
            merged.push({
              ...local,
              isEternal: true,
            });
          }
        });
        setLetters(merged);
        localStorage.setItem("cached_letters", JSON.stringify(merged));
      } catch (error) {
        console.error("Error prefetching letters:", error);
        const localMails = JSON.parse(localStorage.getItem("local_letters") || "[]");
        setLetters(localMails);
      } finally {
        setIsInitialLoadDone(true);
      }
    };
    prefetchLetters();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleOpenLetter = (letter: Letter) => {
    const targetTime = getLetterLockTargetTime(letter);
    const isLocked = letter.isEternal && (Date.now() < targetTime) && (letter.senderId ? letter.senderId !== loggedInUser?.id : false);
    
    if (isLocked) {
      setLockedLetter(letter);
      setCountdownSource("grid");
      setShowCountdownModal(true);
    } else {
      setActiveLetter(letter);
    }
  };

  const handleOpenComposer = (isEternal: boolean) => {
    setIsEternalComposer(true);
    if (loggedInUser) {
      if (loggedInUser.id === "sanjay") {
        setRecipientId("divya");
      } else if (loggedInUser.id === "divya") {
        setRecipientId("sanjay");
      } else {
        const other = profiles.find(p => p.id !== loggedInUser.id);
        setRecipientId(other ? other.id : "");
      }
    }
    setOpenWritePopover(true);
  };

  useEffect(() => {
    if (!showCountdownModal) return;

    const calculateTime = () => {
      const target = new Date("May 23, 2031 00:00:00").getTime();
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [showCountdownModal]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    const el = e.currentTarget.parentElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = attachments.find(a => a.id === id)?.x || 0;
    const initialY = attachments.find(a => a.id === id)?.y || 0;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / composerScale;
      const dy = (moveEvent.clientY - startY) / composerScale;
      
      const unscaledWidth = rect.width / composerScale;
      
      const pctX = initialX + (dx / unscaledWidth) * 100;
      
      const allLinesCount = getLinesOfText(letterContent);
      const totalLinesCount = allLinesCount.length;
      const editorRows = Math.max(6, totalLinesCount);
      
      const initialL = (initialY / 100) * editorRows;
      const initialY_px = initialL * 29.5;
      const Y_px = initialY_px + dy;
      const L = Math.max(0, Math.round(Y_px / 29.5));
      
      const clampedL = Math.min(editorRows - 1, L);
      const pctY = (clampedL / editorRows) * 100;

      setAttachments(prev => prev.map(a => a.id === id ? { ...a, x: Math.max(0, Math.min(85, pctX)), y: Math.max(0, Math.min(90, pctY)) } : a));
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation();
    const attachment = attachments.find(a => a.id === id);
    if (!attachment) return;

    const startX = e.clientX;
    const initialWidth = attachment.width || 80;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / composerScale;
      const newWidth = Math.max(40, Math.min(300, initialWidth + dx));
      setAttachments(prev => prev.map(a => a.id === id ? { ...a, width: newWidth } : a));
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = (height * maxDim) / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = (width * maxDim) / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedSrc = canvas.toDataURL("image/jpeg", 0.7);

        setAttachments(prev => [
          ...prev,
          {
            id: `attach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            src: compressedSrc,
            x: 20 + Math.random() * 40,
            y: 20 + Math.random() * 40,
          }
        ]);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyHighlight = (color: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    
    const editor = document.getElementById("letter-textarea");
    if (!editor || !editor.contains(range.commonAncestorContainer)) {
      setComposerError("Please select some text inside the sheet to highlight first!");
      setTimeout(() => setComposerError(null), 4000);
      return;
    }

    const selectedText = range.toString();
    if (!selectedText.trim()) {
      setComposerError("Please select some text inside the sheet to highlight first!");
      setTimeout(() => setComposerError(null), 4000);
      return;
    }

    const getSelectedTextNodes = (r: Range): Text[] => {
      const container = r.commonAncestorContainer;
      if (container.nodeType === Node.TEXT_NODE) {
        return [container as Text];
      }
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (r.intersectsNode(node)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );
      const nodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        nodes.push(node as Text);
      }
      return nodes;
    };

    const splitParentAroundChild = (parent: HTMLElement, child: Node) => {
      const parentCloneBefore = parent.cloneNode(false) as HTMLElement;
      const parentCloneAfter = parent.cloneNode(false) as HTMLElement;
      
      let beforeChild = true;
      const children = Array.from(parent.childNodes);
      for (const childNode of children) {
        if (childNode === child) {
          beforeChild = false;
          continue;
        }
        if (beforeChild) {
          parentCloneBefore.appendChild(childNode);
        } else {
          parentCloneAfter.appendChild(childNode);
        }
      }
      
      const grandParent = parent.parentNode;
      if (grandParent) {
        if (parentCloneBefore.childNodes.length > 0) {
          grandParent.insertBefore(parentCloneBefore, parent);
        }
        grandParent.insertBefore(child, parent);
        if (parentCloneAfter.childNodes.length > 0) {
          grandParent.insertBefore(parentCloneAfter, parent);
        }
        grandParent.removeChild(parent);
      }
    };

    const textNodes = getSelectedTextNodes(range);
    if (textNodes.length === 0) return;

    let isSameColor = false;
    for (const node of textNodes) {
      const parentMark = node.parentElement?.closest("mark");
      if (parentMark && parentMark.className === `hl-${color}`) {
        isSameColor = true;
        break;
      }
    }

    const targets: { node: Text; start: number; end: number }[] = [];
    for (const node of textNodes) {
      const startOffset = node === range.startContainer ? range.startOffset : 0;
      const endOffset = node === range.endContainer ? range.endOffset : node.length;
      if (startOffset === endOffset) continue;
      targets.push({ node, start: startOffset, end: endOffset });
    }

    // Process from end to start so splitting doesn't invalidate offsets
    for (let i = targets.length - 1; i >= 0; i--) {
      const { node, start, end } = targets[i];
      let targetNode = node;
      if (start > 0) {
        targetNode = targetNode.splitText(start);
      }
      const relativeEnd = end - (start > 0 ? start : 0);
      if (relativeEnd < targetNode.length) {
        targetNode.splitText(relativeEnd);
      }

      const parentMark = targetNode.parentElement?.closest("mark") as HTMLElement | null;

      if (isSameColor) {
        if (parentMark && parentMark.className === `hl-${color}`) {
          splitParentAroundChild(parentMark, targetNode);
        }
      } else {
        if (parentMark) {
          splitParentAroundChild(parentMark, targetNode);
        }
        const mark = document.createElement("mark");
        mark.className = `hl-${color}`;
        targetNode.parentNode?.insertBefore(mark, targetNode);
        mark.appendChild(targetNode);
      }
    }

    selection.removeAllRanges();

    if (editor) {
      editor.normalize();
      editor.querySelectorAll("mark").forEach(m => {
        if (!m.textContent?.trim()) {
          m.parentNode?.removeChild(m);
        }
      });

      const html = editor.innerHTML;
      const textWithTags = convertHtmlToTags(html);
      setLetterContent(textWithTags);
      const lines = getLinesOfText(textWithTags);
      setTextareaRows(Math.max(6, lines.length));
    }
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    const textWithTags = convertHtmlToTags(html);
    setLetterContent(textWithTags);
    const lines = getLinesOfText(textWithTags);
    setTextareaRows(Math.max(6, lines.length));
  };

  const renderFormattedContent = (content: string) => {
    let escaped = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const markerColors = ["yellow", "pink", "green", "blue"];
    markerColors.forEach(color => {
      const regex = new RegExp(`\\[hl-${color}\\]([\\s\\S]*?)\\[\\/hl-${color}\\]`, "gi");
      escaped = escaped.replace(regex, `<mark class="hl-${color}">$1</mark>`);
    });

    // Strip any remaining unmatched or malformed tags
    escaped = escaped
      .replace(/\[hl-(yellow|pink|green|blue)\]/gi, "")
      .replace(/\[\/hl-(yellow|pink|green|blue)\]/gi, "");

    return { __html: escaped };
  };

  const preloadImages = (urls: string[]) => {
    return Promise.all(
      urls.map((url) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );
  };

  const paginateTextIntoPages = (text: string, maxLinesPage1: number = 24, maxLinesPage2: number = 29) => {
    const paragraphs = text.split("\n");
    const allLines: string[] = [];
    const charsPerLine = 72; // Average character limit for 600px width at 14.5px font-size

    paragraphs.forEach((para) => {
      if (para.trim() === "") {
        allLines.push("");
        return;
      }
      const words = para.split(" ");
      let currentLine = "";
      words.forEach((word) => {
        if ((currentLine + " " + word).length > charsPerLine) {
          allLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = currentLine ? currentLine + " " + word : word;
        }
      });
      if (currentLine) {
        allLines.push(currentLine);
      }
    });

    const pages: string[] = [];
    
    // Page 1
    pages.push(allLines.slice(0, maxLinesPage1).join("\n"));
    
    // Page 2 and subsequent pages
    let remainingLines = allLines.slice(maxLinesPage1);
    while (remainingLines.length > 0) {
      pages.push(remainingLines.slice(0, maxLinesPage2).join("\n"));
      remainingLines = remainingLines.slice(maxLinesPage2);
    }

    // Ensure we always have at least 2 pages (so date and signature are on Page 2)
    if (pages.length < 2) {
      pages.push("");
    }
    
    return pages;
  };

  const downloadLetterPdf = async () => {
    if (!activeLetter) return;
    
    // Get sender and recipient names with smart fallbacks
    let senderNameRaw = profiles.find(p => p.id === activeLetter.senderId)?.name;
    let recipientNameRaw = profiles.find(p => p.id === activeLetter.recipientId)?.name;
    
    const senderIdLower = activeLetter.senderId?.toLowerCase();
    const recipientIdLower = activeLetter.recipientId?.toLowerCase();
    
    if (!senderNameRaw) {
      if (senderIdLower === "sanjay" || recipientIdLower === "divya") {
        senderNameRaw = "Sanjay M";
      } else if (senderIdLower === "divya" || recipientIdLower === "sanjay") {
        senderNameRaw = "Divya Bharathi S";
      } else {
        senderNameRaw = "Partner";
      }
    }
    
    if (!recipientNameRaw) {
      if (recipientIdLower === "divya" || senderIdLower === "sanjay") {
        recipientNameRaw = "Divya Bharathi S";
      } else if (recipientIdLower === "sanjay" || senderIdLower === "divya") {
        recipientNameRaw = "Sanjay M";
      } else {
        recipientNameRaw = "Partner";
      }
    }
    
    // Clean name formatting for love letters
    const senderName = (senderNameRaw === "Sanjay M" || senderNameRaw === "Sanjay")
      ? "Sanjay"
      : (senderNameRaw === "Divya Bharathi S" || senderNameRaw === "Divya Bharathi")
        ? "Divya Bharathi"
        : senderNameRaw;
        
    const recipientName = (recipientNameRaw === "Divya Bharathi S" || recipientNameRaw === "Divya Bharathi")
      ? "Divya Bharathi"
      : (recipientNameRaw === "Sanjay M" || recipientNameRaw === "Sanjay")
        ? "Sanjay"
        : recipientNameRaw;
    
    // Get date
    const date = activeLetter.createdAt 
      ? new Date((activeLetter.createdAt.seconds || Date.now() / 1000) * 1000)
      : new Date();
    const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    
    // Preload background images to ensure they render in html-to-image
    const bgImgVersion = "1.0.4";
    const bgImages = [
      `/love_letter_bg_1.jpg?v=${bgImgVersion}`,
      `/love_letter_bg_2.jpg?v=${bgImgVersion}`,
      `/stamp.png?v=${bgImgVersion}`
    ];
    if (activeLetter.signature) {
      bgImages.push(activeLetter.signature);
    }
    
    // Add attachments to preloader
    activeLetter.attachments?.forEach((a: any) => {
      bgImages.push(a.src);
    });
    
    await preloadImages(bgImages);
    
    // Split the text into lines first to check the total count
    const allLines = getLinesOfText(activeLetter.content);
    const totalLines = allLines.length;
    let pagesContent: string[] = [];

    if (totalLines < 15) {
      // 1-page PDF: Page 1 gets all lines, signature and date are also on Page 1
      pagesContent.push(allLines.join("\n"));
    } else {
      // Multi-page PDF: Page 1 has 19 lines, subsequent non-final pages have 27 lines, final page has 18 lines
      let remaining = [...allLines];
      pagesContent.push(remaining.splice(0, 19).join("\n"));
      
      while (remaining.length > 0) {
        if (remaining.length <= 18) {
          pagesContent.push(remaining.splice(0, 18).join("\n"));
        } else {
          pagesContent.push(remaining.splice(0, 27).join("\n"));
        }
      }
      
      if (pagesContent.length < 2) {
        pagesContent.push("");
      }
    }
    
    // Create temporary container
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    tempContainer.style.width = "800px";
    document.body.appendChild(tempContainer);
    
    try {
      const pdf = new jsPDF("p", "pt", "a4");
      const pdfWidth = 595.28;
      const pdfHeight = 841.89;
      
      for (let i = 0; i < pagesContent.length; i++) {
        const pageDiv = document.createElement("div");
        pageDiv.style.position = "relative";
        pageDiv.style.width = "800px";
        pageDiv.style.height = "1130px";
        pageDiv.style.backgroundColor = "#f2eeeb";
        pageDiv.style.overflow = "hidden";
        pageDiv.style.boxSizing = "border-box";
        let bgImg = `/love_letter_bg_2.jpg?v=${bgImgVersion}`; // Default page 2 (blank)
        if (i === 0) {
          bgImg = `/love_letter_bg_1.jpg?v=${bgImgVersion}`; // Page 1
        }
        
        // Append background image as an absolute img element to ensure precise positioning & prevent shift in html-to-image
        const bgImgEl = document.createElement("img");
        bgImgEl.src = bgImg;
        bgImgEl.style.position = "absolute";
        bgImgEl.style.left = "0px";
        bgImgEl.style.top = "0px";
        bgImgEl.style.width = "800px";
        bgImgEl.style.height = "1130px";
        bgImgEl.style.zIndex = "0";
        pageDiv.appendChild(bgImgEl);
        
        // Add names only on Page 1 next to the red lines (positioned precisely over the lines)
        if (i === 0) {
          const toDiv = document.createElement("div");
          toDiv.style.position = "absolute";
          toDiv.style.left = "165px";
          toDiv.style.top = "328px"; // Baseline sits right on TO line (Y = 361px)
          toDiv.style.fontFamily = "'Great Vibes', 'Brush Script MT', cursive";
          toDiv.style.fontSize = "28px";
          toDiv.style.color = "#c44d4d";
          toDiv.style.lineHeight = "1";
          toDiv.style.whiteSpace = "nowrap";
          toDiv.style.zIndex = "1";
          toDiv.innerText = recipientName;
          pageDiv.appendChild(toDiv);
          
          const fromDiv = document.createElement("div");
          fromDiv.style.position = "absolute";
          fromDiv.style.left = "195px";
          fromDiv.style.top = "390px"; // Baseline sits right on FROM line (Y = 423px)
          fromDiv.style.fontFamily = "'Great Vibes', 'Brush Script MT', cursive";
          fromDiv.style.fontSize = "28px";
          fromDiv.style.color = "#c44d4d";
          fromDiv.style.lineHeight = "1";
          fromDiv.style.whiteSpace = "nowrap";
          fromDiv.style.zIndex = "1";
          fromDiv.innerText = senderName;
          pageDiv.appendChild(fromDiv);
        }
        
        // Add content (Page 1 starts below headers, Page 2 starts near top)
        const contentDiv = document.createElement("div");
        contentDiv.style.position = "absolute";
        contentDiv.style.left = "180px";
        contentDiv.style.top = i === 0 ? "485px" : "165px";
        contentDiv.style.width = "440px";
        contentDiv.style.height = i === 0 ? "560px" : "820px";
        contentDiv.style.fontFamily = "'Outfit', sans-serif";
        contentDiv.style.fontSize = "14.5px";
        contentDiv.style.lineHeight = "29.5px";
        contentDiv.style.color = "#000000"; // Black font as requested
        contentDiv.style.textAlign = "left";
        contentDiv.style.whiteSpace = "pre-wrap";
        contentDiv.style.wordBreak = "break-word";
        contentDiv.style.zIndex = "1";
        
        // Add thin black ruled notebook lines to align with the text spacing (first page gets full/longer lines, final page gets capped lines)
        const lineCount = pagesContent[i].split("\n").length;
        let lineLimit = lineCount;
        
        if (i === 0) {
          if (pagesContent.length > 1) {
            lineLimit = 19; // Multi-page: fill entire page 1 content area (19 lines)
          } else {
            lineLimit = 14; // Single-page: fill space above signature (14 lines)
          }
        } else {
          if (i < pagesContent.length - 1) {
            lineLimit = 27; // Non-final page: fill entire page content area (27 lines)
          } else {
            lineLimit = lineCount; // Final page: cap at actual text height to prevent overlap with signature
          }
        }
        
        contentDiv.style.backgroundImage = `repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 28.5px,
          rgba(0, 0, 0, 0.12) 28.5px,
          rgba(0, 0, 0, 0.12) 29.5px
        )`;
        contentDiv.style.backgroundSize = `100% ${lineLimit * 29.5}px`;
        contentDiv.style.backgroundRepeat = "no-repeat";
        contentDiv.style.backgroundAttachment = "local";
        
        // Render formatted HTML (to support marker highlights!)
        const formattedHTML = renderFormattedContent(pagesContent[i]).__html;
        contentDiv.innerHTML = formattedHTML;
        pageDiv.appendChild(contentDiv);
        
        // Add attachments for this page (positioned dynamically next to the exact line of text)
        activeLetter.attachments?.forEach((a: any) => {
          const totalLines = allLines.length;
          const editorRows = Math.max(6, totalLines);
          const targetLine = Math.min(
            Math.max(0, totalLines - 1),
            Math.round((a.y / 100) * editorRows)
          );
          
          // Find which page this line belongs to
          let lineAccumulator = 0;
          let targetPageIdx = 0;
          let relativeLineIdx = 0;
          
          for (let pIdx = 0; pIdx < pagesContent.length; pIdx++) {
            const pageLineCount = pagesContent[pIdx].split("\n").length;
            if (targetLine >= lineAccumulator && targetLine < lineAccumulator + pageLineCount) {
              targetPageIdx = pIdx;
              relativeLineIdx = targetLine - lineAccumulator;
              break;
            }
            // Fallback for edge cases where targetLine is exactly the total length or out of bounds
            if (pIdx === pagesContent.length - 1 && targetLine >= lineAccumulator) {
              targetPageIdx = pIdx;
              relativeLineIdx = Math.min(pageLineCount - 1, targetLine - lineAccumulator);
            }
            lineAccumulator += pageLineCount;
          }
          
          if (targetPageIdx === i) {
            const attImg = document.createElement("img");
            attImg.style.position = "absolute";
            
            const imageWidth = a.width || 80;
            const contentTop = i === 0 ? 485 : 165;
            let topOffset = contentTop + (relativeLineIdx * 29.5);
            
            // Clamp top and left coordinates to keep them safely within page & margins
            const maxTop = i === 0 ? 1000 : 960;
            topOffset = Math.max(contentTop, Math.min(maxTop, topOffset));
            
            let leftOffset = 180 + (a.x / 100) * 440;
            leftOffset = Math.max(180, Math.min(620 - imageWidth, leftOffset));
            
            attImg.style.left = `${leftOffset}px`;
            attImg.style.top = `${topOffset}px`;
            attImg.style.width = `${imageWidth}px`;
            attImg.style.height = "auto";
            attImg.style.objectFit = "contain";
            attImg.style.borderRadius = "4px";
            attImg.style.border = "1px solid #EADEC9";
            attImg.style.boxShadow = "0 4px 6px rgba(0,0,0,0.15)";
            attImg.src = a.src;
            attImg.style.zIndex = "1";
            pageDiv.appendChild(attImg);
          }
        });
        
        // Add date and signature on final page
        if (i === pagesContent.length - 1) {
          // Render the transparent postmark stamp on the final page (bottom-left, moved further left & increased size)
          const stampImg = document.createElement("img");
          stampImg.src = "/stamp.png";
          stampImg.style.position = "absolute";
          stampImg.style.left = "90px";
          stampImg.style.bottom = "65px";
          stampImg.style.width = "280px";
          stampImg.style.height = "200px";
          stampImg.style.objectFit = "contain";
          stampImg.style.zIndex = "1";
          pageDiv.appendChild(stampImg);

          // Render date centered in the right column (moved further right & increased size)
          const dateDiv = document.createElement("div");
          dateDiv.style.position = "absolute";
          dateDiv.style.left = "460px";
          dateDiv.style.width = "240px";
          dateDiv.style.bottom = "90px";
          dateDiv.style.fontFamily = "'Playfair Display', Georgia, serif";
          dateDiv.style.fontSize = "26px";
          dateDiv.style.fontStyle = "italic";
          dateDiv.style.color = "#c44d4d";
          dateDiv.style.fontWeight = "bold";
          dateDiv.style.textAlign = "center";
          dateDiv.style.zIndex = "1";
          dateDiv.innerText = formattedDate;
          pageDiv.appendChild(dateDiv);
          
          if (activeLetter.signature) {
            // Render dynamic salutation centered in the right column (increased size)
            const lovSigDiv = document.createElement("div");
            lovSigDiv.style.position = "absolute";
            lovSigDiv.style.left = "460px";
            lovSigDiv.style.width = "240px";
            lovSigDiv.style.bottom = "120px";
            lovSigDiv.style.fontFamily = "'Outfit', sans-serif";
            lovSigDiv.style.fontSize = "16px";
            lovSigDiv.style.fontWeight = "bold";
            lovSigDiv.style.color = "#c44d4d";
            lovSigDiv.style.letterSpacing = "0.1em";
            lovSigDiv.style.textAlign = "center";
            lovSigDiv.style.zIndex = "1";
            lovSigDiv.innerText = (activeLetter.salutation || "Your Lovely").toUpperCase();
            pageDiv.appendChild(lovSigDiv);

            // Render signature image centered in the right column (moved further right & increased size)
            const sigWrapper = document.createElement("div");
            sigWrapper.style.position = "absolute";
            sigWrapper.style.left = "460px";
            sigWrapper.style.width = "240px";
            sigWrapper.style.bottom = "140px";
            sigWrapper.style.height = "90px";
            sigWrapper.style.display = "flex";
            sigWrapper.style.justifyContent = "center";
            sigWrapper.style.alignItems = "center";
            sigWrapper.style.zIndex = "1";

            const sigImg = document.createElement("img");
            sigImg.style.height = "90px";
            sigImg.style.maxWidth = "100%";
            sigImg.style.objectFit = "contain";
            sigImg.style.filter = "brightness(0)";
            sigImg.src = activeLetter.signature;
            sigWrapper.appendChild(sigImg);
            
            pageDiv.appendChild(sigWrapper);
          } else {
            // Render default printed signature in HTML centered in the right column (increased size)
            const partSigDiv = document.createElement("div");
            partSigDiv.style.position = "absolute";
            partSigDiv.style.left = "460px";
            partSigDiv.style.width = "240px";
            partSigDiv.style.bottom = "140px";
            partSigDiv.style.fontFamily = "'Great Vibes', 'Brush Script MT', cursive";
            partSigDiv.style.fontSize = "54px";
            partSigDiv.style.color = "#c44d4d";
            partSigDiv.style.lineHeight = "1";
            partSigDiv.style.textAlign = "center";
            partSigDiv.style.zIndex = "1";
            partSigDiv.innerText = "Partner";
            pageDiv.appendChild(partSigDiv);
            
            const lovSigDiv = document.createElement("div");
            lovSigDiv.style.position = "absolute";
            lovSigDiv.style.left = "460px";
            lovSigDiv.style.width = "240px";
            lovSigDiv.style.bottom = "120px";
            lovSigDiv.style.fontFamily = "'Outfit', sans-serif";
            lovSigDiv.style.fontSize = "16px";
            lovSigDiv.style.fontWeight = "bold";
            lovSigDiv.style.color = "#c44d4d";
            lovSigDiv.style.letterSpacing = "0.1em";
            lovSigDiv.style.textAlign = "center";
            lovSigDiv.style.zIndex = "1";
            lovSigDiv.innerText = (activeLetter.salutation || "YOUR'S LOVINGLY").toUpperCase();
            pageDiv.appendChild(lovSigDiv);
          }
        }
        
        tempContainer.appendChild(pageDiv);
        
        const dataUrl = await toJpeg(pageDiv, {
          cacheBust: true,
          backgroundColor: "#f2eeeb",
          pixelRatio: 2, // 2x ratio is extremely crisp for printing/viewing while dramatically reducing size
          quality: 0.85, // 85% quality JPEGs compress much better than lossless PNGs
        });
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      }
      
      pdf.save(`Letter-${activeLetter?.id || "memory"}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      document.body.removeChild(tempContainer);
    }
  };

  // Fetch letters from Firestore
  const fetchLetters = async () => {
    setPageState("loading-visit");
    try {
      const q = query(collection(db, "letters"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetched: Letter[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetched.push({
          id: doc.id,
          content: data.content,
          signature: data.signature || null,
          createdAt: data.createdAt,
          attachments: data.attachments || [],
          isEternal: true,
          recipientId: data.recipientId || "",
          senderId: data.senderId || "",
          textareaRows: data.textareaRows || 6,
        });
      });
      const localMails = JSON.parse(localStorage.getItem("local_letters") || "[]");
      const merged = [...fetched];
      localMails.forEach((local: any) => {
        if (!merged.some(m => m.id === local.id)) {
          merged.push({
            ...local,
            isEternal: true,
          });
        }
      });
      setLetters(merged);
      setCurrentPage(0);
      setPageState("visit");
    } catch (error) {
      console.error("Error fetching letters from Firestore:", error);
      const localMails = JSON.parse(localStorage.getItem("local_letters") || "[]");
      setLetters(localMails);
      setCurrentPage(0);
      setPageState("visit");
    } finally {
      setIsInitialLoadDone(true);
    }
  };

  // Submit letter to Firestore
  const handleLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterContent.trim()) return;

    const textarea = document.getElementById("letter-textarea") as HTMLTextAreaElement;
    const actualRows = textarea 
      ? Math.round(textarea.scrollHeight / 29.5) 
      : Math.max(textareaRows, letterContent.split("\n").length);

    setFormState("loading");
    try {
      if (editingLetterId) {
        if (editingLetterId.startsWith("local-")) {
          const localMails = JSON.parse(localStorage.getItem("local_letters") || "[]");
          const updated = localMails.map((m: any) => m.id === editingLetterId ? {
            ...m,
            content: letterContent,
            signature: signatureUrl,
            attachments: attachments,
            salutation: salutation,
            isEternal: true,
            recipientId: recipientId,
            textareaRows: actualRows,
          } : m);
          localStorage.setItem("local_letters", JSON.stringify(updated));
        } else {
          await updateDoc(doc(db, "letters", editingLetterId), {
            content: letterContent,
            signature: signatureUrl,
            attachments: attachments,
            salutation: salutation,
            isEternal: true,
            recipientId: recipientId,
            textareaRows: actualRows,
          });
        }
      } else {
        await addDoc(collection(db, "letters"), {
          content: letterContent,
          signature: signatureUrl,
          attachments: attachments,
          salutation: salutation,
          isEternal: true,
          recipientId: recipientId,
          senderId: loggedInUser?.id || "",
          createdAt: new Date(),
          textareaRows: actualRows,
        });
      }

      setFormState("success");
      // Clean up states after success delay
      setTimeout(() => {
        setOpenWritePopover(false);
        setFormState("idle");
        setLetterContent("");
        setSignatureUrl(localStorage.getItem("default_signature") || null);
        setAttachments([]);
        if (editingLetterId) {
          setPageState("visit");
        }
        setEditingLetterId(null);
        setIsEternalComposer(true);
        setRecipientId("");
        setTextareaRows(6);
        // Refresh letters if they've visited previously
        fetchLetters();
      }, 3500);
    } catch (error) {
      console.error("Error writing letter to Firestore:", error);
      alert("Failed to send letter to the database. Storing locally instead.");
      
      // Local storage fallback so the app works under any condition
      const localMails = JSON.parse(localStorage.getItem("local_letters") || "[]");
      if (editingLetterId) {
        const updated = localMails.map((m: any) => m.id === editingLetterId ? {
          ...m,
          content: letterContent,
          signature: signatureUrl,
          attachments: attachments,
          salutation: salutation,
          isEternal: true,
          recipientId: recipientId,
          textareaRows: actualRows,
        } : m);
        localStorage.setItem("local_letters", JSON.stringify(updated));
      } else {
        localMails.unshift({
          id: `local-${Date.now()}`,
          content: letterContent,
          signature: signatureUrl,
          attachments: attachments,
          salutation: salutation,
          isEternal: true,
          recipientId: recipientId,
          senderId: loggedInUser?.id || "",
          createdAt: { seconds: Date.now() / 1000 },
          textareaRows: actualRows,
        });
        localStorage.setItem("local_letters", JSON.stringify(localMails));
      }

      setFormState("success");
      setTimeout(() => {
        setOpenWritePopover(false);
        setFormState("idle");
        setLetterContent("");
        setSignatureUrl(localStorage.getItem("default_signature") || null);
        setAttachments([]);
        if (editingLetterId) {
          setPageState("visit");
        }
        setEditingLetterId(null);
        setSalutation(localStorage.getItem("default_salutation") || "Your Lovely");
        setIsEternalComposer(true);
        setRecipientId("");
        setTextareaRows(6);
        fetchLetters();
      }, 3500);
    }
  };

  const dynamicPopoverWidth = "512px";
  // Dynamically increase height based on rows added
  const dynamicPopoverHeight = `${Math.min(620, 430 + (textareaRows - 6) * 24)}px`;

  if (isPageLoading) {
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
              Opening Mailbox...
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
    <main className="relative min-h-screen w-full bg-gradient-to-b from-[#0a0a16] via-[#05050e] to-[#010105] text-white overflow-x-hidden flex flex-col items-center justify-center p-4">
      {/* Starry Twinkling Background Style */}
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        .star-item {
          animation: twinkle var(--duration, 3s) infinite ease-in-out;
        }

        /* Custom scrollbar for ivory paper */
        .paper-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .paper-scrollbar::-webkit-scrollbar-track {
          background: #FCFBF9;
          border-radius: 8px;
        }
        .paper-scrollbar::-webkit-scrollbar-thumb {
          background: #EADEC9;
          border-radius: 8px;
          border: 2px solid #FCFBF9;
        }
        .paper-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1C5B2;
        }
        .paper-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #EADEC9 #FCFBF9;
        }

        /* Marker highlights */
        .hl-yellow {
          background-color: rgba(250, 240, 137, 0.7);
          padding: 0 4px;
          border-radius: 4px;
          mix-blend-mode: multiply;
        }
        .hl-pink {
          background-color: rgba(246, 173, 198, 0.7);
          padding: 0 4px;
          border-radius: 4px;
          mix-blend-mode: multiply;
        }
        .hl-green {
          background-color: rgba(154, 230, 180, 0.7);
          padding: 0 4px;
          border-radius: 4px;
          mix-blend-mode: multiply;
        }
        .hl-blue {
          background-color: rgba(144, 205, 244, 0.7);
          padding: 0 4px;
          border-radius: 4px;
          mix-blend-mode: multiply;
        }

        /* Editor Highlight Overrides for Readability */
        #letter-textarea .hl-yellow,
        #letter-textarea .hl-pink,
        #letter-textarea .hl-green,
        #letter-textarea .hl-blue {
          mix-blend-mode: normal !important;
          color: #0c0c0c !important;
        }
        #letter-textarea .hl-yellow {
          background-color: rgba(250, 240, 137, 0.95) !important;
        }
        #letter-textarea .hl-pink {
          background-color: rgba(246, 173, 198, 0.95) !important;
        }
        #letter-textarea .hl-green {
          background-color: rgba(154, 230, 180, 0.95) !important;
        }
        #letter-textarea .hl-blue {
          background-color: rgba(144, 205, 244, 0.95) !important;
        }
      `}</style>

      {/* Stars render */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {stars.map((star, i) => (
          <div
            key={i}
            className="star-item absolute bg-white rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: 0.5,
              // @ts-ignore
              "--duration": `${star.duration}s`,
            }}
          />
        ))}
        {/* Soft pink/purple ambient light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Top Left Back Home Button (when not logged in) */}
      {!loggedInUser && (
        loginState === "select-profile" ? (
          <Link 
            href="/"
            className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition duration-200 z-50 font-outfit"
          >
            <ArrowLeft size={16} />
            Back Home
          </Link>
        ) : (
          <button 
            type="button"
            onClick={() => {
              setLoginState("select-profile");
              setLoginPasswordInput("");
              setLoginPasswordError("");
              setMasterPasswordInput("");
              setMasterPasswordError("");
              setTempNewPassword("");
            }}
            className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition duration-200 z-50 font-outfit cursor-pointer bg-transparent border-none outline-none"
          >
            <ArrowLeft size={16} />
            Back to Profiles
          </button>
        )
      )}

      {/* Top Header Bar */}
      {loggedInUser && (
        <div className="absolute top-4 sm:top-6 left-4 sm:left-8 right-4 sm:right-8 flex items-center justify-between z-50 pointer-events-none">
          <div className="pointer-events-auto">
            {pageState === "landing" ? (
              <button 
                onClick={() => {
                  setLoggedInUser(null);
                  setLoginState("select-profile");
                  sessionStorage.removeItem("logged_in_user_id");
                }}
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition duration-200 font-outfit cursor-pointer bg-transparent border-none outline-none"
              >
                <ArrowLeft size={16} />
                Back to Profiles
              </button>
            ) : (
              <button 
                onClick={() => {
                  setPageState("landing");
                  setIsViewOnlyMode(false);
                }}
                className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition duration-200 font-outfit cursor-pointer bg-transparent border-none outline-none"
              >
                <ArrowLeft size={16} />
                Back to Mailbox
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 pointer-events-auto">
            <ProfileCard
              imageSrc={loggedInUser.avatarUrl}
              name={loggedInUser.name}
              role={loggedInUser.title}
              socials={{ github: loggedInUser.socials?.github }}
              avatarAdjust={loggedInUser.avatarAdjust}
              onClick={() => setIsDetailedCardOpen(true)}
            />
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center justify-center min-h-[90vh]">
        {!loggedInUser && (
          <div className="w-full flex flex-col items-center justify-center relative">

            {loginState === "select-profile" && (
              <ProfileSelector
                title="Who is composing?"
                profiles={[
                  ...profiles.map(p => ({
                    id: p.id,
                    label: p.name,
                    icon: (
                      <img
                        src={p.avatarUrl}
                        alt={`${p.name} profile`}
                        className="h-full w-full object-cover"
                        style={{
                          transform: `scale(${p.avatarAdjust?.scale || 1}) translate(${p.avatarAdjust?.x || 0}px, ${p.avatarAdjust?.y || 0}px)`,
                          transformOrigin: "center center",
                        }}
                      />
                    ),
                  })),
                  {
                    id: "add",
                    label: "Add",
                    icon: (
                      <ProfileIcon className="bg-neutral-850 hover:bg-neutral-800 border border-dashed border-neutral-700 rounded-full h-full w-full flex items-center justify-center transition-colors">
                        <Plus className="h-12 w-12 text-neutral-400 group-hover:text-white" />
                      </ProfileIcon>
                    )
                  }
                ]}
                onProfileSelect={(id) => {
                  if (id === "add") {
                    setLoginState("master-password");
                    setMasterPasswordInput("");
                    setMasterPasswordError("");
                  } else {
                    setSelectedProfileId(id);
                    const profile = profiles.find(p => p.id === id);
                    if (profile) {
                      const sessionKey = `session_expiry_${profile.id}`;
                      const expiryTimeStr = localStorage.getItem(sessionKey);
                      const now = Date.now();
                      
                      if (expiryTimeStr && parseInt(expiryTimeStr, 10) > now) {
                        // Session is active! Bypass password
                        setLoggedInUser(profile);
                        sessionStorage.setItem("logged_in_user_id", profile.id);
                      } else {
                        // No active session or expired, ask password
                        if (!profile.password) {
                          setLoginState("set-password-enter");
                          setTempNewPassword("");
                        } else {
                          setLoginState("enter-password");
                          setLoginPasswordInput("");
                          setLoginPasswordError("");
                        }
                      }
                    }
                  }
                }}
                className="bg-transparent"
              />
            )}

            {loginState === "enter-password" && (
              <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-6 bg-neutral-900/90 border border-neutral-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-purple-500/20 p-0.5 overflow-hidden mb-2 relative">
                    <img 
                      src={profiles.find(p => p.id === selectedProfileId)?.avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                      style={{
                        transform: `scale(${profiles.find(p => p.id === selectedProfileId)?.avatarAdjust?.scale || 1}) translate(${profiles.find(p => p.id === selectedProfileId)?.avatarAdjust?.x || 0}px, ${profiles.find(p => p.id === selectedProfileId)?.avatarAdjust?.y || 0}px)`,
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                  <h2 className="text-xl font-bold font-playfair text-white">
                    Welcome Back, {profiles.find(p => p.id === selectedProfileId)?.name}
                  </h2>
                  <p className="text-xs text-neutral-400 font-outfit">
                    Enter your password to unlock the Mailbox.
                  </p>
                </div>

                 <form onSubmit={async (e) => {
                  e.preventDefault();
                  const profile = profiles.find(p => p.id === selectedProfileId);
                  if (profile) {
                    const hashedInput = await hashPassword(loginPasswordInput);
                    const isMatch = profile.password === hashedInput || profile.password === loginPasswordInput;
                    if (isMatch) {
                      // Migrate to hash if it was plaintext
                      if (profile.password === loginPasswordInput) {
                        profile.password = hashedInput;
                        await setDoc(doc(db, "profiles", profile.id), { password: hashedInput }, { merge: true }).catch(console.error);
                      }
                      setLoggedInUser(profile);
                      sessionStorage.setItem("logged_in_user_id", profile.id);
                      localStorage.setItem(`session_expiry_${profile.id}`, (Date.now() + 5 * 60 * 1000).toString());
                      setLoginPasswordInput("");
                      setLoginPasswordError("");
                    } else {
                      setLoginPasswordError("Incorrect password. Please try again.");
                    }
                  } else {
                    setLoginPasswordError("Incorrect password. Please try again.");
                  }
                }} className="w-full space-y-4">
                  <div className="relative h-[52px] w-full rounded-xl border border-neutral-800 bg-neutral-950 flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPasswordInput}
                      onChange={(e) => setLoginPasswordInput(e.target.value)}
                      className="h-full w-full rounded-xl bg-transparent pl-4 pr-12 py-3 tracking-[0.4em] outline-none text-white font-mono text-sm"
                      placeholder="Password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-neutral-400 hover:text-white cursor-pointer select-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginPasswordError && (
                    <p className="text-xs text-red-400 font-outfit text-center animate-pulse">
                      {loginPasswordError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition font-outfit uppercase tracking-wider"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginState("select-profile");
                      setLoginPasswordInput("");
                      setLoginPasswordError("");
                    }}
                    className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 font-outfit cursor-pointer transition mt-2"
                  >
                    Back to Profiles
                  </button>
                </form>
              </div>
            )}

            {loginState === "set-password-enter" && (
              <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-6 bg-neutral-900/90 border border-neutral-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-purple-500/20 p-0.5 overflow-hidden mb-2 relative">
                    <img 
                      src={profiles.find(p => p.id === selectedProfileId)?.avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                      style={{
                        transform: `scale(${profiles.find(p => p.id === selectedProfileId)?.avatarAdjust?.scale || 1}) translate(${profiles.find(p => p.id === selectedProfileId)?.avatarAdjust?.x || 0}px, ${profiles.find(p => p.id === selectedProfileId)?.avatarAdjust?.y || 0}px)`,
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                  <h2 className="text-xl font-bold font-playfair text-white">
                    Set Password for {profiles.find(p => p.id === selectedProfileId)?.name}
                  </h2>
                  <p className="text-xs text-neutral-400 font-outfit max-w-xs">
                    No password has been configured for this profile yet. Please enter a password.
                  </p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!tempNewPassword.trim()) return;
                  setLoginState("set-password-confirm");
                }} className="w-full space-y-4">
                  <div className="relative h-[52px] w-full rounded-xl border border-neutral-800 bg-neutral-950 flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={tempNewPassword}
                      onChange={(e) => setTempNewPassword(e.target.value)}
                      className="h-full w-full rounded-xl bg-transparent pl-4 pr-12 py-3 tracking-[0.4em] outline-none text-white font-mono text-sm"
                      placeholder="New Password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-neutral-400 hover:text-white cursor-pointer select-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!tempNewPassword.trim()}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition font-outfit uppercase tracking-wider"
                  >
                    Continue to Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginState("select-profile");
                      setTempNewPassword("");
                    }}
                    className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 font-outfit cursor-pointer transition mt-2"
                  >
                    Back to Profiles
                  </button>
                </form>
              </div>
            )}

            {loginState === "set-password-confirm" && (
              <AssistedPasswordConfirmation
                password={tempNewPassword}
                onSuccess={async () => {
                  const hashedPassword = await hashPassword(tempNewPassword);
                  const updated = profiles.map(p => 
                    p.id === selectedProfileId ? { ...p, password: hashedPassword } : p
                  );
                  setProfiles(updated);
                  localStorage.setItem("user_profiles", JSON.stringify(updated));
                  if (selectedProfileId) {
                    setDoc(doc(db, "profiles", selectedProfileId), { password: hashedPassword }, { merge: true }).catch(console.error);
                  }
                  const activeP = updated.find(p => p.id === selectedProfileId);
                  if (activeP) {
                    setLoggedInUser(activeP);
                    sessionStorage.setItem("logged_in_user_id", activeP.id);
                    localStorage.setItem(`session_expiry_${activeP.id}`, (Date.now() + 5 * 60 * 1000).toString());
                  }
                  setLoginState("select-profile");
                  setTempNewPassword("");
                }}
                onCancel={() => {
                  setLoginState("set-password-enter");
                }}
              />
            )}

            {loginState === "master-password" && (
              <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-6 bg-neutral-900/90 border border-neutral-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h2 className="text-xl font-bold font-playfair text-white">
                    Authorized Access Only
                  </h2>
                  <p className="text-xs text-neutral-400 font-outfit">
                    Enter the system master password to add a new user profile.
                  </p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setMasterPasswordError("");
                  const isValid = await validateMasterPasswordInFirebase(masterPasswordInput);
                  if (isValid) {
                    setLoginState("add-profile");
                    setMasterPasswordInput("");
                    setMasterPasswordError("");
                    setNewProfileName("");
                    setNewProfileTitle("");
                    setNewProfileBio("");
                    setNewProfileAvatar("");
                    setNewProfilePassword("");
                    setIsNewProfileConfirming(false);
                    setNewProfileGithub("");
                    setNewProfileLinkedin("");
                    setNewProfileTwitter("");
                  } else {
                    setMasterPasswordError("Incorrect master password.");
                  }
                }} className="w-full space-y-4">
                  <div className="relative h-[52px] w-full rounded-xl border border-neutral-800 bg-neutral-950 flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={masterPasswordInput}
                      onChange={(e) => setMasterPasswordInput(e.target.value)}
                      className="h-full w-full rounded-xl bg-transparent pl-4 pr-12 py-3 tracking-[0.4em] outline-none text-white font-mono text-sm"
                      placeholder="Master Password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-neutral-400 hover:text-white cursor-pointer select-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {masterPasswordError && (
                    <p className="text-xs text-red-400 font-outfit text-center animate-pulse">
                      {masterPasswordError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition font-outfit uppercase tracking-wider"
                  >
                    Authenticate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginState("select-profile");
                      setMasterPasswordInput("");
                      setMasterPasswordError("");
                    }}
                    className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 font-outfit cursor-pointer transition mt-2"
                  >
                    Back to Profiles
                  </button>
                </form>
              </div>
            )}

            {loginState === "reset-password-master" && (
              <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-6 bg-neutral-900/90 border border-neutral-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h2 className="text-xl font-bold font-playfair text-white">
                    Reset Profile Password
                  </h2>
                  <p className="text-xs text-neutral-400 font-outfit">
                    Enter the system master password to reset the password for {profiles.find(p => p.id === selectedProfileId)?.name}.
                  </p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setMasterPasswordError("");
                  const isValid = await validateMasterPasswordInFirebase(masterPasswordInput);
                  if (isValid) {
                    setLoginState("reset-password-new");
                    setMasterPasswordInput("");
                    setMasterPasswordError("");
                    setTempNewPassword("");
                  } else {
                    setMasterPasswordError("Incorrect master password.");
                  }
                }} className="w-full space-y-4">
                  <div className="relative h-[52px] w-full rounded-xl border border-neutral-800 bg-neutral-950 flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={masterPasswordInput}
                      onChange={(e) => setMasterPasswordInput(e.target.value)}
                      className="h-full w-full rounded-xl bg-transparent pl-4 pr-12 py-3 tracking-[0.4em] outline-none text-white font-mono text-sm"
                      placeholder="Master Password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-neutral-400 hover:text-white cursor-pointer select-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {masterPasswordError && (
                    <p className="text-xs text-red-400 font-outfit text-center animate-pulse">
                      {masterPasswordError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition font-outfit uppercase tracking-wider"
                  >
                    Verify Master Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginState("enter-password");
                      setMasterPasswordInput("");
                      setMasterPasswordError("");
                    }}
                    className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 font-outfit cursor-pointer transition mt-2"
                  >
                    Back to Password Prompt
                  </button>
                </form>
              </div>
            )}

            {loginState === "reset-password-new" && (
              <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center gap-6 bg-neutral-900/90 border border-neutral-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-purple-500/20 p-0.5 overflow-hidden mb-2 relative">
                    <img 
                      src={profiles.find(p => p.id === selectedProfileId)?.avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                      style={{
                        transform: `scale(${profiles.find(p => p.id === selectedProfileId)?.avatarAdjust?.scale || 1}) translate(${profiles.find(p => p.id === selectedProfileId)?.avatarAdjust?.x || 0}px, ${profiles.find(p => p.id === selectedProfileId)?.avatarAdjust?.y || 0}px)`,
                        transformOrigin: "center center",
                      }}
                    />
                  </div>
                  <h2 className="text-xl font-bold font-playfair text-white">
                    Set New Password
                  </h2>
                  <p className="text-xs text-neutral-400 font-outfit">
                    Enter the new password for {profiles.find(p => p.id === selectedProfileId)?.name}.
                  </p>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!tempNewPassword.trim()) return;
                  
                  const hashedPassword = await hashPassword(tempNewPassword);
                  const updated = profiles.map(p => 
                    p.id === selectedProfileId ? { ...p, password: hashedPassword } : p
                  );
                  setProfiles(updated);
                  localStorage.setItem("user_profiles", JSON.stringify(updated));
                  if (selectedProfileId) {
                    setDoc(doc(db, "profiles", selectedProfileId), { password: hashedPassword }, { merge: true }).catch(console.error);
                  }
                  
                  const activeP = updated.find(p => p.id === selectedProfileId);
                  if (activeP) {
                    setLoggedInUser(activeP);
                    sessionStorage.setItem("logged_in_user_id", activeP.id);
                    localStorage.setItem(`session_expiry_${activeP.id}`, (Date.now() + 5 * 60 * 1000).toString());
                  }
                  setLoginState("select-profile");
                  setTempNewPassword("");
                }} className="w-full space-y-4">
                  <div className="relative h-[52px] w-full rounded-xl border border-neutral-800 bg-neutral-950 flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={tempNewPassword}
                      onChange={(e) => setTempNewPassword(e.target.value)}
                      className="h-full w-full rounded-xl bg-transparent pl-4 pr-12 py-3 tracking-[0.4em] outline-none text-white font-mono text-sm"
                      placeholder="New Password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-neutral-400 hover:text-white cursor-pointer select-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!tempNewPassword.trim()}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition font-outfit uppercase tracking-wider"
                  >
                    Reset Password & Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginState("select-profile");
                      setTempNewPassword("");
                    }}
                    className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 font-outfit cursor-pointer transition mt-2"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}

            {loginState === "add-profile" && (
              isNewProfileConfirming ? (
                <AssistedPasswordConfirmation
                  password={newProfilePassword}
                  onSuccess={async () => {
                    const newId = newProfileName.toLowerCase().replace(/[^a-z0-9]/g, "-") || `profile-${Date.now()}`;
                    const hashedPassword = await hashPassword(newProfilePassword);
                    const newProfile: UserProfile = {
                      id: newId,
                      name: newProfileName,
                      avatarUrl: newProfileAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
                      title: newProfileTitle || "Member",
                      bio: newProfileBio || "A lovely member of memories.",
                      password: hashedPassword,
                      avatarCrop: newProfileCrop,
                      socials: {
                        github: newProfileGithub,
                        linkedin: newProfileLinkedin,
                        twitter: newProfileTwitter,
                      },
                      actionButton: {
                        text: newProfileBtnText || "Contact Me",
                        href: newProfileBtnHref || "#"
                      }
                    };
                    const updated = [...profiles, newProfile];
                    setProfiles(updated);
                    localStorage.setItem("user_profiles", JSON.stringify(updated));
                    const { id, ...newProfileData } = newProfile;
                    setDoc(doc(db, "profiles", id), newProfileData).catch(console.error);
                    setLoginState("select-profile");
                    setIsNewProfileConfirming(false);
                    setNewProfileCrop(undefined);
                  }}
                  onCancel={() => {
                    setIsNewProfileConfirming(false);
                  }}
                />
              ) : (
                <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-6 bg-neutral-900/90 border border-neutral-800 p-6 md:p-8 rounded-2xl shadow-2xl backdrop-blur-md">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h2 className="text-xl font-bold font-playfair text-white">Create New Profile</h2>
                    <p className="text-xs text-neutral-400 font-outfit">
                      Enter details and select an avatar for the profile.
                    </p>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newProfileName.trim() || !newProfilePassword.trim()) return;
                    setIsNewProfileConfirming(true);
                  }} className="w-full space-y-4 select-text">
                    
                    {/* Avatar upload */}
                    <div className="flex items-center gap-4 border-b border-neutral-850 pb-4">
                      <div 
                        onClick={() => {
                          if (newProfileAvatar) {
                            setCreateUploadImageSrc(newProfileAvatar);
                            setShowCreateCropModal(true);
                          }
                        }}
                        className="relative w-16 h-16 rounded-full border border-neutral-850 p-0.5 overflow-hidden bg-neutral-950 flex items-center justify-center cursor-pointer"
                      >
                        {newProfileAvatar ? (
                          <img src={newProfileAvatar} alt="Preview" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <Plus className="h-6 w-6 text-neutral-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-purple-400 font-outfit uppercase tracking-wider mb-1">
                          Profile Avatar Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setCreateUploadImageSrc(reader.result);
                                  setShowCreateCropModal(true);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-950/40 file:text-purple-300 hover:file:bg-purple-950/60 file:cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-400 font-outfit uppercase tracking-wider mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500 font-outfit"
                          placeholder="E.g. John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-400 font-outfit uppercase tracking-wider mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={newProfilePassword}
                          onChange={(e) => setNewProfilePassword(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                          placeholder="Profile Password"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-400 font-outfit uppercase tracking-wider mb-1">
                          Title / Role
                        </label>
                        <input
                          type="text"
                          value={newProfileTitle}
                          onChange={(e) => setNewProfileTitle(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500 font-outfit"
                          placeholder="E.g. Web Developer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-neutral-400 font-outfit uppercase tracking-wider mb-1">
                          Bio description
                        </label>
                        <textarea
                          value={newProfileBio}
                          onChange={(e) => setNewProfileBio(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-purple-500 font-outfit min-h-[38px] max-h-[60px]"
                          placeholder="Short bio..."
                        />
                      </div>
                    </div>

                    <div className="text-[10px] font-semibold text-purple-400 font-outfit uppercase tracking-wider border-t border-neutral-850 pt-2">
                      Social Links
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[8px] font-semibold text-neutral-400 font-outfit uppercase tracking-wider mb-1">
                          GitHub
                        </label>
                        <input
                          type="text"
                          value={newProfileGithub}
                          onChange={(e) => setNewProfileGithub(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-purple-500 font-mono"
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-semibold text-neutral-400 font-outfit uppercase tracking-wider mb-1">
                          LinkedIn
                        </label>
                        <input
                          type="text"
                          value={newProfileLinkedin}
                          onChange={(e) => setNewProfileLinkedin(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-purple-500 font-mono"
                          placeholder="https://linkedin.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-semibold text-neutral-400 font-outfit uppercase tracking-wider mb-1">
                          Portfolio
                        </label>
                        <input
                          type="text"
                          value={newProfileTwitter}
                          onChange={(e) => setNewProfileTwitter(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-purple-500 font-mono"
                          placeholder="https://yourportfolio.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-semibold text-neutral-400 font-outfit uppercase tracking-wider mb-1">
                          Action Button Text
                        </label>
                        <input
                          type="text"
                          value={newProfileBtnText}
                          onChange={(e) => setNewProfileBtnText(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-purple-500 font-outfit"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-semibold text-neutral-400 font-outfit uppercase tracking-wider mb-1">
                          Action Button Href
                        </label>
                        <input
                          type="text"
                          value={newProfileBtnHref}
                          onChange={(e) => setNewProfileBtnHref(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition font-outfit uppercase tracking-wider"
                    >
                      Next: Confirm Password
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setLoginState("select-profile");
                      }}
                      className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 font-outfit cursor-pointer transition"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              )
            )}
          </div>
        )}

        {loggedInUser && (
          <>
            {/* Top Header Bar moved to outer viewport level */}
        
        {/* LANDING STATE */}
        {pageState === "landing" && (
          <div className="flex flex-col items-center justify-center w-full relative">

            <MailboxFullState
              imageUrl="/mail/mail%20(1).gif"
              title="Mailbox of Sweet Chapters"
              description="A magical vault containing letters written across our shared moments. Write a starry letter to register new emotions, or read saved letters."
              secondaryAction={{
               text: "Visit Letters",
               onClick: () => {
                 if (isInitialLoadDone) {
                   setPageState("visit");
                   // Silent background refresh
                    const silentFetch = async () => {
                      try {
                        const q = query(collection(db, "letters"), orderBy("createdAt", "desc"));
                        const querySnapshot = await getDocs(q);
                        const fetched: Letter[] = [];
                        querySnapshot.forEach((doc) => {
                          const data = doc.data();
                          fetched.push({
                            id: doc.id,
                            content: data.content,
                            signature: data.signature || null,
                            createdAt: data.createdAt,
                            attachments: data.attachments || [],
                            isEternal: true,
                            recipientId: data.recipientId || "",
                            senderId: data.senderId || "",
                          });
                        });
                        const localMails = JSON.parse(localStorage.getItem("local_letters") || "[]");
                        const merged = [...fetched];
                        localMails.forEach((local: any) => {
                          if (!merged.some(m => m.id === local.id)) {
                            merged.push({
                              ...local,
                              isEternal: true,
                            });
                          }
                        });
                        setLetters(merged);
                     } catch (err) {
                       console.error("Silent refresh failed:", err);
                     }
                   };
                   silentFetch();
                 } else {
                   fetchLetters();
                 }
               }
              }}
              primaryAction={{
                text: "Write Letter",
                onClick: () => {
                  handleOpenComposer(false);
                }
              }}
              tertiaryAction={{
                text: "Eternal Letter",
                onClick: () => {
                  const oppositeId = loggedInUser?.id === "sanjay" 
                    ? "divya" 
                    : loggedInUser?.id === "divya" 
                    ? "sanjay" 
                    : profiles.find(p => p.id !== loggedInUser?.id)?.id || "";

                  const oppositeLetters = letters.filter(l => {
                    if (!loggedInUser) return false;
                    const matchesSender = l.senderId === oppositeId;
                    const matchesRecipient = l.recipientId === loggedInUser.id || !l.recipientId || l.recipientId === "";
                    return matchesSender && matchesRecipient;
                  });

                  const latestLetter = oppositeLetters[0];
                  if (latestLetter) {
                    const targetTime = getLetterLockTargetTime(latestLetter);
                    const isFinished = Date.now() >= (targetTime - 2000);
                    if (isFinished) {
                      setShowStackModal(true);
                    } else {
                      setLockedLetter({ ...latestLetter, isEternal: true });
                      setCountdownSource("landing");
                      setShowCountdownModal(true);
                    }
                  } else {
                    setShowNoMessageAlert(true);
                  }
                }
              }}
            />

            {/* PopoverForm wrapper triggered by primary button */}
            <div className={openWritePopover ? "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto transition-all duration-300" : "absolute opacity-0 pointer-events-none"}>
              <div
                className="flex-shrink-0 min-w-[512px] w-[512px]"
                style={{
                  transform: composerScale < 1 ? `scale(${composerScale})` : undefined,
                  transformOrigin: "center center"
                }}
              >
                <PopoverForm
                title="Write Letter"
                open={openWritePopover}
                setOpen={handleCloseWritePopover}
                width={dynamicPopoverWidth}
                height={dynamicPopoverHeight}
                showCloseButton={formState !== "success"}
                showSuccess={formState === "success"}
                openChild={
                  formState === "loading" ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-neutral-950">
                      <img 
                        src="/mail/Email%20motion%20loading.gif" 
                        alt="Submitting" 
                        className="w-56 h-56 object-contain" 
                      />
                      <p className="text-purple-400 text-sm font-outfit mt-2 animate-pulse">
                        Delivering letter to the database...
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleLetterSubmit} className="h-full flex flex-col p-4 justify-between bg-neutral-950 select-text">
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-purple-300 font-outfit uppercase tracking-wider">
                              To:
                            </span>
                            <select
                              value={recipientId}
                              onChange={(e) => setRecipientId(e.target.value)}
                              className="bg-neutral-900 border border-neutral-850 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-500 font-outfit cursor-pointer outline-none"
                            >
                              {profiles
                                .filter(p => p.id !== loggedInUser?.id)
                                .map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <div
                              className="text-[10px] font-semibold font-outfit px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-650 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)] animate-pulse select-none"
                              title="All letters are automatically marked as eternal and locked until May 2031."
                            >
                              ✦ Eternal ✦
                            </div>
                            <img 
                              src="/mail/open%20envelope.gif" 
                              alt="Open envelope" 
                              className="w-10 h-10 object-contain"
                            />
                          </div>
                        </div>

                         {composerError && (
                           <div className="bg-red-950/80 border border-red-900/30 text-red-200 text-xs px-3 py-2 rounded-lg font-outfit flex items-center justify-between animate-fade-in">
                             <span>{composerError}</span>
                             <button 
                               type="button" 
                               onClick={() => setComposerError(null)} 
                               className="text-red-400 hover:text-red-300 ml-2 font-bold cursor-pointer"
                             >
                               ✕
                             </button>
                           </div>
                         )}

                        {/* Toolbar for Highlights and Uploads */}
                        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-neutral-800">
                          <span className="text-[10px] text-neutral-400 font-outfit uppercase tracking-wider">Markers:</span>
                          <button
                            type="button"
                            onClick={() => applyHighlight("yellow")}
                            className="w-4 h-4 rounded-full bg-yellow-300 hover:scale-110 transition cursor-pointer"
                            title="Yellow Highlight"
                          />
                          <button
                            type="button"
                            onClick={() => applyHighlight("pink")}
                            className="w-4 h-4 rounded-full bg-pink-300 hover:scale-110 transition cursor-pointer"
                            title="Pink Highlight"
                          />
                          <button
                            type="button"
                            onClick={() => applyHighlight("green")}
                            className="w-4 h-4 rounded-full bg-green-300 hover:scale-110 transition cursor-pointer"
                            title="Green Highlight"
                          />
                          <button
                            type="button"
                            onClick={() => applyHighlight("blue")}
                            className="w-4 h-4 rounded-full bg-blue-300 hover:scale-110 transition cursor-pointer"
                            title="Blue Highlight"
                          />
                          
                          <div className="h-4 w-[1px] bg-neutral-800 mx-1" />
                          
                          {/* Image Upload Trigger */}
                          <label className="flex items-center gap-1 px-2 py-0.5 rounded border border-neutral-700 bg-neutral-850 hover:bg-neutral-800 text-[9px] text-neutral-300 cursor-pointer font-outfit select-none">
                            <Plus size={8} />
                            Add Image/GIF
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload} 
                              className="hidden" 
                            />
                          </label>
                        </div>

                        {/* ruled notebook styled text area wrapper */}
                        <div 
                          className="relative border border-neutral-850 rounded-md bg-neutral-900/10 p-0 mx-auto w-[440px] box-content" 
                          id="composer-paper-parent"
                        >
                          <div
                            id="letter-textarea"
                            contentEditable
                            suppressContentEditableWarning
                            onInput={handleEditorInput}
                            {...{ placeholder: "Write your lovely words here..." }}
                            className="w-full bg-transparent outline-none border-none text-neutral-200 text-[14.5px] font-outfit leading-[29.5px] p-0 select-text min-h-[177px] whitespace-pre-wrap break-words empty:before:content-[attr(placeholder)] empty:before:text-neutral-500 empty:before:pointer-events-none"
                            style={{
                              backgroundImage: "linear-gradient(to bottom, transparent 95%, rgba(139, 92, 246, 0.1) 95%)",
                              backgroundSize: "100% 29.5px",
                              backgroundPosition: "0 3px",
                              backgroundAttachment: "local",
                              lineHeight: "29.5px",
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          />
                          
                          {/* Draggable attachments */}
                          {attachments.map(a => {
                            const allLinesCount = getLinesOfText(letterContent);
                            const totalLinesCount = allLinesCount.length;
                            const editorRows = Math.max(6, totalLinesCount);
                            const targetLine = Math.min(
                              Math.max(0, totalLinesCount - 1),
                              Math.round((a.y / 100) * editorRows)
                            );
                            
                            return (
                              <div 
                                key={a.id}
                                style={{ left: `${a.x}%`, top: `${targetLine * 29.5}px` }}
                                className="absolute z-20 cursor-move group select-none touch-none"
                                onPointerDown={(e) => handlePointerDown(e, a.id)}
                              >
                              <div className="relative">
                                <img 
                                  src={a.src} 
                                  draggable="false" 
                                  style={{ width: `${a.width || 80}px`, height: "auto" }}
                                  className="object-contain rounded border border-purple-500/80 bg-black/40 shadow-md" 
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttachments(prev => prev.filter(item => item.id !== a.id));
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center cursor-pointer shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ✕
                                </button>
                                {/* Resize handle in bottom-right corner */}
                                <div 
                                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-purple-500 border border-white rounded-full cursor-se-resize shadow-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-30"
                                  onPointerDown={(e) => handleResizeStart(e, a.id)}
                                  title="Drag to resize"
                                >
                                  <span className="text-[7px] text-white font-bold pointer-events-none">⤾</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </div>

                        {/* Editable Signature Section */}
                        {signatureUrl ? (
                          <div className="border border-neutral-800 bg-neutral-900/40 rounded-lg p-3 flex flex-col items-start gap-2 w-full">
                            <div className="flex flex-wrap items-center gap-2 w-full">
                              <input 
                                type="text"
                                value={salutation}
                                onChange={(e) => setSalutation(e.target.value)}
                                className="bg-transparent border-b border-neutral-700 text-xs text-purple-300 font-outfit font-semibold uppercase tracking-wider focus:border-purple-500 outline-none w-40"
                                placeholder="E.g. Your Lovely"
                              />
                              <span className="text-xs text-neutral-500">:</span>
                              {isDefaultSet ? (
                                <span className="text-[9px] text-green-400 font-outfit animate-pulse">Saved default!</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    localStorage.setItem("default_salutation", salutation);
                                    setIsDefaultSet(true);
                                    setTimeout(() => setIsDefaultSet(false), 2000);
                                  }}
                                  className="px-2 py-0.5 rounded border border-neutral-750 bg-neutral-850 hover:bg-neutral-800 text-[9px] text-neutral-300 transition font-outfit cursor-pointer"
                                >
                                  Set as Default
                                </button>
                              )}
                            </div>
                            <div className="relative group w-full flex items-center justify-between">
                              <img 
                                src={signatureUrl} 
                                alt="Signature" 
                                className="h-10 object-contain mt-2" 
                                style={{ filter: "invert(1)" }}
                              />
                              <div className="flex items-center gap-2">
                                {isDefaultSignatureSet ? (
                                  <span className="text-[9px] text-green-400 font-outfit animate-pulse">Saved default!</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (signatureUrl) {
                                        localStorage.setItem("default_signature", signatureUrl);
                                        setIsDefaultSignatureSet(true);
                                        setTimeout(() => setIsDefaultSignatureSet(false), 2000);
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded border border-neutral-750 bg-neutral-850 hover:bg-neutral-800 text-[9px] text-neutral-300 transition font-outfit cursor-pointer animate-fade-in"
                                  >
                                    Set as Default
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSignatureUrl(null);
                                    setIsSignatureOpen(true);
                                  }}
                                  className="text-xs text-red-400 hover:text-red-300 border border-red-900/30 bg-red-950/20 px-2 py-1 rounded cursor-pointer transition font-outfit"
                                >
                                  Edit Signature
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsSignatureOpen(true)}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 font-medium transition cursor-pointer"
                          >
                            Add Signature
                          </button>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-neutral-850 mt-2">
                        <button
                          type="button"
                          onClick={() => setTextareaRows(r => r + 5)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-[11px] text-purple-300 transition cursor-pointer font-outfit"
                        >
                          <Plus size={12} />
                          +5 Lines
                        </button>

                        <button
                          type="submit"
                          className="flex items-center justify-center px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold shadow-md cursor-pointer transition"
                        >
                          Submit
                        </button>
                      </div>
                    </form>
                  )
                }
                successChild={
                  <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center bg-transparent">
                    <img 
                      src="/mail/Email%20Sent.gif" 
                      alt="Sent Success" 
                      className="w-56 h-56 object-contain" 
                    />
                    <h3 className="text-base font-bold text-purple-400 font-playfair mt-2">
                      Letter Sent Successfully!
                    </h3>
                    <p className="text-xs text-neutral-400 font-outfit mt-1">
                      Your words have been stored in the stars.
                    </p>
                  </div>
                }
              />
              </div>
            </div>
          </div>
        )}

        {/* LOADING VISIT STATE */}
        {pageState === "loading-visit" && (
          <div className="flex flex-col items-center justify-center">
            {/* Custom loader: loader.gif */}
            <img 
              src="/loader.gif" 
              alt="Loading letters..." 
              className="w-32 h-32 sm:w-44 sm:h-44 object-contain filter drop-shadow-[0_0_12px_rgba(168,85,247,0.25)]" 
            />
            <p className="text-purple-400 text-lg font-outfit mt-4 animate-pulse uppercase tracking-widest font-semibold text-center px-4">
              Retrieving memories from the registry...
            </p>
          </div>
        )}

        {/* LETTERS DISPLAY (VISIT STATE) */}
        {pageState === "visit" && (
          <div className="w-full flex flex-col items-center pt-20 pb-6 sm:pt-24 sm:pb-8">
            
            {/* Gallery Header */}
            <div className="w-full max-w-4xl flex items-center justify-center mb-8 px-4">
              <h2 className="text-xl sm:text-2xl font-bold font-playfair tracking-tight text-white flex items-center gap-2">
                <Mail className="text-purple-500" size={20} />
                Saved Chapters
              </h2>
            </div>

            {filteredLetters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <FileText size={48} className="text-neutral-600 mb-3" />
                <p className="text-neutral-400 font-outfit text-base">
                  No letters have been sent yet.
                </p>
                <button
                  onClick={() => {
                    setPageState("landing");
                    setOpenWritePopover(true);
                  }}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Write the First Letter
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4 justify-items-center" style={{ perspective: "1000px" }}>
                  {filteredLetters.slice(currentPage * 3, currentPage * 3 + 3).map((letter, index) => {
                    // Fallback for missing dates
                    const dateStr = letter.createdAt 
                      ? new Date((letter.createdAt.seconds || Date.now() / 1000) * 1000).toLocaleDateString()
                      : "Starry Night";

                    // Extract card title from truncated text content
                    const truncatedTitle = letter.content.substring(0, 24) + (letter.content.length > 24 ? "..." : "");
                    const letterNumber = filteredLetters.length - (currentPage * 3 + index);
                    const senderName = profiles.find(p => p.id === letter.senderId)?.name || "Partner";

                    return (
                      <div key={letter.id} className="flex flex-col items-center gap-4 bg-neutral-900/30 p-3 sm:p-5 rounded-2xl border border-neutral-800/80 shadow-lg transition duration-300 hover:border-purple-900/30 w-full max-w-[310px] min-[375px]:max-w-[330px] sm:max-w-none">
                        <InteractiveTravelCard
                          title={letter.isEternal ? "Eternal Letter" : `Letter #${letterNumber}`}
                          date={dateStr}
                          imageUrl="/stamp.png"
                          onActionClick={() => {
                            setActiveLetterSource("grid");
                            handleOpenLetter(letter);
                          }}
                        />
                        
                        <div className="flex gap-2 w-full justify-center mt-2 px-1">
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveLetterSource("grid");
                              handleOpenLetter(letter);
                            }}
                            className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-md transition cursor-pointer text-center font-outfit"
                          >
                            Open Letter
                          </button>
                          
                          {!isViewOnlyMode && (!letter.senderId || letter.senderId === loggedInUser?.id) && (
                            <>
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditLetter(letter);
                                }}
                                className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer text-center font-outfit"
                              >
                                Edit
                              </button>
                              
                              <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLetterToDelete(letter);
                                }}
                                className="py-2 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/30 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer text-center font-outfit"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {Math.ceil(filteredLetters.length / 3) > 1 && (
                  <div className="flex items-center gap-6 mt-8 z-20">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      className="p-3 bg-neutral-900 border border-neutral-800 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-850 transition cursor-pointer text-white flex items-center justify-center size-10 shadow-md"
                      aria-label="Previous Page"
                    >
                      ←
                    </button>
                    <span className="text-sm font-outfit text-neutral-400">
                      Page {currentPage + 1} of {Math.ceil(filteredLetters.length / 3)}
                    </span>
                    <button
                      disabled={currentPage >= Math.ceil(filteredLetters.length / 3) - 1}
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredLetters.length / 3) - 1, prev + 1))}
                      className="p-3 bg-neutral-900 border border-neutral-800 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-850 transition cursor-pointer text-white flex items-center justify-center size-10 shadow-md"
                      aria-label="Next Page"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </>
    )}
  </div>

      {/* Create Profile Image Cropper Modal */}
      {showCreateCropModal && createUploadImageSrc && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
          <ImageCropper
            initialImageSrc={createUploadImageSrc}
            onCropSave={(croppedUrl, cropDetails) => {
              setNewProfileAvatar(croppedUrl);
              setNewProfileCrop(cropDetails);
              setShowCreateCropModal(false);
              setCreateUploadImageSrc(null);
            }}
            onCancel={() => {
              setShowCreateCropModal(false);
              setCreateUploadImageSrc(null);
            }}
          />
        </div>
      )}

      {/* Signature Pad Modal Popup */}
      {isSignatureOpen && (
        <div 
          data-ignore-click-outside="true"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-full max-w-sm relative shadow-2xl">
            <button 
              onClick={() => setIsSignatureOpen(false)} 
              className="absolute top-3 right-3 text-neutral-400 hover:text-white font-bold cursor-pointer text-sm"
            >
              ✕
            </button>
            <SignaturePadComponent 
              onSave={(url) => {
                setSignatureUrl(url);
                setIsSignatureOpen(false);
              }}
              onClear={() => {
                setSignatureUrl(null);
              }}
              title="Draw Your Signature Below"
            />
          </div>
        </div>
      )}

      {/* Full Letter Reader Dialog Popup */}
      {activeLetter && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div 
            className="bg-[#FAF8F5] border-2 border-[#EADEC9] rounded-2xl w-[512px] min-w-[512px] flex-shrink-0 p-8 relative flex flex-col max-h-[85vh] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] text-neutral-800 transition-all duration-300"
            style={{
              boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.55), inset 0 0 40px rgba(234, 222, 201, 0.3)",
              transform: readerScale < 1 ? `scale(${readerScale})` : undefined,
              transformOrigin: "center center"
            }}
          >
            <button 
              onClick={() => {
                setActiveLetter(null);
                if (activeLetterSource === "vault") {
                  setShowStackModal(true);
                }
                setActiveLetterSource(null);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-800 text-xl font-bold cursor-pointer transition"
            >
              ✕
            </button>
            
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-[#EADEC9]">
              <span className="text-xs font-semibold text-amber-800 font-outfit uppercase tracking-widest">
                ✦ Memory Archives ✦
              </span>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={downloadLetterPdf}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#EADEC9] hover:bg-[#EADEC9]/20 text-[10px] text-amber-900 font-semibold transition cursor-pointer font-outfit"
                  title="Download as PDF Document"
                >
                  <Download size={10} />
                  Download PDF
                </button>
                
                {activeLetter.createdAt && (
                  <span className="text-xs text-neutral-500 font-outfit">
                    {new Date((activeLetter.createdAt.seconds || Date.now() / 1000) * 1000).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>

            {/* Ruled letter paper display */}
            <div 
              id="letter-paper-content"
              className="flex-1 overflow-y-auto rounded-lg bg-[#FCFBF9] text-neutral-800 font-outfit text-sm border border-[#EADEC9] select-text relative paper-scrollbar p-0"
              style={{ minHeight: "200px" }}
            >
              <div 
                id="letter-paper-content-inner"
                className="select-text relative p-0 mx-auto w-[440px] flex flex-col" 
                style={{ 
                  minHeight: "100%",
                  backgroundImage: "linear-gradient(to bottom, transparent 95%, rgba(139, 92, 246, 0.15) 95%)",
                  backgroundSize: "100% 29.5px",
                  backgroundPosition: "0 3px",
                  backgroundAttachment: "local",
                  lineHeight: "29.5px",
                  backgroundColor: "#FCFBF9",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {/* Relative container for text and attachments to match editor height exactly */}
                <div className="relative w-full" id="reader-text-container">
                  <div 
                    dangerouslySetInnerHTML={renderFormattedContent(activeLetter.content)} 
                    className="whitespace-pre-wrap select-text text-[14.5px] text-left w-full animate-fade-in" 
                    style={{
                      lineHeight: "29.5px",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  />

                  {/* Render attachments inside this text-only relative container */}
                  {activeLetter.attachments?.map((a: any) => {
                    const allLinesCount = getLinesOfText(activeLetter.content);
                    const totalLinesCount = allLinesCount.length;
                    const editorRows = Math.max(6, totalLinesCount);
                    const targetLine = Math.min(
                      Math.max(0, totalLinesCount - 1),
                      Math.round((a.y / 100) * editorRows)
                    );
                    
                    return (
                      <div 
                        key={a.id}
                        style={{ left: `${a.x}%`, top: `${targetLine * 29.5}px` }}
                        className="absolute z-20 pointer-events-none select-none"
                      >
                        <img 
                          src={a.src} 
                          draggable="false" 
                          style={{ width: `${a.width || 80}px`, height: "auto" }}
                          className="object-contain rounded shadow-lg border border-[#EADEC9]" 
                        />
                      </div>
                    );
                  })}
                </div>
                
                {activeLetter.signature && (
                  <div className="mt-10 border-t border-[#EADEC9] pt-4 flex flex-col items-start gap-1 w-full relative z-10">
                    <span className="text-xs font-bold text-amber-900 font-outfit uppercase tracking-wide">
                      {activeLetter.salutation || "Your Lovely"}:
                    </span>
                    <img 
                      src={activeLetter.signature} 
                      alt="Signature" 
                      className="h-10 object-contain mt-2" 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!letterToDelete} onOpenChange={(open) => !open && setLetterToDelete(null)}>
        <AlertDialogContent className="bg-neutral-900 border border-neutral-800 text-white">
          <AlertDialogHeader className="mb-4 items-center gap-2 md:flex-row md:items-start md:gap-4">
            <div
              aria-hidden="true"
              className="shrink-0 rounded-full bg-red-950 p-3 border border-red-900/30"
            >
              <Trash2 className="size-5 text-red-400" />
            </div>
            <div className="flex flex-col gap-2">
              <AlertDialogTitle className="text-lg font-semibold font-playfair">Delete Letter?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-neutral-400 font-outfit">
                Are you sure you want to delete this letter? This action is irreversible and will erase it from the archives.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLetterToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (letterToDelete) {
                  await handleDeleteLetter(letterToDelete.id);
                  setLetterToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white border-0 font-outfit font-semibold"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detailed Editable Profile Card Modal */}
      {isDetailedCardOpen && loggedInUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
          <GlassmorphismProfileCard
            avatarUrl={loggedInUser.avatarUrl}
            name={loggedInUser.name}
            title={loggedInUser.title}
            bio={loggedInUser.bio}
            socialLinks={[
              { id: 'github', icon: Github, label: 'GitHub', href: loggedInUser.socials?.github || '#' },
              { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', href: loggedInUser.socials?.linkedin || '#' },
              { id: 'twitter', icon: Globe, label: 'Portfolio', href: loggedInUser.socials?.twitter || '#' },
            ]}
            actionButton={loggedInUser.actionButton}
            avatarAdjust={loggedInUser.avatarAdjust}
            avatarCrop={loggedInUser.avatarCrop}
            password={loggedInUser.password}
            onClose={() => setIsDetailedCardOpen(false)}
            onSave={async (updatedData) => {
              const hashedPassword = updatedData.password ? await hashPassword(updatedData.password) : "";
              const updatedProfiles = await Promise.all(profiles.map(async (p) => {
                if (p.id === loggedInUser.id) {
                  return {
                    ...p,
                    name: updatedData.name,
                    title: updatedData.title,
                    bio: updatedData.bio,
                    avatarUrl: updatedData.avatarUrl,
                    socials: {
                      github: updatedData.socialLinks.find(l => l.id === 'github')?.href || '',
                      linkedin: updatedData.socialLinks.find(l => l.id === 'linkedin')?.href || '',
                      twitter: updatedData.socialLinks.find(l => l.id === 'twitter')?.href || '',
                    },
                    actionButton: updatedData.actionButton,
                    avatarAdjust: updatedData.avatarAdjust,
                    avatarCrop: updatedData.avatarCrop,
                    password: hashedPassword
                  };
                }
                return p;
              }));
              setProfiles(updatedProfiles);
              localStorage.setItem("user_profiles", JSON.stringify(updatedProfiles));
              const targetProfile = updatedProfiles.find(p => p.id === loggedInUser.id);
              if (targetProfile) {
                const { id, ...data } = targetProfile;
                setDoc(doc(db, "profiles", loggedInUser.id), data).catch(console.error);
              }
              
              const newLoggedIn = updatedProfiles.find(p => p.id === loggedInUser.id);
              if (newLoggedIn) {
                setLoggedInUser(newLoggedIn);
              }
            }}
          />
        </div>
      )}
      {showCountdownModal && lockedLetter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
          {(() => {
            const oppositeId = loggedInUser?.id === "sanjay" 
              ? "divya" 
              : loggedInUser?.id === "divya" 
              ? "sanjay" 
              : profiles.find(p => p.id !== loggedInUser?.id)?.id || "";

            const oppositeLetters = letters.filter(l => {
              if (!loggedInUser) return false;
              const matchesSender = l.senderId === oppositeId;
              const matchesRecipient = l.recipientId === loggedInUser.id || !l.recipientId || l.recipientId === "";
              return matchesSender && matchesRecipient;
            });

            return (
              <EventCountdownCard
                title={`Eternal Letter from ${profiles.find(p => p.id === lockedLetter.senderId)?.name || "your partner"}`}
                date={new Date(getLetterLockTargetTime(lockedLetter))}
                image="https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&fit=crop"
                letterCount={oppositeLetters.length}
                onJoin={() => {
                  const letterToOpen = lockedLetter;
                  if (!letterToOpen) return;
                  const targetTime = getLetterLockTargetTime(letterToOpen);
                  const isFinished = Date.now() >= (targetTime - 2000);
                  
                  setShowCountdownModal(false);
                  setLockedLetter(null);
                  
                  if (isFinished) {
                    if (countdownSource === "landing") {
                      setShowStackModal(true);
                      setActiveLetterSource(null);
                    } else {
                      setActiveLetter(letterToOpen);
                    }
                  } else {
                    setActiveLetterSource(null);
                  }
                  setCountdownSource(null);
                }}
                onClose={() => {
                  const letterToOpen = lockedLetter;
                  const targetTime = letterToOpen ? getLetterLockTargetTime(letterToOpen) : 0;
                  const isFinished = Date.now() >= (targetTime - 2000);

                  setShowCountdownModal(false);
                  setLockedLetter(null);
                  
                  if (isFinished) {
                    setShowStackModal(true);
                  } else {
                    setShowStackModal(false);
                  }
                  setActiveLetterSource(null);
                }}
                className="bg-neutral-900/95 border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] text-white backdrop-blur-xl"
              />
            );
          })()}
        </div>
      )}
      {showNoMessageAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
          <AlertCard
            title="No Message Found"
            message="There is no eternal letter registered in the mailbox registry yet. Create a new letter and mark it as 'Eternal' to seal a message across time!"
            onClose={() => {
              setShowNoMessageAlert(false);
            }}
            onAction={() => {
              setShowNoMessageAlert(false);
              handleOpenComposer(true);
            }}
            actionText="Write Eternal Letter"
            className="bg-neutral-900/95 border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] text-white backdrop-blur-xl"
          />
        </div>
      )}
      {showStackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
          <div className="bg-neutral-900/95 border border-white/10 rounded-2xl w-full max-w-2xl p-6 relative flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] text-white backdrop-blur-xl max-h-[90vh] overflow-hidden">
            <button 
              onClick={() => setShowStackModal(false)} 
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-xl font-bold cursor-pointer transition z-50"
            >
              ✕
            </button>
            
            <div className="flex flex-col items-center mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold font-playfair tracking-wide text-white flex items-center gap-2">
                ✦ Eternal Vault ✦
              </h2>
              <p className="text-xs text-neutral-400 font-outfit mt-1">
                A collection of letters sealed across space and time.
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-[300px] overflow-hidden">
              {(() => {
                const oppositeId = loggedInUser?.id === "sanjay" 
                  ? "divya" 
                  : loggedInUser?.id === "divya" 
                  ? "sanjay" 
                  : profiles.find(p => p.id !== loggedInUser?.id)?.id || "";

                const oppositeLetters = letters.filter(l => {
                  if (!loggedInUser) return false;
                  const matchesSender = l.senderId === oppositeId;
                  const matchesRecipient = l.recipientId === loggedInUser.id || !l.recipientId || l.recipientId === "";
                  return matchesSender && matchesRecipient;
                });

                const stackCards = [
                  ...oppositeLetters.map(l => {
                    const senderName = profiles.find(p => p.id === l.senderId)?.name || "Partner";
                    return {
                      id: l.id,
                      title: `Letter from ${senderName}`,
                      description: "Letter",
                      icon: <Mail className="h-5 w-5" />,
                      rawLetter: l
                    };
                  }),
                  {
                    id: "empty-card",
                    title: "Empty Slot",
                    description: "No letter is attached to this card.",
                    icon: <Mail className="h-5 w-5 opacity-40" />,
                    isEmptyCard: true
                  }
                ];

                return (
                  <MorphingCardStack
                    cards={stackCards}
                    onOpen={(card) => {
                      setShowStackModal(false);
                      setActiveLetterSource("vault");
                      handleOpenLetter(card.rawLetter);
                    }}
                    onDownload={async (card) => {
                      setActiveLetterSource("vault");
                      setActiveLetter(card.rawLetter);
                      // Wait 300ms for activeLetter to be fully mounted in the DOM
                      await new Promise(resolve => setTimeout(resolve, 300));
                      await downloadLetterPdf();
                      setActiveLetter(null);
                      setActiveLetterSource(null);
                    }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
