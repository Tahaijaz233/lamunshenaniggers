import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Search, Plus, TrendingUp } from 'lucide-react';
import { stickersAPI } from '@/services/api';
import type { Sticker } from '@/types';

interface StickerPickerProps {
  onClose: () => void;
  onSelect: (sticker: Sticker) => void;
}

const DEFAULT_STICKERS: Sticker[] = [
  {
    _id: '1',
    name: 'Happy',
    url: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/Smilies/Grinning%20Face%20with%20Big%20Eyes.png',
    creator: {} as any,
    pack: 'default',
    tags: ['happy', 'smile'],
    isAnimated: false,
    usageCount: 0
  },
  {
    _id: '2',
    name: 'Love',
    url: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/Smilies/Red%20Heart.png',
    creator: {} as any,
    pack: 'default',
    tags: ['love', 'heart'],
    isAnimated: false,
    usageCount: 0
  },
  {
    _id: '3',
    name: 'Laugh',
    url: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/Smilies/Face%20with%20Tears%20of%20Joy.png',
    creator: {} as any,
    pack: 'default',
    tags: ['laugh', 'funny'],
    isAnimated: false,
    usageCount: 0
  },
  {
    _id: '4',
    name: 'Cool',
    url: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/Smilies/Smiling%20Face%20with%20Sunglasses.png',
    creator: {} as any,
    pack: 'default',
    tags: ['cool', 'sunglasses'],
    isAnimated: false,
    usageCount: 0
  },
  {
    _id: '5',
    name: 'Thinking',
    url: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/Smilies/Thinking%20Face.png',
    creator: {} as any,
    pack: 'default',
    tags: ['thinking', 'hmm'],
    isAnimated: false,
    usageCount: 0
  },
  {
    _id: '6',
    name: 'Fire',
    url: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/Travel%20and%20places/Fire.png',
    creator: {} as any,
    pack: 'default',
    tags: ['fire', 'hot'],
    isAnimated: false,
    usageCount: 0
  },
  {
    _id: '7',
    name: 'Party',
    url: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/Activities/Party%20Popper.png',
    creator: {} as any,
    pack: 'default',
    tags: ['party', 'celebrate'],
    isAnimated: false,
    usageCount: 0
  },
  {
    _id: '8',
    name: 'Clap',
    url: 'https://cdn.jsdelivr.net/gh/Tarikul-Islam-Anik/Animated-Fluent-Emojis@master/Emojis/People/Clapping%20Hands.png',
    creator: {} as any,
    pack: 'default',
    tags: ['clap', 'applause'],
    isAnimated: false,
    usageCount: 0
  }
];

const StickerPicker: React.FC<StickerPickerProps> = ({
  onClose,
  onSelect
}) => {
  const [stickers, setStickers] = useState<Sticker[]>(DEFAULT_STICKERS);
  const [myStickers, setMyStickers] = useState<Sticker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('popular');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStickers();
  }, []);

  const loadStickers = async () => {
    setIsLoading(true);
    try {
      const [allResponse, myResponse] = await Promise.all([
        stickersAPI.getAll(),
        stickersAPI.getMyStickers()
      ]);
      
      if (allResponse.data.stickers.length > 0) {
        setStickers(allResponse.data.stickers);
      }
      setMyStickers(myResponse.data.stickers);
    } catch (error) {
      console.error('Failed to load stickers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (sticker: Sticker) => {
    onSelect(sticker);
    stickersAPI.incrementUsage(sticker._id).catch(console.error);
  };

  const filteredStickers = stickers.filter(sticker =>
    sticker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sticker.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredMyStickers = myStickers.filter(sticker =>
    sticker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sticker.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="bg-[#0a0a0a] border border-[#2d2d2d] rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
          <h2 className="text-xl font-bold text-white font-cinzel">Stickers</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search stickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#1a1a1a] border-[#2d2d2d] text-white placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a] mx-4 w-auto">
            <TabsTrigger 
              value="popular" 
              className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Popular
            </TabsTrigger>
            <TabsTrigger 
              value="mine"
              className="data-[state=active]:bg-[#d4af37] data-[state=active]:text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              My Stickers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="flex-1 overflow-y-auto p-4 m-0">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredStickers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No stickers found</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filteredStickers.map((sticker) => (
                  <button
                    key={sticker._id}
                    onClick={() => handleSelect(sticker)}
                    className="aspect-square bg-[#1a1a1a] rounded-lg p-2 hover:bg-[#2d2d2d] transition-colors flex items-center justify-center"
                  >
                    <img
                      src={sticker.url}
                      alt={sticker.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine" className="flex-1 overflow-y-auto p-4 m-0">
            {filteredMyStickers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>You haven't created any stickers yet</p>
                <p className="text-sm mt-2">Feature coming soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filteredMyStickers.map((sticker) => (
                  <button
                    key={sticker._id}
                    onClick={() => handleSelect(sticker)}
                    className="aspect-square bg-[#1a1a1a] rounded-lg p-2 hover:bg-[#2d2d2d] transition-colors flex items-center justify-center"
                  >
                    <img
                      src={sticker.url}
                      alt={sticker.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StickerPicker;
