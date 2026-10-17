import { useState, useCallback } from 'react';
import { PollOption } from '../types';

export const MAX_POLL_QUESTION_LENGTH = 140;
export const MAX_POLL_OPTION_LENGTH = 30;
export const POLL_LIMIT_EXCEEDED_MSG = "You’ve exceeded the maximum character limit.";

export const usePostPoll = (initialOptions: PollOption[] = [{ id: '1', text: '' }, { id: '2', text: '' }]) => {
  const [pollQuestion, setPollQuestionState] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOption[]>(initialOptions);
  // Set default poll duration to '1 week'
  const [pollDuration, setPollDuration] = useState('1 week');
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [optionErrors, setOptionErrors] = useState<Record<string, string>>({});

  const setPollQuestion = useCallback((value: string) => {
    if (value.length > MAX_POLL_QUESTION_LENGTH) {
      setPollQuestionState(value.slice(0, MAX_POLL_QUESTION_LENGTH));
      setQuestionError(POLL_LIMIT_EXCEEDED_MSG);
    } else {
      setPollQuestionState(value);
      if (value.length < MAX_POLL_QUESTION_LENGTH) {
        setQuestionError(null);
      }
    }
  }, []);

  const addPollOption = useCallback(() => {
    if (pollOptions.length < 6) {
      setPollOptions(prev => [...prev, { id: 'auto-' + Date.now().toString(), text: '' }]);
    }
  }, [pollOptions.length]);

  const removePollOption = useCallback((id: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((option) => option.id !== id));
      setOptionErrors(prev => {
        if (!prev[id]) return prev;
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  }, [pollOptions.length]);

  const updatePollOption = useCallback((id: string, text: string) => {
    if (text.length > MAX_POLL_OPTION_LENGTH) {
      setPollOptions(prev => prev.map((option) => (option.id === id ? { ...option, text: text.slice(0, MAX_POLL_OPTION_LENGTH) } : option)));
      setOptionErrors(prev => ({ ...prev, [id]: POLL_LIMIT_EXCEEDED_MSG }));
    } else {
      setPollOptions(prev => prev.map((option) => (option.id === id ? { ...option, text } : option)));
      if (text.length < MAX_POLL_OPTION_LENGTH) {
        setOptionErrors(prev => {
          if (!prev[id]) return prev;
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
    }
  }, []);

  const clearPoll = useCallback(() => {
    setPollQuestionState('');
    setPollOptions([{ id: '1', text: '' }, { id: '2', text: '' }]);
    setPollDuration('1 week');
    setQuestionError(null);
    setOptionErrors({});
  }, []);

  const isPollValid = useCallback(() => {
    return pollQuestion.trim() !== '' && pollOptions.filter(o => o.text.trim()).length >= 2;
  }, [pollQuestion, pollOptions]);

  return {
    pollQuestion,
    setPollQuestion,
    pollOptions,
    setPollOptions,
    pollDuration,
    setPollDuration,
    addPollOption,
    removePollOption,
    updatePollOption,
    clearPoll,
    isPollValid,
    questionError,
    setQuestionError,
    optionErrors,
    setOptionErrors,
    MAX_POLL_QUESTION_LENGTH,
    MAX_POLL_OPTION_LENGTH,
    POLL_LIMIT_EXCEEDED_MSG,
  };
};
