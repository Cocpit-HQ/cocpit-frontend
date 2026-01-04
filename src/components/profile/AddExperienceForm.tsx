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
  onDelete?: (id: string) => void
  isDark?: boolean // Optional
  initialData?: Experience | null
}

export default function AddExperienceForm({ onCancel, onSave, onDelete, initialData }: AddExperienceFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    location: "",
    start_date: "",
    end_date: "",
    description: "",
  })
  const [currentlyWorking, setCurrentlyWorking] = useState(false)


  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        company_name: initialData.company_name,
        location: initialData.location,
        start_date: dayjs(initialData.start_date).format("YYYY-MM-DD"),
        end_date: initialData.end_date ? dayjs(initialData.end_date).format("YYYY-MM-DD") : "",
        description: initialData.description ?? "",
      })
      if (!initialData.end_date) {
        setCurrentlyWorking(true)
      } else {
        setCurrentlyWorking(false)
      }
    } else {
      setFormData({
        title: "",
        company_name: "",
        location: "",
        start_date: "",
        end_date: "",
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
    onSave?.({ ...initialData, ...formData, end_date: currentlyWorking ? null : formData.end_date })
  }

  const handleDelete = () => {
    if (initialData?.experience_id) {
      onDelete?.(initialData.experience_id)
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
        <Label htmlFor="company_name" className={labelStyles}>Company</Label>
        <Input 
          id="company_name" 
          value={formData.company_name} 
          onChange={handleChange} 
          className={inputStyles} 
          placeholder="Ex: Microsoft"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="start_date" className={labelStyles}>Start Date</Label>
          <Input 
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            className={inputStyles}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="end_date" className={labelStyles}>End Date</Label>
          <Input 
            id="end_date"
            type="date"
            value={formData.end_date}
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
              setFormData(prev => ({...prev, end_date: ''}));
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
