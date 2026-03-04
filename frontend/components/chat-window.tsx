"use client";

import * as React from "react";
import { SendHorizontal, UserPlus, XCircle, Trash2, Image as ImageIcon, Loader2, Smile, Menu, MessageSquare, Users, Plus, Film } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Mic } from "lucide-react";
import dynamic from "next/dynamic";
import { formatLastSeen } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TypingIndicator } from "@/components/typing-indicator";
import { MessageBubble } from "@/components/message-bubble";
import { GifPicker } from "@/components/gif-picker";
import { VoiceRecorder } from "@/components/voice-recorder";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import type { Message, User } from "@/lib/types";

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
  onClearChat,
  onOpenSidebar,
}: {
  meId: string;
  other: User | null;
  messages: Message[];
  typingLabel: string | null;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onSend: (text: string, image?: string, voice?: string, duration?: number, type?: "text" | "image" | "voice" | "gif") => void;
  onEdit: (id: string, text: string) => void;
  onUnsend: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onProfileOpen?: (user: User) => void;
  onClearChat?: () => void;
  onOpenSidebar?: () => void;
}) {
  const { token } = useAuth();
  const [text, setText] = React.useState("");
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showGifPicker, setShowGifPicker] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const pickerRef = React.useRef<HTMLDivElement | null>(null);
  const gifPickerRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const typingTimeout = React.useRef<number | null>(null);

  // Close emoji picker when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (gifPickerRef.current && !gifPickerRef.current.contains(event.target as Node)) {
        setShowGifPicker(false);
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

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 1. Validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported format.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" is over 5MB.`);
        return;
      }
    }

    // 2. Upload and Send (Parallel)
    try {
      setUploading(true);
      const loadingToast = toast.loading(`Uploading ${files.length > 1 ? files.length + " images" : "image"}...`);

      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("image", file);

        const res = await apiFetch<any>("/api/messages/upload", {
          method: "POST",
          body: formData,
          token: token
        });

        if (res.success) {
          onSend("", res.url, undefined, undefined, "image");
        } else {
          throw new Error(res.message || "Upload failed");
        }
      });

      await Promise.all(uploadPromises);
      toast.dismiss(loadingToast);
      if (files.length > 1) {
        toast.success(`Sent ${files.length} images successfully!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Some uploads failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleChange(v: string) {
    setText(v);
    onTypingStart();
    scheduleStopTyping();
  }

  function submit() {
    const t = text.trim();
    if (!t) return;
    onSend(t, undefined, undefined, undefined, "text");
    setText("");
    onTypingStop();
  }

  async function handleVoiceSend(blob: Blob, duration: number) {
    try {
      setUploading(true);
      const loadingToast = toast.loading("Sending voice message...");

      const formData = new FormData();
      formData.append("file", blob, "voice.webm");

      const res = await apiFetch<any>("/api/messages/upload", {
        method: "POST",
        body: formData,
        token: token
      });

      if (res.success) {
        onSend("", undefined, res.url, duration, "voice");
        toast.dismiss(loadingToast);
      } else {
        throw new Error(res.message || "Upload failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send voice message");
    } finally {
      setUploading(false);
      setIsRecording(false);
    }
  }

  function handleGifSelect(url: string) {
    onSend("", url, undefined, undefined, "gif");
    setShowGifPicker(false);
  }

  if (!other) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center bg-edtech">
        <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative flex h-full w-full items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <MessageSquare className="h-14 w-14" />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Start a Conversation
            </h2>
            <p className="text-muted-foreground leading-relaxed font-medium">
              Connect with friends instantly. Experience real-time messaging with
              premium animations and enterprise-grade security.
            </p>
          </div>
          <div className="pt-4">
            <Button
              size="lg"
              onClick={onOpenSidebar}
              className="md:hidden w-full max-w-[240px] h-14 rounded-2xl bg-white text-indigo-600 font-bold shadow-xl shadow-white/10 hover:scale-105 active:scale-95 transition-all group"
            >
              <Users className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Discover Users
            </Button>
            <div className="hidden md:flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
              <span className="h-px w-8 bg-current/20" />
              Select a contact to begin
              <span className="h-px w-8 bg-current/20" />
            </div>
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
              <span className={cn("h-2 w-2 rounded-full flex-shrink-0", other.online ? "bg-emerald-500 animate-pulse-subtle" : "bg-muted-foreground/40")} />
              {other.online ? "Online" : formatLastSeen(other.lastSeen)}
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
        className="flex-1 flex flex-col space-y-4 overflow-y-auto p-3 md:p-4"
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
              {isRecording ? (
                <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setIsRecording(false)} />
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                  />

                  {/* Plus Menu (Attachment) */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 transition-all rounded-full"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-48 p-2 glass border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          className="justify-start gap-3 h-11 text-zinc-300 hover:text-white hover:bg-white/5"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium">Photos & Videos</span>
                        </Button>

                        <Popover open={showGifPicker} onOpenChange={setShowGifPicker}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="justify-start gap-3 h-11 text-zinc-300 hover:text-white hover:bg-white/5"
                            >
                              <div className="h-8 w-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                                <Film className="h-4 w-4 text-pink-500" />
                              </div>
                              <span className="text-sm font-medium">GIFs</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent side="top" align="start" className="p-0 border-none bg-transparent shadow-none w-fit">
                            <GifPicker onSelect={handleGifSelect} />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Emoji Picker */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-10 w-10 shrink-0 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-all rounded-full",
                        showEmojiPicker && "text-amber-500 bg-amber-500/10"
                      )}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      <Smile className="h-5 w-5" />
                    </Button>

                    {showEmojiPicker && (
                      <div className="absolute bottom-12 left-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            setText((prev) => prev + emojiData.emoji);
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
                    className="border-none bg-muted/60 focus-visible:ring-1 focus-visible:ring-indigo-500/30 h-11 rounded-2xl"
                    onFocus={() => {
                      setShowEmojiPicker(false);
                      setShowGifPicker(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit();
                      }
                    }}
                  />

                  {text.trim() ? (
                    <Button
                      size="icon"
                      className="h-11 w-11 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 rounded-full"
                      onClick={submit}
                    >
                      <SendHorizontal className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-11 w-11 shrink-0 text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 transition-all rounded-full"
                      onClick={() => setIsRecording(true)}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              )}
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

