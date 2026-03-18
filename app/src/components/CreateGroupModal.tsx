import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@/types';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreate: (data: { name: string; description: string; members: string[] }) => void;
  contacts: User[];
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  onClose,
  onCreate,
  contacts
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsCreating(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        members: selectedMembers
      });
      onClose();
    } catch (error) {
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
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
          <h2 className="text-xl font-bold text-white font-cinzel">Create Group</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Group Name */}
            <div className="space-y-2">
              <Label htmlFor="group-name" className="text-gray-300">
                Group Name *
              </Label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name"
                className="bg-[#1a1a1a] border-[#2d2d2d] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="group-description" className="text-gray-300">
                Description
              </Label>
              <Textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter group description (optional)"
                className="bg-[#1a1a1a] border-[#2d2d2d] text-white placeholder:text-gray-600 min-h-[80px]"
              />
            </div>

            {/* Members */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                Add Members ({selectedMembers.length} selected)
              </Label>
              
              {contacts.length === 0 ? (
                <div className="text-center py-4 text-gray-500 bg-[#1a1a1a] rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No contacts to add</p>
                  <p className="text-xs">Add contacts first</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => toggleMember(contact.id)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${selectedMembers.includes(contact.id) 
                          ? 'bg-[#d4af37]/10 border border-[#d4af37]' 
                          : 'bg-[#1a1a1a] hover:bg-[#2d2d2d]'
                        }
                      `}
                    >
                      <Checkbox
                        checked={selectedMembers.includes(contact.id)}
                        onChange={() => {}}
                        className="border-[#d4af37] data-[state=checked]:bg-[#d4af37] data-[state=checked]:text-black"
                      />
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={contact.avatar || undefined} />
                        <AvatarFallback className="bg-[#2d2d2d] text-[#d4af37]">
                          {getInitials(contact.displayName || contact.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {contact.displayName || contact.username}
                        </h4>
                        <p className="text-sm text-gray-500">@{contact.username}</p>
                      </div>
                      {selectedMembers.includes(contact.id) && (
                        <Check className="w-5 h-5 text-[#d4af37]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#1a1a1a] flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#2d2d2d] text-gray-300 hover:bg-[#1a1a1a]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="flex-1 btn-gold"
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                'Create Group'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
