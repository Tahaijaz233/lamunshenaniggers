import React, { useState } from 'react';
import { 
  Search, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut, 
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User, Group } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  contacts: User[];
  groups: Group[];
  onlineUsers: string[];
  selectedChat: User | Group | null;
  chatType: 'direct' | 'group' | null;
  onSelectChat: (chat: User | Group, type: 'direct' | 'group') => void;
  onSearchUsers: () => void;
  onCreateGroup: () => void;
  onLogout: () => void;
  currentUser: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  contacts,
  groups,
  onlineUsers,
  selectedChat,
  chatType,
  onSelectChat,
  onSearchUsers,
  onCreateGroup,
  onLogout,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = (contacts || []).filter(contact =>
    contact.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = (groups || []).filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-30 h-full bg-[#0a0a0a] border-r border-[#1a1a1a]
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-3 ${!isOpen && 'md:justify-center'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4af37] to-[#c5a028] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-black" />
              </div>
              {isOpen && (
                <div>
                  <h1 className="font-cinzel font-bold text-[#d4af37] text-lg">LAMUN</h1>
                  <p className="text-xs text-gray-500">Shenaniggers</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>

          {isOpen && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#1a1a1a] border-[#2d2d2d] text-white placeholder:text-gray-600 h-9"
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        {isOpen && (
          <div className="flex border-b border-[#1a1a1a]">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chats' 
                  ? 'text-[#d4af37] border-b-2 border-[#d4af37]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'groups' 
                  ? 'text-[#d4af37] border-b-2 border-[#d4af37]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Groups
            </button>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-dark">
          {isOpen ? (
            <>
              {/* Add Buttons */}
              <div className="p-3 space-y-2">
                {activeTab === 'chats' ? (
                  <Button
                    variant="outline"
                    onClick={onSearchUsers}
                    className="w-full justify-start gap-2 border-[#2d2d2d] text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Add Contact
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={onCreateGroup}
                    className="w-full justify-start gap-2 border-[#2d2d2d] text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Create Group
                  </Button>
                )}
              </div>

              {/* List */}
              <div className="px-2 pb-4">
                {activeTab === 'chats' ? (
                  filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {searchQuery ? 'No contacts found' : 'No contacts yet'}
                    </div>
                  ) : (
                    filteredContacts.map((contact) => {
                      const isOnline = onlineUsers.includes(contact.id);
                      const isSelected = chatType === 'direct' && (selectedChat as User)?.id === contact.id;

                      return (
                        <div
                          key={contact.id}
                          onClick={() => onSelectChat(contact, 'direct')}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                            ${isSelected ? 'bg-[#1a1a1a] border-l-2 border-[#d4af37]' : 'hover:bg-[#1a1a1a]'}
                          `}
                        >
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={contact.avatar || undefined} />
                              <AvatarFallback className="bg-[#2d2d2d] text-[#d4af37]">
                                {getInitials(contact.displayName || contact.username)}
                              </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate">
                              {contact.displayName || contact.username}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {isOnline ? 'Online' : `Last seen ${formatLastSeen(contact.lastSeen)}`}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  filteredGroups.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      {searchQuery ? 'No groups found' : 'No groups yet'}
                    </div>
                  ) : (
                    filteredGroups.map((group) => {
                      const isSelected = chatType === 'group' && (selectedChat as Group)?._id === group._id;

                      return (
                        <div
                          key={group._id}
                          onClick={() => onSelectChat(group, 'group')}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                            ${isSelected ? 'bg-[#1a1a1a] border-l-2 border-[#d4af37]' : 'hover:bg-[#1a1a1a]'}
                          `}
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={group.avatar || undefined} />
                            <AvatarFallback className="bg-[#2d2d2d] text-[#d4af37]">
                              <Users className="w-5 h-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate">{group.name}</h3>
                            <p className="text-sm text-gray-500 truncate">
                              {group.members.length} members
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </>
          ) : (
            /* Collapsed Icons Only */
            <div className="flex flex-col items-center py-4 gap-4">
              <button
                onClick={() => setActiveTab('chats')}
                className={`p-3 rounded-xl transition-colors ${
                  activeTab === 'chats' ? 'bg-[#1a1a1a] text-[#d4af37]' : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`p-3 rounded-xl transition-colors ${
                  activeTab === 'groups' ? 'bg-[#1a1a1a] text-[#d4af37]' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-5 h-5" />
              </button>
              <button
                onClick={onSearchUsers}
                className="p-3 rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[#1a1a1a]">
          {isOpen ? (
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={currentUser?.avatar || undefined} />
                <AvatarFallback className="bg-[#2d2d2d] text-[#d4af37]">
                  {getInitials(currentUser?.displayName || currentUser?.username || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {currentUser?.displayName || currentUser?.username}
                </p>
                <p className="text-xs text-gray-500">@{currentUser?.username}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2d2d2d]">
                  <DropdownMenuItem className="text-gray-300 focus:bg-[#2d2d2d] focus:text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#2d2d2d]" />
                  <DropdownMenuItem 
                    onClick={onLogout}
                    className="text-red-400 focus:bg-[#2d2d2d] focus:text-red-400"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex justify-center">
              <Avatar className="w-10 h-10 cursor-pointer" onClick={onLogout}>
                <AvatarImage src={currentUser?.avatar || undefined} />
                <AvatarFallback className="bg-[#2d2d2d] text-[#d4af37]">
                  {getInitials(currentUser?.displayName || currentUser?.username || 'U')}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;