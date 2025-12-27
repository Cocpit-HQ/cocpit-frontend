"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Experience } from "@/types/entities"
import { Checkbox } from "@/components/ui/checkbox"
import dayjs from "dayjs"

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
  const [currentlyWorking, setCurrentlyWorking] = useState(false)


  useEffect(() => {
    if (initialData) {
			const [start, end] = initialData.duration.split(' - ');
      setFormData({
        title: initialData.title,
        company: initialData.company,
        location: initialData.location,
        startDate: dayjs(start, "MMM YYYY").format("YYYY-MM-DD"),
        endDate: end === "Present" ? "" : dayjs(end, "MMM YYYY").format("YYYY-MM-DD"),
        description: initialData.description,
      })
      if (end === "Present") {
        setCurrentlyWorking(true)
      } else {
        setCurrentlyWorking(false)
      }
    } else {
      setFormData({
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      })
      setCurrentlyWorking(false)
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
		const duration = `${dayjs(formData.startDate).format("MMM YYYY")} - ${currentlyWorking ? "Present" : dayjs(formData.endDate).format("MMM YYYY")}`;
    onSave?.({ ...initialData, ...formData, duration })
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
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            className={inputStyles}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate" className={labelStyles}>End Date</Label>
          <Input 
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            className={inputStyles}
            disabled={currentlyWorking}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="currentlyWorking"
          checked={currentlyWorking}
          onCheckedChange={(checked) => {
            setCurrentlyWorking(checked as boolean);
            if(checked) {
              setFormData(prev => ({...prev, endDate: ''}));
            }
          }}
        />
        <label
          htmlFor="currentlyWorking"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I currently work here
        </label>
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
