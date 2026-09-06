import React from 'react';
import { Type, Image, Video, BarChart3, FileText } from 'lucide-react';
import { PostType } from './types';

interface PostTypeSelectorProps {
  activeType: PostType;
  onTypeChange: (type: PostType) => void;
  isEdit: boolean;
  isMobile: boolean;
  className?: string;
}

const PostTypeSelector = ({
  activeType,
  onTypeChange,
  isEdit,
  isMobile,
  className = ""
}: PostTypeSelectorProps) => {

  const types = [
    { id: 'text', label: 'Post', icon: Type, color: 'text-primary' },
    { id: 'photo', label: 'Photo', icon: Image, color: 'text-green-500' },
    { id: 'video', label: 'Video', icon: Video, color: 'text-blue-500' },
    { id: 'poll', label: 'Poll', icon: BarChart3, color: 'text-orange-500' },
    { id: 'article', label: 'Article', icon: FileText, color: 'text-purple-500' },
  ];

  if (isMobile) {
    return (
      <div className={`flex items-center gap-2 overflow-x-auto py-2 px-1 custom-scrollbar ${className}`}>
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => !isEdit && onTypeChange(type.id as PostType)}
            disabled={isEdit}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
              activeType === type.id 
                ? 'bg-primary border-primary text-primary-foreground shadow-sm' 
                : 'bg-muted border-border text-muted-foreground'
            } ${isEdit && activeType !== type.id ? 'opacity-50' : ''}`}
          >
            <type.icon className="w-4 h-4" />
            <span className="text-xs font-bold">{type.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {types.map((type) => (
        <button
          key={type.id}
          onClick={() => !isEdit && onTypeChange(type.id as PostType)}
          disabled={isEdit}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
            activeType === type.id 
              ? 'bg-primary/10 text-primary' 
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          } ${isEdit && activeType !== type.id ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <type.icon className={`w-5 h-5 ${activeType === type.id ? 'text-primary' : type.color}`} />
          <span className="text-sm font-bold">{type.label}</span>
        </button>
      ))}
    </div>
  );
};

export default PostTypeSelector;
