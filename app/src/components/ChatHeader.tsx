import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Phone, Video, MoreVertical, Menu, Users } from 'lucide-react';
import type { User, Group } from '@/types';

interface ChatHeaderProps {
  chat: User | Group;
  chatType: 'direct' | 'group' | null;
  isOnline: boolean;
  isTyping: boolean;
  onToggleSidebar: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  chat,
  chatType,
  isOnline,
  isTyping,
  onToggleSidebar,
  onVoiceCall,
  onVideoCall
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusText = () => {
    if (isTyping) return 'typing...';
    if (isOnline) return 'online';
    if (chatType === 'direct') {
      const lastSeen = (chat as User).lastSeen;
      if (lastSeen) {
        const date = new Date(lastSeen);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'last seen just now';
        if (minutes < 60) return `last seen ${minutes}m ago`;
        if (hours < 24) return `last seen ${hours}h ago`;
        if (days < 7) return `last seen ${days}d ago`;
        return `last seen ${date.toLocaleDateString()}`;
      }
    }
    return '';
  };

  const isDirect = chatType === 'direct';
  const displayName = isDirect 
    ? (chat as User).displayName || (chat as User).username
    : (chat as Group).name;
  const avatar = isDirect ? (chat as User).avatar : (chat as Group).avatar;
  const memberCount = isDirect ? null : (chat as Group).members.length;

  return (
    <div className="h-16 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback className="bg-[#2d2d2d] text-[#d4af37]">
              {isDirect 
                ? getInitials(displayName)
                : <Users className="w-4 h-4" />
              }
            </AvatarFallback>
          </Avatar>
          {isDirect && isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
          )}
        </div>

        <div>
          <h2 className="text-white font-medium">{displayName}</h2>
          <p className={`text-xs ${isTyping ? 'text-[#d4af37]' : 'text-gray-500'}`}>
            {isDirect 
              ? getStatusText()
              : `${memberCount} members`
            }
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isDirect && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onVoiceCall}
              className="text-gray-400 hover:text-[#d4af37] hover:bg-[#1a1a1a]"
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onVideoCall}
              className="text-gray-400 hover:text-[#d4af37] hover:bg-[#1a1a1a]"
            >
              <Video className="w-5 h-5" />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
        >
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;
