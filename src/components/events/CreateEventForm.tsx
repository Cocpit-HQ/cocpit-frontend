"use client"

import React, { useState } from "react"
import { Calendar, MapPin, DollarSign, Image, X, Clock, User, Mail, Users, AlertCircle } from "lucide-react"
import { useEvents } from "@/context/EventsContext"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface CreateEventFormProps {
  onClose: () => void
}

export function CreateEventForm({ onClose }: CreateEventFormProps) {
  const { createEvent } = useEvents()
  const [activeSection, setActiveSection] = useState('core') // For potential tab navigation if needed, currently single page

  const [formData, setFormData] = useState({
    // Core
    title: "",
    description: "",
    category: "Professional",
    eventType: "InPerson" as "Online" | "InPerson",
    virtualLink: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",

    // Organizer
    organizerName: "Me", // Mock default
    organizerEmail: "",

    // Registration
    maxAttendees: "",
    registrationDeadline: "",
    waitlist: false,

    // Ticketing
    priceType: "Free" as "Free" | "Paid",
    ticketName: "",
    price: "",
    quantity: "",
    paymentProvider: "Stripe",

    // Optional
    tags: "",
    image: null as File | null // Mock logic
  })

  const handleSubmit = () => {
    // Validation
    if (!formData.title || !formData.startDate || !formData.startTime) {
        alert("Please fill in required fields (Title, Start Date, Start Time).");
        return;
    }

    createEvent({
        title: formData.title,
        description: formData.description,
        category: formData.category,

        date: formData.startDate,
        time: formData.startTime,
        endDate: formData.endDate,
        endTime: formData.endTime,

        location: formData.eventType === 'Online' ? 'Online' : formData.location,
        virtualLink: formData.virtualLink,
        eventType: formData.eventType,

        organizer: {
          name: formData.organizerName,
          email: formData.organizerEmail
        },

        attendees: "1",
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        registrationDeadline: formData.registrationDeadline,
        waitlist: formData.waitlist,

        priceType: formData.priceType,
        price: formData.price ? parseFloat(formData.price) : 0,
        ticketDetails: formData.priceType === 'Paid' ? {
          name: formData.ticketName,
          quantity: formData.quantity ? parseInt(formData.quantity) : 0,
          provider: formData.paymentProvider
        } : undefined,

        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop", // Mock image
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),

        type: formData.priceType === 'Paid' ? 'Paid' : 'Free'
    });

    onClose();
  }

  return (
    <div className="bg-card flex flex-col h-full md:h-auto md:max-h-[90vh]">
      <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
        <h2 className="text-xl font-bold text-foreground">Create New Event</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

        {/* Core Details */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
            Core Details
          </h3>

          <div className="grid gap-4">
            <div>
              <Label className="mb-2 block">Event Title *</Label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. Tech Mixer 2024"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <Label className="mb-2 block">Description *</Label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary resize-none"
                placeholder="What is this event about?"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Category</Label>
                <select
                  className="w-full px-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option>Professional</option>
                  <option>Networking</option>
                  <option>Workshop</option>
                  <option>Conference</option>
                  <option>Social</option>
                </select>
              </div>
              <div>
                <Label className="mb-2 block">Event Type</Label>
                <div className="flex gap-2 p-1 bg-muted rounded-xl">
                  {['InPerson', 'Online'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({...formData, eventType: type as any})}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.eventType === type
                          ? 'bg-card text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {type === 'InPerson' ? 'In-person' : 'Online'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formData.eventType === 'InPerson' ? (
              <div>
                <Label className="mb-2 block">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                    placeholder="Enter full address"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label className="mb-2 block">Virtual Link</Label>
                <input
                  type="url"
                  className="w-full px-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                  placeholder="https://zoom.us/..."
                  value={formData.virtualLink}
                  onChange={(e) => setFormData({...formData, virtualLink: e.target.value})}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Start Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Start Time *</Label>
                <div className="relative">
                   <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="time"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">End Date</Label>
                 <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">End Time</Label>
                 <div className="relative">
                   <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="time"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Organizer Info */}
        <section className="space-y-4">
           <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
            Organizer Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Organizer Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                  value={formData.organizerName}
                  onChange={(e) => setFormData({...formData, organizerName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Contact Email</Label>
               <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                  value={formData.organizerEmail}
                  onChange={(e) => setFormData({...formData, organizerEmail: e.target.value})}
                />
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Registration & Capacity */}
        <section className="space-y-4">
           <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</span>
            Registration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Max Attendees</Label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="number"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                  placeholder="Unlimited"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData({...formData, maxAttendees: e.target.value})}
                />
              </div>
            </div>
             <div>
              <Label className="mb-2 block">Registration Deadline</Label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
                id="waitlist"
                checked={formData.waitlist}
                onCheckedChange={(c) => setFormData({...formData, waitlist: c})}
            />
            <Label htmlFor="waitlist">Allow Waitlist when full</Label>
          </div>
        </section>

        <Separator />

        {/* Ticketing */}
        <section className="space-y-4">
           <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">4</span>
            Ticketing
          </h3>

          <div className="flex gap-4">
             <div className="flex items-center space-x-2">
                <input
                    type="radio"
                    id="price-free"
                    name="priceType"
                    checked={formData.priceType === 'Free'}
                    onChange={() => setFormData({...formData, priceType: 'Free'})}
                    className="w-4 h-4 text-primary"
                />
                <Label htmlFor="price-free">Free Event</Label>
             </div>
             <div className="flex items-center space-x-2">
                <input
                    type="radio"
                    id="price-paid"
                    name="priceType"
                    checked={formData.priceType === 'Paid'}
                    onChange={() => setFormData({...formData, priceType: 'Paid'})}
                    className="w-4 h-4 text-primary"
                />
                <Label htmlFor="price-paid">Paid Ticket</Label>
             </div>
          </div>

          {formData.priceType === 'Paid' && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-4">
                <div>
                  <Label className="mb-2 block">Ticket Name</Label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. General Admission"
                    value={formData.ticketName}
                    onChange={(e) => setFormData({...formData, ticketName: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">Price ($)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="number"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                            />
                        </div>
                    </div>
                     <div>
                        <Label className="mb-2 block">Quantity</Label>
                        <input
                            type="number"
                            className="w-full px-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                            placeholder="100"
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        />
                    </div>
                </div>
                 <div>
                  <Label className="mb-2 block">Payment Provider (Mock)</Label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border bg-input border-border text-foreground focus:outline-none focus:border-primary"
                    value={formData.paymentProvider}
                    onChange={(e) => setFormData({...formData, paymentProvider: e.target.value})}
                  >
                    <option>Stripe</option>
                    <option>Razorpay</option>
                    <option>PayPal</option>
                    <option>Offline Payment</option>
                  </select>
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p>This is a mock implementation. No real payments will be processed.</p>
                </div>
            </div>
          )}
        </section>

      </div>

      <div className="p-6 border-t border-border flex gap-4 flex-shrink-0 bg-card z-10">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 rounded-xl border font-medium hover:bg-muted transition-colors border-border text-muted-foreground"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
        >
          Create Event
        </button>
      </div>
    </div>
  )
}
