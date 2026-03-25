"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventCardSimple } from './EventCardSimple';
import { CreateEventForm } from './CreateEventForm';
import { Page, Theme } from '@/types/common';
import { Search, Calendar, Users, Clock, DollarSign, Filter, MapPin, Menu, BarChart2, ScanLine } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { BackendEvent } from '@/types/event';

interface EventDashboardProps {
    navigateTo: (page: Page) => void;
    onLogout?: () => void;
    theme: Theme;
}

const participantsData = [
    { name: "Alex Morgan", time: "Registered 2 hours ago", initial: "A", color: "bg-blue-500" },
    { name: "Sarah Chen", time: "Registered 5 hours ago", initial: "S", color: "bg-green-500" },
    { name: "Michael Ross", time: "Registered 1 day ago", initial: "M", color: "bg-orange-500" }
];

type DashboardEvent = BackendEvent & {
    id: string;
    date: string;
    ticketType: 'Paid' | 'Free';
    ticketPrice: number;
    totalTickets: number;
    soldTickets: number;
    freeRegistrations: number;
    paidRegistrations: number;
    revenue: number;
    isSoldOut: boolean;
    formattedDate: string;
    status: string;
    attendees: number;
};

export function EventDashboard({ theme }: EventDashboardProps) {
    // force dark mode logic for this specific dashboard view to match screenshot exactly if that's the intent, 
    // but better to use the theme variables. 
    // The screenshot shows a very specific dark theme. 
    // We'll use the card/background classes which map to the theme variables.
    const { activeProfile } = useActiveProfile(); // Get active profile context

    const [events, setEvents] = useState<DashboardEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState<number | string | null>(null);
    const [selectedStat, setSelectedStat] = useState<string>("revenue"); // Default selected stat
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState<'analytics' | 'participants'>('analytics');
    const [participantSearchQuery, setParticipantSearchQuery] = useState('');

    // Edit/Delete State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<DashboardEvent | null>(null);

    const detailsRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Fetch Real Events on Mount
    useEffect(() => {
        const fetchMyEvents = async () => {
            setIsLoading(true);
            try {
                const { getMyCreatedEvents } = await import('@/services/api/event');
                const companyId = activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined;
                const data = await getMyCreatedEvents(companyId);
                // backend returns BackendEvent[], we map to what dashboard needs if necessary
                // or just use it directly. EventCardSimple expects basic fields.
                // We need to ensure we can calculate analytics from it if possible, or mock analytics for now.

                const eventsWithAnalytics: DashboardEvent[] = data.map((event) => {
                    // Mock analytics for now as backend might not return stats yet
                    const isPaid = event.price_type === 'Paid';
                    const ticketPrice = Number(event.price) || 0;
                    const totalTickets = event.max_attendees || 100;
                    const soldTickets = event.registered_count || 0;
                    const freeRegistrations = isPaid ? Math.floor(soldTickets * 0.1) : soldTickets;
                    const paidRegistrations = isPaid ? soldTickets - freeRegistrations : 0;
                    const revenue = paidRegistrations * ticketPrice;

                    return {
                        ...event,
                        id: event.event_id, // Map event_id to id for consistency
                        date: new Date(event.start_time).toLocaleDateString(), // Format date
                        ticketType: isPaid ? 'Paid' : 'Free',
                        ticketPrice,
                        totalTickets,
                        soldTickets,
                        freeRegistrations,
                        paidRegistrations,
                        revenue,
                        isSoldOut: soldTickets >= totalTickets,
                        formattedDate: new Date(event.start_time).toLocaleDateString(),
                        status: 'Published', // Assuming published for now
                        attendees: soldTickets,
                    };
                });

                setEvents(eventsWithAnalytics);
                if (eventsWithAnalytics.length > 0) {
                    setSelectedEventId(eventsWithAnalytics[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch my events", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMyEvents();
    }, [activeProfile?.id, activeProfile?.type]);

    const handleEventClick = (id: number | string) => {
        setSelectedEventId(id);
        // On mobile, scroll to details
        if (window.innerWidth < 1024) {
            setTimeout(() => {
                detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    const handleEdit = (event: DashboardEvent) => {
        // Map back to BackendEvent structure if needed or pass directly
        setEditingEvent(event);
        setShowEditModal(true);
    };

    const handleDelete = async (id: number | string) => {
        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
        try {
            const { deleteEvent } = await import('@/services/api/event');
            await deleteEvent(id);
            setEvents(prev => prev.filter(e => e.id !== id));
            if (selectedEventId === id) {
                setSelectedEventId(null);
            }
        } catch (error) {
            console.error("Failed to delete event", error);
            alert("Failed to delete event.");
        }
    };

    const selectedEvent = events.find(e => e.id === selectedEventId);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            filterType === 'all' ? true :
                filterType === 'in-person' ? event.location !== 'Online' :
                    filterType === 'virtual' ? event.location === 'Online' : true;

        return matchesSearch && matchesFilter;
    });

    // Aggregate Metrics
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'Published').length;
    const totalTicketsSold = events.reduce((acc, e) => acc + e.soldTickets, 0);
    const totalTicketCapacity = events.reduce((acc, e) => acc + (e.totalTickets || 0), 0);
    const totalRevenue = events.reduce((acc, e) => acc + (e.revenue || 0), 0);
    const capacityPercentage = totalTicketCapacity > 0 ? Math.round((totalTicketsSold / totalTicketCapacity) * 100) : 0;

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Event Dashboard</h1>
                    <p className="text-muted-foreground">Manage and track your events</p>
                </div>
                {/* Create Event button removed as requested */}
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* All Events */}
                {/* All Events */}
                <div
                    onClick={() => setSelectedStat("all_events")}
                    className={`${theme === 'light' ? 'bg-white/60 border-black/5 hover:bg-white/80' : 'bg-white/5 border-white/10 hover:bg-white/10'} backdrop-blur-md rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group border transition-all cursor-pointer ${selectedStat === 'all_events' ? 'border-primary ring-1 ring-primary' : `${theme === 'light' ? 'hover:border-black/10' : 'hover:border-white/20'}`}`}
                >
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
                {/* Active Events */}
                <div
                    onClick={() => setSelectedStat("active_events")}
                    className={`${theme === 'light' ? 'bg-white/60 border-black/5 hover:bg-white/80' : 'bg-white/5 border-white/10 hover:bg-white/10'} backdrop-blur-md rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group border transition-all cursor-pointer ${selectedStat === 'active_events' ? 'border-primary ring-1 ring-primary' : `${theme === 'light' ? 'hover:border-black/10' : 'hover:border-white/20'}`}`}
                >
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
                {/* Tickets Sold */}
                <div
                    onClick={() => setSelectedStat("tickets_sold")}
                    className={`${theme === 'light' ? 'bg-white/60 border-black/5 hover:bg-white/80' : 'bg-white/5 border-white/10 hover:bg-white/10'} backdrop-blur-md rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group border transition-all cursor-pointer ${selectedStat === 'tickets_sold' ? 'border-primary ring-1 ring-primary' : `${theme === 'light' ? 'hover:border-black/10' : 'hover:border-white/20'}`}`}
                >
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
                <div
                    onClick={() => setSelectedStat("total_revenue_top")}
                    className={`${theme === 'light' ? 'bg-white/60 border-black/5 hover:bg-white/80' : 'bg-white/5 border-white/10 hover:bg-white/10'} backdrop-blur-md rounded-xl p-5 flex flex-col justify-between h-32 relative overflow-hidden group border transition-all cursor-pointer ${selectedStat === 'total_revenue_top' ? 'border-primary ring-1 ring-primary' : `${theme === 'light' ? 'hover:border-black/10' : 'hover:border-white/20'}`}`}
                >
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
                    <div className={`${theme === 'light' ? 'bg-white/60 border-black/5' : 'bg-white/5 border-white/10'} backdrop-blur-md border rounded-xl p-4 h-[400px] md:h-[600px] flex flex-col`}>
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
                                className={`w-full pl-9 pr-8 py-2 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#171c28]'}`}
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className={`w-40 border-border text-foreground ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#171c28]'}`}>
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
                            {isLoading ? (
                                <div className="text-center py-10 text-muted-foreground">Loading events...</div>
                            ) : filteredEvents.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">No events found.</div>
                            ) : (
                                filteredEvents.map(event => (
                                    <EventCardSimple
                                        key={event.id}
                                        event={event}
                                        isSelected={selectedEventId === event.id}
                                        onClick={() => handleEventClick(event.id)}
                                        onEdit={() => handleEdit(event)}
                                        onDelete={() => handleDelete(event.id)}
                                        onViewDetails={() => router.push(`/events/${event.id}`)}
                                        onScan={() => router.push(`/events/${event.id}/scan`)}
                                        theme={theme}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Event Details */}
                <div className="lg:col-span-2" ref={detailsRef}>
                    {selectedEvent ? (
                        <div className={`${theme === 'light' ? 'bg-white/60 border-black/5' : 'bg-white/5 border-white/10'} backdrop-blur-md border rounded-xl p-6 h-auto md:h-[600px] overflow-y-auto scrollbar-hide`} >
                            {/* Event Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-foreground mb-1">{selectedEvent.title}</h2>
                                    <div className="flex gap-2 items-center mb-3">
                                        <span className={`h-8 flex items-center justify-center px-3 rounded-full text-xs font-medium border whitespace-nowrap ${selectedEvent.status === 'Published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                                            {selectedEvent.status}
                                        </span>
                                        <span className="h-8 flex items-center justify-center px-3 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                                            {selectedEvent.ticketType} Event
                                        </span>
                                        <button
                                            onClick={() => router.push(`/events/${selectedEvent.id}/scan`)}
                                            className="h-8 flex items-center justify-center gap-2 px-3 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors text-xs font-medium lg:hidden whitespace-nowrap"
                                        >
                                            <ScanLine className="w-4 h-4" />
                                            <span>Scan Entry</span>
                                        </button>
                                    </div>
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
                                <div className="flex items-start pt-1">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-foreground border border-white/10 transition-colors">
                                                <Menu className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className={`w-40 border-border text-foreground ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#171c28]'}`}>
                                            <DropdownMenuItem
                                                onClick={() => setViewMode('analytics')}
                                                className={`flex items-center gap-2 cursor-pointer hover:bg-white/5 focus:bg-white/5 ${viewMode === 'analytics' ? 'bg-primary/10 text-primary' : ''}`}
                                            >
                                                <BarChart2 className="w-4 h-4" />
                                                <span>Analytics</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setViewMode('participants')}
                                                className={`flex items-center gap-2 cursor-pointer hover:bg-white/5 focus:bg-white/5 ${viewMode === 'participants' ? 'bg-primary/10 text-primary' : ''}`}
                                            >
                                                <Users className="w-4 h-4" />
                                                <span>Participants</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {viewMode === 'analytics' ? (
                                <>
                                    {/* Quick Stats Grid */}
                                    <Separator className="marketing-separator my-8 bg-white/10" />
                                    <h3 className="text-sm font-semibold text-foreground mb-3">Quick Stats</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <div
                                            onClick={() => setSelectedStat("attendees")}
                                            className={`rounded-lg p-4 border transition-all cursor-pointer ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#171c28]'} ${selectedStat === 'attendees' ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-white/50'}`}
                                        >
                                            <p className="text-xs text-muted-foreground mb-1">Total Attendees</p>
                                            <p className="text-xl font-bold text-foreground">{selectedEvent.attendees || 0}</p>
                                        </div>
                                        <div
                                            onClick={() => setSelectedStat("views")}
                                            className={`rounded-lg p-4 border transition-all cursor-pointer ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#171c28]'} ${selectedStat === 'views' ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-white/50'}`}
                                        >
                                            <p className="text-xs text-muted-foreground mb-1">Views</p>
                                            <p className="text-xl font-bold text-foreground">1,234</p>
                                        </div>
                                        <div
                                            onClick={() => setSelectedStat("rate")}
                                            className={`rounded-lg p-4 border transition-all cursor-pointer ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#171c28]'} ${selectedStat === 'rate' ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-white/50'}`}
                                        >
                                            <p className="text-xs text-muted-foreground mb-1">Registration Rate</p>
                                            <p className="text-xl font-bold text-foreground">18.4%</p>
                                        </div>
                                        <div
                                            onClick={() => setSelectedStat("revenue")}
                                            className={`rounded-lg p-4 border transition-all cursor-pointer ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#171c28]'} ${selectedStat === 'revenue' ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-white/50'}`}
                                        >
                                            <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                                            <p className="text-xl font-bold text-foreground">${selectedEvent.revenue?.toLocaleString() || 0}</p>
                                        </div>
                                    </div>

                                    <Separator className="marketing-separator my-8 bg-white/10" />

                                    {/* Ticketing Analytics */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-foreground">Ticketing Analytics</h3>
                                            <span className="text-xs border border-border px-2 py-0.5 rounded-full text-muted-foreground whitespace-nowrap">
                                                ${selectedEvent.ticketPrice} / ticket
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="text-xs px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground rounded-full border border-border transition-colors">
                                                Export Sales
                                            </button>
                                            <button className="text-xs px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full border border-primary/20 transition-colors">
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

                                            <div
                                                onClick={() => setSelectedStat("ticket_breakdown")}
                                                className={`rounded-lg p-3 flex justify-between border transition-all cursor-pointer ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#171c28]'} ${selectedStat === 'ticket_breakdown' ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-white/50'}`}
                                            >
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

                                        {/* Revenue & Stats Column */}
                                        <div className="space-y-4">
                                            {/* Total Revenue Card */}
                                            <div
                                                onClick={() => setSelectedStat("total_revenue")}
                                                className={`rounded-lg p-4 border transition-all cursor-pointer ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#171c28]'} ${selectedStat === 'total_revenue' ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-white/50'}`}
                                            >
                                                <p className="text-xs text-muted-foreground">Total Revenue</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-2xl font-bold text-foreground">${selectedEvent.revenue?.toLocaleString() || 0}</p>
                                                </div>
                                                <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Live tracking
                                                </p>
                                            </div>

                                            {/* Conversion & Avg Card */}
                                            <div
                                                onClick={() => setSelectedStat("conversion")}
                                                className={`rounded-lg p-4 border transition-all cursor-pointer grid grid-cols-2 gap-4 ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#171c28]'} ${selectedStat === 'conversion' ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-white/50'}`}
                                            >
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
                                </>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <div className="relative w-full">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                            <input
                                                type="text"
                                                placeholder="Search participants..."
                                                value={participantSearchQuery}
                                                onChange={(e) => setParticipantSearchQuery(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3">Participants</h3>
                                    <div className="space-y-4">
                                        {participantsData
                                            .filter(p => p.name.toLowerCase().includes(participantSearchQuery.toLowerCase()))
                                            .map((activity, i) => (
                                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border border-border/50 ${theme === 'light' ? 'bg-[#f3f4f6]/50' : 'bg-[#171c28]/50'}`}>
                                                    <div className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center text-sm text-white font-medium`}>
                                                        {activity.initial}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{activity.name}</p>
                                                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </>
                            )}

                            {/* Recent Activity */}


                        </div>
                    ) : (
                        <div className={`${theme === 'light' ? 'bg-white/60 border-black/5' : 'bg-white/5 border-white/10'} backdrop-blur-md border rounded-xl p-6 h-[600px] flex items-center justify-center text-muted-foreground`}>
                            <p>Select an event to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {
                showEditModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm">
                        <CreateEventForm
                            onClose={() => {
                                setShowEditModal(false);
                                setEditingEvent(null);
                            }}
                            initialData={editingEvent || undefined}
                        />
                    </div>
                )
            }
        </div>
    );
}
