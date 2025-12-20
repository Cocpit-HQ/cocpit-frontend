"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AddExperienceFormProps {
  onCancel?: () => void
  onSave?: (data: any) => void
  isDark?: boolean
}

export default function AddExperienceForm({ onCancel, onSave, isDark }: AddExperienceFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave?.(formData)
  }

  const inputStyles = isDark
    ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-500"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
  
  const labelStyles = `text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title" className={labelStyles}>Title</Label>
        <Input 
          id="title" 
          value={formData.title} 
          onChange={handleChange} 
          className={inputStyles} 
          placeholder="Ex: Product Manager"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="company" className={labelStyles}>Company</Label>
        <Input 
          id="company" 
          value={formData.company} 
          onChange={handleChange} 
          className={inputStyles} 
          placeholder="Ex: Microsoft"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="startDate" className={labelStyles}>Start Date</Label>
          <Input 
            id="startDate" 
            type="text"
            value={formData.startDate} 
            onChange={handleChange} 
            className={inputStyles} 
            placeholder="Ex: Jan 2020"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate" className={labelStyles}>End Date</Label>
          <Input 
            id="endDate" 
            type="text"
            value={formData.endDate} 
            onChange={handleChange} 
            className={inputStyles} 
            placeholder="Ex: Present"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="location" className={labelStyles}>Location</Label>
        <Input 
          id="location" 
          value={formData.location} 
          onChange={handleChange} 
          className={inputStyles} 
          placeholder="Ex: London, UK"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description" className={labelStyles}>Description</Label>
        <Textarea 
          id="description" 
          value={formData.description} 
          onChange={handleChange} 
          className={`${inputStyles} min-h-[100px]`}
          placeholder="Describe your responsibilities..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className={isDark ? "border-[#2d3548] text-gray-300 hover:bg-[#171c28] bg-transparent" : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"}
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-[#5B7CFF] hover:bg-[#4A6BEF] text-white border-0">
          Save
        </Button>
      </div>
    </form>
  )
}