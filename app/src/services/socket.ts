import { io, Socket } from 'socket.io-client';
import type { Message } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected');
        const userId = localStorage.getItem('userId');
        if (userId) {
          this.authenticate(userId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      // Message events
      this.socket.on('new_message', (message: Message) => {
        this.emit('new_message', message);
      });

      this.socket.on('message_sent', (message: Message) => {
        this.emit('message_sent', message);
      });

      this.socket.on('message_edited', (message: Message) => {
        this.emit('message_edited', message);
      });

      this.socket.on('message_deleted', (data: { messageId: string }) => {
        this.emit('message_deleted', data);
      });

      this.socket.on('message_read', (data: { messageId: string; readBy: string }) => {
        this.emit('message_read', data);
      });

      this.socket.on('reaction_added', (data: { messageId: string; reactions: any[] }) => {
        this.emit('reaction_added', data);
      });

      // Typing events
      this.socket.on('typing', (data: { userId: string; isTyping: boolean }) => {
        this.emit('typing', data);
      });

      // User status events
      this.socket.on('user_status', (data: { userId: string; status: string; lastSeen?: string }) => {
        this.emit('user_status', data);
      });

      // Call events
      this.socket.on('incoming_call', (data: any) => {
        this.emit('incoming_call', data);
      });

      this.socket.on('call_accepted', (data: any) => {
        this.emit('call_accepted', data);
      });

      this.socket.on('call_rejected', (data: any) => {
        this.emit('call_rejected', data);
      });

      this.socket.on('call_ended', (data: any) => {
        this.emit('call_ended', data);
      });

      this.socket.on('call_failed', (data: any) => {
        this.emit('call_failed', data);
      });

      this.socket.on('ice_candidate', (data: any) => {
        this.emit('ice_candidate', data);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  authenticate(userId: string) {
    if (this.socket) {
      this.socket.emit('authenticate', { userId });
    }
  }

  sendMessage(data: {
    recipientId?: string;
    groupId?: string;
    type: string;
    content: string;
    mediaUrl?: string;
    mediaThumbnail?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    replyTo?: any;
  }) {
    if (this.socket) {
      this.socket.emit('send_message', data);
    }
  }

  sendTyping(data: { recipientId?: string; groupId?: string; isTyping: boolean }) {
    if (this.socket) {
      this.socket.emit('typing', data);
    }
  }

  markRead(messageIds: string[]) {
    if (this.socket) {
      this.socket.emit('mark_read', { messageIds });
    }
  }

  editMessage(messageId: string, content: string) {
    if (this.socket) {
      this.socket.emit('edit_message', { messageId, content });
    }
  }

  deleteMessage(messageId: string) {
    if (this.socket) {
      this.socket.emit('delete_message', { messageId });
    }
  }

  addReaction(messageId: string, emoji: string) {
    if (this.socket) {
      this.socket.emit('add_reaction', { messageId, emoji });
    }
  }

  joinGroup(groupId: string) {
    if (this.socket) {
      this.socket.emit('join_group', groupId);
    }
  }

  leaveGroup(groupId: string) {
    if (this.socket) {
      this.socket.emit('leave_group', groupId);
    }
  }

  // Call methods
  callUser(data: { recipientId: string; type: 'voice' | 'video'; offer: RTCSessionDescriptionInit }) {
    if (this.socket) {
      this.socket.emit('call_user', data);
    }
  }

  respondToCall(data: { callId: string; accepted: boolean; answer?: RTCSessionDescriptionInit }) {
    if (this.socket) {
      this.socket.emit('call_response', data);
    }
  }

  sendIceCandidate(data: { callId: string; candidate: RTCIceCandidateInit; to: string }) {
    if (this.socket) {
      this.socket.emit('ice_candidate', data);
    }
  }

  endCall(data: { callId: string; duration: number }) {
    if (this.socket) {
      this.socket.emit('end_call', data);
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => callback(data));
    }
  }

  get isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;
