import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  MoreHorizontal, 
  Reply, 
  Edit2, 
  Trash2, 
  Check, 
  CheckCheck,
  Play,
  Pause,
  FileText,
  Download,
  X
} from 'lucide-react';
import type { Message } from '@/types';
import { format } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥'];

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onReply,
  onDelete,
  onEdit,
  onReact,
  messagesEndRef
}) => {
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const isOwnMessage = (message: Message) => message.sender.id === currentUserId;

  const formatTime = (date: string) => {
    return format(new Date(date), 'h:mm a');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEditStart = (message: Message) => {
    setEditingMessage(message._id);
    setEditContent(message.content);
  };

  const handleEditSubmit = (messageId: string) => {
    if (editContent.trim()) {
      onEdit(messageId, editContent.trim());
    }
    setEditingMessage(null);
    setEditContent('');
  };

  const handleEditCancel = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const toggleAudio = (messageId: string, audioUrl: string) => {
    const audio = audioRefs.current.get(messageId);
    
    if (playingAudio === messageId) {
      audio?.pause();
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio) {
        const currentAudio = audioRefs.current.get(playingAudio);
        currentAudio?.pause();
      }
      
      if (audio) {
        audio.play();
        setPlayingAudio(messageId);
      } else {
        const newAudio = new Audio(audioUrl);
        newAudio.onended = () => setPlayingAudio(null);
        audioRefs.current.set(messageId, newAudio);
        newAudio.play();
        setPlayingAudio(messageId);
      }
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.isDeleted) {
      return (
        <span className="italic text-gray-500">This message was deleted</span>
      );
    }

    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            <img
              src={message.mediaUrl}
              alt="Shared image"
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxHeight: '300px', objectFit: 'cover' }}
              onClick={() => setSelectedImage(message.mediaUrl!)}
            />
            {message.content && message.content !== '[Image]' && (
              <p className="text-white">{message.content}</p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            <video
              src={message.mediaUrl}
              controls
              className="max-w-full rounded-lg"
              style={{ maxHeight: '300px' }}
              poster={message.mediaThumbnail}
            />
            {message.content && message.content !== '[Video]' && (
              <p className="text-white">{message.content}</p>
            )}
          </div>
        );

      case 'instagram_reel':
        return (
          <div className="space-y-2">
            {message.mediaUrl ? (
              <video
                src={message.mediaUrl}
                controls
                className="max-w-full rounded-lg"
                style={{ maxHeight: '400px' }}
              />
            ) : (
              <iframe
                src={`https://www.instagram.com/reel/${message.content.split('/reel/')[1]?.split('/')[0]}/embed/`}
                className="w-full rounded-lg"
                style={{ minHeight: '400px' }}
                frameBorder="0"
                allowFullScreen
              />
            )}
            <a 
              href={message.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] text-sm hover:underline flex items-center gap-1"
            >
              View on Instagram
            </a>
          </div>
        );

      case 'audio':
      case 'voice':
        return (
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleAudio(message._id, message.mediaUrl!)}
              className="w-10 h-10 rounded-full bg-[#d4af37] text-black hover:bg-[#f0e68c]"
            >
              {playingAudio === message._id ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>
            <div className="flex-1">
              <div className="audio-waveform">
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ 
                    animationPlayState: playingAudio === message._id ? 'running' : 'paused'
                  }} />
                ))}
              </div>
              {message.duration && (
                <span className="text-xs text-gray-500">
                  {formatDuration(message.duration)}
                </span>
              )}
            </div>
          </div>
        );

      case 'pdf':
        return (
          <div className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{message.fileName}</p>
              {message.fileSize && (
                <p className="text-xs text-gray-500">{formatFileSize(message.fileSize)}</p>
              )}
            </div>
            <a
              href={message.mediaUrl}
              download={message.fileName}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Download className="w-5 h-5" />
              </Button>
            </a>
          </div>
        );

      case 'sticker':
        return (
          <img
            src={message.mediaUrl}
            alt="Sticker"
            className="max-w-[150px] max-h-[150px]"
          />
        );

      default:
        return <p className="text-white whitespace-pre-wrap">{message.content}</p>;
    }
  };

  const renderReplyPreview = (message: Message) => {
    if (!message.replyTo) return null;

    return (
      <div className="reply-preview mb-2">
        <p className="text-xs text-[#d4af37]">
          {message.replyTo.sender?.displayName || message.replyTo.sender?.username}
        </p>
        <p className="text-sm text-gray-400 truncate">
          {message.replyTo.type === 'image' && 'Image'}
          {message.replyTo.type === 'video' && 'Video'}
          {message.replyTo.type === 'audio' && 'Audio'}
          {message.replyTo.type === 'voice' && 'Voice message'}
          {message.replyTo.type === 'pdf' && 'PDF'}
          {message.replyTo.type === 'sticker' && 'Sticker'}
          {message.replyTo.type === 'text' && message.replyTo.content}
        </p>
      </div>
    );
  };

  const renderReactions = (message: Message) => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const reactionCounts = message.reactions.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="flex gap-1 mt-1">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <span 
            key={emoji} 
            className="text-xs bg-[#1a1a1a] px-1.5 py-0.5 rounded-full border border-[#2d2d2d]"
          >
            {emoji} {count > 1 && count}
          </span>
        ))}
      </div>
    );
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-dark messages-container">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date Divider */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-[#1a1a1a] px-4 py-1 rounded-full">
              <span className="text-xs text-gray-500">
                {format(new Date(date), 'MMMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-4">
            {dateMessages.map((message, index) => {
              const own = isOwnMessage(message);
              const showAvatar = index === 0 || 
                dateMessages[index - 1].sender.id !== message.sender.id;

              return (
                <div
                  key={message._id}
                  className={`flex ${own ? 'justify-end' : 'justify-start'} message-enter`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={`flex gap-2 max-w-[80%] ${own ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    {!own && showAvatar && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarImage src={message.sender.avatar || undefined} />
                        <AvatarFallback className="bg-[#2d2d2d] text-[#d4af37] text-xs">
                          {message.sender.displayName?.[0] || message.sender.username[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!own && !showAvatar && <div className="w-8" />}

                    {/* Message Bubble */}
                    <div className="group relative">
                      <div
                        className={`message-bubble ${
                          own ? 'message-bubble-sent' : 'message-bubble-received'
                        }`}
                      >
                        {/* Reply Preview */}
                        {renderReplyPreview(message)}

                        {/* Edit Mode */}
                        {editingMessage === message._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditSubmit(message._id);
                                if (e.key === 'Escape') handleEditCancel();
                              }}
                              className="bg-[#2d2d2d] text-white px-3 py-1 rounded text-sm flex-1"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSubmit(message._id)}
                              className="w-6 h-6 text-green-400"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleEditCancel}
                              className="w-6 h-6 text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          renderMessageContent(message)
                        )}

                        {/* Message Meta */}
                        <div className={`flex items-center gap-1 mt-1 ${own ? 'justify-end' : ''}`}>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.createdAt)}
                          </span>
                          {message.isEdited && (
                            <span className="text-xs text-gray-600">(edited)</span>
                          )}
                          {own && (
                            <span className="text-xs text-gray-500">
                              {message.readBy.length > 0 ? (
                                <CheckCheck className="w-3 h-3 text-[#d4af37]" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reactions */}
                      {renderReactions(message)}

                      {/* Message Actions */}
                      {!message.isDeleted && editingMessage !== message._id && (
                        <div className={`absolute top-0 ${own ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-gray-400 hover:text-white"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align={own ? 'end' : 'start'}
                              className="bg-[#1a1a1a] border-[#2d2d2d]"
                            >
                              <DropdownMenuItem 
                                onClick={() => onReply(message)}
                                className="text-gray-300 focus:bg-[#2d2d2d] focus:text-white"
                              >
                                <Reply className="w-4 h-4 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              
                              {own && message.type === 'text' && (
                                <DropdownMenuItem 
                                  onClick={() => handleEditStart(message)}
                                  className="text-gray-300 focus:bg-[#2d2d2d] focus:text-white"
                                >
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuSeparator className="bg-[#2d2d2d]" />
                              
                              {own && (
                                <DropdownMenuItem 
                                  onClick={() => onDelete(message._id)}
                                  className="text-red-400 focus:bg-[#2d2d2d] focus:text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Quick Reactions */}
                          <div className="flex gap-0.5 mt-1 bg-[#1a1a1a] rounded-full p-1 border border-[#2d2d2d]">
                            {EMOJIS.slice(0, 4).map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => onReact(message._id, emoji)}
                                className="w-6 h-6 flex items-center justify-center hover:bg-[#2d2d2d] rounded-full text-sm"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Scroll to bottom anchor */}
      <div ref={messagesEndRef} />

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-black/95 border-[#2d2d2d] p-0">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageList;
