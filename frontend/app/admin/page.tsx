"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    MessageSquare,
    Send,
    ShieldAlert,
    Trash2,
    ArrowLeft,
    Activity,
    UserCheck,
    UserX,
    X,
    ChevronRight,
    Search,
    Clock
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";
import { formatLastSeen, formatMessageTime } from "@/lib/time";
import { MessageBubble } from "@/components/message-bubble";
import { Input } from "@/components/ui/input";

export default function AdminDashboard() {
    const router = useRouter();
    const { token, user, loading: authLoading } = useAuth();
    const [stats, setStats] = React.useState<any>(null);
    const [users, setUsers] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Chat Viewer State
    const [viewingUser, setViewingUser] = React.useState<any>(null);
    const [conversations, setConversations] = React.useState<any[]>([]);
    const [selectedPartner, setSelectedPartner] = React.useState<any>(null);
    const [chatMessages, setChatMessages] = React.useState<any[]>([]);
    const [chatLoading, setChatLoading] = React.useState(false);
    const [convsLoading, setConvsLoading] = React.useState(false);

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
    const [deleteLoading, setDeleteLoading] = React.useState(false);

    const fetchData = React.useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const [sRes, uRes] = await Promise.all([
                apiFetch<any>("/api/admin/stats", { token }),
                apiFetch<any>("/api/admin/users", { token })
            ]);
            setStats(sRes.stats);
            setUsers(uRes.users);
        } catch (e: any) {
            toast.error(e.message || "Failed to load admin data");
            router.push("/chat");
        } finally {
            setLoading(false);
        }
    }, [token, router]);

    React.useEffect(() => {
        if (authLoading) return;
        if (!token || user?.role !== "admin") {
            router.push("/chat");
            return;
        }
        fetchData();
    }, [authLoading, token, user, router, fetchData]);

    async function toggleRole(userId: string) {
        try {
            const res = await apiFetch<any>("/api/admin/toggle-role", {
                method: "POST",
                body: { userId },
                token
            });
            toast.success(res.message);
            fetchData();
        } catch (e: any) {
            toast.error(e.message);
        }
    }

    async function deleteUser(userId: string) {
        setConfirmState({
            open: true,
            title: "Delete User?",
            description: "Are you SURE? This deletes the user and ALL their chats forever. This action is irreversible.",
            variant: "destructive",
            onConfirm: async () => {
                try {
                    setDeleteLoading(true);
                    const res = await apiFetch<any>(`/api/admin/user/${userId}`, {
                        method: "DELETE",
                        token
                    });
                    toast.success(res.message);
                    setConfirmState(p => ({ ...p, open: false }));
                    fetchData();
                } catch (e: any) {
                    toast.error(e.message);
                } finally {
                    setDeleteLoading(false);
                }
            }
        });
    }

    // Chat Viewer Functions
    async function openChatViewer(u: any) {
        setViewingUser(u);
        setConversations([]);
        setSelectedPartner(null);
        setChatMessages([]);
        setConvsLoading(true);
        try {
            const res = await apiFetch<any>(`/api/admin/conversations/${u._id}`, { token });
            setConversations(res.conversations || []);
        } catch (e: any) {
            toast.error("Failed to fetch conversations");
        } finally {
            setConvsLoading(false);
        }
    }

    async function loadFullChat(partner: any) {
        setSelectedPartner(partner);
        setChatMessages([]);
        setChatLoading(true);
        try {
            const res = await apiFetch<any>(`/api/admin/conversation?userA=${viewingUser._id}&userB=${partner._id}`, { token });
            setChatMessages(res.messages || []);
        } catch (e: any) {
            toast.error("Failed to load chat history");
        } finally {
            setChatLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen p-8 space-y-8 bg-background">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-foreground p-4 md:p-8 selection:bg-primary/30">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary">
                            <ShieldAlert className="h-5 w-5" />
                            <span className="text-sm font-bold uppercase tracking-widest text-primary/80">Control Center</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/chat")}
                        className="gap-2 border-white/10 bg-white/5 hover:bg-white/10"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Chat
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Users" value={stats?.totalUsers} icon={Users} color="text-blue-500" />
                    <StatCard title="Messages Sent" value={stats?.totalMessages} icon={MessageSquare} color="text-green-500" />
                    <StatCard title="Friend Requests" value={stats?.totalRequests} icon={Send} color="text-purple-500" />
                    <StatCard title="Users Online" value={stats?.onlineUsers} icon={Activity} color="text-primary" />
                </div>

                {/* User Management Table */}
                <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl">
                    <CardHeader className="border-b border-white/5 p-6 bg-white/[0.02]">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            User Management
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Manage permissions and monitor user activity across the platform.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">User</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Email</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Role</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Last Active</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Joined</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((u) => (
                                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary/20 to-primary/40 flex items-center justify-center font-bold text-primary border border-primary/20">
                                                    {u.username[0].toUpperCase()}
                                                </div>
                                                <span className="font-bold text-gray-200">{u.username}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400 font-medium">{u.email}</td>
                                        <td className="p-4">
                                            <Badge variant={u.role === "admin" ? "default" : "secondary"} className="font-bold uppercase tracking-tighter text-[10px]">
                                                {u.role}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${u.online ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-600"}`} />
                                                <span className="text-xs font-medium text-gray-400">
                                                    {u.online ? "Online" : formatLastSeen(u.lastSeen)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs text-gray-500 font-medium">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openChatViewer(u)}
                                                    title="View Chats"
                                                    className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleRole(u._id)}
                                                    title={u.role === "admin" ? "Demote to User" : "Promote to Admin"}
                                                    disabled={u.email === "xyzg135@gmail.com"}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {u.role === "admin" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteUser(u._id)}
                                                    disabled={u.email === "xyzg135@gmail.com"}
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {/* Chat Viewer Modal */}
            {viewingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-6xl h-[85vh] bg-zinc-900 border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black">Chat History: {viewingUser.username}</h2>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{viewingUser.email}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setViewingUser(null)} className="rounded-full hover:bg-white/5">
                                <X className="h-6 w-6" />
                            </Button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Conversations List */}
                            <div className="w-80 border-r border-white/5 bg-black/20 overflow-y-auto">
                                <div className="p-4 border-b border-white/5 sticky top-0 bg-zinc-900/80 backdrop-blur-md z-10">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <Input className="pl-9 h-9 bg-white/5 border-white/10 text-sm" placeholder="Search conversations..." />
                                    </div>
                                </div>

                                {convsLoading ? (
                                    <div className="p-4 space-y-4">
                                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm italic">No conversations found.</div>
                                ) : (
                                    conversations.map((conv) => (
                                        <button
                                            key={conv.partner._id}
                                            onClick={() => loadFullChat(conv.partner)}
                                            className={cn(
                                                "w-full p-4 flex items-center gap-3 transition-all border-b border-white/5 hover:bg-white/5 text-left",
                                                selectedPartner?._id === conv.partner._id && "bg-primary/10 border-r-2 border-r-primary"
                                            )}
                                        >
                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-gray-400 border border-white/10 overflow-hidden">
                                                    {conv.partner.avatar ? <img src={conv.partner.avatar} className="w-full h-full object-cover" /> : conv.partner.username[0].toUpperCase()}
                                                </div>
                                                {conv.partner.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-sm text-gray-200 truncate">{conv.partner.username}</span>
                                                    <span className="text-[10px] text-gray-500">{formatMessageTime(conv.lastMessage?.timestamp || new Date())}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage?.text || (conv.lastMessage?.image ? "Sent a photo" : "No messages")}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-white/5 rounded text-gray-400">{conv.messageCount} msgs</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-700" />
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Chat Messages Log */}
                            <div className="flex-1 flex flex-col bg-black/40 relative">
                                {!selectedPartner ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-4">
                                        <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
                                            <MessageSquare className="h-12 w-12 text-gray-700" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-gray-400">Select a conversation</p>
                                            <p className="text-sm max-w-xs mx-auto">Click on a contact to the left to view the full encrypted message history.</p>
                                        </div>
                                    </div>
                                ) : chatLoading ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="space-y-4 w-full max-w-md p-8">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                                                    <Skeleton className="h-12 w-48 rounded-2xl" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Chat Log Header */}
                                        <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-zinc-900/30 backdrop-blur-md">
                                            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-gray-400 border border-white/5 text-xs overflow-hidden">
                                                {selectedPartner.avatar ? <img src={selectedPartner.avatar} className="w-full h-full object-cover" /> : selectedPartner.username[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-gray-200">{viewingUser.username} & {selectedPartner.username}</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> Secure Log View
                                                </p>
                                            </div>
                                        </div>

                                        {/* Messages Area */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {chatMessages.length === 0 ? (
                                                <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">Conversation is empty.</div>
                                            ) : (
                                                chatMessages.map(msg => (
                                                    <MessageBubble
                                                        key={msg._id}
                                                        message={msg}
                                                        isMine={String(msg.senderId) === String(viewingUser._id)}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={confirmState.open}
                onOpenChange={(open) => setConfirmState(p => ({ ...p, open }))}
                title={confirmState.title}
                description={confirmState.description}
                onConfirm={confirmState.onConfirm}
                variant={confirmState.variant}
                loading={deleteLoading}
            />

            {/* Version Footer */}
            <div className="max-w-7xl mx-auto py-8 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase tracking-[0.2em]">
                <span>System Secure Protocol v1.3</span>
                <span>Dashboard Live Status: Active</span>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl overflow-hidden group hover:border-primary/30 transition-all">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p>
                        <p className="text-3xl font-black text-white">{value}</p>
                    </div>
                    <div className={`p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all ${color}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
