"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, Pencil, Trash2, Smile, Maximize2 } from "lucide-react";
import { formatPreciseTime } from "@/lib/time";
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
  const [editText, setEditText] = React.useState(message.text);
  const ts = typeof message.timestamp === "string" ? new Date(message.timestamp) : new Date(message.timestamp);

  const getFullUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${env.backendUrl}${path}`;
  };

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== message.text) {
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "relative max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200",
              isMine
                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-none"
                : "bg-zinc-800/80 backdrop-blur-sm border border-white/5 text-zinc-100 rounded-tl-none"
            )}
          >
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
              <div className="space-y-2">
                {message.type === "image" && message.image && (
                  <div
                    className="relative cursor-pointer overflow-hidden rounded-lg group/img"
                    onClick={() => setViewerOpen(true)}
                  >
                    <img
                      src={getFullUrl(message.image)}
                      alt="Shared content"
                      className="max-w-full max-h-[300px] object-cover transition-transform duration-500 group-hover/img:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-md p-2 rounded-full">
                        <Maximize2 className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                )}
                {message.text && (
                  <div className="whitespace-pre-wrap break-words text-[14.5px] leading-relaxed tracking-wide font-medium">
                    {message.text}
                  </div>
                )}
              </div>
            )}

            <div className={cn("mt-1 flex items-center justify-end gap-1.5 text-[9px] font-bold uppercase tracking-wider opacity-60", isMine ? "text-white" : "text-zinc-400")}>
              {message.isEdited && <span>(edited)</span>}
              <span>{formatPreciseTime(ts)}</span>
              {isMine && (
                <CheckCheck className={cn("h-3 w-3", message.seen ? "text-emerald-300" : "text-white/40")} />
              )}
            </div>

            {/* Reactions Overlay */}
            <div className={cn("absolute -bottom-3 flex flex-wrap gap-1", isMine ? "right-2" : "left-2")}>
              <AnimatePresence>
                {reactionCounts.map(([emoji, count]) => (
                  <motion.div
                    key={emoji}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-1 rounded-full bg-zinc-900 border border-white/10 px-1.5 py-0.5 text-[10px] shadow-lg shadow-black/40"
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

