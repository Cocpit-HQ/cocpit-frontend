"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { companyService, Company } from "@/services/company.service";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Schema matching backend requirements
const companyFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    headline: z.string().min(1, "Headline is required").max(120, "Headline must be 120 characters or less"),
    industry: z.string().optional(),
    size: z.string().optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    location: z.string().optional(),
    description: z.string().optional(),
    slogan: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface EditCompanyFormProps {
    company: Company;
}

export function EditCompanyForm({ company }: EditCompanyFormProps) {
    const queryClient = useQueryClient();

    const form = useForm<CompanyFormValues>({
        resolver: zodResolver(companyFormSchema),
        defaultValues: {
            name: company.name || "",
            headline: company.headline || "",
            industry: company.industry || "",
            size: company.size || "1-10",
            website: company.website || "",
            location: company.location || "",
            description: company.description || "",
            slogan: company.slogan || "",
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: CompanyFormValues) => companyService.updateCompany(company.company_id, data),
        onSuccess: (updatedCompany) => {
            toast.success("Company details updated successfully");
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["company", company.slug] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update company");
        },
    });

    function onSubmit(data: CompanyFormValues) {
        updateMutation.mutate(data);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Acme Corp" {...field} />
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
                                <FormDescription>A short one-line description (max 120 chars).</FormDescription>
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
                        name="website"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com" {...field} />
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
                                <FormLabel>Headquarters Location</FormLabel>
                                <FormControl>
                                    <Input placeholder="San Francisco, CA" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Industry</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Technology">Technology</SelectItem>
                                        <SelectItem value="Finance">Finance</SelectItem>
                                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                                        <SelectItem value="Education">Education</SelectItem>
                                        <SelectItem value="Retail">Retail</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="1-10">1-10 employees</SelectItem>
                                        <SelectItem value="11-50">11-50 employees</SelectItem>
                                        <SelectItem value="51-200">51-200 employees</SelectItem>
                                        <SelectItem value="201-500">201-500 employees</SelectItem>
                                        <SelectItem value="500+">500+ employees</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="slogan"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slogan / Catchphrase</FormLabel>
                            <FormControl>
                                <Input placeholder="Innovating the future..." {...field} />
                            </FormControl>
                            <FormDescription>Short text to appear near your logo.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us about your company..."
                                    className="min-h-[120px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Markdown is supported.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end">
                    <Button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    );
}
