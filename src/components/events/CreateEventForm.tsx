"use client"

import React, { useState } from "react"
import { Calendar, MapPin, DollarSign, Image, X, Clock, User, Mail, Users, AlertCircle } from "lucide-react"
import { useEvents } from "@/context/EventsContext"
import { Switch } from "@/components/ui/switch"
import { createEvent, updateEvent } from "@/services/api/event"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useUserCompanies, useCompanyPermissions } from "@/components/organizations/hooks/use-company"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const createEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  eventType: z.enum(["Online", "InPerson"]),
  virtualLink: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  organizerName: z.string().min(2, "Organizer name is required"),
  organizerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  maxAttendees: z.string().optional(),
  registrationDeadline: z.string().optional(),
  waitlist: z.boolean().default(false),
  priceType: z.enum(["Free", "Paid"]),
  ticketName: z.string().optional(),
  price: z.string().optional(),
  quantity: z.string().optional(),
  paymentProvider: z.string().optional(),
  tags: z.string().optional(),
  companyId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.eventType === "Online" && !data.virtualLink) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Virtual link is required for online events",
      path: ["virtualLink"],
    })
  } else if (data.eventType === "Online" && data.virtualLink && !data.virtualLink.startsWith('http')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Virtual link must be a valid URL (http/https)",
      path: ["virtualLink"],
    })
  }

  if (data.eventType === "InPerson" && !data.location) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Location is required for in-person events",
      path: ["location"],
    })
  }

  if (data.priceType === "Paid") {
    if (!data.price || Number(data.price) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price must be greater than 0",
        path: ["price"],
      })
    }
    if (!data.ticketName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ticket name is required for paid events",
        path: ["ticketName"],
      })
    }
  }

  // Date Logic
  const startDateTime = new Date(`${data.startDate}T${data.startTime}`)

  if (startDateTime < new Date()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Event start time must be in the future",
      path: ["startTime"],
    })
  }

  if (data.endDate) {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be greater than start date",
        path: ["endDate"],
      })
    } else if (data.endDate === data.startDate && data.endTime) {
      // Same day, check times (HH:MM strings are comparable)
      if (data.endTime <= data.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End time must be after start time",
          path: ["endTime"],
        })
      }
    }
  }

  if (data.registrationDeadline) {
    // Registration must be strictly before the start date (as per user request)
    if (data.registrationDeadline >= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Registration deadline must be before event start date",
        path: ["registrationDeadline"],
      })
    }
  }
})

type CreateEventFormValues = z.infer<typeof createEventSchema>

import { BackendEvent } from "@/types/event"

interface CreateEventFormProps {
  onClose: () => void
  initialData?: BackendEvent
}

