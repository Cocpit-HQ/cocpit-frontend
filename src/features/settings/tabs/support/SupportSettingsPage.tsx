"use client";

import React, { useState, useEffect } from 'react';
import { Layout, Info, Headphones, ChevronRight, Star, Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { HelpCentre } from './HelpCentre';
import { ContactSupport } from './ContactSupport';
import { submitFeedback } from '@/features/settings/api/support';
import { toast } from 'sonner';
import { useSettingsStore } from '@/store/settings.store';
import api from '@/lib/axios';
import { useSocket } from '@/context/SocketContext';
import { useActiveProfile } from '@/context/ActiveProfileContext';

export function SupportSettingsPage() {
  const { activeProfile, isCompany } = useActiveProfile();
  const view = useSettingsStore((state) => state.support.view);
  const setView = useSettingsStore((state) => state.setSupportView);
  const [rating, setRating] = useState<number>(1);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Version + feedback state
  const [appVersion, setAppVersion] = useState<string>('');
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState<boolean>(false);
  const [versionLoading, setVersionLoading] = useState(true);

  const { socket } = useSocket();

  // Fetch version and actor-scoped feedback status whenever active actor context changes
  useEffect(() => {
    setVersionLoading(true);
    const currentActorType = activeProfile?.type === 'COMPANY' ? 'ORGANIZATION' : 'USER';
    const currentActorId = activeProfile?.id || '';

    api.get('/settings/support/version', {
      headers: {
        'x-actor-type': currentActorType,
        'x-actor-id': currentActorId,
      }
    })
      .then((res) => {
        setAppVersion(res.data.version || '');
        setHasSubmittedFeedback(res.data.has_submitted_feedback || false);
      })
      .catch(() => {
        setAppVersion('');
        setHasSubmittedFeedback(false);
      })
      .finally(() => setVersionLoading(false));
  }, [activeProfile?.type, activeProfile?.id]);

  // Listen for real-time FEEDBACK_SUBMITTED event from backend
  useEffect(() => {
    if (!socket) return;

    const handleFeedbackSubmitted = (data: { app_version: string; actor_type?: string; actor_id?: string; has_submitted_feedback: boolean }) => {
      const currentActorType = activeProfile?.type === 'COMPANY' ? 'ORGANIZATION' : 'USER';
      const currentActorId = activeProfile?.id;

      if (data.app_version === appVersion && data.has_submitted_feedback) {
        if (data.actor_type === currentActorType && String(data.actor_id) === String(currentActorId)) {
          setHasSubmittedFeedback(true);
        }
      }
    };

    socket.on('FEEDBACK_SUBMITTED', handleFeedbackSubmitted);
    return () => {
      socket.off('FEEDBACK_SUBMITTED', handleFeedbackSubmitted);
    };
  }, [socket, appVersion, activeProfile?.type, activeProfile?.id]);

  const handleSubmitFeedback = async () => {
    if (rating < 1 || rating > 5) return;
    if (!appVersion) return;

    setIsSubmitting(true);
    const currentActorType = activeProfile?.type === 'COMPANY' ? 'ORGANIZATION' : 'USER';
    const currentActorId = activeProfile?.id || '';

    try {
      await api.post('/settings/support/feedback', {
        rating,
        comment,
        app_version: appVersion
      }, {
        headers: {
          'x-actor-type': currentActorType,
          'x-actor-id': currentActorId,
        }
      });
      toast.success("Feedback submitted successfully!");
      setHasSubmittedFeedback(true);
      setComment("");
      setRating(1);
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === 'help') {
    return <HelpCentre onBack={() => setView('main')} />;
  }

  if (view === 'contact') {
    return <ContactSupport onBack={() => setView('main')} />;
  }

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20 relative">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">
        {/* Header section */}
        <div className="flex flex-col items-start justify-center mb-2">
          <h1 className="text-[24px] font-semibold text-black dark:text-foreground leading-[32px]">Support</h1>
          <p className="text-[16px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[24px] mt-1">Get help or share your feedback</p>
        </div>

        {/* Content */}
        <div className="flex flex-col w-full">
          
            <div className="flex flex-row justify-between items-center py-3 w-full border-t border-transparent">
            <div className="flex flex-row items-center gap-4">
              <Layout className="w-6 h-6 text-black dark:text-foreground" strokeWidth={1.5} />
              <div className="flex flex-col justify-center">
                <h3 className="text-[16px] font-normal text-black dark:text-foreground leading-[24px]">Platform version</h3>
                <p className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">You are up to date</p>
              </div>
            </div>
            <span className="text-[16px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[24px] px-3 py-1 bg-white dark:bg-card rounded-full">
              {versionLoading ? '...' : appVersion || '—'}
            </span>
          </div>

          {/* Help center */}
          <div 
            className="flex flex-row justify-between items-center py-3 w-full border-t border-[#DADADA] dark:border-border cursor-pointer transition-colors"
            onClick={() => setView('help')}
          >
            <div className="flex flex-row items-center gap-4">
              <Info className="w-6 h-6 text-black dark:text-foreground" strokeWidth={1.5} />
              <div className="flex flex-col justify-center">
                <h3 className="text-[16px] font-normal text-black dark:text-foreground leading-[24px]">Help center</h3>
                <p className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">Browse frequently asked questions</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-black dark:text-foreground" strokeWidth={1.5} />
          </div>

          {/* Contact support */}
          <div 
            className="flex flex-row justify-between items-center py-3 w-full border-t border-[#DADADA] dark:border-border cursor-pointer transition-colors"
            onClick={() => setView('contact')}
          >
            <div className="flex flex-row items-center gap-4">
              <Icon icon="streamline:customer-support-1" className="w-6 h-6 text-black dark:text-foreground" />
              <div className="flex flex-col justify-center">
                <h3 className="text-[16px] font-normal text-black dark:text-foreground leading-[24px]">Contact support</h3>
                <p className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">We're here to help — our team typically responds within 24 hours</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-black dark:text-foreground" strokeWidth={1.5} />
          </div>

        </div>

        {/* Share feedback card — skeleton placeholder while checking, hidden if already submitted */}
        {versionLoading ? (
          <div className="w-full h-[180px] bg-gray-100 dark:bg-slate-800/50 rounded-[24px] mt-4 animate-pulse" />
        ) : !hasSubmittedFeedback ? (
          <div className="flex flex-col justify-center p-4 gap-4 w-full border border-[#E0E7FF] dark:border-slate-800 rounded-[24px] mt-4 transition-all">
            <div className="flex flex-col gap-1 w-full">
              <h3 className="text-[16px] font-normal text-black dark:text-foreground leading-[24px]">Share feedback</h3>
              <p className="text-[16px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[24px]">How is your experience with Cocpit?</p>
            </div>
            
            <div className="flex flex-row items-center gap-2 w-full">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  onClick={() => setRating(star)}
                  className={`w-6 h-6 cursor-pointer transition-colors ${rating >= star ? 'text-[#FBBF24] fill-[#FBBF24]' : 'text-[#6B7280] dark:text-muted-foreground'}`}
                  strokeWidth={1.5}
                />
              ))}
            </div>

            <textarea 
              className={`w-full h-[72px] border border-[#DADADA] dark:border-border bg-transparent rounded-[12px] p-3 text-[16px] text-black dark:text-foreground font-poppins focus:outline-none ${isCompany ? 'focus:border-[#1A73E8]' : 'focus:border-[#6366F1]'} resize-none placeholder-[#6B7280]`}
              placeholder="Tell us what we can improve..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex flex-row justify-end items-center w-full mt-2">
              <button 
                className={`flex flex-row justify-center items-center py-2 px-4 min-w-[140px] h-[40px] ${isCompany ? 'bg-[#1A73E8] hover:bg-[#1557B0]' : 'bg-[#6366F1] hover:bg-[#4F46E5]'} rounded-[24px] transition-colors disabled:opacity-50`}
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <span className="text-[16px] font-medium text-white leading-[24px]">Send Feedback</span>
                )}
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}

