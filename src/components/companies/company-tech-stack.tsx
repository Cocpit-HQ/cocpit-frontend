"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Laptop } from "lucide-react";
import { useTechStack, useAddTechStack, useRemoveTechStack, useCompanyPermissions } from "@/hooks/useCompany";
import { Company } from "@/services/company.service";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface CompanyTechStackProps {
    company: Company;
}

export function CompanyTechStack({ company }: CompanyTechStackProps) {
    const { slug, company_id } = company;
    const { canEdit } = useCompanyPermissions(company);
    const { data: techStack, isLoading } = useTechStack(slug);
    const addMutation = useAddTechStack();
    const removeMutation = useRemoveTechStack();

    const [newTech, setNewTech] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (!newTech.trim()) return;
        try {
            await addMutation.mutateAsync({ companyId: company_id, name: newTech.trim() });
            setNewTech("");
            setIsAdding(false);
        } catch (e) {
            // toast handled in hook
        }
    };

    const handleRemove = async (stackId: string) => {
        if (!confirm("Remove this technology?")) return;
        try {
            await removeMutation.mutateAsync({ companyId: company_id, stackId });
        } catch (e) {
            // toast handled in hook
        }
    };

    if (isLoading) return <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
        </div>
    </div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Laptop className="w-5 h-5 text-primary" />
                    Tech Stack
                </h3>
                {canEdit && !isAdding && (
                    <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Add Tech
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="flex items-center gap-2 max-w-sm">
                    <Input
                        value={newTech}
                        onChange={(e) => setNewTech(e.target.value)}
                        placeholder="e.g. React, Python..."
                        className="h-8"
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        autoFocus
                    />
                    <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>
                        Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
                        Cancel
                    </Button>
                </div>
            )}

            {techStack && techStack.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {techStack.map((item) => (
                        <Badge key={item.stack_id} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-1 group">
                            {item.name}
                            {canEdit && (
                                <button
                                    onClick={() => handleRemove(item.stack_id)}
                                    className="ml-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-sm italic">No tech stack listed yet.</p>
            )}
        </div>
    );
}
