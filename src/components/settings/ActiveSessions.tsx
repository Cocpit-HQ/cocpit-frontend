"use client";

import React, { useEffect, useState } from "react";
import {
    Monitor,
    Smartphone,
    Globe,
    LogOut,
    Trash2,
    ShieldCheck,
    MoreVertical,
    AlertTriangle,
    History,
    Lock
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "sonner";

import { getSessions, logoutSession, logoutAllOtherSessions } from "@/services/api/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

dayjs.extend(relativeTime);

interface Session {
    session_id: string;
    user_agent: string;
    ip_address: string;
    browser: string;
    os: string;
    device_type: string;
    created_at: string;
    expires_at: string;
    is_current: boolean;
}

export default function ActiveSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [terminatingId, setTerminatingId] = useState<string | null>(null);
    const [terminatingAll, setTerminatingAll] = useState(false);

    const [logoutTarget, setLogoutTarget] = useState<Session | null>(null);
    const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
    const [password, setPassword] = useState("");
    const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);

    const fetchSessions = async () => {
        try {
            const data = await getSessions();
            setSessions(data.sessions);
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            toast.error("Could not load active sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleLogoutSingle = async () => {
        if (!logoutTarget) return;
        if (!password) {
            toast.error("Please enter your password");
            return;
        }

        setTerminatingId(logoutTarget.session_id);
        setIsPasswordInvalid(false);

        try {
            await logoutSession(logoutTarget.session_id, password);
            toast.success("Device logged out");
            setSessions(prev => prev.filter(s => s.session_id !== logoutTarget.session_id));
            setLogoutTarget(null);
            setPassword("");
        } catch (error: any) {
            if (error.response?.status === 401) {
                setIsPasswordInvalid(true);
                toast.error("Invalid password");
            } else {
                toast.error("Failed to log out device");
            }
        } finally {
            setTerminatingId(null);
        }
    };

    const handleLogoutAllOthers = async () => {
        if (!password) {
            toast.error("Please enter your password");
            return;
        }

        setTerminatingAll(true);
        setIsPasswordInvalid(false);

        try {
            const res = await logoutAllOtherSessions(password);
            const count = res.deleted_count || 0;
            toast.success(`Logged out of ${count} other device${count !== 1 ? 's' : ''}`);
            setSessions(prev => prev.filter(s => s.is_current));
            setShowLogoutAllModal(false);
            setPassword("");
        } catch (error: any) {
            if (error.response?.status === 401) {
                setIsPasswordInvalid(true);
                toast.error("Invalid password");
            } else {
                toast.error("Failed to log out other devices");
            }
        } finally {
            setTerminatingAll(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Active Sessions</h2>
                    <p className="text-sm text-muted-foreground">Manage where you are logged in</p>
                </div>

                {sessions.length > 1 && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setShowLogoutAllModal(true)}
                        disabled={terminatingAll}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout all others
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {sessions.map((session) => {
                    const isExpiringSoon = dayjs(session.expires_at).diff(dayjs(), 'hours') < 24;
                    const sessionDisplay = `${session.browser} on ${session.os}`;

                    return (
                        <Card key={session.session_id} className={`overflow-hidden border transition-all ${session.is_current ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border bg-card'}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-lg ${session.is_current ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {session.device_type === 'Mobile' || session.device_type === 'Tablet' ? (
                                                <Smartphone className="w-5 h-5" />
                                            ) : (
                                                <Monitor className="w-5 h-5" />
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-foreground">{sessionDisplay}</span>
                                                {session.is_current && (
                                                    <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] h-5">
                                                        This device
                                                    </Badge>
                                                )}
                                                {isExpiringSoon && !session.is_current && (
                                                    <span className="text-[10px] text-amber-500 flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        Expires soon
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1" title={session.user_agent}>
                                                    <Globe className="w-3 h-3" />
                                                    {session.ip_address}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <History className="w-3 h-3" />
                                                    Logged in {dayjs(session.created_at).fromNow()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {!session.is_current && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setLogoutTarget(session)}
                                            disabled={terminatingId === session.session_id}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {session.is_current && (
                                        <div className="flex items-center text-primary text-xs font-medium px-2 py-1 bg-primary/10 rounded-full h-fit">
                                            <ShieldCheck className="w-3 h-3 mr-1" />
                                            Active
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Logout Single Session Modal */}
            <Dialog
                open={!!logoutTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setLogoutTarget(null);
                        setPassword("");
                        setIsPasswordInvalid(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Logout</DialogTitle>
                        <DialogDescription>
                            Please enter your password to confirm logging out of this device.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="password-single">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password-single"
                                    type="password"
                                    placeholder="Enter your password"
                                    className={`pl-10 ${isPasswordInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setIsPasswordInvalid(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && password && !terminatingId) {
                                            handleLogoutSingle();
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                            {isPasswordInvalid && (
                                <p className="text-[10px] font-medium text-destructive">Incorrect password. Please try again.</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setLogoutTarget(null);
                                setPassword("");
                                setIsPasswordInvalid(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLogoutSingle}
                            disabled={!!terminatingId || !password}
                        >
                            {terminatingId ? "Logging out..." : "Log out"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Logout All Sessions Modal */}
            <Dialog
                open={showLogoutAllModal}
                onOpenChange={(open) => {
                    setShowLogoutAllModal(open);
                    if (!open) {
                        setPassword("");
                        setIsPasswordInvalid(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Log out of all other devices?</DialogTitle>
                        <DialogDescription>
                            This will sign you out of all devices except this one. Please enter your password to confirm.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="password-all">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password-all"
                                    type="password"
                                    placeholder="Enter your password"
                                    className={`pl-10 ${isPasswordInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setIsPasswordInvalid(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && password && !terminatingAll) {
                                            handleLogoutAllOthers();
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                            {isPasswordInvalid && (
                                <p className="text-[10px] font-medium text-destructive">Incorrect password. Please try again.</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowLogoutAllModal(false);
                                setPassword("");
                                setIsPasswordInvalid(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleLogoutAllOthers}
                            disabled={terminatingAll || !password}
                        >
                            {terminatingAll ? "Logging out..." : "Log out all"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
