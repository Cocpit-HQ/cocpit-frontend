"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreatePostModal } from '@/components/home/CreatePostModal';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useCompanyPermissions } from '@/hooks/use-company';

interface CreatePostButtonProps {
    companyId?: string;
    companyName?: string;
    companyLogo?: string;
}

export function CreatePostButton({ companyId, companyName, companyLogo }: CreatePostButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { activeProfile } = useActiveProfile();
    const { canCreateContent } = useCompanyPermissions(activeProfile);

    if (!companyId || !canCreateContent) return null;

    return (
        <>
            <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Post
            </Button>

            <CreatePostModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialPostType="text"
                companyId={companyId}
                companyName={companyName}
                companyLogo={companyLogo}
            />
        </>
    );
}
