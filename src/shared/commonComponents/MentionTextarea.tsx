"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserMention } from '@/services/api/users';
import { cn } from '@/lib/utils';
import { HashtagSuggestion } from '@/services/api/hashtags';
import { useMentions } from '@/hooks/use-mentions';
import { CocpitMentionListCard } from '@/shared/commonComponents/CocpitMentionListCard';

import { parseMentionsForFrontend } from '@/lib/mentions';

export interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onMentionSelect?: (user: UserMention) => void;
    onMentionsChange?: (mentions: UserMention[]) => void;
    searchUsersFn?: (query: string, forTagging?: boolean, cursor?: string) => Promise<any>;
    placeholder?: string;
    className?: string;
    initialMentions?: UserMention[];
    zIndex?: number;
    maxHeight?: number;
    enableHashtags?: boolean;
    enableLinkHighlight?: boolean;
    placement?: 'top' | 'bottom' | 'auto';
    popupClassName?: string;
}

export const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(({ 
    value, 
    onChange, 
    onMentionSelect, 
    onMentionsChange,
    searchUsersFn, 
    className, 
    initialMentions,
    zIndex,
    maxHeight,
    enableHashtags = true,
    enableLinkHighlight = true,
    placement = 'auto',
    popupClassName,
    ...props 
}, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);
    const [mentionedNames, setMentionedNames] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserMention[]>([]);
    
    useEffect(() => {
        if (initialMentions && initialMentions.length > 0) {
            setSelectedUsers(initialMentions);
            setMentionedNames(initialMentions.map(u => u.full_name).filter(Boolean));
        } else if (initialMentions && initialMentions.length === 0) {
            setSelectedUsers([]);
            setMentionedNames([]);
        }
    }, [initialMentions]);

    // Safeguard: Automatically convert raw @[Name](account) into hidden marker format if passed in value
    useEffect(() => {
        if (value && /@\[([^\]]+)\]\(([^)]+)\)/.test(value)) {
            const { content: parsedContent, inlineMentions: parsedMentions } = parseMentionsForFrontend(value);
            setSelectedUsers(prev => {
                const combined = [...prev];
                parsedMentions.forEach(pm => {
                    if (!combined.some(u => u.full_name === pm.full_name || u.account_name === pm.account_name)) {
                        combined.push(pm);
                    }
                });
                return combined;
            });
            setMentionedNames(prev => Array.from(new Set([...prev, ...parsedMentions.map(u => u.full_name)])));
            if (onMentionsChange && parsedMentions.length > 0) {
                onMentionsChange(parsedMentions);
            }
            const event = { target: { value: parsedContent } } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(event);
        }
    }, [value, onChange, onMentionsChange]);
    
    const {
        query, setQuery,
        mode, setMode,
        showSuggestions, setShowSuggestions,
        suggestionPosition, setSuggestionPosition,
        users, hashtags,
        activeIndex, setActiveIndex,
        isLoading,
        hasMore,
        loadMoreUsers,
        handleKeyDown: mentionKeyDown
    } = useMentions({ searchUsersFn: searchUsersFn as any });

    // Helper to calculate caret coordinates for absolute positioning
    const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
        const div = document.createElement('div');
        const style = window.getComputedStyle(element);
        
        const properties = [
            'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
            'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily',
            'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'
        ];

        div.style.position = 'absolute';
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordBreak = 'break-word';

        properties.forEach(prop => {
            (div.style as any)[prop] = (style as any)[prop];
        });

        const content = element.value.substring(0, position);
        div.textContent = content;

        const span = document.createElement('span');
        span.textContent = element.value.substring(position) || '.';
        div.appendChild(span);

        document.body.appendChild(div);
        const { offsetLeft: left, offsetTop: top } = span;
        document.body.removeChild(div);

        return {
            top: top - element.scrollTop + parseInt(style.lineHeight || '20'),
            left: Math.max(0, Math.min(left, element.clientWidth - 280))
        };
    };

    const prevValueLengthRef = useRef(value?.length || 0);

    const adjustHeight = () => {
        const el = textareaRef.current;
        if (!el) return;

        const maxH = maxHeight || (props.style?.maxHeight ? parseInt(String(props.style.maxHeight), 10) : undefined);
        const prevLength = prevValueLengthRef.current;
        const currentLength = el.value.length;
        prevValueLengthRef.current = currentLength;

        const isAtEnd = el.selectionEnd >= currentLength - 1;
        const isAlreadyClamped = Boolean(maxH && el.clientHeight >= maxH);

        // Optimization: If content is already clamped at maxH and length is increasing,
        // avoid expensive 'height: auto' layout reflow. Just maintain maxH and auto-scroll to end if typing at end.
        if (isAlreadyClamped && currentLength >= prevLength) {
            if (isAtEnd) {
                el.scrollTop = el.scrollHeight;
            }
            handleScroll();
            return;
        }

        const prevScrollTop = el.scrollTop;
        el.style.height = 'auto';
        const scrollH = el.scrollHeight;

        if (maxH && scrollH > maxH) {
            el.style.height = `${maxH}px`;
            el.style.overflowY = 'auto';
            if (backdropRef.current) {
                backdropRef.current.style.height = `${maxH}px`;
                backdropRef.current.style.maxHeight = `${maxH}px`;
            }
            if (isAtEnd) {
                el.scrollTop = scrollH;
            } else {
                el.scrollTop = prevScrollTop;
            }
        } else {
            const newH = Math.max(scrollH, 20);
            el.style.height = `${newH}px`;
            el.style.overflowY = 'hidden';
            if (backdropRef.current) {
                backdropRef.current.style.height = 'auto';
                backdropRef.current.style.maxHeight = 'none';
            }
            el.scrollTop = 0;
        }
        handleScroll();
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        adjustHeight();

        const currentText = e.target.value;
        
        // Count how many times each user mention appears in currentText
        const counts: Record<string, number> = {};
        for (const user of selectedUsers) {
            if (!user.full_name) continue;
            if (counts[user.full_name] === undefined) {
                const escaped = user.full_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const markerRegex = new RegExp(`\u200B${escaped}`, 'g');
                const markerMatches = currentText.match(markerRegex);
                if (markerMatches) {
                    counts[user.full_name] = markerMatches.length;
                } else {
                    const fallbackRegex = new RegExp(escaped, 'g');
                    const fallbackMatches = currentText.match(fallbackRegex);
                    counts[user.full_name] = fallbackMatches ? fallbackMatches.length : 0;
                }
            }
        }

        const remainingUsers: UserMention[] = [];
        const usedCounts: Record<string, number> = {};
        for (const user of selectedUsers) {
            const available = counts[user.full_name] || 0;
            const used = usedCounts[user.full_name] || 0;
            if (used < available) {
                remainingUsers.push(user);
                usedCounts[user.full_name] = used + 1;
            }
        }

        if (remainingUsers.length !== selectedUsers.length) {
            setSelectedUsers(remainingUsers);
            setMentionedNames(Array.from(new Set(remainingUsers.map(u => u.full_name))));
            if (onMentionsChange) onMentionsChange(remainingUsers);
        }

        onChange(e);

        const cursor = e.target.selectionStart;
        const textBeforeCursor = currentText.substring(0, cursor);

        const mentionMatch = textBeforeCursor.match(/(?:^|[\s\u200B])@([a-zA-Z0-9_]*)$/);
        const hashtagMatch = enableHashtags ? textBeforeCursor.match(/(?:^|[\s\u200B])#([a-zA-Z0-9_]*)$/) : null;

        if (mentionMatch || hashtagMatch) {
            const nextMode = mentionMatch ? 'mention' : 'hashtag';
            if (!showSuggestions || mode !== nextMode) {
                const triggerPos = cursor - (mentionMatch ? mentionMatch[1].length : hashtagMatch![1].length);
                const coords = getCaretCoordinates(e.target, triggerPos);
                setSuggestionPosition(coords);
            }
            setQuery(mentionMatch ? mentionMatch[1] : hashtagMatch![1]);
            setMode(nextMode);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            setMode(null);
            setQuery('');
        }

        requestAnimationFrame(() => {
            const el = textareaRef.current;
            if (!el) return;
            if (el.selectionEnd >= el.value.length - 1) {
                el.scrollTop = el.scrollHeight;
                handleScroll();
            }
        });
    };

    const onSelect = (item: UserMention | HashtagSuggestion) => {
        if (mode === 'mention') {
            selectUser(item as UserMention);
        } else {
            selectHashtag(item as HashtagSuggestion);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const el = textareaRef.current;

        // Atomic mention deletion on Backspace
        if (e.key === 'Backspace' && el && el.selectionStart === el.selectionEnd) {
            const cursor = el.selectionStart;
            const textBefore = value.substring(0, cursor);

            const lastMarkerIdx = textBefore.lastIndexOf('\u200B');
            if (lastMarkerIdx !== -1) {
                const mentionSegment = textBefore.substring(lastMarkerIdx);
                if (!mentionSegment.includes('\n')) {
                    const textFromMarker = value.substring(lastMarkerIdx);
                    const allKnownNames = Array.from(new Set([
                        ...mentionedNames,
                        ...selectedUsers.map(u => u.full_name).filter(Boolean)
                    ]));

                    let mentionEndPos = -1;
                    let matchedName = '';

                    for (const name of allKnownNames) {
                        if (textFromMarker.startsWith(`\u200B${name} `)) {
                            mentionEndPos = lastMarkerIdx + name.length + 2;
                            matchedName = name;
                            break;
                        } else if (textFromMarker.startsWith(`\u200B${name}`)) {
                            mentionEndPos = lastMarkerIdx + name.length + 1;
                            matchedName = name;
                            break;
                        }
                    }

                    if (mentionEndPos === -1) {
                        const genericMatch = textFromMarker.match(/^\u200B[^\s\u200B]+ ?/);
                        if (genericMatch) {
                            mentionEndPos = lastMarkerIdx + genericMatch[0].length;
                        } else {
                            mentionEndPos = lastMarkerIdx + 1;
                        }
                    }

                    if (cursor >= lastMarkerIdx && cursor <= mentionEndPos) {
                        e.preventDefault();
                        const newValue = value.substring(0, lastMarkerIdx) + value.substring(mentionEndPos);

                        if (matchedName) {
                            // Remove only one occurrence of matchedName from selectedUsers
                            const removeIdx = selectedUsers.findIndex(u => u.full_name === matchedName);
                            const nextUsers = removeIdx !== -1
                                ? selectedUsers.filter((_, idx) => idx !== removeIdx)
                                : selectedUsers;

                            setSelectedUsers(nextUsers);

                            // Only remove from mentionedNames if NO other occurrences remain in nextUsers and not in newValue
                            const stillHasName = nextUsers.some(u => u.full_name === matchedName) || newValue.includes(`\u200B${matchedName}`);
                            if (!stillHasName) {
                                setMentionedNames(prev => prev.filter(n => n !== matchedName));
                            }

                            if (onMentionsChange) onMentionsChange(nextUsers);
                        }

                        const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
                        onChange(event);

                        setTimeout(() => {
                            if (textareaRef.current) {
                                textareaRef.current.setSelectionRange(lastMarkerIdx, lastMarkerIdx);
                                textareaRef.current.focus();
                            }
                        }, 0);
                        return;
                    }
                }
            }
        }

        const handled = mentionKeyDown(e, onSelect);
        if (!handled && props.onKeyDown) {
            props.onKeyDown(e);
        }
        setTimeout(handleScroll, 0);
    };

    // Position cursor at the end of pasted content and process inline mention markers or triggers on paste
    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (props.onPaste) {
            props.onPaste(e);
        }
        if (e.defaultPrevented) return;

        const pastedText = e.clipboardData?.getData('text/plain');
        if (!pastedText) return;

        const el = textareaRef.current;
        const start = el ? el.selectionStart : value.length;
        const end = el ? el.selectionEnd : value.length;

        let insertedText = pastedText;
        let newMentions: UserMention[] = [];

        if (/@\[([^\]]+)\]\(([^)]+)\)/.test(pastedText)) {
            const { content: parsedContent, inlineMentions: parsedMentions } = parseMentionsForFrontend(pastedText);
            insertedText = parsedContent;
            newMentions = parsedMentions;
        }

        e.preventDefault();

        const textBefore = value.substring(0, start);
        const textAfter = value.substring(end);
        
        if (props.maxLength) {
            const availableSpace = props.maxLength - (textBefore.length + textAfter.length);
            if (availableSpace <= 0) {
                insertedText = '';
            } else if (insertedText.length > availableSpace) {
                insertedText = insertedText.substring(0, availableSpace);
            }
        }
        
        const newValue = textBefore + insertedText + textAfter;

        if (newMentions.length > 0) {
            setSelectedUsers(prev => {
                const combined = [...prev];
                newMentions.forEach(pm => {
                    if (!combined.some(u => u.full_name === pm.full_name || u.account_name === pm.account_name)) {
                        combined.push(pm);
                    }
                });
                return combined;
            });
            setMentionedNames(prev => Array.from(new Set([...prev, ...newMentions.map(u => u.full_name)])));
            if (onMentionsChange) {
                onMentionsChange([...selectedUsers, ...newMentions]);
            }
        }

        const newCursorPos = start + insertedText.length;

        const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(event);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                textareaRef.current.focus();
                adjustHeight();

                setShowSuggestions(false);
                setMode(null);
                setQuery('');
            }
        }, 0);
    };

    const selectUser = (user: UserMention, format: 'account' | 'full' = 'account') => {
        const el = textareaRef.current;
        if (!el) return;

        const cursor = el.selectionStart;
        const textBefore = value.substring(0, cursor);
        const textAfter = value.substring(cursor);
        
        const match = textBefore.match(/(?:^|[\s\u200B])@([a-zA-Z0-9._ ]*)$/);
        if (match) {
            const baseLeft = textBefore.substring(0, match.index! + match[0].indexOf('@'));
            const content = format === 'full' ? user.full_name : user.full_name; // Force full name
            const injected = `\u200B${content} `;
            const newValue = baseLeft + injected + textAfter;

            // Track the full name so the highlighter knows to match it with spaces
            setMentionedNames(prev => Array.from(new Set([...prev, content])));
            
            const nextUsers = [...selectedUsers, user];
            setSelectedUsers(nextUsers);
            if (onMentionsChange) onMentionsChange(nextUsers);

            const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(event);
            setShowSuggestions(false);
            if (onMentionSelect) onMentionSelect(user);

            setTimeout(() => {
                const newPos = baseLeft.length + injected.length;
                el.setSelectionRange(newPos, newPos);
                el.focus();
            }, 0);
        }
    };

    const selectHashtag = (tag: HashtagSuggestion) => {
        const el = textareaRef.current;
        if (!el) return;

        const boundaryRegex = new RegExp(`(^|\\s)#${tag.tag}(\\s|$)`, 'i');
        if (boundaryRegex.test(value)) {
            setShowSuggestions(false);
            return;
        }

        const cursor = el.selectionStart;
        const textBefore = value.substring(0, cursor);
        const textAfter = value.substring(cursor);
        
        const match = textBefore.match(/(?:^|[\s\u200B])#([a-zA-Z0-9_]*)$/);
        if (match) {
            const baseLeft = textBefore.substring(0, match.index! + match[0].indexOf('#'));
            const injected = `#${tag.tag} `;
            const newValue = baseLeft + injected + textAfter;

            const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(event);
            setShowSuggestions(false);

            setTimeout(() => {
                const newPos = baseLeft.length + injected.length;
                el.setSelectionRange(newPos, newPos);
                el.focus();
            }, 0);
        }
    };

    const backdropRef = useRef<HTMLDivElement>(null);

    const renderHighlightedText = (text: string) => {
        if (!text) return null;
        
        // Escape names for regex, sorted longest first to avoid partial prefix collisions
        const allKnownNames = Array.from(new Set([
            ...mentionedNames,
            ...selectedUsers.map(u => u.full_name).filter(Boolean)
        ]));
        const escapedNames = allKnownNames
            .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .sort((a, b) => b.length - a.length);
        const nameRegexPart = escapedNames.length > 0 ? `\u200B(?:${escapedNames.join('|')})|` : '';
        const linkRegexPart = enableLinkHighlight ? `|(?:https?:\\/\\/|www\\.)[^\\s]+` : '';
        const regex = new RegExp(`(${nameRegexPart}\u200B[^\\s\u200B]+|@\\[[^\\]]+\\]\\([^)]+\\)${linkRegexPart}|(?:^|\\s)#[a-zA-Z0-9_]+)`, 'g');

        const parts = text.split(regex);
        return (
            <>
                {parts.map((part, i) => {
                    if (part.startsWith('\u200B') || part.startsWith('@[')) {
                        return (
                            <span 
                                key={i} 
                                className="mention-token text-[var(--ds-accent)] !text-[var(--ds-accent)]"
                                style={{ color: 'var(--ds-accent)' }}
                            >
                                {part}
                            </span>
                        );
                    }
                    if (enableLinkHighlight && /^(?:https?:\/\/|www\.)[^\s]+$/.test(part)) {
                        return (
                            <span 
                                key={i} 
                                className="link-token text-[var(--ds-accent)] !text-[var(--ds-accent)]"
                                style={{ color: 'var(--ds-accent)', WebkitTextFillColor: 'var(--ds-accent)' }}
                            >
                                {part}
                            </span>
                        );
                    }
                    if (/(?:^|\s)#[a-zA-Z0-9_]+/.test(part)) {
                        return (
                            <span 
                                key={i} 
                                className="hashtag-token text-[var(--ds-text-primary)] !text-[var(--ds-text-primary)]"
                                style={{ color: 'var(--ds-text-primary)' }}
                            >
                                {part}
                            </span>
                        );
                    }
                    return part;
                })}
            </>
        );
    };

    const handleScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (textareaRef.current && backdropRef.current) {
                backdropRef.current.scrollTop = textareaRef.current.scrollTop;
                backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [value]);

    const containerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const suggestionPositionRef = useRef(suggestionPosition);

    useEffect(() => {
        suggestionPositionRef.current = suggestionPosition;
    }, [suggestionPosition]);

    const [computedZIndex, setComputedZIndex] = useState<number>(zIndex ?? 35);

    useEffect(() => {
        if (zIndex !== undefined) {
            setComputedZIndex(zIndex);
            return;
        }
        if (!showSuggestions || !containerRef.current) {
            setComputedZIndex(35);
            return;
        }
        let el: HTMLElement | null = containerRef.current;
        let maxZ = 35;
        while (el && el !== document.body) {
            const z = window.getComputedStyle(el).zIndex;
            if (z && z !== 'auto') {
                const num = parseInt(z, 10);
                if (!isNaN(num) && num >= 40) {
                    maxZ = Math.max(maxZ, num + 10);
                }
            }
            el = el.parentElement;
        }
        setComputedZIndex(maxZ);
    }, [zIndex, showSuggestions]);

    useEffect(() => {
        if (!showSuggestions) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node;
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                popupRef.current && !popupRef.current.contains(target)
            ) {
                setShowSuggestions(false);
            }
        };

        const updatePositionAndVisibility = () => {
            if (!textareaRef.current || !popupRef.current) return;

            const textareaRect = textareaRef.current.getBoundingClientRect();
            const popupEl = popupRef.current;
            const popupHeight = popupEl.offsetHeight || 168;
            const popupWidth = popupEl.offsetWidth || 560;

            const isTop = placement === 'top' || (textareaRect.bottom + popupHeight > window.innerHeight && textareaRect.top > popupHeight);

            // Exactly 8px above input box when placement is 'top' / flipped
            const currentTop = isTop
                ? textareaRect.top - popupHeight - 8
                : textareaRect.top + (suggestionPositionRef.current?.top ?? 24);

            const currentLeft = isTop
                ? Math.max(12, Math.min(textareaRect.left - 32, window.innerWidth - popupWidth - 12))
                : textareaRect.left + (suggestionPositionRef.current?.left ?? 0);

            // Close the modal only when it has scrolled completely outside of the viewport
            const isOutOfViewport =
                textareaRect.bottom < 0 ||
                textareaRect.top > window.innerHeight ||
                currentLeft + popupWidth <= 0 ||
                currentLeft >= window.innerWidth;

            if (isOutOfViewport) {
                setShowSuggestions(false);
                return;
            }

            popupEl.style.top = `${currentTop}px`;
            popupEl.style.left = `${currentLeft}px`;
        };

        const handleScrollOrResize = (e: Event) => {
            const target = e.target as Node;
            // Don't reposition or close if scrolling inside the suggestions list itself
            if (popupRef.current && popupRef.current.contains(target)) {
                return;
            }
            updatePositionAndVisibility();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [showSuggestions, setShowSuggestions, placement]);

    return (
        <div ref={containerRef} className="flex flex-col w-full relative">
            {showSuggestions && mode === 'mention' && typeof document !== 'undefined' && createPortal(
                <div 
                    ref={popupRef}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    className={cn(
                        "fixed pointer-events-auto shadow-2xl rounded-xl w-full max-w-[560px] h-[168px] p-0 box-border flex flex-col items-start bg-[var(--ds-bg)] border border-[var(--ds-border)] overflow-hidden animate-in fade-in-0 zoom-in-95",
                        popupClassName
                    )}
                    style={{
                        zIndex: computedZIndex,
                        top: (() => {
                            if (!textareaRef.current) return '40px';
                            const rect = textareaRef.current.getBoundingClientRect();
                            const isTop = placement === 'top' || (rect.bottom + 168 > window.innerHeight && rect.top > 168);
                            return isTop ? `${rect.top - 168 - 8}px` : `${rect.top + (suggestionPosition.top ?? 24)}px`;
                        })(),
                        left: (() => {
                            if (!textareaRef.current) return '10px';
                            const rect = textareaRef.current.getBoundingClientRect();
                            const isTop = placement === 'top' || (rect.bottom + 168 > window.innerHeight && rect.top > 168);
                            return isTop 
                                ? `${Math.max(12, Math.min(rect.left - 32, window.innerWidth - 560 - 12))}px`
                                : `${rect.left + (suggestionPosition.left ?? 0)}px`;
                        })(),
                    }}
                >
                    <CocpitMentionListCard
                        users={users}
                        activeIndex={activeIndex}
                        query={query}
                        isLoading={isLoading}
                        onSelect={(user) => selectUser(user as UserMention, 'account')}
                        onHoverIndex={setActiveIndex}
                        onDismiss={() => setShowSuggestions(false)}
                        showNoResults={!isLoading && showSuggestions && users.length === 0 && !!query}
                        hasMore={hasMore}
                        onLoadMore={loadMoreUsers}
                    />
                </div>,
                document.body
            )}

            {enableHashtags && showSuggestions && mode === 'hashtag' && typeof document !== 'undefined' && createPortal(
                <div
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    ref={(el) => {
                        popupRef.current = el;
                        if (el) {
                            const activeItem = el.children[activeIndex + 1] as HTMLElement; // +1 because first child is "Suggestions" title
                            if (activeItem) {
                                activeItem.scrollIntoView({ block: 'nearest' });
                            }
                        }
                    }}
                    className="fixed pointer-events-auto animate-in fade-in-0 zoom-in-95 shadow-2xl bg-ds-bg border border-ds-border rounded-xl flex flex-col items-start p-4 gap-2 w-[280px] max-h-[232px] overflow-x-hidden overflow-y-auto custom-scrollbar mb-2 box-border"
                    style={{
                        zIndex: computedZIndex,
                        top: typeof suggestionPosition.top === 'number'
                            ? `${(textareaRef.current?.getBoundingClientRect().top || 0) + suggestionPosition.top}px` 
                            : '40px',
                        left: typeof suggestionPosition.left === 'number'
                            ? `${(textareaRef.current?.getBoundingClientRect().left || 0) + suggestionPosition.left}px` 
                            : '10px',
                    }}
                >
                    <div className="text-sm font-semibold text-ds-text-secondary mb-2 shrink-0">Suggestions</div>
                    {hashtags.map((hashtag, index) => (
                        <div
                            key={hashtag.tag}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => selectHashtag(hashtag)}
                            className={cn(
                                "flex flex-row justify-between items-center px-3 py-2 w-full rounded-lg cursor-pointer transition-colors duration-150",
                                index === activeIndex ? "bg-ds-surface-1 text-ds-text-primary" : "hover:bg-ds-surface-1/50 text-ds-text-secondary"
                            )}
                        >
                            <span className="font-medium text-ds-text-primary">#{hashtag.tag}</span>
                            <span className="text-xs text-ds-text-muted">{hashtag.usage_count} posts</span>
                        </div>
                    ))}
                    {!isLoading && hashtags.length === 0 && query && (
                        <div className="px-3 py-3 text-xs text-ds-text-muted italic text-center w-full">
                            No results found
                        </div>
                    )}
                </div>,
                document.body
            )}

            <div className="relative w-full">
                {/* Backdrop containing the highlighted text */}
                <div
                    ref={backdropRef}
                    className={cn(
                        "absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden text-ds-text-primary text-foreground",
                        value.length === 0 ? "opacity-0" : "opacity-100",
                        className
                    )}
                    style={{
                        borderColor: 'transparent',
                        backgroundColor: 'transparent',
                        color: 'var(--ds-text-primary, currentColor)',
                    }}
                >
                    {renderHighlightedText(value)}
                </div>

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleInput}
                    onScroll={handleScroll}
                    onKeyUp={handleScroll}
                    onClick={handleScroll}
                    onSelect={handleScroll}
                    {...props}
                    onDrop={(e) => {
                        if (props.onDrop) {
                            props.onDrop(e);
                            return;
                        }
                        const hasFiles = e.dataTransfer.files && e.dataTransfer.files.length > 0;
                        const types = Array.from(e.dataTransfer.types || []);
                        if (hasFiles || types.includes('text/uri-list') || types.includes('text/html')) {
                            const uri = e.dataTransfer.getData('text/uri-list');
                            const html = e.dataTransfer.getData('text/html');
                            if (hasFiles || uri || (html && html.includes('<img'))) {
                                e.preventDefault();
                            }
                        }
                    }}
                    onDragOver={(e) => {
                        if (props.onDragOver) {
                            props.onDragOver(e);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    className={cn(
                        "w-full resize-none overflow-y-auto scrollbar-hide bg-transparent outline-none relative z-10 selection:bg-[var(--primary)] selection:text-white dark:selection:text-white mention-textarea-input",
                        value.length > 0 ? "!text-transparent" : "text-ds-text-primary",
                        className
                    )}
                    style={{
                        ...props.style,
                        color: value.length > 0 ? 'transparent' : 'inherit',
                        WebkitTextFillColor: value.length > 0 ? 'transparent' : 'inherit',
                        caretColor: 'var(--ds-text-primary)',
                    }}
                />
            </div>
        </div>
    );
});

export default MentionTextarea;
