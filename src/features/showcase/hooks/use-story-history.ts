import { useState, useCallback } from 'react';
import { StoryLayer } from '../types/story-editor';

const MAX_HISTORY = 10;

export function useStoryHistory(initialLayers: StoryLayer[]) {
    const [history, setHistory] = useState<StoryLayer[][]>([initialLayers]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const pushState = useCallback((newLayers: StoryLayer[]) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, currentIndex + 1);
            newHistory.push(newLayers);
            if (newHistory.length > MAX_HISTORY) {
                newHistory.shift();
            }
            return newHistory;
        });
        setCurrentIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    }, [currentIndex]);

    const replaceState = useCallback((newLayers: StoryLayer[]) => {
        setHistory(prev => {
            const newHistory = [...prev];
            newHistory[currentIndex] = newLayers;
            return newHistory;
        });
    }, [currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            return history[currentIndex - 1];
        }
        return null;
    }, [currentIndex, history]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(prev => prev + 1);
            return history[currentIndex + 1];
        }
        return null;
    }, [currentIndex, history]);

    return {
        layers: history[currentIndex],
        undo,
        redo,
        pushState,
        replaceState,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1
    };
}
