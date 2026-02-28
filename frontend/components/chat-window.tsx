"use client";

import * as React from "react";
import { SendHorizontal, UserPlus, XCircle, Trash2, Image as ImageIcon, Loader2, Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TypingIndicator } from "@/components/typing-indicator";
import { MessageBubble } from "@/components/message-bubble";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import type { Message, User } from "@/lib/types";
import dynamic from "next/dynamic";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ChatWindow({
  meId,
  other,
  messages,
  typingLabel,
  onTypingStart,
  onTypingStop,
  onSend,
  onEdit,
  onUnsend,
  onReact,
  onProfileOpen,
  onClearChat
}: {
  meId: string;
  other: User | null;
  messages: Message[];
  typingLabel: string | null;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onSend: (text: string, image?: string) => void;
  onEdit: (id: string, text: string) => void;
  onUnsend: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onProfileOpen?: (user: User) => void;
  onClearChat?: () => void;
}) {
  const { token } = useAuth();
  const [text, setText] = React.useState("");
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const pickerRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const typingTimeout = React.useRef<number | null>(null);

  // Close emoji picker when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lastSnappedId = React.useRef<string | null>(null);

  React.useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || messages.length === 0) return;

    const currentId = other?._id || "";
    const isNewChat = currentId !== lastSnappedId.current;

    if (isNewChat) {
      // Instant snap for first load of this chat
      el.scrollTop = el.scrollHeight + 1000;
      lastSnappedId.current = currentId;
    } else {
      // Smooth scroll for new messages in same chat
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, other?._id]);

  function scheduleStopTyping() {
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => onTypingStop(), 900);
  }

  function handleChange(v: string) {
    setText(v);
    onTypingStart();
    scheduleStopTyping();
  }

  function submit() {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
    onTypingStop();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB.");
      return;
    }

    // 2. Upload
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      // Using the local backend's upload endpoint
      const res = await apiFetch<any>("/api/messages/upload", {
        method: "POST",
        body: formData,
        token: token // Explicitly passing the token
      });

      if (res.success) {
        onSend("", res.url);
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!other) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md text-center">
          <div className="text-xl font-semibold">Pick a user to start chatting</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Your real-time conversation will appear here with smooth animations and delivery status.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between border-b bg-background/40 px-3 py-2 md:px-4 md:py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Avatar
            className="h-10 w-10 ring-2 ring-primary/10 cursor-pointer transition-transform hover:scale-110"
            onClick={() => onProfileOpen?.(other)}
          >
            <AvatarImage src={other.avatar || ""} alt={other.username} />
            <AvatarFallback>{initials(other.username)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{other.username}</div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", other.online ? "bg-emerald-500 animate-pulse-subtle" : "bg-muted-foreground/40")} />
              {other.online ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        {other.friendshipStatus === "accepted" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  onClick={onClearChat}
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end">Clear Chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div
        id="message-list"
        ref={listRef}
        className="flex-1 flex flex-col justify-end space-y-4 overflow-y-auto p-3 md:p-4 scrollbar-hide"
      >
        <div className="flex-1" /> {/* Spacer to push content to bottom */}
        {messages.map((m) => (
          <MessageBubble
            key={m._id}
            message={m}
            isMine={String(m.senderId) === String(meId)}
            onEdit={onEdit}
            onUnsend={onUnsend}
            onReact={onReact}
          />
        ))}
      </div>

      <div className="border-t bg-background/40 px-3 py-3 md:px-4 md:py-4 backdrop-blur-md">
        <div className="mb-2 min-h-[1.25rem]">
          {typingLabel ? <TypingIndicator label={typingLabel} /> : null}
        </div>
        <div className="flex items-center gap-2">
          {other.isMe ? (
            <div className="flex w-full items-center justify-center rounded-lg bg-primary/10 p-3 text-sm text-primary border border-primary/20">
              <span className="font-medium">This is your personal profile space. Click your avatar above to edit your status.</span>
            </div>
          ) : (other.isBlockedByMe || other.hasBlockedMe || other.friendshipStatus !== "accepted") ? (
            <div className="flex w-full items-center justify-center rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              <span className="font-medium">
                {(other.isBlockedByMe || other.hasBlockedMe)
                  ? "Communication has been restricted for this profile."
                  : "You must be friends to exchange messages."}
              </span>
            </div>
          ) : other.friendshipStatus === "accepted" ? (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                disabled={uploading}
                className="h-10 w-10 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
              </Button>
              <div className="relative flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-full",
                    showEmojiPicker && "text-primary bg-primary/10"
                  )}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-5 w-5" />
                </Button>

                {showEmojiPicker && (
                  <div
                    ref={pickerRef}
                    className="absolute bottom-12 left-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setText((prev) => prev + emojiData.emoji);
                        // setShowEmojiPicker(false); // Keep open to add multiple emojis like IG
                      }}
                      autoFocusSearch={false}
                      theme={"dark" as any}
                      width={320}
                      height={400}
                    />
                  </div>
                )}
              </div>

              <Input
                value={text}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Type your message..."
                className="border-none bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                onFocus={() => setShowEmojiPicker(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg transition-all hover:scale-105 hover:shadow-indigo-500/25 active:scale-95"
                onClick={submit}
              >
                <SendHorizontal className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="flex w-full items-center justify-center rounded-lg bg-muted/30 p-2 text-sm text-muted-foreground">
              {other.friendshipStatus === "received" ? (
                <div className="flex items-center gap-4">
                  <span>{other.username} wants to chat with you</span>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => onProfileOpen?.(other)}>
                    View Request
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span>You must be friends to chat</span>
                  {other.friendshipStatus === "sent" && (
                    <Button size="sm" variant="ghost" className="h-8 text-xs text-red-500 hover:bg-red-500/10 gap-1" onClick={() => onProfileOpen?.(other)}>
                      <XCircle className="h-3 w-3" /> Cancel Request
                    </Button>
                  )}
                  {other.friendshipStatus === "none" && (
                    <Button size="sm" className="h-8 gap-2 bg-primary shadow-lg hover:shadow-primary/20" onClick={() => onProfileOpen?.(other)}>
                      <UserPlus className="h-4 w-4" /> Add Friend
                    </Button>
                  )}
                  {other.friendshipStatus === "sent" && (
                    <Button size="sm" variant="secondary" className="h-8" disabled>
                      Request Pending
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

