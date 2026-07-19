"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/axios';
import { Suspense } from 'react';

import * as teamService from '@/features/manage-team/services/team.service';

function InviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [message, setMessage] = useState('');

    const handleAccept = async () => {
        if (!token) return;
        setStatus('LOADING');
        try {
            await teamService.acceptInvite(token);
            setStatus('SUCCESS');
            setMessage("Invitation accepted successfully!");
            setTimeout(() => {
                router.push('/dashboard'); // or redirect to specific company?
            }, 2000);
        } catch (error: any) {
            setStatus('ERROR');
            setMessage(error.response?.data?.message || "Failed to accept invitation.");
        }
    };

    const handleDecline = async () => {
        if (!token) return;
        setStatus('LOADING');
        try {
            await teamService.declineInvite(token);
            setStatus('SUCCESS');
            setMessage("Invitation declined.");
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error: any) {
            setStatus('ERROR');
            setMessage(error.response?.data?.message || "Failed to decline invitation.");
        }
    };

    if (!token) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Card className="w-[400px]">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <XCircle /> Invalid Invitation
                        </CardTitle>
                        <CardDescription>
                            This invitation link is invalid or missing a token.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50/50">
            <Card className="w-[400px] shadow-lg">
                <CardHeader>
                    <CardTitle>Join Company</CardTitle>
                    <CardDescription>
                        You have been invited to join a company on Cocpit.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {status === 'SUCCESS' ? (
                        <div className="flex flex-col items-center gap-4 text-green-600">
                            <CheckCircle2 className="h-12 w-12" />
                            <p className="font-medium">{message}</p>
                            <p className="text-sm text-muted-foreground">Redirecting...</p>
                        </div>
                    ) : status === 'ERROR' ? (
                        <div className="flex flex-col items-center gap-4 text-destructive">
                            <XCircle className="h-12 w-12" />
                            <p className="font-medium">{message}</p>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">
                            Click below to accept the invitation and access the company workspace.
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 justify-center">
                    {status !== 'SUCCESS' && (
                        <>
                            <Button onClick={handleAccept} disabled={status === 'LOADING'} className="w-full">
                                {status === 'LOADING' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Accept Invitation
                            </Button>
                            <Button onClick={handleDecline} disabled={status === 'LOADING'} variant="outline" className="w-full">
                                Decline
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <InviteContent />
        </Suspense>
    );
}
