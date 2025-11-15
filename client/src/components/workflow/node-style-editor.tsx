import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette } from 'lucide-react';

interface NodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
}

interface NodeStyleEditorProps {
  style: NodeStyle;
  onStyleChange: (style: NodeStyle) => void;
}

const presetColors = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
];

const presetEmojis = [
  '🤖', '💻', '🔍', '📊', '🔒', '⚡', '🎯', '🚀', '💡', '🔧',
  '📝', '🎨', '📱', '🌐', '🔔', '⚙️', '🎮', '📚', '🎵', '🌟',
];

export const NodeStyleEditor = memo(({ style, onStyleChange }: NodeStyleEditorProps) => {
  const [localStyle, setLocalStyle] = useState<NodeStyle>(style);
  
  const handleColorChange = (color: string) => {
    const newStyle = { ...localStyle, backgroundColor: color };
    setLocalStyle(newStyle);
    onStyleChange(newStyle);
  };
  
  const handleBorderColorChange = (color: string) => {
    const newStyle = { ...localStyle, borderColor: color };
    setLocalStyle(newStyle);
    onStyleChange(newStyle);
  };
  
  const handleIconChange = (icon: string) => {
    const newStyle = { ...localStyle, icon };
    setLocalStyle(newStyle);
    onStyleChange(newStyle);
  };
  
  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    const newStyle = { ...localStyle, size };
    setLocalStyle(newStyle);
    onStyleChange(newStyle);
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <Palette className="w-4 h-4 mr-2" />
          Customize
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="grid grid-cols-8 gap-2">
              {presetColors.map(color => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: color,
                    borderColor: localStyle.backgroundColor === color ? '#fff' : 'transparent'
                  }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
            </div>
            <Input
              type="color"
              value={localStyle.backgroundColor || '#8b5cf6'}
              onChange={(e) => handleColorChange(e.target.value)}
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Border Color</Label>
            <Input
              type="color"
              value={localStyle.borderColor || '#8b5cf6'}
              onChange={(e) => handleBorderColorChange(e.target.value)}
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Icon/Emoji</Label>
            <div className="grid grid-cols-10 gap-1">
              {presetEmojis.map(emoji => (
                <button
                  key={emoji}
                  className="text-xl hover:scale-125 transition-transform"
                  onClick={() => handleIconChange(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Size</Label>
            <Select 
              value={localStyle.size || 'medium'}
              onValueChange={handleSizeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

NodeStyleEditor.displayName = 'NodeStyleEditor';
