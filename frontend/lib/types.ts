export type User = {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  online?: boolean;
  unreadCount?: number;
  status?: string;
  friends?: string[];
  blockedUsers?: string[];
  friendshipStatus?: "none" | "sent" | "received" | "accepted" | "me";
  isMe?: boolean;
  isBlockedByMe?: boolean;
  hasBlockedMe?: boolean;
};

export type Message = {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string | Date;
  seen: boolean;
  isEdited?: boolean;
  reactions?: { userId: string; emoji: string }[];
};

