"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, Pencil, Trash2, Smile, Maximize2, Play, Pause, Volume2 } from "lucide-react";
import { formatMessageTime } from "@/lib/time";
import { ImageViewer } from "@/components/image-viewer";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import type { Message } from "@/lib/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const REACTION_EMOJIS = ["❤️", "👍", "🔥", "😂", "😮", "😢"];

export function MessageBubble({
  message,
  isMine,
  onEdit,
  onUnsend,
  onReact,
}: {
  message: Message;
  isMine: boolean;
  onEdit?: (id: string, text: string) => void;
  onUnsend?: (id: string) => void;
  onReact?: (id: string, emoji: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [editText, setEditText] = React.useState(message.text || "");
  const ts = typeof message.timestamp === "string" ? new Date(message.timestamp) : new Date(message.timestamp);

  const getFullUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = env.backendUrl.endsWith("/") ? env.backendUrl.slice(0, -1) : env.backendUrl;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== (message.text || "")) {
      onEdit?.(message._id, editText.trim());
    }
    setEditing(false);
  };

  const reactionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    message.reactions?.forEach((r) => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    return Object.entries(counts);
  }, [message.reactions]);

  return (
    <div className={cn("group flex w-full flex-col gap-1", isMine ? "items-end" : "items-start")}>
      <ContextMenu>
        <ContextMenuTrigger disabled={!isMine}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "relative max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm transition-all duration-200 text-[14.5px] leading-relaxed z-[10]",
              isMine
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-none"
                : "bg-zinc-800/90 backdrop-blur-sm border border-white/5 text-zinc-100 rounded-tl-none"
            )}
          >
            {/* SVG Tail */}
            <div className={cn(
              "absolute top-0 w-3 h-4",
              isMine ? "-right-2 text-purple-600" : "-left-2 text-zinc-800/90"
            )}>
              <svg viewBox="0 0 10 12" className="w-full h-full fill-current">
                {isMine ? (
                  <path d="M0 0 C 4 0, 8 0, 10 0 L 0 12 Z" />
                ) : (
                  <path d="M10 0 C 6 0, 2 0, 0 0 L 10 12 Z" />
                )}
              </svg>
            </div>

            {editing ? (
              <div className="flex flex-col gap-2 min-w-[200px]">
                <Input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEditSubmit()}
                  className="h-8 bg-black/20 border-white/10 text-white text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs text-white/70 hover:text-white">Cancel</Button>
                  <Button size="sm" onClick={handleEditSubmit} className="h-7 text-xs bg-white text-indigo-600 hover:bg-white/90">Save</Button>
                </div>
              </div>
            ) : (
              <div>
                {(message.type === "image" || message.type === "gif") && message.image && (
                  <div
                    className="relative cursor-pointer overflow-hidden rounded-lg group/img mb-1.5 shadow-md"
                    onClick={() => setViewerOpen(true)}
                  >
                    <img
                      src={getFullUrl(message.image)}
                      alt="Shared content"
                      className="max-w-full max-h-[320px] w-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                    />
                    {message.type === "image" && (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md p-2 rounded-full">
                          <Maximize2 className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    )}
                    {message.type === "gif" && (
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                        GIF
                      </div>
                    )}
                  </div>
                )}

                {message.type === "voice" && message.voice && (
                  <div className={cn(
                    "flex items-center gap-3 py-1 mb-1.5 min-w-[200px] rounded-xl px-2",
                    isMine ? "bg-white/10" : "bg-white/5"
                  )}>
                    <audio
                      ref={audioRef}
                      src={getFullUrl(message.voice)}
                      onTimeUpdate={() => {
                        if (audioRef.current) {
                          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
                        }
                      }}
                      onEnded={() => {
                        setIsPlaying(false);
                        setProgress(0);
                      }}
                      className="hidden"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"
                      onClick={() => {
                        if (isPlaying) {
                          audioRef.current?.pause();
                        } else {
                          audioRef.current?.play();
                        }
                        setIsPlaying(!isPlaying);
                      }}
                    >
                      {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </Button>

                    <div className="flex-1 space-y-1.5">
                      <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-white rounded-full"
                          animate={{ width: `${progress}%` }}
                          transition={{ type: "tween", duration: 0.1 }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] opacity-70">
                        <div className="flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          <span>Voice Message</span>
                        </div>
                        <span>{message.duration ? `${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, "0")}` : ""}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="relative flex flex-col pr-12">
                  <span className="break-words">
                    {message.isEdited && <span className="text-[10px] opacity-60 mr-1">(edited)</span>}
                    {message.text}
                  </span>

                  {/* Timestamp & Status (Always bottom right of the bubble) */}
                  <div className={cn(
                    "absolute bottom-0 right-0 flex items-center gap-1 text-[10.5px]",
                    isMine ? "text-white/60" : "text-zinc-500"
                  )}>
                    <span>{formatMessageTime(ts)}</span>
                    {isMine && (
                      <CheckCheck className={cn("h-3.5 w-3.5", message.seen ? "text-blue-300" : "opacity-60")} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reactions Overlay */}
            <div className={cn("absolute -bottom-3 flex flex-wrap gap-1", isMine ? "right-2" : "left-2")}>
              <AnimatePresence>
                {reactionCounts.map(([emoji, count]) => (
                  <motion.div
                    key={emoji}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1 rounded-full bg-zinc-900 border border-white/10 px-1.5 py-0.5 text-[10px] shadow-lg shadow-black/40 cursor-pointer"
                    onClick={() => onReact?.(message._id, emoji)}
                  >
                    <span>{emoji}</span>
                    {count > 1 && <span className="text-zinc-400 font-bold">{count}</span>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent className="glass-morphism border-white/10 bg-zinc-900/90 text-zinc-100 min-w-[140px]">
          <ContextMenuItem onClick={() => setEditing(true)} className="gap-2 cursor-pointer focus:bg-white/10">
            <Pencil className="h-4 w-4" /> Edit
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onUnsend?.(message._id)} className="gap-2 cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400">
            <Trash2 className="h-4 w-4" /> Unsend
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Floating Action Bar (Mobile-friendly picker) */}
      <div className={cn("flex items-center gap-1 transition-opacity duration-300", editing ? "opacity-0" : "opacity-0 group-hover:opacity-100")}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/5 text-zinc-500">
              <Smile className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align={isMine ? "end" : "start"} className="w-fit p-1.5 glass bg-zinc-900/90 border-white/10">
            <div className="flex gap-1">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact?.(message._id, emoji)}
                  className="hover:scale-125 transition-transform p-1 rounded-md hover:bg-white/5"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {message.image && (
        <ImageViewer
          src={getFullUrl(message.image)}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}

