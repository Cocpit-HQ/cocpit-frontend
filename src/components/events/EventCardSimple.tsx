
import React from 'react';
import { Calendar, MapPin, MoreVertical, Users } from 'lucide-react';
import { Theme } from '@/types/common';

export interface SimpleEvent {
    id: number;
    title: string;
    date: string;
    location: string;
    attendees: number;
    status: string;
}

interface EventCardSimpleProps {
    event: SimpleEvent & { [key: string]: any };
    isSelected: boolean;
    onClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
    theme: Theme;
}

export function EventCardSimple({ event, isSelected, onClick, onEdit, onDelete, theme }: EventCardSimpleProps) {
    return (
        <div
            onClick={onClick}
            className={`relative p-4 rounded-xl border transition-all cursor-pointer group mb-3 ${isSelected
                    ? 'bg-muted/60 border-muted/80 shadow-md' // Selected state darker/highlighted
                    : 'bg-transparent border-transparent hover:bg-muted/30 border-b-border/50'
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className={`font-semibold line-clamp-1 text-sm ${isSelected ? 'text-foreground' : 'text-foreground/90'}`}>
                    {event.title}
                </h3>
                <button className="text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            <div className="flex gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${event.status === 'Published'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                    <span className="w-1 h-1 rounded-full bg-current inline-block mr-1 mb-0.5"></span>
                    {event.status}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20">
                    {event.ticketType === 'Paid' ? 'Paid' : 'Free'}
                </span>
            </div>

            <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 opacity-70" />
                    <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5 opacity-70" />
                    <span>{event.attendees} attendees</span>
                </div>
            </div>

            {isSelected && (
                <button className="w-full mt-2 text-xs bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
                    View Details
                </button>
            )}
        </div>
    );
}
