"use client";

import * as React from "react";
import { User, ShieldAlert, UserPlus, UserCheck, UserMinus, XCircle, Edit2, Check } from "lucide-react";
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
    const [editingStatus, setEditingStatus] = React.useState(false);
    const [newStatus, setNewStatus] = React.useState(user?.status || "");
    const [loading, setLoading] = React.useState(false);

    const isMe = currentUser?._id === user?._id;

    React.useEffect(() => {
        if (user) setNewStatus(user.status || "");
    }, [user]);

    if (!user) return null;

    async function handleStatusUpdate() {
        setLoading(true);
        await onAction("updateStatus", { status: newStatus });
        setEditingStatus(false);
        setLoading(false);
    }

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
                        <DialogTitle className="text-2xl font-bold">{user.username}</DialogTitle>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                    </DialogHeader>

                    <div className="mt-6 space-y-4">
                        <div className="group relative rounded-xl bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary/60">Status</div>
                            {editingStatus ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={newStatus}
                                        onChange={e => setNewStatus(e.target.value)}
                                        className="h-8 bg-background/50 border-primary/20"
                                        autoFocus
                                    />
                                    <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleStatusUpdate} disabled={loading}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <p className="italic text-foreground/90">"{user.status || "No status set"}"</p>
                                    {isMe && (
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditingStatus(true)}>
                                            <Edit2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                            {!isMe && (
                                <>
                                    {user.friendshipStatus === "none" && (
                                        <Button className="w-full gap-2 bg-primary shadow-lg hover:shadow-primary/20" onClick={() => onAction("addFriend")} disabled={loading}>
                                            <UserPlus className="h-4 w-4" /> Add Friend
                                        </Button>
                                    )}
                                    {user.friendshipStatus === "sent" && (
                                        <div className="flex flex-col gap-2">
                                            <Button variant="secondary" className="w-full gap-2" disabled>
                                                <UserCheck className="h-4 w-4" /> Request Pending
                                            </Button>
                                            <Button variant="ghost" className="w-full gap-2 text-xs text-red-500 hover:bg-red-500/10" onClick={() => onAction("cancelFriend", { requestId: user.requestId })} disabled={loading}>
                                                <XCircle className="h-3 w-3" /> Cancel Request
                                            </Button>
                                        </div>
                                    )}
                                    {user.friendshipStatus === "received" && (
                                        <div className="flex flex-col gap-2">
                                            <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg" onClick={() => onAction("acceptFriend", { requestId: user.requestId })} disabled={loading}>
                                                <UserCheck className="h-4 w-4" /> Accept Request
                                            </Button>
                                            <Button variant="outline" className="w-full gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => onAction("declineFriend", { requestId: user.requestId })} disabled={loading}>
                                                <XCircle className="h-4 w-4" /> Decline Request
                                            </Button>
                                        </div>
                                    )}
                                    {user.friendshipStatus === "accepted" && (
                                        <Button variant="outline" className="w-full gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => onAction("unfriend")} disabled={loading}>
                                            <UserMinus className="h-4 w-4" /> Unfriend
                                        </Button>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="ghost" className="flex-1 gap-2 text-xs text-muted-foreground hover:text-red-500" onClick={() => onAction("block")} disabled={loading}>
                                            <ShieldAlert className="h-3 w-3" /> Block User
                                        </Button>
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
