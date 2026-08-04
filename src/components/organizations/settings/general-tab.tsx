"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Company, companyService } from "@/services/organization.service";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "./image-upload";
import { DangerZone } from "./danger-zone";

// --- Schema ---
const companyFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    headline: z.string().min(1, "Headline is required.").max(120, "Headline must be 120 characters or less."),
    slogan: z.string().optional(),
    industry: z.string().optional(),
    size: z.string().optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    location: z.string().optional(),
    description: z.string().optional(),
    logo_url: z.string().optional(),
    cover_url: z.string().optional(),
});

type OrganizationFormValues = z.infer<typeof companyFormSchema>;

interface GeneralTabProps {
    company: Company;
}

export function GeneralTab({ company }: GeneralTabProps) {
    const queryClient = useQueryClient();
    // const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    // const [isUploadingCover, setIsUploadingCover] = useState(false);

    // --- Form ---
    const form = useForm<OrganizationFormValues>({
        resolver: zodResolver(companyFormSchema),
        defaultValues: {
            name: company.name || "",
            headline: company.headline || "",
            slogan: company.slogan || "",
            industry: company.institution_type || company.industry || "",
            size: company.size || "",
            website: company.website || "",
            location: company.location || "",
            description: company.description || "",
            logo_url: company.logo_url || "",
            cover_url: company.cover_url || "",
        },
    });

    // --- Mutation ---
    const updateMutation = useMutation({
        mutationFn: (data: OrganizationFormValues) => companyService.updateCompany(company.company_id, data),
        onSuccess: (data) => {
            toast.success("Company updated successfully");
            queryClient.invalidateQueries({ queryKey: ["company", company.slug] });
            // If slug changed, we'd need to redirect, but we aren't allowing slug change yet.
        },
        onError: (err: any) => {
            toast.error(companyService.normalizeError(err));
        },
    });

    function onSubmit(data: OrganizationFormValues) {
        updateMutation.mutate(data);
    }

    // --- Image Handlers (Mock for now, or use real upload if available) ---
    // Since we don't have a real file upload API in the context provided (except maybe "Fixing Image Fit Mode" context?),
    // I will implementation a simple prompt or assume a direct upload service if exists. 
    // Wait, the "Fixing Image Fit Mode" conversation implies there IS an image upload system.
    // I should check `src/services/api/upload.ts` or similar if I can find it.
    // I'll search for it first? No, I'll just use a text input for URL for now to be safe, 
    // OR create a "Mock" uploader that just prompts for URL if I can't find the upload service.
    // Actually, I'll look for `upload.service` or similar in a bit. 
    // For this step, to ensure it works, I will keep them as Input fields (URL) but add a "Upload" button 
    // that effectively just focuses the input or opens a file picker if I implemented it.
    // Let's stick to standard Inputs for URLs for MVP speed, maybe with a nice preview.

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Update your company's public profile details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* Images Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Logo */}
                                <div className="space-y-4">
                                    <FormLabel>Company Logo</FormLabel>
                                    <div className="flex items-center gap-4">
                                        <FormField
                                            control={form.control}
                                            name="logo_url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <ImageUpload
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="h-24 w-24 border-2 border-border"
                                                            aspectRatio="square"
                                                            placeholder={<span className="text-2xl font-bold">{form.watch("name")?.slice(0, 2).toUpperCase()}</span>}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium">Company Logo</p>
                                            <p className="text-xs text-muted-foreground">
                                                Recommended size: 400x400px. <br />
                                                Formats: JPG, PNG. Max 5MB.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Cover */}
                                <div className="space-y-4">
                                    <FormLabel>Cover Image</FormLabel>
                                    <div className="relative h-32 w-full bg-muted rounded-md overflow-hidden border border-border">
                                        {form.watch("cover_url") ? (
                                            <img
                                                src={form.watch("cover_url")}
                                                alt="Cover"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                                No cover image
                                            </div>
                                        )}
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="cover_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormDescription className="text-xs">
                                                    URL to your cover image (1200x300 recommended).
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Acme Inc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="headline"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Headline *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="A short one-liner about your company" maxLength={120} {...field} />
                                        </FormControl>
                                        <div className="flex items-center justify-between">
                                            <FormDescription>Short one-line description (max 120 chars).</FormDescription>
                                            <span className={`text-xs ${(field.value?.length || 0) > 120 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                {field.value?.length || 0}/120
                                            </span>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="slogan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tagline / Slogan</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Building the future..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="industry"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Industry</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Technology" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="size"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Size</FormLabel>
                                            <FormControl>
                                                {/* Could be a Select, using Input for flexibility now */}
                                                <Input placeholder="e.g. 10-50 employees" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://acme.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Headquarters</FormLabel>
                                            <FormControl>
                                                <Input placeholder="San Francisco, CA" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>About</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell us about your company..."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <div className="mt-8">
                <DangerZone company={company} />
            </div>
        </>
    );
}
