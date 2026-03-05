"use client";

import { useCreateCompany } from "@/components/organizations/hooks/use-company";
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

const ORGANIZATION_TYPES = [
    { label: "Company", value: "COMPANY" },
    { label: "Educational Institution", value: "INSTITUTION" },
];

const INSTITUTION_TYPES = [
    { label: "University", value: "University" },
    { label: "College", value: "College" },
    { label: "School", value: "School" },
    { label: "Bootcamp", value: "Bootcamp" },
    { label: "Other", value: "Other" },
];

const SIZE_OPTIONS = [
    { label: "1-10 employees (Startup)", value: "1-10" },
    { label: "11-50 employees", value: "11-50" },
    { label: "51-200 employees", value: "51-200" },
    { label: "201-1000 employees", value: "201-1000" },
    { label: "1000+ employees (Enterprise)", value: "1000+" },
];

export default function OrganizationForm() {
    // State Ownership: Form Container
    const [entityType, setEntityType] = useState<"COMPANY" | "INSTITUTION">("COMPANY");
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");

    // Company Fields
    const [industry, setIndustry] = useState("");
    const [size, setSize] = useState("");

    // Institution Fields
    const [institutionType, setInstitutionType] = useState("");
    const [establishedYear, setEstablishedYear] = useState("");
    const [campusLocation, setCampusLocation] = useState("");

    const [isSlugValid, setIsSlugValid] = useState(false);

    // Derived state for validation
    const isNameValid = name.trim().length >= 2;
    const isIndustryValid = !!industry;
    const isSizeValid = !!size;

    const isInstitutionValid = !!institutionType && !!campusLocation;

    const isFormValid = isNameValid && isSlugValid &&
        (entityType === "COMPANY" ? (isIndustryValid && isSizeValid) : isInstitutionValid);

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
            entity_type: entityType,
            ...(entityType === "COMPANY" ? { industry, size } : {
                institution_type: institutionType,
                established_year: establishedYear ? parseInt(establishedYear) : undefined,
                campus_location: campusLocation
            }),
        });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    };

    return (
        <Card className="max-w-2xl mx-auto border-none shadow-none md:border md:shadow-lg bg-card transition-all">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight">Create Organization Account</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                    Build your brand presence on the platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-6">
                        {/* Organization Type */}
                        <SelectField
                            id="entityType"
                            label="Organization Type"
                            value={entityType}
                            onChange={(val) => setEntityType(val as "COMPANY" | "INSTITUTION")}
                            options={ORGANIZATION_TYPES}
                            required={true}
                        />

                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium leading-none">
                                {entityType === 'COMPANY' ? 'Company Name' : 'Institution Name'} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder={entityType === 'COMPANY' ? "e.g. Acme Innovations Inc." : "e.g. Stanford University"}
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

                        {/* URL/Slug Field */}
                        <SlugInput
                            id="slug"
                            value={slug}
                            onChange={setSlug}
                            onStatusChange={setIsSlugValid}
                            suggestion={generateSlug(name)}
                            label={entityType === 'COMPANY' ? 'Company URL' : 'Institution URL'}
                            description={entityType === 'COMPANY' ? 'Users can visit your company page at this link.' : 'Users can visit your institution page at this link.'}
                        />

                        {/* Dynamic Fields based on Type */}
                        {entityType === 'COMPANY' ? (
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
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SelectField
                                        id="institutionType"
                                        label="Institution Type"
                                        value={institutionType}
                                        onChange={setInstitutionType}
                                        options={INSTITUTION_TYPES}
                                        required={true}
                                    />
                                    <div className="space-y-2">
                                        <Label htmlFor="establishedYear" className="text-sm font-medium leading-none">
                                            Established Year
                                        </Label>
                                        <Input
                                            id="establishedYear"
                                            type="number"
                                            placeholder="e.g. 1885"
                                            value={establishedYear}
                                            onChange={(e) => setEstablishedYear(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="campusLocation" className="text-sm font-medium leading-none">
                                        Main Campus Location <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="campusLocation"
                                        placeholder="e.g. Stanford, California"
                                        value={campusLocation}
                                        onChange={(e) => setCampusLocation(e.target.value)}
                                        required={entityType === 'INSTITUTION'}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions (Pure Presentation) */}
                    <div className="pt-6 border-t mt-6">
                        {createCompanyMutation.isError && (
                            <div className="mb-4 p-3 text-sm text-red-500 bg-red-900/20 border border-red-500/50 rounded-md">
                                {createCompanyMutation.error instanceof Error ? createCompanyMutation.error.message : "Failed to create organization"}
                            </div>
                        )}
                        <FormActions
                            isLoading={createCompanyMutation.isPending}
                            isDisabled={!isFormValid}
                            submitLabel="Create Organization"
                            onCancel={() => window.history.back()}
                        />
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
