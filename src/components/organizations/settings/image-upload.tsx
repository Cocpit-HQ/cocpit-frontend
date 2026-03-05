"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { uploadMedia } from "@/services/api/upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    className?: string;
    aspectRatio?: "square" | "cover";
    placeholder?: React.ReactNode;
}

export function ImageUpload({ value, onChange, className, aspectRatio = "square", placeholder }: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("Image size should be less than 5MB");
            return;
        }

        setIsUploading(true);
        try {
            const urls = await uploadMedia([file]);
            if (urls && urls.length > 0) {
                onChange(urls[0].url);
                toast.success("Image uploaded successfully");
            }
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={cn("relative group overflow-hidden bg-muted border border-border", className, aspectRatio === "square" ? "rounded-full" : "rounded-md")}>
            {value ? (
                <img
                    src={value}
                    alt="Upload"
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="flex items-center justify-center w-full h-full text-muted-foreground p-4 text-center">
                    {placeholder || <Upload className="w-6 h-6" />}
                </div>
            )}

            {/* Overlay */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer",
                    isUploading ? "opacity-100 bg-black/60" : ""
                )}
                onClick={!isUploading ? triggerUpload : undefined}
            >
                {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                    <Upload className="w-6 h-6 text-white" />
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
}