export function CreateEventForm({ onClose, initialData }: CreateEventFormProps) {
  const { theme } = useTheme()
  const { refreshMyEvents } = useEvents()
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.banner_url || null)

  // Helper to parse date/time strings
  const parseDateTime = (isoString?: string) => {
    if (!isoString) return { date: '', time: '' }
    // Assuming backend returns local time string or ISO. 
    // If ISO (e.g. 2024-03-15T18:00:00), we can split.
    try {
      const dateObj = new Date(isoString);
      // Format to YYYY-MM-DD
      const date = dateObj.toISOString().split('T')[0];
      // Format to HH:mm
      const time = dateObj.toTimeString().slice(0, 5);
      return { date, time };
    } catch (e) {
      // Fallback if string is already formatted simply
      const parts = isoString.split('T');
      return { date: parts[0] || '', time: parts[1]?.substring(0, 5) || '' }
    }
  }

  const { date: startDate, time: startTime } = parseDateTime(initialData?.start_time);
  const { date: endDate, time: endTime } = parseDateTime(initialData?.end_time);

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema) as any,
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "Tech",
      eventType: initialData?.event_type || "InPerson",
      virtualLink: initialData?.virtual_link || "",
      location: initialData?.location || "",
      startDate: startDate || "",
      startTime: startTime || "",
      endDate: endDate || "",
      endTime: endTime || "",
      organizerName: initialData?.organizer_name || "Me",
      organizerEmail: initialData?.organizer_email || "",
      maxAttendees: initialData?.max_attendees ? String(initialData.max_attendees) : "",
      registrationDeadline: initialData?.registration_deadline?.split('T')[0] || "",
      waitlist: initialData?.waitlist_enabled || false,
      priceType: initialData?.price_type || "Free",
      ticketName: initialData?.ticket_name || "",
      price: initialData?.price ? String(initialData.price) : "",
      quantity: "100", // BackendEvent doesn't seem to have quantity, defaulting
      paymentProvider: "Stripe",
      tags: initialData?.tags?.join(', ') || "",
    },
  })

  // Company Selection Logic
  const { data: companies } = useUserCompanies();

  const allowedCompanies = React.useMemo(() => {
    if (!companies) return [];
    // Only allow companies where user can post events (Permission: CREATE_CONTENT or MANAGE_COMPANY)
    return companies.filter(company => {
      // useCompanyPermissions expects viewer_role_data structure
      // But getUserCompanies returns `viewer_role_data`.
      // If it returns role string (legacy), we handle it differently or rely on backend.
      // Assuming getUserCompanies returns viewer_role_data as updated.
      const perms = useCompanyPermissions(company); // This works because useCompanyPermissions is a pure helper function exported
      return perms.checkPermission('CREATE_CONTENT') || perms.checkPermission('POST_JOBS') || perms.isAdmin || perms.isOwner;
    });
  }, [companies]);

  const selectedCompanyId = form.watch("companyId");
  const selectedCompany = allowedCompanies.find(c => c.company_id === selectedCompanyId);

  // Auto-fill organizer info if company selected
  React.useEffect(() => {
    if (selectedCompany) {
      form.setValue("organizerName", selectedCompany.name);
      if (selectedCompany.email) form.setValue("organizerEmail", selectedCompany.email);
      // Maybe lock inputs? Or just prefill.
    } else {
      // Reset to "Me" if switching back? Or user's name?
      // We lack user's name here easily without fetching profile or passing prop.
      // initialData?.organizer_name || "Me" was default.
      if (initialData?.organizer_name) form.setValue("organizerName", initialData.organizer_name);
    }
  }, [selectedCompany, form, initialData]);

  // Watch values for conditional rendering
  const eventType = form.watch("eventType")
  const priceType = form.watch("priceType")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (previewUrl) {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const onSubmit = async (values: CreateEventFormValues) => {
    try {
      setIsLoading(true);
      const data = new FormData();

      // Core
      data.append("title", values.title);
      data.append("description", values.description);
      data.append("category", values.category);

      const combinedStart = `${values.startDate}T${values.startTime}`;
      data.append("startTime", combinedStart);

      if (values.endDate && values.endTime) {
        const combinedEnd = `${values.endDate}T${values.endTime}`;
        data.append("endTime", combinedEnd);
      }

      data.append("location", values.eventType === 'Online' ? 'Online' : (values.location || ''));
      if (values.virtualLink) data.append("virtualLink", values.virtualLink);
      data.append("eventType", values.eventType);

      // Organizer
      data.append("organizerName", values.organizerName);
      if (values.organizerEmail) data.append("organizerEmail", values.organizerEmail);

      // Registration
      if (values.maxAttendees) data.append("maxAttendees", values.maxAttendees);
      if (values.registrationDeadline) data.append("registrationDeadline", values.registrationDeadline);
      data.append("waitlist", String(values.waitlist));

      // Ticketing
      data.append("priceType", values.priceType);
      if (values.price) data.append("price", values.price);
      if (values.ticketName) data.append("ticketName", values.ticketName);
      if (values.quantity) data.append("quantity", values.quantity);
      if (values.paymentProvider) data.append("paymentProvider", values.paymentProvider || "");

      // Tags
      if (values.tags) {
        const tagsList = values.tags.split(',').map(t => t.trim()).filter(t => t);
        tagsList.forEach(tag => data.append("tags", tag));
      }

      // Banner Image
      if (imageFile) {
        data.append("banner", imageFile);
      }

      if (values.companyId) {
        data.append("companyId", values.companyId);
      } else {
        // Explicitly signal personal posting to override potential org actor context
        data.append("companyId", "me");
      }

      if (initialData) {
        await updateEvent(initialData.event_id, data);
        alert("Event updated successfully!");
      } else {
        await createEvent(data);
        alert("Event created successfully!");
      }

      if (refreshMyEvents) {
        await refreshMyEvents();
      }

      onClose();
    } catch (error: any) {
      console.error("Save event error:", error);
      alert(error.response?.data?.message || "Failed to save event.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-background border border-border flex flex-col h-full md:h-auto md:max-h-[90vh] md:rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
        <h2 className="text-xl font-bold text-foreground">{initialData ? "Edit Event" : "Create New Event"}</h2>
        <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-black/5 text-muted-foreground hover:text-foreground' : 'hover:bg-white/10 text-muted-foreground hover:text-foreground'}`}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <form id="create-event-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Post As Selector */}
          {allowedCompanies.length > 0 && (
            <section className="space-y-4">
              <Label className="mb-2 block">Post As</Label>
              <Select
                value={selectedCompanyId || "me"}
                onValueChange={(val) => {
                  form.setValue("companyId", val);
                }}
              >
                <SelectTrigger className={`w-full px-4 py-3 h-auto rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5' : 'bg-white/5 border-white/10'} text-foreground`}>
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Myself</span>
                    </div>
                  </SelectItem>
                  {allowedCompanies.map((company) => (
                    <SelectItem key={company.company_id} value={company.company_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={company.logo_url} />
                          <AvatarFallback>{company.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{company.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
          )}

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
                  {...form.register("title")}
                  className={`w-full px-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                  placeholder="e.g. Tech Mixer 2024"
                />
                {form.formState.errors.title && <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>}
              </div>

              <div>
                <Label className="mb-2 block">Description *</Label>
                <textarea
                  rows={3}
                  {...form.register("description")}
                  className={`w-full px-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary resize-none transition-colors`}
                  placeholder="What is this event about?"
                />
                {form.formState.errors.description && <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message}</p>}
              </div>

              <div>
                <Label className="mb-2 block">Event Banner</Label>
                <div className="relative mt-2">
                  {/* The placeholder dictates the exact height of the component. It becomes invisible when an image is present. */}
                  <div className={`flex justify-center rounded-xl border border-dashed px-6 py-10 ${theme === 'light' ? 'bg-white/20 border-black/5' : 'bg-white/5 border-white/10'} ${previewUrl ? 'opacity-0 pointer-events-none' : ''}`}>
                    <div className="text-center">
                      <Image className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                        <label className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary/80">
                          <span>Upload a file</span>
                          {!previewUrl && <input type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />}
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>

                  {previewUrl && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden border border-border">
                      <img src={previewUrl} alt="Banner preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors z-10">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Category</Label>
                  <select
                    {...form.register("category")}
                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors appearance-none`}
                  >
                    <option>Tech</option>
                    <option>Business</option>
                    <option>Networking</option>
                    <option>Workshop</option>
                    <option>Summit</option>
                    <option>Conference</option>
                    <option>Masterclass</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-2 block">Event Type</Label>
                  <Controller
                    name="eventType"
                    control={form.control}
                    render={({ field }) => (
                      <div className={`flex gap-2 p-1 rounded-xl ${theme === 'light' ? 'bg-black/5' : 'bg-white/5'}`}>
                        {['InPerson', 'Online'].map((type) => (
                          <button
                            type="button"
                            key={type}
                            onClick={() => field.onChange(type)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${field.value === type
                              ? `${theme === 'light' ? 'bg-white shadow-sm text-primary' : 'bg-white/10 text-primary shadow-sm'}`
                              : 'text-muted-foreground hover:text-foreground'
                              }`}
                          >
                            {type === 'InPerson' ? 'In-person' : 'Online'}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </div>

              {eventType === 'InPerson' ? (
                <div>
                  <Label className="mb-2 block">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      {...form.register("location")}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                      placeholder="Enter full address"
                    />
                  </div>
                  {form.formState.errors.location && <p className="text-red-500 text-sm mt-1">{form.formState.errors.location.message}</p>}
                </div>
              ) : (
                <div>
                  <Label className="mb-2 block">Virtual Link *</Label>
                  <input
                    type="url"
                    {...form.register("virtualLink")}
                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                    placeholder="https://zoom.us/..."
                  />
                  {form.formState.errors.virtualLink && <p className="text-red-500 text-sm mt-1">{form.formState.errors.virtualLink.message}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Start Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      {...form.register("startDate")}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                    />
                  </div>
                  {form.formState.errors.startDate && <p className="text-red-500 text-sm mt-1">{form.formState.errors.startDate.message}</p>}
                </div>
                <div>
                  <Label className="mb-2 block">Start Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="time"
                      {...form.register("startTime")}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                    />
                  </div>
                  {form.formState.errors.startTime && <p className="text-red-500 text-sm mt-1">{form.formState.errors.startTime.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="date"
                      {...form.register("endDate")}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                    />
                  </div>
                  {form.formState.errors.endDate && <p className="text-red-500 text-sm mt-1">{form.formState.errors.endDate.message}</p>}
                </div>
                <div>
                  <Label className="mb-2 block">End Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="time"
                      {...form.register("endTime")}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                    />
                  </div>
                  {form.formState.errors.endTime && <p className="text-red-500 text-sm mt-1">{form.formState.errors.endTime.message}</p>}
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
                <Label className="mb-2 block">Organizer Name *</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    {...form.register("organizerName")}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/50 border-black/5 focus:bg-white/80' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                  />
                </div>
                {form.formState.errors.organizerName && <p className="text-red-500 text-sm mt-1">{form.formState.errors.organizerName.message}</p>}
              </div>
              <div>
                <Label className="mb-2 block">Contact Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    {...form.register("organizerEmail")}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/50 border-black/5 focus:bg-white/80' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                  />
                </div>
                {form.formState.errors.organizerEmail && <p className="text-red-500 text-sm mt-1">{form.formState.errors.organizerEmail.message}</p>}
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
                    {...form.register("maxAttendees")}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/50 border-black/5 focus:bg-white/80' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Registration Deadline</Label>
                <input
                  type="date"
                  {...form.register("registrationDeadline")}
                  className={`w-full px-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                />
                {form.formState.errors.registrationDeadline && <p className="text-red-500 text-sm mt-1">{form.formState.errors.registrationDeadline.message}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Controller
                name="waitlist"
                control={form.control}
                render={({ field }) => (
                  <Switch
                    id="waitlist"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
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
              <Controller
                name="priceType"
                control={form.control}
                render={({ field }) => (
                  <>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="price-free"
                        value="Free"
                        checked={field.value === 'Free'}
                        onChange={() => field.onChange('Free')}
                        className="w-4 h-4 text-primary"
                      />
                      <Label htmlFor="price-free">Free Event</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="price-paid"
                        value="Paid"
                        checked={field.value === 'Paid'}
                        onChange={() => field.onChange('Paid')}
                        className="w-4 h-4 text-primary"
                      />
                      <Label htmlFor="price-paid">Paid Ticket</Label>
                    </div>
                  </>
                )}
              />
            </div>

            {priceType === 'Paid' && (
              <div className={`p-4 rounded-xl border space-y-4 ${theme === 'light' ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/10'}`}>
                <div>
                  <Label className="mb-2 block">Ticket Name *</Label>
                  <input
                    type="text"
                    {...form.register("ticketName")}
                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                    placeholder="e.g. General Admission"
                  />
                  {form.formState.errors.ticketName && <p className="text-red-500 text-sm mt-1">{form.formState.errors.ticketName.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Price ($) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        {...form.register("price")}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                        placeholder="0.00"
                      />
                    </div>
                    {form.formState.errors.price && <p className="text-red-500 text-sm mt-1">{form.formState.errors.price.message}</p>}
                  </div>
                  <div>
                    <Label className="mb-2 block">Quantity</Label>
                    <input
                      type="number"
                      {...form.register("quantity")}
                      className={`w-full px-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors`}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Payment Provider (Mock)</Label>
                  <select
                    {...form.register("paymentProvider")}
                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'light' ? 'bg-white/20 border-black/5 focus:bg-white/40' : 'bg-white/5 border-white/10 focus:bg-white/10'} text-foreground focus:outline-none focus:border-primary transition-colors appearance-none`}
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
        </form>
      </div>

      <div className="p-6 border-t border-border bg-background flex gap-4 flex-shrink-0 z-10 sticky bottom-0">
        <button
          onClick={onClose}
          type="button"
          className={`flex-1 px-6 py-3 rounded-xl border font-medium transition-colors ${theme === 'light' ? 'border-black/10 text-muted-foreground hover:bg-black/5 hover:text-foreground' : 'border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}
        >
          Cancel
        </button>
        <Button
          type="submit"
          form="create-event-form"
          disabled={isLoading || form.formState.isSubmitting}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : (initialData ? "Update Event" : "Create Event")}
        </Button>
      </div>
    </div>
  )
}
