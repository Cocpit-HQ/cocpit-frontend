"use client";

import { useCreateCompany } from "@/components/companies/hooks/use-company";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { SlugInput } from "./slug-input";
import { SelectField } from "@/components/ui/select-field";
import { FormActions } from "./form-actions";

const INDUSTRY_OPTIONS = [
    { label: "Technology & Software", value: "technology" },
    { label: "Healthcare & Medicine", value: "healthcare" },
    { label: "Finance & Banking", value: "finance" },
    { label: "Education", value: "education" },
    { label: "Retail & E-commerce", value: "retail" },
    { label: "Manufacturing", value: "manufacturing" },
    { label: "Media & Entertainment", value: "media" },
    { label: "Other", value: "other" },
];

const SIZE_OPTIONS = [
    { label: "1-10 employees (Startup)", value: "1-10" },
    { label: "11-50 employees", value: "11-50" },
    { label: "51-200 employees", value: "51-200" },
    { label: "201-1000 employees", value: "201-1000" },
    { label: "1000+ employees (Enterprise)", value: "1000+" },
];

export default function CompanyForm() {
    // State Ownership: Form Container
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [industry, setIndustry] = useState("");
    const [size, setSize] = useState("");
    const [isSlugValid, setIsSlugValid] = useState(false);

    // Derived state for validation
    const isNameValid = name.trim().length >= 2;
    const isIndustryValid = !!industry;
    const isSizeValid = !!size;
    const isFormValid = isNameValid && isSlugValid && isIndustryValid && isSizeValid;

    const createCompanyMutation = useCreateCompany();

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        createCompanyMutation.mutate({
            name,
            slug,
            industry,
            size,
        });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    return (
        <Card className="max-w-2xl mx-auto border-none shadow-none md:border md:shadow-lg bg-card transition-all">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight">Create Company Account</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                    Build your employer brand and start hiring top talent.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium leading-none">
                                Company Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g. Acme Innovations Inc."
                                value={name}
                                onChange={handleNameChange}
                                required
                                minLength={2}
                                className="h-11"
                                autoComplete="organization"
                            />
                            <p className="text-[0.8rem] text-muted-foreground">
                                This will be your public display name.
                            </p>
                        </div>

                        {/* Slug Field (Specialized Component) */}
                        <SlugInput
                            value={slug}
                            onChange={setSlug}
                            onStatusChange={setIsSlugValid}
                            suggestion={generateSlug(name)}
                        />

                        {/* Dropdowns (Reusable Component) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SelectField
                                id="industry"
                                label="Industry"
                                value={industry}
                                onChange={setIndustry}
                                options={INDUSTRY_OPTIONS}
                                required={true}
                            />
                            <SelectField
                                id="size"
                                label="Company Size"
                                value={size}
                                onChange={setSize}
                                options={SIZE_OPTIONS}
                                required={true}
                            />
                        </div>
                    </div>

                    {/* Actions (Pure Presentation) */}
                    <div className="pt-6 border-t mt-6">
                        {createCompanyMutation.isError && (
                            <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                                {createCompanyMutation.error instanceof Error ? createCompanyMutation.error.message : "Failed to create company"}
                            </div>
                        )}
                        <FormActions
                            isLoading={createCompanyMutation.isPending}
                            isDisabled={!isFormValid}
                            submitLabel="Create Company"
                            onCancel={() => window.history.back()}
                        />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
