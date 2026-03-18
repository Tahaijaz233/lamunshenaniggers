import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Video,
  Mic,
  Smile,
  X,
  StopCircle,
  FileText,
  Link as LinkIcon
} from 'lucide-react';
import { mediaAPI } from '@/services/api';
import { toast } from 'sonner';
import type { User, Group, Message } from '@/types';
import imageCompression from 'browser-image-compression';

interface MessageInputProps {
  onSendMessage: (content: string, type: string, mediaData?: any) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  onOpenStickerPicker: () => void;
  selectedChat: User | Group | null;
  chatType: 'direct' | 'group' | null;
}

const EMOJIS = ['😀', '😂', '🥰', '😎', '🤔', '👍', '❤️', '🎉', '🔥', '👏', '🙏', '💯'];

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  replyingTo,
  onCancelReply,
  onOpenStickerPicker,
  selectedChat: _selectedChat,
  chatType: _chatType
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [instagramLink, setInstagramLink] = useState('');
  const [showInstagramInput, setShowInstagramInput] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    if (!message.trim()) return;

    // Check if it's an Instagram link
    if (message.includes('instagram.com/reel/')) {
      handleInstagramLink(message.trim());
      return;
    }

    onSendMessage(message.trim(), 'text');
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInstagramLink = async (url: string) => {
    setIsUploading(true);
    try {
      const response = await mediaAPI.getInstagramReel(url);
      
      if (response.data.videoUrl) {
        onSendMessage(url, 'instagram_reel', {
          mediaUrl: response.data.videoUrl,
          mediaThumbnail: response.data.thumbnailUrl
        });
      } else {
        onSendMessage(url, 'instagram_reel');
      }
      
      setMessage('');
      setShowInstagramInput(false);
    } catch (error) {
      toast.error('Failed to process Instagram link');
    } finally {
      setIsUploading(false);
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Image compression failed:', error);
      return file;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const response = await mediaAPI.uploadImage(compressedFile);
      
      onSendMessage('[Image]', 'image', {
        mediaUrl: response.data.url,
        fileName: file.name,
        fileSize: response.data.size
      });
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be less than 50MB');
      return;
    }

    setIsUploading(true);
    try {
      const response = await mediaAPI.uploadVideo(file);
      
      onSendMessage('[Video]', 'video', {
        mediaUrl: response.data.url,
        mediaThumbnail: response.data.thumbnail,
        duration: response.data.duration,
        fileName: file.name,
        fileSize: response.data.size
      });
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setIsUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const response = await mediaAPI.uploadPDF(file);
      
      onSendMessage('[PDF]', 'pdf', {
        mediaUrl: response.data.url,
        fileName: response.data.fileName,
        fileSize: response.data.size
      });
    } catch (error) {
      toast.error('Failed to upload PDF');
    } finally {
      setIsUploading(false);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        
        setIsUploading(true);
        try {
          const response = await mediaAPI.uploadAudio(audioFile);
          
          onSendMessage('[Voice Message]', 'voice', {
            mediaUrl: response.data.url,
            duration: recordingTime,
            fileSize: response.data.size
          });
        } catch (error) {
          toast.error('Failed to send voice message');
        } finally {
          setIsUploading(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="bg-[#0a0a0a] border-t border-[#1a1a1a] p-4">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-[#1a1a1a] rounded-t-lg px-4 py-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#d4af37]">
              Replying to {replyingTo.sender.displayName || replyingTo.sender.username}
            </p>
            <p className="text-sm text-gray-400 truncate">
              {replyingTo.type === 'text' ? replyingTo.content : `[${replyingTo.type}]`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancelReply}
            className="w-6 h-6 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Instagram Link Input */}
      {showInstagramInput && (
        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-t-lg px-4 py-2 mb-2">
          <LinkIcon className="w-4 h-4 text-[#d4af37]" />
          <Input
            placeholder="Paste Instagram reel link..."
            value={instagramLink}
            onChange={(e) => setInstagramLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && instagramLink.trim()) {
                handleInstagramLink(instagramLink.trim());
              }
            }}
            className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-600 focus-visible:ring-0"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowInstagramInput(false);
              setInstagramLink('');
            }}
            className="w-6 h-6 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment Menu */}
        {!isRecording && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-[#d4af37] hover:bg-[#1a1a1a]"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="start"
              className="w-auto bg-[#1a1a1a] border-[#2d2d2d] p-2"
            >
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-[#2d2d2d] transition-colors"
                >
                  <ImageIcon className="w-6 h-6 text-[#d4af37]" />
                  <span className="text-xs text-gray-400">Image</span>
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-[#2d2d2d] transition-colors"
                >
                  <Video className="w-6 h-6 text-[#d4af37]" />
                  <span className="text-xs text-gray-400">Video</span>
                </button>
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-[#2d2d2d] transition-colors"
                >
                  <FileText className="w-6 h-6 text-[#d4af37]" />
                  <span className="text-xs text-gray-400">PDF</span>
                </button>
                <button
                  onClick={() => setShowInstagramInput(true)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-[#2d2d2d] transition-colors"
                >
                  <LinkIcon className="w-6 h-6 text-[#d4af37]" />
                  <span className="text-xs text-gray-400">Reel</span>
                </button>
                <button
                  onClick={onOpenStickerPicker}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-[#2d2d2d] transition-colors"
                >
                  <Smile className="w-6 h-6 text-[#d4af37]" />
                  <span className="text-xs text-gray-400">Sticker</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf"
          onChange={handlePDFUpload}
          className="hidden"
        />

        {/* Message Input or Recording */}
        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 bg-[#1a1a1a] rounded-full px-4 py-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm">Recording {formatDuration(recordingTime)}</span>
          </div>
        ) : (
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isUploading}
              className="bg-[#1a1a1a] border-[#2d2d2d] text-white placeholder:text-gray-600 pr-10 rounded-full"
            />
            
            {/* Emoji Button */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 text-gray-400 hover:text-[#d4af37]"
                >
                  <Smile className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                side="top" 
                align="end"
                className="w-auto bg-[#1a1a1a] border-[#2d2d2d] p-2"
              >
                <div className="grid grid-cols-6 gap-1">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-[#2d2d2d] rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Voice/Message Button */}
        {isRecording ? (
          <Button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-11 h-11"
          >
            <StopCircle className="w-5 h-5" />
          </Button>
        ) : message.trim() ? (
          <Button
            onClick={handleSend}
            disabled={isUploading}
            className="btn-gold rounded-full w-11 h-11 p-0"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        ) : (
          <Button
            onClick={startRecording}
            className="bg-[#1a1a1a] hover:bg-[#2d2d2d] text-[#d4af37] rounded-full w-11 h-11 border border-[#2d2d2d]"
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
