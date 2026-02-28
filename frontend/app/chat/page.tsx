"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { ChatWindow } from "@/components/chat-window";
import { ProfileDialog } from "@/components/profile-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import type { Message, User } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useSocket } from "@/hooks/useSocket";

export default function ChatPage() {
  const router = useRouter();
  const { token, user, loading: authLoading, logout } = useAuth();
  const socket = useSocket(token);

  const [users, setUsers] = React.useState<User[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(true);
  const [onlineIds, setOnlineIds] = React.useState<Set<string>>(new Set());

  const [activeUser, setActiveUser] = React.useState<User | null>(null);
  const [activeProfile, setActiveProfile] = React.useState<User | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [typingFrom, setTypingFrom] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    try {
      const res = await apiFetch<{ users: User[] }>("/api/users", { token });
      setUsers(res.users || []);
    } catch (_e) { }
  }, [token]);

  const onSocialRefresh = fetchUsers;

  const [confirmState, setConfirmState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: "default" | "destructive";
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => { },
    variant: "default",
  });

  const meId = user?._id || "";

  const activeUserRef = React.useRef<User | null>(activeUser);
  const meIdRef = React.useRef<string>(meId);
  const usersRef = React.useRef<User[]>(users);

  React.useEffect(() => {
    activeUserRef.current = activeUser;
    meIdRef.current = meId;
    usersRef.current = users;
  }, [activeUser, meId, users]);

  React.useEffect(() => {
    if (authLoading) return;
    if (!token) router.push("/");
  }, [authLoading, token, router]);

  // Load users
  React.useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setUsersLoading(true);
    apiFetch<{ users: User[] }>("/api/users", { token })
      .then((res) => {
        if (cancelled) return;
        setUsers(res.users || []);
      })
      .catch((e) => {
        if (String(e?.message || "").toLowerCase().includes("unauthorized")) {
          logout();
          router.push("/login");
        }
      })
      .finally(() => !cancelled && setUsersLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, logout, router]);


  const openChat = React.useCallback(async (u: User) => {
    if (!token || !socket) return;
    setActiveUser(u);
    setMobileOpen(false);
    setTypingFrom(null);

    setUsers(prev => prev.map(user =>
      String(user._id) === String(u._id) ? { ...user, unreadCount: 0 } : user
    ));

    const res = await apiFetch<{ messages: Message[] }>(`/api/messages/${u._id}`, { token });
    setMessages(res.messages || []);

    socket.emit("joinChat", { otherUserId: u._id });
    socket.emit("markSeen", { otherUserId: u._id });
  }, [token, socket]);

  const onMsg = React.useCallback(({ message }: { message: Message }) => {
    const curActive = activeUserRef.current;
    const curMe = meIdRef.current;
    if (!curActive) return;

    const isThisChat =
      (String(message.senderId) === String(curActive._id) && String(message.receiverId) === String(curMe)) ||
      (String(message.senderId) === String(curMe) && String(message.receiverId) === String(curActive._id));

    if (!isThisChat) return;

    setMessages((prev) => {
      if (prev.find(m => m._id === message._id)) return prev;
      return [...prev, message];
    });
  }, []);

  const onNotification = React.useCallback(({ message }: { message: Message }) => {
    const curActive = activeUserRef.current;
    const curUsers = usersRef.current;
    const senderId = String(message.senderId);

    const sender = curUsers.find(u => String(u._id) === senderId);
    const isNotActiveChat = !curActive || String(curActive._id) !== senderId;

    if (isNotActiveChat && sender) {
      toast.info(`New message from ${sender.username}`, {
        description: message.text.length > 50 ? message.text.slice(0, 50) + "..." : message.text,
        action: { label: "Open", onClick: () => openChat(sender) }
      });
    }

    setUsers(prev => prev.map(u =>
      String(u._id) === senderId ? { ...u, unreadCount: (u.unreadCount || 0) + 1 } : u
    ));
  }, [openChat]);

  React.useEffect(() => {
    if (!socket) return;
    const onOnline = (ids: string[]) => setOnlineIds(new Set(ids.map(String)));
    const onTyping = ({ from }: { from: string }) => setTypingFrom(String(from));
    const onStopTyping = ({ from }: { from: string }) => {
      const curActive = activeUserRef.current;
      if (curActive && String(from) === String(curActive._id)) setTypingFrom(null);
    };
    const onSeenUpdate = ({ by }: { by: string }) => {
      const curActive = activeUserRef.current;
      const curMe = meIdRef.current;
      if (!curActive) return;
      if (String(by) !== String(curActive._id)) return;
      setMessages((prev) => prev.map((m) => (String(m.senderId) === String(curMe) ? { ...m, seen: true } : m)));
    };

    const onUpdate = ({ message }: { message: Message }) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };
    const onDelete = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    socket.on("onlineUsers", onOnline);
    socket.on("message", onMsg);
    socket.on("messageNotification", onNotification);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);
    socket.on("seenUpdate", onSeenUpdate);
    socket.on("messageUpdate", onUpdate);
    socket.on("messageDelete", onDelete);

    const onChatCleared = ({ from }: { from: string }) => {
      const curActive = activeUserRef.current;
      if (curActive && String(from) === String(curActive._id)) {
        setMessages([]);
      }
    };

    socket.on("friendRequest", onSocialRefresh);
    socket.on("friendAccept", onSocialRefresh);
    socket.on("friendCancel", onSocialRefresh);
    socket.on("friendDecline", onSocialRefresh);
    socket.on("unfriend", onSocialRefresh);
    socket.on("blockUpdate", onSocialRefresh);
    socket.on("chatCleared", onChatCleared);

    return () => {
      socket.off("onlineUsers", onOnline);
      socket.off("message", onMsg);
      socket.off("messageNotification", onNotification);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
      socket.off("seenUpdate", onSeenUpdate);
      socket.off("messageUpdate", onUpdate);
      socket.off("messageDelete", onDelete);
      socket.off("friendRequest", onSocialRefresh);
      socket.off("friendAccept", onSocialRefresh);
      socket.off("friendCancel", onSocialRefresh);
      socket.off("friendDecline", onSocialRefresh);
      socket.off("unfriend", onSocialRefresh);
      socket.off("blockUpdate", onSocialRefresh);
      socket.off("chatCleared", onChatCleared);
    };
  }, [socket, onMsg, onNotification, token]);

  // Merge online status into users list
  const usersWithStatus = React.useMemo(() => {
    return users.map((u: any) => ({
      ...u,
      online: (u.isBlockedByMe || u.hasBlockedMe) ? false : (u.isMe ? true : onlineIds.has(String(u._id)))
    }));
  }, [users, onlineIds]);


  function onTypingStart() {
    if (!socket || !activeUser) return;
    socket.emit("typing", { otherUserId: activeUser._id });
  }
  function onTypingStop() {
    if (!socket || !activeUser) return;
    socket.emit("stopTyping", { otherUserId: activeUser._id });
  }

  function onSend(text: string) {
    if (!socket || !activeUser) return;
    socket.emit("sendMessage", { to: activeUser._id, text, tempId: crypto.randomUUID?.() });
  }

  const onEditMessage = React.useCallback((messageId: string, newText: string) => {
    socket?.emit("editMessage", { messageId, newText });
  }, [socket]);

  const onUnsendMessage = React.useCallback((messageId: string) => {
    socket?.emit("unsendMessage", { messageId });
  }, [socket]);

  const onReactToMessage = React.useCallback((messageId: string, emoji: string) => {
    socket?.emit("reactToMessage", { messageId, emoji });
  }, [socket]);

  React.useEffect(() => {
    if (!activeUser || !socket) return;
    socket.emit("markSeen", { otherUserId: activeUser._id });
  }, [messages.length, activeUser, socket]);

  const typingLabel =
    typingFrom && activeUser && String(typingFrom) === String(activeUser._id) ? `${activeUser.username} is typing` : null;

  async function handleSocialAction(action: string, data?: any) {
    try {
      if (action === "updateProfile") {
        await apiFetch("/api/users/profile", { method: "PATCH", body: data, token });
        toast.success("Profile updated");
      } else if (action === "addFriend") {
        await apiFetch("/api/users/friend-request", { method: "POST", body: { receiverId: activeProfile?._id }, token });
        toast.success("Friend request sent");
      } else if (action === "acceptFriend") {
        await apiFetch("/api/users/friend-accept", { method: "POST", body: { requestId: data.requestId }, token });
        toast.success("Friend request accepted");
      } else if (action === "block") {
        await apiFetch("/api/users/block", { method: "POST", body: { userId: data?.userId || activeProfile?._id }, token });
        toast.success("User blocked");
      } else if (action === "unblock") {
        await apiFetch("/api/users/unblock", { method: "POST", body: { userId: data?.userId || activeProfile?._id }, token });
        toast.success("User unblocked");
      } else if (action === "unfriend") {
        await apiFetch("/api/users/unfriend", { method: "POST", body: { userId: data?.userId || activeProfile?._id }, token });
        toast.success("Unfriended successfully");
      } else if (action === "cancelFriend") {
        await apiFetch("/api/users/friend-cancel", { method: "POST", body: { requestId: data.requestId }, token });
        toast.success("Friend request cancelled");
      } else if (action === "declineFriend") {
        await apiFetch("/api/users/friend-decline", { method: "POST", body: { requestId: data.requestId }, token });
        toast.success("Friend request declined");
      } else if (action === "clearAll") {
        setConfirmState({
          open: true,
          title: "Delete All Messages?",
          description: "Are you sure you want to delete ALL messages globally? This cannot be undone.",
          variant: "destructive",
          onConfirm: async () => {
            try {
              await apiFetch("/api/messages/all", { method: "DELETE", token });
              toast.success("All messages cleared");
              setMessages([]);
            } catch (err: any) {
              toast.error(err.message || "Failed to clear messages");
            }
          }
        });
      } else if (action === "clearChat") {
        if (!activeUser) return;
        setConfirmState({
          open: true,
          title: `Clear chat with ${activeUser.username}?`,
          description: "This will delete all messages for both you and the receiver. This action cannot be undone.",
          variant: "destructive",
          onConfirm: async () => {
            try {
              await apiFetch(`/api/messages/${activeUser._id}/clear`, { method: "DELETE", token });
              setMessages([]);
              toast.success("Chat cleared");
            } catch (err: any) {
              toast.error(err.message || "Failed to clear chat");
            }
          }
        });
      }

      // Refresh user list to get new friendship statuses
      const refreshRes = await apiFetch<{ users: User[] }>("/api/users", { token });
      const newUsers = refreshRes.users || [];
      setUsers(newUsers);

      // Update active user if it was the one modified
      if (activeProfile) {
        const updated = newUsers.find((u: User) => String(u._id) === String(activeProfile._id));
        if (updated) setActiveProfile(updated);
        else setActiveProfile(null);
      }
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    }
  }

  const pendingRequests = React.useMemo(() => {
    return users.filter(u => u.friendshipStatus === "received");
  }, [users]);

  return (
    <div className="min-h-dvh bg-edtech">
      <Navbar
        notifications={pendingRequests}
        onAction={handleSocialAction}
        onMenuToggle={() => setMobileOpen(true)}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto flex flex-col h-[calc(100dvh-4rem)] max-w-7xl gap-2 p-2 md:grid md:grid-cols-[360px_1fr] md:gap-4 md:p-4"
      >
        {/* Mobile active chat indicator (Optional, keeping it simple as per user request to move btn) */}
        {activeUser && (
          <div className="flex items-center justify-center p-2 md:hidden">
            <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
              Chatting with {activeUser.username}
            </span>
          </div>
        )}

        {/* Sidebar (desktop) */}
        <div className="hidden h-[calc(100dvh-6rem)] overflow-hidden md:block">
          <Sidebar
            users={usersWithStatus}
            loading={usersLoading}
            activeUserId={activeUser?._id || null}
            onSelectUser={openChat}
            onProfileOpen={setActiveProfile}
          />
        </div>

        {/* Sidebar (mobile slide-over) */}
        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              className="fixed inset-0 z-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMobileOpen(false)}
                aria-hidden
              />
              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className="absolute left-0 top-0 h-full w-[320px] p-3"
              >
                <div className="h-full overflow-hidden">
                  <Sidebar
                    users={usersWithStatus}
                    loading={usersLoading}
                    activeUserId={activeUser?._id || null}
                    onSelectUser={openChat}
                    onProfileOpen={(u) => { setActiveProfile(u); setMobileOpen(false); }}
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Chat */}
        <div className="flex-1 min-h-0 overflow-hidden md:h-[calc(100dvh-6rem)] shadow-2xl">
          {authLoading ? (
            <Card className="glass h-full p-4">
              <Skeleton className="h-10 w-48" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-16 w-2/3" />
                <Skeleton className="ml-auto h-16 w-2/3" />
                <Skeleton className="h-16 w-2/3" />
              </div>
            </Card>
          ) : user ? (
            <ChatWindow
              meId={user._id}
              other={activeUser ? usersWithStatus.find((x) => x._id === activeUser._id) || activeUser : null}
              messages={messages}
              typingLabel={typingLabel}
              onTypingStart={onTypingStart}
              onTypingStop={onTypingStop}
              onSend={onSend}
              onEdit={onEditMessage}
              onUnsend={onUnsendMessage}
              onReact={onReactToMessage}
              onProfileOpen={setActiveProfile}
              onClearChat={() => handleSocialAction("clearChat")}
            />
          ) : (
            <Card className="glass flex h-full items-center justify-center">
              <Button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
                Go to login
              </Button>
            </Card>
          )}
        </div>
      </motion.div>

      <ProfileDialog
        user={activeProfile}
        currentUser={user}
        isOpen={!!activeProfile}
        onClose={() => setActiveProfile(null)}
        onAction={handleSocialAction}
      />
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open: boolean) => setConfirmState((p) => ({ ...p, open }))}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        variant={confirmState.variant}
      />
    </div>
  );
}

