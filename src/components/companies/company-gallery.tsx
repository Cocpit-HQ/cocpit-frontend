"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { useGallery, useAddToGallery, useRemoveFromGallery, useCompanyPermissions } from "@/components/companies/hooks/use-company";
import { Company } from "@/services/company.service";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CompanyGalleryProps {
    company: Company;
}

export function CompanyGallery({ company }: CompanyGalleryProps) {
    const { slug, company_id } = company;
    const { canEdit } = useCompanyPermissions(company);
    const { data: gallery, isLoading } = useGallery(slug);
    const addMutation = useAddToGallery();
    const removeMutation = useRemoveFromGallery();

    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [caption, setCaption] = useState("");

    const handleAdd = async () => {
        if (!url.trim()) return;
        try {
            await addMutation.mutateAsync({
                companyId: company_id,
                url: url.trim(),
                type: 'image', // Basic support for now, video needs more UI
                caption: caption.trim()
            });
            setIsOpen(false);
            setUrl("");
            setCaption("");
        } catch (e) {
            // toast handled in hook
        }
    };

    const handleRemove = async (galleryId: string) => {
        if (!confirm("Delete this image?")) return;
        try {
            await removeMutation.mutateAsync({ companyId: company_id, galleryId });
        } catch (e) {
            // toast handled in hook
        }
    };

    if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="aspect-video w-full rounded-lg" />
    </div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Life at {company.name}
                </h3>
                {canEdit && (
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-1" /> Add Photo
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add to Gallery</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Image URL</Label>
                                    <Input
                                        placeholder="https://..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Caption (Optional)</Label>
                                    <Input
                                        placeholder="Team outing..."
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleAdd}
                                    disabled={!url || addMutation.isPending}
                                >
                                    {addMutation.isPending ? "Adding..." : "Add Photo"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {gallery && gallery.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {gallery.map((item) => (
                        <div key={item.gallery_id} className="group relative rounded-lg overflow-hidden border bg-muted aspect-video">
                            <img src={item.url} alt={item.caption || "Company photo"} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            {item.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs truncate">
                                    {item.caption}
                                </div>
                            )}
                            {canEdit && (
                                <button
                                    onClick={() => handleRemove(item.gallery_id)}
                                    className="absolute top-2 right-2 bg-black/50 hover:bg-destructive text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No gallery images yet.</p>
                </div>
            )}
        </div>
    );
}
