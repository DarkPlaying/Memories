"use client";

import React, { useState } from 'react';
import { ArrowUpRight, Edit2, Check, X, Camera, Eye, EyeOff, Globe } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Github, Linkedin } from './brand-icons';
import ImageCropper from './image-cropper';

interface SocialLink {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  href: string;
}

interface ActionButtonProps {
  text: string;
  href: string;
}

interface GlassmorphismProfileCardProps {
  avatarUrl: string;
  name: string;
  title: string;
  bio: string;
  socialLinks?: SocialLink[];
  actionButton?: ActionButtonProps;
  avatarAdjust?: { scale: number; x: number; y: number };
  password?: string;
  onSave?: (updated: {
    name: string;
    title: string;
    bio: string;
    avatarUrl: string;
    socialLinks: Array<{ id: string; href: string }>;
    actionButton: ActionButtonProps;
    avatarAdjust?: { scale: number; x: number; y: number };
    password?: string;
  }) => void;
  onClose?: () => void;
}

export function GlassmorphismProfileCard({
  avatarUrl: initialAvatarUrl,
  name: initialName,
  title: initialTitle,
  bio: initialBio,
  socialLinks = [],
  actionButton = { text: 'Contact Me', href: '#' },
  avatarAdjust = { scale: 1, x: 0, y: 0 },
  password: initialPassword = '',
  onSave,
  onClose,
}: GlassmorphismProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [title, setTitle] = useState(initialTitle);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Avatar adjustments
  const [scale, setScale] = useState(avatarAdjust?.scale || 1);
  const [posX, setPosX] = useState(avatarAdjust?.x || 0);
  const [posY, setPosY] = useState(avatarAdjust?.y || 0);

  // Profile password
  const [profilePassword, setProfilePassword] = useState(initialPassword);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Upload and crop modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploadImageSrc, setUploadImageSrc] = useState<string | null>(null);

  // Keep track of social hrefs
  const [socialHrefs, setSocialHrefs] = useState<Record<string, string>>(() => {
    const hrefs: Record<string, string> = {};
    socialLinks.forEach(link => {
      hrefs[link.id] = link.href;
    });
    return hrefs;
  });

  const [btnText, setBtnText] = useState(actionButton.text);
  const [btnHref, setBtnHref] = useState(actionButton.href);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onSave) {
      onSave({
        name,
        title,
        bio,
        avatarUrl,
        socialLinks: socialLinks.map(link => ({
          id: link.id,
          href: socialHrefs[link.id] || '#'
        })),
        actionButton: { text: btnText, href: btnHref },
        avatarAdjust: { scale, x: posX, y: posY },
        password: profilePassword
      });
    }
  };

  const handleCancel = () => {
    setName(initialName);
    setTitle(initialTitle);
    setBio(initialBio);
    setAvatarUrl(initialAvatarUrl);
    const hrefs: Record<string, string> = {};
    socialLinks.forEach(link => {
      hrefs[link.id] = link.href;
    });
    setSocialHrefs(hrefs);
    setBtnText(actionButton.text);
    setBtnHref(actionButton.href);
    setScale(avatarAdjust?.scale || 1);
    setPosX(avatarAdjust?.x || 0);
    setPosY(avatarAdjust?.y || 0);
    setProfilePassword(initialPassword);
    setShowEditPassword(false);
    setIsEditing(false);
  };

  // Resolve icons dynamically
  const getIcon = (id: string) => {
    if (id === 'github') return Github;
    if (id === 'linkedin') return Linkedin;
    if (id === 'twitter' || id === 'website') return Globe;
    return Github;
  };

  return (
    <div className="relative w-full max-w-sm font-sans z-[90]">
      <div 
        className="relative flex flex-col items-center p-6 md:p-8 rounded-3xl border border-neutral-800 transition-all duration-500 ease-out backdrop-blur-xl bg-neutral-900/85 text-white max-h-[90vh] overflow-y-auto dark-scrollbar"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer transition p-1 bg-neutral-800/40 rounded-full hover:bg-neutral-800"
          >
            <X size={16} />
          </button>
        )}

        {/* Edit/Action buttons */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 left-4 text-neutral-400 hover:text-purple-400 cursor-pointer transition p-1.5 bg-neutral-850 border border-neutral-800 rounded-full flex items-center gap-1 text-[10px] uppercase font-semibold font-outfit"
            title="Edit Profile Card"
          >
            <Edit2 size={12} />
            <span>Edit</span>
          </button>
        ) : (
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={handleSave}
              className="text-green-400 hover:text-green-300 cursor-pointer transition p-1.5 bg-green-950/20 border border-green-900/35 rounded-full"
              title="Save Changes"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleCancel}
              className="text-red-400 hover:text-red-300 cursor-pointer transition p-1.5 bg-red-950/20 border border-red-900/35 rounded-full"
              title="Discard Changes"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Avatar Area */}
        <div 
          onClick={() => {
            setShowUploadModal(true);
          }}
          className="relative w-24 h-24 mb-4 mt-2 rounded-full p-0.5 border-2 border-purple-500/30 group overflow-hidden cursor-pointer"
        >
          <img 
            src={avatarUrl} 
            alt={`${name}'s Avatar`}
            className="w-full h-full rounded-full object-cover"
            style={{
              transform: `scale(${scale}) translate(${posX}px, ${posY}px)`,
              transformOrigin: "center center",
            }}
            onError={(e) => { 
              const target = e.target as HTMLImageElement;
              target.onerror = null; 
              target.src = `https://placehold.co/96x96/6366f1/white?text=${name.charAt(0)}`; 
            }}
          />
          {isEditing && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          )}
        </div>

        {/* Name and Title */}
        {!isEditing ? (
          <>
            <h2 className="text-2xl font-bold font-playfair text-white tracking-wide">{name}</h2>
            <p className="mt-1 text-xs font-semibold font-outfit text-purple-400 uppercase tracking-wider text-center">{title}</p>
            <p className="mt-4 text-center text-xs leading-relaxed text-neutral-300 font-outfit">{bio}</p>
          </>
        ) : (
          <div className="w-full space-y-3 mt-2 flex flex-col items-center">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-center bg-neutral-950 border border-neutral-800 rounded-lg py-1 px-2 text-lg font-bold text-white focus:outline-none focus:border-purple-500 font-playfair"
              placeholder="Full Name"
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-center bg-neutral-950 border border-neutral-800 rounded-lg py-1 px-2 text-xs font-semibold text-purple-400 focus:outline-none focus:border-purple-500 uppercase tracking-wider font-outfit"
              placeholder="Title / Role"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-1.5 px-3 text-xs leading-relaxed text-neutral-300 focus:outline-none focus:border-purple-500 font-outfit h-[140px] dark-scrollbar"
              placeholder="Short bio description..."
            />
            {/* Password Change */}
            <div className="w-full space-y-3 mt-1 p-3 bg-neutral-950/40 border border-neutral-850 rounded-xl text-left">
              <div className="space-y-1">
                <label className="text-[10px] text-neutral-400 font-outfit font-semibold uppercase tracking-wider block">Change Password</label>
                <div className="relative flex items-center bg-neutral-950 border border-neutral-800 rounded-lg">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    className="w-full bg-transparent py-1.5 px-3 pr-10 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="New Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 text-neutral-405 hover:text-white cursor-pointer select-none border-none bg-transparent"
                  >
                    {showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-1/2 h-px my-5 rounded-full bg-neutral-800" />

        {/* Social Links */}
        <div className="flex items-center justify-center gap-3">
          {socialLinks.map((item) => {
            const IconComponent = getIcon(item.id);
            if (!isEditing) {
              return (
                <div key={item.id} className="relative">
                  <a
                    href={socialHrefs[item.id] || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-out group overflow-hidden bg-neutral-850 hover:bg-neutral-800 border border-neutral-800"
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    aria-label={item.label}
                  >
                    <IconComponent size={16} className="transition-all duration-200 ease-out text-neutral-400 group-hover:text-white" />
                  </a>
                  {hoveredItem === item.id && (
                    <div 
                      role="tooltip"
                      className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-[10px] font-medium text-white whitespace-nowrap shadow-lg animate-fade-in pointer-events-none"
                    >
                      {item.label}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-neutral-950 border-b border-r border-neutral-800" />
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div key={item.id} className="flex flex-col items-center gap-1">
                  <IconComponent size={14} className="text-neutral-400" />
                  <input
                    type="text"
                    value={socialHrefs[item.id] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSocialHrefs(prev => ({ ...prev, [item.id]: val }));
                    }}
                    className="w-16 bg-neutral-950 border border-neutral-800 rounded px-1 py-0.5 text-[8px] text-neutral-300 focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="Link URL"
                  />
                </div>
              );
            }
          })}
        </div>

        {/* Action Button */}
        {!isEditing ? (
          actionButton && (
            <a
              href={btnHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-5 py-2.5 mt-6 rounded-full font-semibold text-xs backdrop-blur-sm transition-all duration-300 ease-out hover:scale-[1.03] active:scale-95 group bg-purple-600 hover:bg-purple-700 text-white font-outfit uppercase tracking-wider"
              style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.3)' }}
            >
              <span>{btnText}</span>
              <ArrowUpRight size={14} className="transition-transform duration-300 ease-out group-hover:rotate-45" />
            </a>
          )
        ) : (
          <div className="w-full space-y-2 mt-4">
            <div className="text-[10px] text-neutral-400 font-outfit font-semibold uppercase">Action Button:</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={btnText}
                onChange={(e) => setBtnText(e.target.value)}
                className="w-1/2 bg-neutral-950 border border-neutral-800 rounded-lg py-1 px-2 text-xs text-white focus:outline-none focus:border-purple-500 font-outfit"
                placeholder="Button Text"
              />
              <input
                type="text"
                value={btnHref}
                onChange={(e) => setBtnHref(e.target.value)}
                className="w-1/2 bg-neutral-950 border border-neutral-800 rounded-lg py-1 px-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                placeholder="Button Href"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 rounded-3xl -z-10 transition-all duration-500 ease-out blur-2xl opacity-20 bg-gradient-to-r from-purple-500/50 to-indigo-500/50 pointer-events-none" />

      {/* Upload Image Modal Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm relative shadow-2xl text-white">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer transition p-1 bg-neutral-800/40 rounded-full hover:bg-neutral-800 border-none bg-transparent"
            >
              <X size={16} />
            </button>
            <h3 className="text-lg font-bold font-playfair mb-4 text-purple-400 text-left">Upload Image</h3>
            
            <div className="space-y-4">
              <div className="border border-dashed border-neutral-800 bg-neutral-950 p-4 rounded-xl flex items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onload = () => {
                        setUploadImageSrc(reader.result as string);
                      };
                    }
                  }}
                  className="w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-850 file:text-neutral-205 hover:file:bg-neutral-700 file:cursor-pointer"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadImageSrc(null);
                  }}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-outfit text-xs font-semibold py-2.5 rounded-xl cursor-pointer transition border border-solid border-neutral-750"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (uploadImageSrc) {
                      setShowUploadModal(false);
                      setShowCropModal(true);
                    } else {
                      setUploadImageSrc(avatarUrl);
                      setShowUploadModal(false);
                      setShowCropModal(true);
                    }
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-outfit text-xs font-semibold py-2.5 rounded-xl cursor-pointer transition border-none"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cropper Modal Dialog */}
      {showCropModal && uploadImageSrc && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onMouseDown={(e) => e.stopPropagation()}>
          <ImageCropper
            initialImageSrc={uploadImageSrc}
            onCropSave={(croppedUrl) => {
              setAvatarUrl(croppedUrl);
              setShowCropModal(false);
              setUploadImageSrc(null);
              // Save immediately if view mode
              if (!isEditing && onSave) {
                onSave({
                  name,
                  title,
                  bio,
                  avatarUrl: croppedUrl,
                  socialLinks: socialLinks.map(link => ({
                    id: link.id,
                    href: socialHrefs[link.id] || '#'
                  })),
                  actionButton: { text: btnText, href: btnHref },
                  avatarAdjust: { scale, x: posX, y: posY },
                  password: profilePassword
                });
              }
            }}
            onCancel={() => {
              setShowCropModal(false);
              setShowUploadModal(true);
            }}
          />
        </div>
      )}
    </div>
  );
}
