import React, { useMemo } from 'react';
import { useGallery } from '@/components/companies/hooks/use-company';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Company } from '@/services/company.service';

interface HomeGalleryPreviewProps {
    company: Company;
    onViewAll: () => void;
}

export function HomeGalleryPreview({ company, onViewAll }: HomeGalleryPreviewProps) {
    const { data: gallery, isLoading } = useGallery(company.slug);

    const images = useMemo(() => {
        if (!gallery) return [];
        return gallery.slice(0, 3); // Show 3 images to match grid
    }, [gallery]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="aspect-square rounded-lg" />
                    <Skeleton className="aspect-square rounded-lg" />
                </div>
            </div>
        );
    }

    if (!gallery || gallery.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    Life at {company.name}
                </h3>
                <Button variant="ghost" size="sm" onClick={onViewAll} className="gap-1">
                    View Gallery <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
                {images.map((item) => (
                    <div key={item.gallery_id} className="min-w-[40vw] md:min-w-0 snap-center relative rounded-lg overflow-hidden border bg-muted aspect-square group">
                        <img
                            src={item.url}
                            alt={item.caption || "Company photo"}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        {item.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.caption}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
