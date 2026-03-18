import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { socketService } from '@/services/socket';
import { usersAPI, messagesAPI, groupsAPI } from '@/services/api';
import Sidebar from './Sidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserSearchModal from './UserSearchModal';
import CreateGroupModal from './CreateGroupModal';
import CallOverlay from './CallOverlay';
import StickerPicker from './StickerPicker';
import type { User, Group, Message } from '@/types';
import { Menu } from 'lucide-react';
import { toast } from 'sonner';

const ChatApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedChat, setSelectedChat] = useState<User | Group | null>(null);
  const [chatType, setChatType] = useState<'direct' | 'group' | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [activeCall, setActiveCall] = useState<{
    isActive: boolean;
    type: 'voice' | 'video';
    peer?: User;
    isIncoming?: boolean;
    callId?: string;
    offer?: RTCSessionDescriptionInit;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null!);

  // Load contacts and groups
  useEffect(() => {
    loadContacts();
    loadGroups();
  }, []);

  // Socket event listeners
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      setMessages(prev => {
        // Check if message already exists
        if (prev.some(m => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });

      // Mark as read if in current chat
      if (selectedChat) {
        const chatId = chatType === 'direct'
          ? (selectedChat as User).id
          : (selectedChat as Group)._id;

        const isForCurrentChat = chatType === 'direct'
          ? (message.sender.id === chatId || message.recipient === chatId)
          : message.group === chatId;

        if (isForCurrentChat) {
          socketService.markRead([message._id]);
        }
      }
    };

    const handleMessageSent = (message: Message) => {
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleMessageEdited = (message: Message) => {
      setMessages(prev => prev.map(m =>
        m._id === message._id ? message : m
      ));
    };

    const handleMessageDeleted = (data: { messageId: string }) => {
      setMessages(prev => prev.map(m =>
        m._id === data.messageId ? { ...m, isDeleted: true } : m
      ));
    };

    const handleReactionAdded = (data: { messageId: string; reactions: any[] }) => {
      setMessages(prev => prev.map(m =>
        m._id === data.messageId ? { ...m, reactions: data.reactions } : m
      ));
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.isTyping) {
        setTypingUsers(prev => [...new Set([...prev, data.userId])]);
      } else {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    const handleUserStatus = (data: { userId: string; status: string }) => {
      if (data.status === 'online') {
        setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
      } else {
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      }
    };

    const handleIncomingCall = (data: any) => {
      setActiveCall({
        isActive: true,
        type: data.type,
        peer: data.caller,
        isIncoming: true,
        callId: data.callId,
        offer: data.offer
      });
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('message_sent', handleMessageSent);
    socketService.on('message_edited', handleMessageEdited);
    socketService.on('message_deleted', handleMessageDeleted);
    socketService.on('reaction_added', handleReactionAdded);
    socketService.on('typing', handleTyping);
    socketService.on('user_status', handleUserStatus);
    socketService.on('incoming_call', handleIncomingCall);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('message_sent', handleMessageSent);
      socketService.off('message_edited', handleMessageEdited);
      socketService.off('message_deleted', handleMessageDeleted);
      socketService.off('reaction_added', handleReactionAdded);
      socketService.off('typing', handleTyping);
      socketService.off('user_status', handleUserStatus);
      socketService.off('incoming_call', handleIncomingCall);
    };
  }, [selectedChat, chatType]);

  // Load messages when chat changes
  useEffect(() => {
    if (selectedChat && chatType) {
      loadMessages();

      // Join group room if group chat
      if (chatType === 'group') {
        socketService.joinGroup((selectedChat as Group)._id);
      }
    }

    return () => {
      if (selectedChat && chatType === 'group') {
        socketService.leaveGroup((selectedChat as Group)._id);
      }
    };
  }, [selectedChat, chatType]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadContacts = async () => {
    try {
      const response = await usersAPI.getContacts();
      setContacts(response.data.contacts || response.data || []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setContacts([]);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await groupsAPI.getMyGroups();
      setGroups(response.data.groups || response.data || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
      setGroups([]);
    }
  };

  const loadMessages = async () => {
    if (!selectedChat || !chatType) return;

    try {
      let response;
      if (chatType === 'direct') {
        response = await messagesAPI.getConversation((selectedChat as User).id);
      } else {
        response = await messagesAPI.getGroupMessages((selectedChat as Group)._id);
      }
      setMessages(response.data.messages || response.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (content: string, type: string = 'text', mediaData?: any) => {
    if (!selectedChat || !chatType) return;

    const messageData: any = {
      type,
      content,
      ...mediaData
    };

    if (chatType === 'direct') {
      messageData.recipientId = (selectedChat as User).id;
    } else {
      messageData.groupId = (selectedChat as Group)._id;
    }

    if (replyingTo) {
      messageData.replyTo = {
        message: replyingTo._id,
        content: replyingTo.content,
        type: replyingTo.type,
        sender: replyingTo.sender.id
      };
    }

    socketService.sendMessage(messageData);
    setReplyingTo(null);
  };

  const handleSelectChat = (chat: User | Group, type: 'direct' | 'group') => {
    setSelectedChat(chat);
    setChatType(type);
    setMessages([]);
    setReplyingTo(null);

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleAddContact = async (userId: string) => {
    try {
      await usersAPI.addContact(userId);
      toast.success('Contact added successfully');
      loadContacts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add contact');
    }
  };

  const handleCreateGroup = async (data: { name: string; description: string; members: string[] }) => {
    try {
      await groupsAPI.create(data);
      toast.success('Group created successfully');
      loadGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create group');
    }
  };

  const handleInitiateCall = (type: 'voice' | 'video') => {
    if (!selectedChat || chatType !== 'direct') {
      toast.error('Calls are only available in direct messages');
      return;
    }

    setActiveCall({
      isActive: true,
      type,
      peer: selectedChat as User,
      isIncoming: false
    });
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    socketService.deleteMessage(messageId);
  };

  const handleEditMessage = (messageId: string, content: string) => {
    socketService.editMessage(messageId, content);
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    socketService.addReaction(messageId, emoji);
  };

  return (
    <div className="h-screen bg-black flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        contacts={contacts}
        groups={groups}
        onlineUsers={onlineUsers}
        selectedChat={selectedChat}
        chatType={chatType}
        onSelectChat={handleSelectChat}
        onSearchUsers={() => setIsSearchModalOpen(true)}
        onCreateGroup={() => setIsCreateGroupModalOpen(true)}
        onLogout={logout}
        currentUser={user}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-black">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              chat={selectedChat}
              chatType={chatType}
              isOnline={chatType === 'direct' && onlineUsers.includes((selectedChat as User).id)}
              isTyping={chatType === 'direct' && typingUsers.includes((selectedChat as User).id)}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onVoiceCall={() => handleInitiateCall('voice')}
              onVideoCall={() => handleInitiateCall('video')}
            />

            {/* Messages */}
            <MessageList
              messages={messages}
              currentUserId={user?.id || ''}
              onReply={handleReply}
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
              onReact={handleAddReaction}
              messagesEndRef={messagesEndRef}
            />

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
              onOpenStickerPicker={() => setIsStickerPickerOpen(true)}
              selectedChat={selectedChat}
              chatType={chatType}
            />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c5a028] flex items-center justify-center mb-6 shadow-lg shadow-[#d4af37]/20">
              <Menu className="w-12 h-12 text-black" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-cinzel">
              Welcome to LAMUN SHENANIGGERS
            </h2>
            <p className="text-gray-400 max-w-md mb-6">
              Select a chat from the sidebar or search for users to start messaging.
            </p>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="btn-outline-gold"
            >
              Find Users
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {isSearchModalOpen && (
        <UserSearchModal
          onClose={() => setIsSearchModalOpen(false)}
          onAddContact={handleAddContact}
          existingContacts={contacts}
        />
      )}

      {isCreateGroupModalOpen && (
        <CreateGroupModal
          onClose={() => setIsCreateGroupModalOpen(false)}
          onCreate={handleCreateGroup}
          contacts={contacts}
        />
      )}

      {isStickerPickerOpen && (
        <StickerPicker
          onClose={() => setIsStickerPickerOpen(false)}
          onSelect={(sticker) => {
            handleSendMessage('[Sticker]', 'sticker', { mediaUrl: sticker.url });
            setIsStickerPickerOpen(false);
          }}
        />
      )}

      {/* Call Overlay */}
      {activeCall?.isActive && (
        <CallOverlay
          call={activeCall}
          onClose={() => setActiveCall(null)}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default ChatApp;