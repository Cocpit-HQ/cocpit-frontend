
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
    user: UserData | null;
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
            queryClient.invalidateQueries({ queryKey: ['my-profile'] });
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
            <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[500px] [&>button]:hidden outline-none">
                <div className="relative bg-card rounded-[24px] p-[24px] pt-[32px] w-full shadow-sm flex flex-col outline-none">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 p-1 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center mb-8 relative px-4">
                        <DialogTitle className="text-[18px] leading-[26px] font-semibold font-[family-name:var(--font-poppins)] text-foreground mb-1">Contact info</DialogTitle>
                        <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">Your contact details for professional connections</p>
                    </div>

                    <div className="space-y-6 px-4 pb-4">
                        {/* Email */}
                        {Boolean(user.email) && (
                            <div className="flex items-start gap-4">
                                <Mail className="w-6 h-6 text-primary mt-0.5" strokeWidth={1.5} />
                                <div className="flex-1 flex flex-col gap-1">
                                    <p className="text-[16px] font-medium text-foreground">Email</p>
                                    <div className="flex items-center justify-between group h-5">
                                        <a href={`mailto:${user.email}`} className="text-muted-foreground text-[14px] font-normal break-all">
                                            {user.email}
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleCopy(user.email || '', 'Email')}
                                        >
                                            {copiedField === 'Email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Phone */}
                        {Boolean(user.mobile_number) && (
                            <div className="flex items-start gap-4">
                                <Phone className="w-6 h-6 text-primary mt-0.5" strokeWidth={1.5} />
                                <div className="flex-1 flex flex-col gap-1">
                                    <p className="text-[16px] font-medium text-foreground">Phone</p>
                                    <div className="flex items-center justify-between group h-5">
                                        <span className="text-muted-foreground text-[14px] font-normal">
                                            {user.mobile_number}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleCopy(user.mobile_number || '', 'Phone')}
                                        >
                                            {copiedField === 'Phone' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile Link */}
                        <div className="flex items-start gap-4">
                            <LinkIcon className="w-6 h-6 text-primary mt-0.5" strokeWidth={1.5} />
                            <div className="flex-1 flex flex-col gap-1">
                                <div className="flex items-center gap-2 h-6">
                                    <p className="text-[16px] font-medium text-foreground">Profile URL</p>

                                </div>

                                {isEditingUrl ? (
                                    <div className="space-y-3 mt-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[14px] text-muted-foreground whitespace-nowrap">/profile/</span>
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    value={usernameInput}
                                                    onChange={(e) => handleUsernameChange(e.target.value)}
                                                    className={`w-full text-[14px] px-2.5 py-1.5 rounded-[8px] border bg-card text-foreground outline-none transition-colors ${usernameStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                                                            usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500 focus:border-red-500' :
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
                                                    {usernameStatus === 'taken' && <X className="w-4 h-4 text-red-500" />}
                                                    {usernameStatus === 'invalid' && <X className="w-4 h-4 text-orange-500" />}
                                                </div>
                                            </div>
                                        </div>
                                        {usernameStatus === 'available' && <p className="text-[12px] text-green-500">Username is available!</p>}
                                        {usernameStatus === 'taken' && <p className="text-[12px] text-red-500">This username is already taken</p>}
                                        {usernameStatus === 'invalid' && <p className="text-[12px] text-orange-500">3-30 characters: letters, numbers, _ and - only</p>}
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleSave}
                                                disabled={isSaving || (usernameStatus !== 'available' && usernameInput !== currentUsername)}
                                                className="h-[32px] px-4 rounded-[16px] text-[12px] bg-primary text-primary-foreground hover:opacity-90 border-none shadow-none"
                                            >
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setIsEditingUrl(false)}
                                                className="h-[32px] px-4 rounded-[16px] text-[12px] border-primary text-primary hover:bg-secondary bg-transparent"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between group h-5 mt-1">
                                        <a href={profileUrl} className="text-primary text-[14px] font-normal break-all line-clamp-1">
                                            {profileUrl}
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleCopy(profileUrl, 'Profile URL')}
                                        >
                                            {copiedField === 'Profile URL' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
