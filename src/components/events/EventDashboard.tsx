"use client";

import { useState } from 'react';
import { EventCardSimple } from './EventCardSimple';
import { Page, Theme } from '@/types/common';
import { Plus, Search, Calendar, Users, Clock, DollarSign, Filter, MapPin } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventDashboardProps {
    navigateTo: (page: Page) => void;
    onLogout?: () => void;
    theme: Theme;
}

const myEvents = [
    {
        id: 1,
        title: 'Product Management Summit 2025',
        date: 'March 15, 2025',
        location: 'San Francisco, CA',
        attendees: 234,
        status: 'Published',
    },
    {
        id: 2,
        title: 'Tech Networking Mixer',
        date: 'March 20, 2025',
        location: 'Virtual Event',
        attendees: 156,
        status: 'Draft',
    },
    {
        id: 3,
        title: 'Web Development Workshop',
        date: 'March 25, 2025',
        location: 'New York, NY',
        attendees: 89,
        status: 'Published',
    },
];

export function EventDashboard({ navigateTo, theme }: EventDashboardProps) {
    // force dark mode logic for this specific dashboard view to match screenshot exactly if that's the intent, 
    // but better to use the theme variables. 
    // The screenshot shows a very specific dark theme. 
    // We'll use the card/background classes which map to the theme variables.

    const [selectedEventId, setSelectedEventId] = useState<number | null>(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Extended mock data with ticketing info
    const eventsWithAnalytics = myEvents.map(event => {
        const isPaid = event.id % 2 !== 0; // Odd IDs are paid
        const ticketPrice = isPaid ? (event.id === 1 ? 299 : 49) : 0;
        const totalTickets = event.id === 1 ? 500 : 200;
        const soldTickets = event.attendees;
        const freeRegistrations = isPaid ? Math.floor(soldTickets * 0.1) : soldTickets;
        const paidRegistrations = isPaid ? soldTickets - freeRegistrations : 0;

        return {
            ...event,
            ticketType: isPaid ? 'Paid' : 'Free',
            ticketPrice,
            totalTickets: isPaid ? totalTickets : 0,
            soldTickets,
            freeRegistrations,
            paidRegistrations,
            revenue: paidRegistrations * ticketPrice,
            isSoldOut: isPaid && soldTickets >= totalTickets,
            formattedDate: event.date
        };
    });

    const selectedEvent = eventsWithAnalytics.find(e => e.id === selectedEventId);

    const filteredEvents = eventsWithAnalytics.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            filterType === 'all' ? true :
                filterType === 'in-person' ? event.location !== 'Virtual Event' :
                    filterType === 'virtual' ? event.location === 'Virtual Event' : true;

        return matchesSearch && matchesFilter;
    });

    // Aggregate Metrics
    const totalEvents = eventsWithAnalytics.length;
    const activeEvents = eventsWithAnalytics.filter(e => e.status === 'Published').length;
    const totalTicketsSold = eventsWithAnalytics.reduce((acc, e) => acc + e.soldTickets, 0);
    const totalTicketCapacity = eventsWithAnalytics.reduce((acc, e) => acc + (e.totalTickets || 0), 0);
    const totalRevenue = eventsWithAnalytics.reduce((acc, e) => acc + (e.revenue || 0), 0);
    const capacityPercentage = totalTicketCapacity > 0 ? Math.round((totalTicketsSold / totalTicketCapacity) * 100) : 0;

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Event Dashboard</h1>
                    <p className="text-muted-foreground">Manage and track your events</p>
                </div>
                <button
                    onClick={() => navigateTo('create-event' as Page)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-all font-medium"
                >
                    <Plus className="w-4 h-4" /> Create Event
                </button>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* All Events */}
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">All Events</p>
                            <h2 className="text-3xl font-bold text-foreground">{totalEvents}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Active Events */}
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Active Events</p>
                            <h2 className="text-3xl font-bold text-foreground">{activeEvents}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Tickets Sold */}
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10 w-full">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Tickets Sold</p>
                            <h2 className="text-3xl font-bold text-foreground">{totalTicketsSold}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="z-10 w-full mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Capacity: {totalTicketCapacity}</span>
                            <span>{capacityPercentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                style={{ width: `${capacityPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                            <h2 className="text-3xl font-bold text-foreground">${totalRevenue.toLocaleString()}</h2>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Your Events List */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="bg-card border border-border rounded-xl p-4 h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-semibold text-foreground">Your Events</h3>
                            <span className="text-xs text-muted-foreground">{filteredEvents.length} events</span>
                        </div>

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 bg-[#171c28] border-border text-foreground">
                                    <DropdownMenuItem onClick={() => setFilterType('all')} className="cursor-pointer hover:bg-muted focus:bg-muted">
                                        All Events
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterType('in-person')} className="cursor-pointer hover:bg-muted focus:bg-muted">
                                        In-Person
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setFilterType('virtual')} className="cursor-pointer hover:bg-muted focus:bg-muted">
                                        Virtual Only
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                            {filteredEvents.map(event => (
                                <EventCardSimple
                                    key={event.id}
                                    event={event}
                                    isSelected={selectedEventId === event.id}
                                    onClick={() => setSelectedEventId(event.id)}
                                    onEdit={() => { }}
                                    onDelete={() => { }}
                                    theme={theme}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Event Details */}
                <div className="lg:col-span-2">
                    {selectedEvent ? (
                        <div className="bg-card border border-border rounded-xl p-6 h-[600px] overflow-y-auto scrollbar-hide">
                            {/* Event Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground mb-2">{selectedEvent.title}</h2>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            <span>{selectedEvent.date}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" />
                                            <span>{selectedEvent.location}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedEvent.status === 'Published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                        {selectedEvent.status}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                        {selectedEvent.ticketType} Event
                                    </span>
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <h3 className="text-sm font-semibold text-foreground mb-3">Quick Stats</h3>
                            <div className="grid grid-cols-4 gap-4 mb-8">
                                <div className="bg-[#171c28] rounded-lg p-4 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">Total Attendees</p>
                                    <p className="text-xl font-bold text-foreground">{selectedEvent.attendees}</p>
                                </div>
                                <div className="bg-[#171c28] rounded-lg p-4 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">Views</p>
                                    <p className="text-xl font-bold text-foreground">1,234</p>
                                </div>
                                <div className="bg-[#171c28] rounded-lg p-4 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">Registration Rate</p>
                                    <p className="text-xl font-bold text-foreground">18.4%</p>
                                </div>
                                <div className="bg-[#171c28] rounded-lg p-4 border border-border">
                                    <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                                    <p className="text-xl font-bold text-foreground">${selectedEvent.revenue.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Ticketing Analytics */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-foreground">Ticketing Analytics</h3>
                                    <span className="text-xs border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                                        ${selectedEvent.ticketPrice} / ticket
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-full border border-border transition-colors">
                                        Export Sales
                                    </button>
                                    <button className="text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full border border-primary/20 transition-colors">
                                        Manage Tickets
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Progress */}
                                <div>
                                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                        <span>Ticket Sales Progress</span>
                                        <span>{selectedEvent.soldTickets} / {selectedEvent.totalTickets} sold</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full bg-green-500"
                                            style={{ width: `${Math.min((selectedEvent.soldTickets / selectedEvent.totalTickets) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground mb-4">
                                        <span>{selectedEvent.totalTickets - selectedEvent.soldTickets} remaining</span>
                                        <span>{Math.round((selectedEvent.soldTickets / selectedEvent.totalTickets) * 100)}%</span>
                                    </div>

                                    <div className="bg-[#171c28] rounded-lg p-3 flex justify-between border border-border">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Free (Comps)</p>
                                            <p className="font-semibold text-foreground">{selectedEvent.freeRegistrations}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Paid Sales</p>
                                            <p className="font-semibold text-foreground">{selectedEvent.paidRegistrations}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Card */}
                                {/* Revenue & Stats Column */}
                                <div className="space-y-4">
                                    {/* Total Revenue Card */}
                                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-2xl font-bold text-foreground">${selectedEvent.revenue.toLocaleString()}</p>
                                        </div>
                                        <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Live tracking
                                        </p>
                                    </div>

                                    {/* Conversion & Avg Card */}
                                    <div className="bg-[#171c28] rounded-lg p-4 border border-border grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground">Conversion</p>
                                            <p className="text-sm font-semibold text-foreground">91.0%</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground">Avg / Attendee</p>
                                            <p className="text-sm font-semibold text-foreground">$44.60</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
                            <div className="space-y-4">
                                {[
                                    { name: "Alex Morgan", time: "Registered 2 hours ago", initial: "A", color: "bg-blue-500" },
                                    { name: "Sarah Chen", time: "Registered 5 hours ago", initial: "S", color: "bg-green-500" },
                                    { name: "Michael Ross", time: "Registered 1 day ago", initial: "M", color: "bg-orange-500" }
                                ].map((activity, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center text-xs text-white font-medium`}>
                                            {activity.initial}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{activity.name}</p>
                                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-xl p-6 h-[600px] flex items-center justify-center text-muted-foreground">
                            <p>Select an event to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
