"use client"

import React from "react"
import { Calendar, CreditCard, Hash, Type } from "lucide-react"

type Props = {
  isDark: boolean
  onCancel?: () => void
  onCreated?: () => void
}

export function CreateEventForm({ isDark, onCancel, onCreated }: Props) {
  const handleCancel = () => {
    onCancel?.()
  }

  const handleCreate = () => {
    onCreated?.()
  }

  return (
    <div className="space-y-6">
        {/* Event Banner */}
        <div>
          <label
            className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            htmlFor="event-banner"
          >
            Event Banner
          </label>
          <div
            className={`flex items-center justify-between rounded-lg border px-4 py-4 ${
              isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-[#0b1020]/5 border-gray-300 text-gray-900"
            }`}
          >
            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Upload an image to display as the event banner
            </span>
            <button
              id="event-banner"
              type="button"
              className="px-4 py-2 text-sm rounded-lg border border-dashed border-[#5B7CFF] text-[#5B7CFF] hover:bg-[#5B7CFF]/10 transition-colors"
            >
              Upload Banner
            </button>
          </div>
        </div>

        {/* Event Name */}
        <div>
          <label
            className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            htmlFor="event-name"
          >
            Event Name
          </label>
          <div
            className={`flex items-center rounded-lg border px-4 py-3 ${
              isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-[#0b1020]/5 border-gray-300 text-gray-900"
            }`}
          >
            <Type className="w-4 h-4 mr-3 text-gray-500" />
            <input
              id="event-name"
              type="text"
              placeholder="Enter event name"
              className={`flex-1 bg-transparent focus:outline-none ${
                isDark ? "placeholder-gray-500" : "placeholder-gray-500"
              }`}
            />
          </div>
        </div>

        {/* Date and Time */}
        <div>
          <label
            className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            htmlFor="event-datetime"
          >
            Date and Time
          </label>
          <div
            className={`flex items-center rounded-lg border px-4 py-3 ${
              isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-[#0b1020]/5 border-gray-300 text-gray-900"
            }`}
          >
            <Calendar className="w-4 h-4 mr-3 text-gray-500" />
            <input
              id="event-datetime"
              type="text"
              placeholder="dd-mm-yyyy  --:--"
              className={`flex-1 bg-transparent focus:outline-none ${
                isDark ? "placeholder-gray-500" : "placeholder-gray-500"
              }`}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            htmlFor="event-description"
          >
            Description
          </label>
          <textarea
            id="event-description"
            placeholder="Enter event description"
            rows={4}
            className={`w-full rounded-lg border px-4 py-3 resize-none focus:outline-none focus:border-[#5B7CFF] ${
              isDark
                ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-500"
                : "bg-[#0b1020]/5 border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
          />
        </div>

        {/* Payments */}
        <div>
          <label
            className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            htmlFor="event-payment"
          >
            Payments
          </label>
          <div
            className={`flex items-center rounded-lg border px-4 py-3 ${
              isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-[#0b1020]/5 border-gray-300 text-gray-900"
            }`}
          >
            <CreditCard className="w-4 h-4 mr-3 text-gray-500" />
            <input
              id="event-payment"
              type="text"
              placeholder="Enter payment details"
              className={`flex-1 bg-transparent focus:outline-none ${
                isDark ? "placeholder-gray-500" : "placeholder-gray-500"
              }`}
            />
          </div>
        </div>

        {/* Limited Members */}
        <div>
          <label
            className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            htmlFor="event-limit"
          >
            Limited Members
          </label>
          <div
            className={`flex items-center rounded-lg border px-4 py-3 ${
              isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-[#0b1020]/5 border-gray-300 text-gray-900"
            }`}
          >
            <Hash className="w-4 h-4 mr-3 text-gray-500" />
            <input
              id="event-limit"
              type="number"
              placeholder="Enter maximum number of attendees"
              className={`flex-1 bg-transparent focus:outline-none ${
                isDark ? "placeholder-gray-500" : "placeholder-gray-500"
              }`}
            />
          </div>
        </div>

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          onClick={handleCancel}
          className={`px-6 py-3 rounded-lg border text-sm ${
            isDark ? "border-[#2d3548] text-gray-300 hover:bg-[#171c28]" : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          className="flex-1 px-6 py-3 rounded-lg text-sm bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white hover:opacity-90 transition-all"
        >
          Create Event
        </button>
      </div>
    </div>
  )
}


