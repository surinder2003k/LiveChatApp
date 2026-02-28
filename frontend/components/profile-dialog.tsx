"use client";

import * as React from "react";
import { User, ShieldAlert, UserPlus, UserCheck, UserMinus, XCircle, Edit2, Check, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { User as UserType } from "@/lib/types";

function initials(name: string) {
    return name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
}

export function ProfileDialog({
    user,
    currentUser,
    isOpen,
    onClose,
    onAction
}: {
    user: UserType | null;
    currentUser: UserType | null;
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: string, data?: any) => Promise<void>;
}) {
    const [editingProfile, setEditingProfile] = React.useState(false);
    const [newStatus, setNewStatus] = React.useState(user?.status || "");
    const [newUsername, setNewUsername] = React.useState(user?.username || "");
    const [loading, setLoading] = React.useState(false);

    const isMe = currentUser?._id === user?._id;

    React.useEffect(() => {
        if (user) {
            setNewStatus(user.status || "");
            setNewUsername(user.username || "");
        }
    }, [user]);

    if (!user) return null;

    async function handleProfileUpdate() {
        setLoading(true);
        await onAction("updateProfile", { status: newStatus, username: newUsername });
        setEditingProfile(false);
        setLoading(false);
    }

    const onBlock = async () => {
        setLoading(true);
        try {
            await onAction("block", { userId: user._id });
        } finally {
            setLoading(false);
        }
    };

    const onUnblock = async () => {
        setLoading(true);
        try {
            await onAction("unblock", { userId: user._id });
        } finally {
            setLoading(false);
        }
    };

    const onUnfriend = async () => {
        setLoading(true);
        try {
            await onAction("unfriend", { userId: user._id });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass max-w-sm overflow-hidden border-primary/20 p-0 shadow-2xl">
                <div className="relative h-24 bg-gradient-to-r from-indigo-500/20 to-purple-600/20" />

                <div className="px-6 pb-6 text-center">
                    <div className="relative -mt-12 mb-4 inline-block">
                        <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                            <AvatarImage src={user.avatar || ""} alt={user.username} />
                            <AvatarFallback className="text-2xl">{initials(user.username)}</AvatarFallback>
                        </Avatar>
                        {user.online && (
                            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 ring-4 ring-background animate-pulse" />
                        )}
                    </div>

                    <DialogHeader>
                        {editingProfile ? (
                            <div className="space-y-2 mb-2">
                                <div className="text-xs font-semibold uppercase tracking-wider text-primary/60 text-left">Display Name</div>
                                <Input
                                    value={newUsername}
                                    onChange={e => setNewUsername(e.target.value)}
                                    placeholder="Enter your name"
                                    className="h-10 bg-background/50 border-primary/20 text-center font-bold text-lg"
                                />
                            </div>
                        ) : (
                            <>
                                <DialogTitle className="text-2xl font-bold">{user.username}</DialogTitle>
                                {(isMe || currentUser?.role === "admin") && user.email && (
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                )}
                            </>
                        )}
                    </DialogHeader>

                    <div className="mt-6 space-y-4">
                        <div className="group relative rounded-xl bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary/60">Status</div>
                            {editingProfile ? (
                                <div className="space-y-3">
                                    <Input
                                        value={newStatus}
                                        onChange={e => setNewStatus(e.target.value)}
                                        className="h-8 bg-background/50 border-primary/20"
                                        placeholder="Hey there! I am using ChatApp."
                                    />
                                    <div className="flex gap-2">
                                        <Button className="flex-1 h-9 bg-primary" onClick={handleProfileUpdate} disabled={loading}>
                                            <Check className="h-4 w-4 mr-2" /> Save Changes
                                        </Button>
                                        <Button variant="ghost" className="h-9" onClick={() => setEditingProfile(false)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <p className="italic text-foreground/90">&quot;{user.status || "No status set"}&quot;</p>
                                    {isMe && (
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditingProfile(true)}>
                                            <Edit2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-primary/10 mt-4">
                            {!isMe && (
                                <>
                                    <div className="mb-1 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Professional Actions</div>

                                    <div className="flex flex-col gap-2 mt-2">
                                        {!user.isBlockedByMe && !user.hasBlockedMe ? (
                                            <div className="flex gap-2">
                                                {user.friendshipStatus === "none" && (
                                                    <Button className="flex-1 gap-2 bg-primary shadow-lg hover:shadow-primary/20" onClick={() => onAction("addFriend")} disabled={loading}>
                                                        <UserPlus className="h-4 w-4" /> Add Friend
                                                    </Button>
                                                )}
                                                {user.friendshipStatus === "sent" && (
                                                    <Button variant="secondary" className="flex-1 gap-2" disabled>
                                                        <UserCheck className="h-4 w-4" /> Pending
                                                    </Button>
                                                )}
                                                {user.friendshipStatus === "received" && (
                                                    <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg" onClick={() => onAction("acceptFriend", { requestId: user.requestId })} disabled={loading}>
                                                        <UserCheck className="h-4 w-4" /> Accept
                                                    </Button>
                                                )}
                                                {user.friendshipStatus === "accepted" && (
                                                    <Button variant="outline" className="flex-1 gap-2 border-orange-500/20 text-orange-500 hover:bg-orange-500/10" onClick={onUnfriend} disabled={loading}>
                                                        <UserMinus className="h-4 w-4" /> Unfriend
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-[10px] text-center text-muted-foreground/60 italic mb-2">
                                                Interactions restricted
                                            </div>
                                        )}

                                        {user.isBlockedByMe ? (
                                            <Button variant="secondary" className="w-full gap-2 text-primary hover:bg-primary/10 border-primary/20" onClick={onUnblock} disabled={loading}>
                                                <Unlock className="h-4 w-4" /> Unblock User
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/5" onClick={onBlock} disabled={loading}>
                                                <ShieldAlert className="h-4 w-4" /> Block User
                                            </Button>
                                        )}

                                        {user.hasBlockedMe && (
                                            <div className="text-[10px] text-center text-muted-foreground/60 italic mt-1">
                                                This profile has been restricted.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
