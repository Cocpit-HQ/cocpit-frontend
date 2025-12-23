"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Education } from "@/types/entities"

interface AddEducationFormProps {
  onCancel?: () => void
  onSave?: (data: Partial<Education>) => void
  onDelete?: (id: number) => void
  isDark?: boolean // Optional
  initialData?: Education | null
}

export default function AddEducationForm({ onCancel, onSave, onDelete, initialData }: AddEducationFormProps) {
  const [formData, setFormData] = useState({
    school: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    description: "",
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        school: initialData.school,
        degree: initialData.degree,
        fieldOfStudy: initialData.fieldOfStudy,
        startDate: initialData.duration.split(" - ")[0],
        endDate: initialData.duration.split(" - ")[1],
        description: initialData.description,
      })
    } else {
      setFormData({
        school: "",
        degree: "",
        fieldOfStudy: "",
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
        <Label htmlFor="school" className={labelStyles}>School</Label>
        <Input 
          id="school" 
          value={formData.school} 
          onChange={handleChange} 
          className={inputStyles} 
          placeholder="Ex: Stanford University"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="degree" className={labelStyles}>Degree</Label>
        <Input 
          id="degree" 
          value={formData.degree} 
          onChange={handleChange} 
          className={inputStyles} 
          placeholder="Ex: MBA"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="fieldOfStudy" className={labelStyles}>Field of Study</Label>
        <Input 
          id="fieldOfStudy" 
          value={formData.fieldOfStudy} 
          onChange={handleChange} 
          className={inputStyles} 
          placeholder="Ex: Business Administration"
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
            placeholder="Ex: 2016"
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
            placeholder="Ex: 2018"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description" className={labelStyles}>Description</Label>
        <Textarea 
          id="description" 
          value={formData.description} 
          onChange={handleChange} 
          className={`${inputStyles} min-h-[100px]`}
          placeholder="Describe your activities, societies, etc."
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
