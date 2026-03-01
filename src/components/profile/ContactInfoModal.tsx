
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mail, Phone, Link as LinkIcon, Copy, Check, Pencil, X, Loader2 } from 'lucide-react';
import { UserData } from '@/types/user';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from '@/services/api/profile';
import { checkAccountNameAvailability } from '@/services/api/onboarding';
import { useQueryClient } from '@tanstack/react-query';

interface ContactInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserData | undefined;
    isOwnProfile?: boolean;
}

export function ContactInfoModal({ isOpen, onClose, user, isOwnProfile = false }: ContactInfoModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Username editing state
    const [isEditingUrl, setIsEditingUrl] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
    const [isSaving, setIsSaving] = useState(false);
    const checkTimer = useRef<NodeJS.Timeout | null>(null);

    if (!user) return null;

    const currentUsername = user.account_name || '';
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${currentUsername || user.id}` : '';

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast({
            title: "Copied!",
            description: `${field} copied to clipboard`,
        });
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleStartEdit = () => {
        setUsernameInput(currentUsername);
        setUsernameStatus('idle');
        setIsEditingUrl(true);
    };

    const handleUsernameChange = (value: string) => {
        setUsernameInput(value);
        if (checkTimer.current) clearTimeout(checkTimer.current);
        const regex = /^[a-zA-Z0-9_-]{3,30}$/;
        if (!value || value === currentUsername) {
            setUsernameStatus('idle');
        } else if (!regex.test(value)) {
            setUsernameStatus('invalid');
        } else {
            setUsernameStatus('checking');
            checkTimer.current = setTimeout(async () => {
                try {
                    const available = await checkAccountNameAvailability(value);
                    setUsernameStatus(available ? 'available' : 'taken');
                } catch {
                    setUsernameStatus('idle');
                }
            }, 500);
        }
    };

    const handleSave = async () => {
        if (usernameStatus !== 'available' && usernameInput !== currentUsername) return;
        if (usernameInput === currentUsername) {
            setIsEditingUrl(false);
            return;
        }
        setIsSaving(true);
        try {
            await updateProfile({ account_name: usernameInput } as any);
            queryClient.invalidateQueries({ queryKey: ['myProfile'] });
            toast({ title: "Success", description: "Profile URL updated!" });
            setIsEditingUrl(false);
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Failed to update username';
            toast({ variant: "destructive", title: "Error", description: msg });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-card border-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        {user.name}&apos;s Contact Info
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
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-muted-foreground">Profile URL</p>
                                {isOwnProfile && !isEditingUrl && (
                                    <button
                                        onClick={handleStartEdit}
                                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                        title="Edit profile URL"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {isEditingUrl ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">/profile/</span>
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={usernameInput}
                                                onChange={(e) => handleUsernameChange(e.target.value)}
                                                className={`w-full text-sm px-2.5 py-1.5 rounded-md border bg-background text-foreground outline-none transition-colors ${usernameStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                                                        usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-destructive focus:border-destructive' :
                                                            'border-border focus:border-primary'
                                                    }`}
                                                autoFocus
                                                placeholder="your_username"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSave();
                                                    if (e.key === 'Escape') setIsEditingUrl(false);
                                                }}
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                                                {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-500" />}
                                                {usernameStatus === 'taken' && <X className="w-4 h-4 text-destructive" />}
                                                {usernameStatus === 'invalid' && <X className="w-4 h-4 text-orange-500" />}
                                            </div>
                                        </div>
                                    </div>
                                    {usernameStatus === 'available' && <p className="text-xs text-green-500">Username is available!</p>}
                                    {usernameStatus === 'taken' && <p className="text-xs text-destructive">This username is already taken</p>}
                                    {usernameStatus === 'invalid' && <p className="text-xs text-orange-500">3-30 characters: letters, numbers, _ and - only</p>}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={handleSave}
                                            disabled={isSaving || (usernameStatus !== 'available' && usernameInput !== currentUsername)}
                                            className="h-7 text-xs"
                                        >
                                            {isSaving ? 'Saving...' : 'Save'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsEditingUrl(false)}
                                            className="h-7 text-xs"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
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
                            )}
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
