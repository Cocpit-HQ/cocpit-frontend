import React from 'react';
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

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className={`space-y-5 ${isMobile ? '' : ''}`}>
      {/* Question / Title Field */}
      <div className="space-y-1.5">
        <label className="text-[13.5px] font-semibold text-gray-700 dark:text-gray-300 font-poppins">
          Title
        </label>
        <input
          type="text"
          value={pollQuestion}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="What would you like to ask your network?"
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent text-[14.5px] text-black dark:text-white placeholder:text-gray-400 focus:outline-none transition-all font-poppins"
        />
      </div>

      {/* Options Fields */}
      <div className="space-y-3">
        <label className="text-[13.5px] font-semibold text-gray-700 dark:text-gray-300 font-poppins">
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
                className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent text-[14.5px] text-black dark:text-white placeholder:text-gray-400 focus:outline-none transition-all font-poppins"
              />
              {!isEdit && pollOptions.length > 2 && (
                <button 
                  onClick={() => onRemoveOption(option.id)} 
                  className="absolute right-3.5 p-1 text-gray-400 hover:text-destructive hover:bg-gray-100 dark:hover:bg-[#2a2a4a] rounded-full transition-all"
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
            className="flex items-center gap-1.5 text-sm font-semibold text-[#818CF8] hover:text-[#6366F1] px-4 py-2 border border-[#818CF8] rounded-full hover:bg-[#818CF8]/5 transition-all w-fit font-poppins mt-1"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add option
          </button>
        )}
      </div>

      {/* Duration Dropdown Select */}
      <div className="space-y-1.5">
        <label className="text-[13.5px] font-semibold text-gray-700 dark:text-gray-300 font-poppins">
          Poll duration
        </label>
        <div className="relative">
          <select
            value={pollDuration}
            onChange={(e) => onDurationChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent text-[14.5px] text-black dark:text-white focus:outline-none transition-all font-poppins appearance-none cursor-pointer pr-10"
          >
            <option value="1 day" className="bg-white dark:bg-[#1a1a2e] text-black dark:text-white">1 day</option>
            <option value="3 days" className="bg-white dark:bg-[#1a1a2e] text-black dark:text-white">3 days</option>
            <option value="1 week" className="bg-white dark:bg-[#1a1a2e] text-black dark:text-white">1 week</option>
            <option value="2 weeks" className="bg-white dark:bg-[#1a1a2e] text-black dark:text-white">2 weeks</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-300">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollFlow;
