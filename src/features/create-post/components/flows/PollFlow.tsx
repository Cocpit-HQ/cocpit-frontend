import React from 'react';
import { Plus, X } from 'lucide-react';
import { PollOption } from '../../types';

interface PollFlowProps {
  pollQuestion: string;
  onQuestionChange: (value: string) => void;
  pollOptions: PollOption[];
  onAddOption: () => void;
  onRemoveOption: (id: string) => void;
  onUpdateOption: (id: string, text: string) => void;
  pollDuration: string;
  onDurationChange: (value: string) => void;
  isEdit: boolean;
  isMobile: boolean;
}

const PollFlow = ({
  pollQuestion,
  onQuestionChange,
  pollOptions,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  pollDuration,
  onDurationChange,
  isEdit,
  isMobile
}: PollFlowProps) => {

  return (
    <div className={`space-y-6 ${isMobile ? '' : ''}`}>
      <div className="space-y-2">
        <label className={`text-sm font-medium ${isMobile ? 'text-muted-foreground' : 'text-foreground'}`}>
          {isMobile ? 'Question' : 'Your Question'}
        </label>
        <input
          type="text"
          value={pollQuestion}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder={isMobile ? "Ask a question..." : "e.g., What is your biggest challenge?"}
          className={`w-full px-4 py-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${isMobile ? 'bg-muted/50 border-transparent focus:bg-background' : 'border-border'}`}
        />
      </div>

      <div className="space-y-3">
        <label className={`text-sm font-medium ${isMobile ? 'text-muted-foreground' : 'text-foreground'}`}>Options</label>
        {pollOptions.map((option, index) => (
          <div key={option.id} className="flex gap-2">
            <input
              type="text"
              value={option.text}
              onChange={(e) => onUpdateOption(option.id, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-grow px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {!isEdit && pollOptions.length > 2 && (
              <button 
                onClick={() => onRemoveOption(option.id)} 
                className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors border border-border"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        {!isEdit && pollOptions.length < 6 && (
          <button
            onClick={onAddOption}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 px-1 py-1"
          >
            <Plus className="w-4 h-4" />
            Add Option
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Poll Duration</label>
        <select
          value={pollDuration}
          onChange={(e) => onDurationChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
        >
          <option value="1 day">1 Day</option>
          <option value="3 days">3 Days</option>
          <option value="1 week">1 Week</option>
          <option value="2 weeks">2 Weeks</option>
        </select>
      </div>
    </div>
  );
};

export default PollFlow;
