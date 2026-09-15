import React, { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { PollOption } from '../types';

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
  const [durationOpen, setDurationOpen] = useState(false);

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const durations = ['1 day', '3 days', '1 week', '2 weeks'];

  return (
    <div className={`space-y-5 ${isMobile ? '' : ''}`}>
      {/* Question / Title Field */}
      <div className="space-y-2">
        <label className="text-ds-text-secondary text-[14px] font-medium leading-[20px]">
          Title
        </label>
        <input
          type="text"
          value={pollQuestion}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="What would you like to ask your network?"
          className="w-full px-4 py-3 rounded-2xl bg-ds-surface-1 border border-ds-border text-[14px] font-medium leading-[20px] text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 transition-all"
        />
      </div>

      {/* Options Fields */}
      <div className="space-y-3">
        <label className="text-ds-text-secondary text-[14px] font-medium leading-[20px]">
          Options
        </label>
        <div className="space-y-2.5">
          {pollOptions.map((option, index) => (
            <div key={option.id} className="relative flex items-center w-full">
              <input
                type="text"
                value={option.text}
                onChange={(e) => onUpdateOption(option.id, e.target.value)}
                placeholder={optionLetters[index] ? `Option ${optionLetters[index]}` : `Option ${index + 1}`}
                className="w-full px-4 py-3 pr-12 rounded-2xl bg-ds-surface-1 border border-ds-border text-[14px] font-medium leading-[20px] text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 transition-all"
              />
              {!isEdit && pollOptions.length > 2 && (
                <button 
                  onClick={() => onRemoveOption(option.id)} 
                  className="absolute right-3.5 p-1 text-ds-text-muted hover:text-[var(--ds-error)] hover:bg-ds-surface-2 rounded-full transition-all"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Option Button */}
        {!isEdit && pollOptions.length < 6 && (
          <button
            type="button"
            onClick={onAddOption}
            className="flex items-center justify-center gap-[8px] font-dmsans text-[16px] font-medium leading-[24px] text-ds-text-primary h-[36px] border border-ds-border rounded-full bg-transparent hover:bg-ds-surface-1 transition-all w-full mt-1 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add option
          </button>
        )}
      </div>

      {/* Duration Dropdown Select */}
      <div className={`space-y-2 transition-all duration-200 z-[50] relative`}>
        <label className="text-ds-text-secondary text-[14px] font-medium leading-[20px]">
          Poll duration
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDurationOpen((open) => !open)}
            className="w-full flex items-center justify-between py-3 text-[14px] text-ds-text-secondary font-medium cursor-pointer bg-transparent outline-none"
          >
            <span>{pollDuration || 'Poll duration'}</span>
            <ChevronDown className={`w-4 h-4 text-ds-text-secondary transition-transform duration-200 ${durationOpen ? 'rotate-180' : ''}`} />
          </button>
          {durationOpen && (
            <div className="absolute left-0 right-0 top-full bg-ds-bg rounded-b-2xl z-[999] py-2 flex flex-col shadow-2xl border-b border-l border-r border-ds-border/30">
              {durations.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => { onDurationChange(d); setDurationOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-[14px] font-dmsans transition-colors cursor-pointer bg-transparent hover:bg-white/5 ${
                    pollDuration === d
                      ? 'text-[var(--ds-accent)] font-medium'
                      : 'text-ds-text-secondary'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollFlow;
