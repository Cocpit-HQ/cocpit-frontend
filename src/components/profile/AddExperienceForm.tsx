"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Experience } from "@/types/entities"

interface AddExperienceFormProps {
  onCancel?: () => void
  onSave?: (data: Partial<Experience>) => void
  onDelete?: (id: number) => void
  isDark?: boolean // Optional
  initialData?: Experience | null
}

export default function AddExperienceForm({ onCancel, onSave, onDelete, initialData }: AddExperienceFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    description: "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        company: initialData.company,
        location: initialData.location,
        startDate: initialData.duration.split(" - ")[0],
        endDate: initialData.duration.split(" - ")[1],
        description: initialData.description,
      })
    } else {
      setFormData({
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave?.({ ...initialData, ...formData, duration: `${formData.startDate} - ${formData.endDate}` })
  }

  const handleDelete = () => {
    if (initialData?.id) {
      onDelete?.(initialData.id)
    }
  }

  const inputStyles = "bg-input border-border text-foreground placeholder-muted-foreground"
  
  const labelStyles = "text-sm font-medium text-foreground"

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

      <div className="flex justify-between gap-2 pt-2">
        <div>
          {initialData && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="border-border text-muted-foreground hover:bg-muted bg-transparent"
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground border-0">
            Save
          </Button>
        </div>
      </div>
    </form>
  )
}
