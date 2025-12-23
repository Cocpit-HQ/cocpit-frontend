"use client"

import React, { useState } from "react"
import { Calendar, MapPin, DollarSign, Image, X } from "lucide-react"
import { useEvents } from "@/context/EventsContext"

interface CreateEventFormProps {
  onClose: () => void
}

export function CreateEventForm({ onClose }: CreateEventFormProps) {
  const { createEvent } = useEvents()
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    price: "",
    category: "Professional",
    description: ""
  })

  const handleSubmit = () => {
    // Basic validation
    if (!formData.title || !formData.date) {
        alert("Please fill in at least the title and date.");
        return;
    }

    createEvent({
        title: formData.title,
        date: formData.date, // Note: Should probably format this better
        time: formData.time || "10:00 AM",
        location: formData.location || "Online",
        price: formData.price ? parseFloat(formData.price) : 0,
        category: formData.category,
        description: formData.description,
        attendees: "1", // Self
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop", // Mock image
        type: formData.price ? 'Premium' : 'Free'
    });

    onClose();
  }

  return (
    <div className="bg-card">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">Create New Event</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">
            Event Title
          </label>
          <input
            type="text"
            placeholder="e.g. Tech Mixer 2024"
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-primary bg-input border-border text-foreground placeholder-muted-foreground"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="date"
                className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:border-primary bg-input border-border text-foreground"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Time
            </label>
            <input
              type="time"
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-primary bg-input border-border text-foreground"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Enter location or 'Online'"
              className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:border-primary bg-input border-border text-foreground placeholder-muted-foreground"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>
        </div>

        {/* Price & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Price
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:border-primary bg-input border-border text-foreground placeholder-muted-foreground"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Category
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-primary bg-input border-border text-foreground"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option>Professional</option>
              <option>Networking</option>
              <option>Workshop</option>
              <option>Conference</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Tell people what your event is about..."
            className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-primary bg-input border-border text-foreground placeholder-muted-foreground resize-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium mb-2 text-muted-foreground">
            Cover Image
          </label>
          <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Image className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Click to upload cover image</p>
            <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF (max. 3MB)</p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-border flex gap-4">
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
