
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mail, Phone, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { UserData } from '@/types/user';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ContactInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserData | undefined;
}

export function ContactInfoModal({ isOpen, onClose, user }: ContactInfoModalProps) {
    const { toast } = useToast();
    const [copiedField, setCopiedField] = useState<string | null>(null);

    if (!user) return null;

    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${user.id}` : '';

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast({
            title: "Copied!",
            description: `${field} copied to clipboard`,
        });
        setTimeout(() => setCopiedField(null), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-card border-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        {user.name}'s Contact Info
                    </DialogTitle>
                    <DialogDescription>
                        Contact details provided by the user.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">

                    {/* Email */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Email</p>
                            <div className="flex items-center justify-between group">
                                <a href={`mailto:${user.email}`} className="text-foreground hover:underline text-sm font-medium break-all">
                                    {user.email || 'Not provided'}
                                </a>
                                {user.email && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleCopy(user.email, 'Email')}
                                    >
                                        {copiedField === 'Email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Phone</p>
                            <div className="flex items-center justify-between group">
                                <span className="text-foreground text-sm font-medium">
                                    {user.mobile_number || 'Not provided'}
                                </span>
                                {user.mobile_number && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleCopy(user.mobile_number || '', 'Phone')}
                                    >
                                        {copiedField === 'Phone' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Profile Link */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <LinkIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Profile URL</p>
                            <div className="flex items-center justify-between group">
                                <a href={profileUrl} className="text-primary hover:underline text-sm font-medium break-all line-clamp-1">
                                    {profileUrl}
                                </a>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleCopy(profileUrl, 'Profile URL')}
                                >
                                    {copiedField === 'Profile URL' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
