/* DEPRECATED
DEPRECATED\n// import { useState, useCallback } from 'react';
import { PollOption } from '../types';

export const usePostPoll = (initialOptions: PollOption[] = [{ id: '1', text: '' }, { id: '2', text: '' }]) => {
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOption[]>(initialOptions);
  const [pollDuration, setPollDuration] = useState('1 week');

  const addPollOption = useCallback(() => {
    if (pollOptions.length < 6) {
      setPollOptions(prev => [...prev, { id: 'auto-' + Date.now().toString(), text: '' }]);
    }
  }, [pollOptions.length]);

  const removePollOption = useCallback((id: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((option) => option.id !== id));
    }
  }, [pollOptions.length]);

  const updatePollOption = useCallback((id: string, text: string) => {
    setPollOptions(prev => prev.map((option) => (option.id === id ? { ...option, text } : option)));
  }, []);

  const clearPoll = useCallback(() => {
    setPollQuestion('');
    setPollOptions([{ id: '1', text: '' }, { id: '2', text: '' }]);
    setPollDuration('1 week');
  }, []);

  const isPollValid = useCallback(() => {
    return pollQuestion.trim() !== '' && pollOptions.filter(o => o.text.trim()).length >= 2;
  }, [pollQuestion, pollOptions]);

  return {
    pollQuestion, setPollQuestion,
    pollOptions, setPollOptions,
    pollDuration, setPollDuration,
    addPollOption,
    removePollOption,
    updatePollOption,
    clearPoll,
    isPollValid
  };
};

*/
export {};
