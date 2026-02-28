"use client";

import { motion } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserCard({
  user,
  active,
  onClick,
  onProfileOpen
}: {
  user: User;
  active: boolean;
  onClick: () => void;
  onProfileOpen?: (user: User) => void;
}) {
  const online = !!user.online;
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left"
      type="button"
    >
      <Card
        className={cn(
          "group flex items-center gap-3 p-3 transition-all duration-300 hover:shadow-lg border-transparent",
          active ? "glass border-primary/40 shadow-md ring-1 ring-primary/20" : "hover:bg-muted/50"
        )}
      >
        <div className="relative" onClick={(e) => { e.stopPropagation(); onProfileOpen?.(user); }}>
          <Avatar className="h-10 w-10 ring-2 ring-background transition-transform group-hover:scale-110 cursor-pointer">
            <AvatarImage src={user.avatar || ""} alt={user.username} />
            <AvatarFallback>{initials(user.username)}</AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-background",
              online ? "bg-emerald-500 animate-pulse-subtle" : "bg-muted-foreground/40"
            )}
            aria-label={online ? "Online" : "Offline"}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">
                {user.isMe ? "My Profile" : user.username}
              </span>
              {user.isMe && (
                <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary ring-1 ring-inset ring-primary/20">
                  Me
                </span>
              )}
              {user.friendshipStatus === "received" && (
                <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-500 ring-1 ring-inset ring-amber-500/20">
                  Request
                </span>
              )}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {user.isMe ? "Click avatar to set status" : (user.status || (online ? "Online" : "Offline"))}
            </div>
          </div>
          {!!user.unreadCount && user.unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-lg"
            >
              {user.unreadCount > 99 ? "99+" : user.unreadCount}
            </motion.div>
          )}
        </div>
      </Card>
    </motion.button>
  );
}

