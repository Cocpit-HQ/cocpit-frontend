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
  isDark?: boolean
  initialData?: Education | null
}

export default function AddEducationForm({ onCancel, onSave, onDelete, isDark, initialData }: AddEducationFormProps) {
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

  const inputStyles = isDark
    ? "bg-background border-[#2d3548] text-white placeholder-gray-500"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
  
  const labelStyles = `text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`

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
            className={isDark ? "border-[#2d3548] text-gray-300 hover:bg-background bg-transparent" : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-[#5B7CFF] hover:bg-[#4A6BEF] text-white border-0">
            Save
          </Button>
        </div>
      </div>
    </form>
  )
}
