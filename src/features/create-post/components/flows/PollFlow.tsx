/* DEPRECATED
DEPRECATED\n// import React, { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
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
  const [durationOpen, setDurationOpen] = useState(false);

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const durations = ['1 day', '3 days', '1 week', '2 weeks'];

  return (
    <div className={`space-y-5 ${isMobile ? '' : ''}`}>
      {/* Question / Title Field * /}
      <div className="space-y-2">
        <label className="text-[13.5px] font-normal text-foreground font-poppins">
          Title
        </label>
        <input
          type="text"
          value={pollQuestion}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="What would you like to ask your network?"
          className="w-full px-4 py-3 rounded-2xl bg-white/10 dark:bg-white/5 border border-zinc-200 dark:border-zinc-700 backdrop-blur-md text-[14.5px] text-black dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-poppins"
        />
      </div>

      {/* Options Fields * /}
      <div className="space-y-3">
        <label className="text-[13.5px] font-normal text-foreground font-poppins">
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
                className="w-full px-4 py-3 pr-12 rounded-2xl bg-white/10 dark:bg-white/5 border border-zinc-200 dark:border-zinc-700 backdrop-blur-md text-[14.5px] text-black dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-poppins"
              />
              {!isEdit && pollOptions.length > 2 && (
                <button 
                  onClick={() => onRemoveOption(option.id)} 
                  className="absolute right-3.5 p-1 text-gray-400 hover:text-destructive hover:bg-gray-100 dark:hover:bg-secondary rounded-full transition-all"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Option Button * /}
        {!isEdit && pollOptions.length < 6 && (
          <button
            type="button"
            onClick={onAddOption}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#818CF8] hover:text-[#6366F1] px-4 py-2 border border-[#818CF8] rounded-full bg-card hover:bg-[#EEF2FF] dark:hover:bg-secondary transition-all w-fit font-poppins mt-1"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add option
          </button>
        )}
      </div>

      {/* Duration Dropdown Select * /}
      <div className="space-y-2">
        <label className="text-[13.5px] font-normal text-foreground font-poppins">
          Poll duration
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDurationOpen((open) => !open)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent text-[14.5px] text-black dark:text-white focus:outline-none transition-all font-poppins flex items-center justify-between"
          >
            <span>{pollDuration}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-300" />
          </button>
          {durationOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-card border border-border rounded-2xl shadow-md z-[200] p-1">
              {durations.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => { onDurationChange(d); setDurationOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-poppins transition-colors
                    ${pollDuration === d
                      ? 'bg-primary text-white'
                      : 'text-foreground'
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

*/
export {};
