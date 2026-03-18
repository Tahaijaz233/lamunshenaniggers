import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { usersAPI } from '@/services/api';
import type { User } from '@/types';

interface UserSearchModalProps {
  onClose: () => void;
  onAddContact: (username: string) => void;
  existingContacts: User[];
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  onClose,
  onAddContact,
  existingContacts
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedUsers, setAddedUsers] = useState<string[]>([]);

  const existingContactIds = (existingContacts || []).map(c => c.id);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await usersAPI.search(searchQuery);
        setSearchResults(response.data.users || response.data || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeout = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleAddContact = async (username: string) => {
    try {
      await onAddContact(username);
      setAddedUsers(prev => [...prev, username]);
    } catch (error) {
      // Error handled in parent
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
          <h2 className="text-xl font-bold text-white font-cinzel">Find Users</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-[#2d2d2d] text-white placeholder:text-gray-600"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 pt-0">
          {searchQuery.length < 2 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Type at least 2 characters to search</p>
            </div>
          ) : isSearching ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (searchResults || []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(searchResults || []).map((user) => {
                const isExisting = existingContactIds.includes(user.id);
                const isAdded = addedUsers.includes(user.username);

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback className="bg-[#2d2d2d] text-[#d4af37]">
                        {getInitials(user.displayName || user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium">
                        {user.displayName || user.username}
                      </h3>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                    {isExisting || isAdded ? (
                      <Button
                        variant="ghost"
                        disabled
                        className="text-green-400"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Added
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleAddContact(user.username)}
                        className="btn-gold"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;