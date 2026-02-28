"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCard } from "@/components/user-card";
import type { User } from "@/lib/types";

export function Sidebar({
  users,
  loading,
  activeUserId,
  onSelectUser,
  onProfileOpen,
}: {
  users: User[];
  loading: boolean;
  activeUserId: string | null;
  onSelectUser: (user: User) => void;
  onProfileOpen?: (user: User) => void;
}) {
  const [q, setQ] = React.useState("");
  const sortedUsers = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = users.filter((u) =>
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );

    return [...filtered].sort((a, b) => {
      if (a.isMe) return -1;
      if (b.isMe) return 1;
      if (a.friendshipStatus === "received" && b.friendshipStatus !== "received") return -1;
      if (b.friendshipStatus === "received" && a.friendshipStatus !== "received") return 1;
      return 0;
    });
  }, [q, users]);

  return (
    <div className="glass flex h-full flex-col gap-3 p-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users..." className="pl-9" />
      </div>

      <div className="space-y-2 overflow-y-auto p-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))
        ) : sortedUsers.length === 0 ? (
          <div className="mt-8 text-center text-sm text-muted-foreground">No users found</div>
        ) : (
          sortedUsers.map((u) => (
            <UserCard
              key={String(u._id)}
              user={u}
              active={activeUserId === String(u._id)}
              onClick={() => onSelectUser(u)}
              onProfileOpen={onProfileOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}
