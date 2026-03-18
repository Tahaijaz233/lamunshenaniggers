export interface User {
  id?: string;
  _id?: string;
  username: string;
  displayName: string;
  avatar: string | null;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
}

export interface Message {
  _id: string;
  sender: User;
  recipient?: string;
  group?: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'sticker' | 'instagram_reel' | 'voice';
  content: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  replyTo?: {
    message: string;
    content: string;
    type: string;
    sender: User;
  };
  reactions: {
    user: string;
    emoji: string;
  }[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  readBy: {
    user: string;
    readAt: string;
  }[];
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  avatar: string | null;
  creator: User;
  admins: string[];
  members: {
    user: User;
    joinedAt: string;
    role: 'admin' | 'member';
  }[];
  isPrivate: boolean;
  inviteLink: string;
  settings: {
    onlyAdminsCanPost: boolean;
    onlyAdminsCanAddMembers: boolean;
  };
  lastMessage?: {
    content: string;
    sender: User;
    timestamp: string;
  };
}

export interface Sticker {
  _id: string;
  name: string;
  url: string;
  creator: User;
  pack: string;
  tags: string[];
  isAnimated: boolean;
  usageCount: number;
}

export interface Call {
  _id: string;
  caller: User;
  recipient: User;
  type: 'voice' | 'video';
  status: 'missed' | 'ongoing' | 'completed' | 'rejected';
  startedAt: string;
  endedAt?: string;
  duration: number;
}

export interface ChatState {
  currentUser: User | null;
  selectedChat: User | Group | null;
  chatType: 'direct' | 'group' | null;
  messages: Message[];
  contacts: User[];
  groups: Group[];
  onlineUsers: string[];
  typingUsers: string[];
}