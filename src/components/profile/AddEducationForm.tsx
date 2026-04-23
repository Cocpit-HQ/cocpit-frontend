"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Education } from "@/types/entities"
import { Checkbox } from "@/components/ui/checkbox"
import dayjs from "dayjs"

interface AddEducationFormProps {
  onCancel?: () => void
  onSave?: (data: Partial<Education>) => void
  onDelete?: (id: string) => void
  isDark?: boolean // Optional
  initialData?: Education | null
}

export default function AddEducationForm({ onCancel, onSave, onDelete, initialData }: AddEducationFormProps) {
  const [formData, setFormData] = useState({
    school_name: "",
    degree: "",
    field_of_study: "",
    start_date: "",
    end_date: "",
    description: "",
  })
  const [stillStudying, setStillStudying] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        school_name: initialData.school_name ?? "",
        degree: initialData.degree ?? "",
        field_of_study: initialData.field_of_study ?? "",
        start_date: initialData.start_date ? dayjs(initialData.start_date).format("YYYY-MM-DD") : "",
        end_date: initialData.end_date ? dayjs(initialData.end_date).format("YYYY-MM-DD") : "",
        description: initialData.description ?? "",
      })
      setStillStudying(!initialData.end_date)
    } else {
      setFormData({
        school_name: "",
        degree: "",
        field_of_study: "",
        start_date: "",
        end_date: "",
        description: "",
      })
      setStillStudying(false)
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave?.({ ...initialData, ...formData, end_date: stillStudying ? null : formData.end_date })
  }

  const handleDelete = () => {
    if (initialData?.education_id) {
      onDelete?.(initialData.education_id)
    }
  }

  const inputStyles = "bg-input border-border text-foreground placeholder-muted-foreground"
  
  const labelStyles = "text-sm font-medium text-foreground"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="school_name" className={labelStyles}>School</Label>
        <Input 
          id="school_name" 
          value={formData.school_name} 
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
        <Label htmlFor="field_of_study" className={labelStyles}>Field of Study</Label>
        <Input 
          id="field_of_study" 
          value={formData.field_of_study} 
          onChange={handleChange} 
          className={inputStyles} 
          placeholder="Ex: Business Administration"
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
            value={formData.end_date ?? ""}
            onChange={handleChange}
            className={inputStyles}
            disabled={stillStudying}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="stillStudying"
          checked={stillStudying}
          onCheckedChange={(checked) => {
            setStillStudying(checked as boolean);
            if(checked) {
              setFormData(prev => ({...prev, end_date: ''}));
            }
          }}
        />
        <label
          htmlFor="stillStudying"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I'm still studying
        </label>
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
