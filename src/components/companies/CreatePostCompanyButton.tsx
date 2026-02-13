"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreatePostModal } from '@/components/home/CreatePostModal';

interface CreatePostButtonProps {
    companyId?: string;
    companyName?: string;
    companyLogo?: string;
}

export function CreatePostButton({ companyId, companyName, companyLogo }: CreatePostButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!companyId) return null;

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
