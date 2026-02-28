"use client";

import * as React from "react";
import { Bell, UserCheck, XCircle, User as UserIcon, Inbox } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/lib/types";

export function NotificationsPopover({
    requests,
    onAction,
}: {
    requests: User[];
    onAction: (action: string, data: any) => void;
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 hover:bg-primary/10 transition-colors">
                    <Bell className="h-5 w-5" />
                    {requests.length > 0 && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-background animate-in zoom-in duration-300">
                            {requests.length}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm" align="end">
                <div className="flex items-center justify-between border-b border-primary/10 p-4">
                    <div className="flex items-center gap-2">
                        <Inbox className="h-4 w-4 text-primary" />
                        <h4 className="font-bold text-base">Friend Requests</h4>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {requests.length} New
                    </span>
                </div>
                <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                    {requests.length === 0 ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-3 p-6 text-center">
                            <div className="rounded-full bg-muted p-4">
                                <Bell className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">No new requests</p>
                                <p className="text-xs text-muted-foreground mt-1">When someone sends you a friend request, it will show up here.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col py-2">
                            {requests.map((u) => (
                                <div key={u._id} className="group flex items-start gap-4 p-4 hover:bg-primary/5 transition-all duration-200">
                                    <Avatar className="h-11 w-11 border-2 border-primary/10 shrink-0">
                                        <AvatarImage src={u.avatar} alt={u.username} />
                                        <AvatarFallback><UserIcon className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1 overflow-hidden">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold truncate text-foreground">{u.username}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1">Wants to connect with you</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                className="h-8 flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
                                                onClick={() => onAction("acceptFriend", { requestId: u.requestId })}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 flex-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 font-medium"
                                                onClick={() => onAction("declineFriend", { requestId: u.requestId })}
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {requests.length > 0 && (
                    <div className="border-t border-primary/10 p-2 text-center">
                        <p className="text-[10px] text-muted-foreground">Manage all your connections in settings</p>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
