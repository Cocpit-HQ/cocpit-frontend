"use client";

import React, { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Star } from 'lucide-react';
import { HelpCentre } from '../components/HelpCentre';
import { ContactSupport } from '../components/ContactSupport';
import { useSettingsStore } from '@/store/settings.store';
import { submitFeedback } from '@/features/settings/api/support';
import { toast } from 'sonner';

export function SupportSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/support';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const currentView = useSettingsStore((state) => state.support.view);
  const setCurrentView = useSettingsStore((state) => state.setSupportView);

  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);

  const handleSubmitFeedback = useCallback(async () => {
    if (feedbackRating === 0 && !feedbackComment.trim()) {
      toast.error('Please select a star rating or provide feedback');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      await submitFeedback({
        rating: feedbackRating,
        comment: feedbackComment.trim() || undefined,
        app_version: '1.0.0',
      });
      toast.success('Thank you for your feedback!');
      setFeedbackRating(0);
      setHoverRating(0);
      setFeedbackComment('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  }, [feedbackRating, feedbackComment]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmitFeedback();
      }
    },
    [handleSubmitFeedback]
  );

  if (currentView === 'help') {
    return <HelpCentre onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'contact') {
    return <ContactSupport onBack={() => setCurrentView('main')} />;
  }

  return (
    <div className="w-full max-w-[712px] px-2 sm:px-4 py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3">
      {/* Title & Mobile Back */}
      <div className="self-stretch flex flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => router.replace(basePath)}
          aria-label="Back to settings menu"
          className="-ml-1.5 flex md:hidden items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
        </button>
        <div className="ds-text-body-2 text-ds-text-primary">Support</div>
      </div>

      {/* Menu Rows & Feedback Card */}
      <div className="self-stretch flex flex-col justify-start items-start gap-3">
        {/* Platform version */}
        <div className="self-stretch py-3 border-b border-ds-border inline-flex justify-between items-center">
          <div className="flex-1 min-w-0 pr-2 inline-flex flex-col justify-center items-start">
            <div className="ds-text-body-1 text-ds-text-primary">Platform version</div>
            <div className="ds-text-secondary text-ds-text-secondary">You are up to date</div>
          </div>
          <ChevronRight className="w-5 h-5 text-ds-text-primary shrink-0" strokeWidth={1.5} />
        </div>

        {/* Help center */}
        <button
          type="button"
          onClick={() => setCurrentView('help')}
          className="self-stretch py-3 border-b border-ds-border inline-flex justify-between items-center text-left bg-transparent cursor-pointer hover:opacity-85 transition-opacity ds-focus-ring"
        >
          <div className="flex-1 min-w-0 pr-2 inline-flex flex-col justify-center items-start">
            <div className="ds-text-body-1 text-ds-text-primary">Help center</div>
            <div className="ds-text-secondary text-ds-text-secondary">Browse frequently asked questions</div>
          </div>
          <ChevronRight className="w-5 h-5 text-ds-text-primary shrink-0" strokeWidth={1.5} />
        </button>

        {/* Contact support */}
        <button
          type="button"
          onClick={() => setCurrentView('contact')}
          className="self-stretch py-3 inline-flex justify-between items-center text-left bg-transparent cursor-pointer hover:opacity-85 transition-opacity ds-focus-ring"
        >
          <div className="flex-1 min-w-0 pr-2 inline-flex flex-col justify-center items-start">
            <div className="ds-text-body-1 text-ds-text-primary">Contact support</div>
            <div className="ds-text-secondary text-ds-text-secondary">
              We&apos;re here to help — our team typically responds within 24 hours
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-ds-text-primary shrink-0" strokeWidth={1.5} />
        </button>

        {/* Share feedback Card */}
        <div className="self-stretch p-3 sm:p-4 rounded-2xl border border-ds-border flex flex-col justify-center items-start gap-2">
          <div className="self-stretch flex flex-col justify-start items-start gap-3">
            <div className="flex flex-col justify-center items-start">
              <div className="ds-text-body-1 text-ds-text-primary">Share feedback</div>
              <div className="ds-text-secondary text-ds-text-secondary">How is your experience with Cocpit?</div>
            </div>

            {/* Stars */}
            <div className="self-stretch inline-flex justify-start items-center gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  className="w-5 h-5 flex items-center justify-center p-0 cursor-pointer bg-transparent border-none ds-focus-ring"
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      star <= (hoverRating || feedbackRating)
                        ? 'fill-ds-accent text-ds-accent'
                        : 'text-ds-text-primary'
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>

            {/* Feedback Input */}
            <div className="self-stretch py-2 border-b border-ds-border inline-flex justify-start items-center">
              <input
                type="text"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell us what we can improve..."
                className="w-full bg-transparent border-none outline-none ds-text-secondary text-ds-text-primary placeholder:text-ds-text-muted p-0"
              />
            </div>

            {/* Submit Button */}
            <div className="self-stretch flex flex-col justify-center items-end">
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback || (feedbackRating === 0 && !feedbackComment.trim())}
                className="h-[36px] px-3 py-1.5 bg-ds-accent rounded-[100px] inline-flex justify-center items-center cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity ds-focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="ds-text-body-1 text-ds-text-primary font-medium">
                  {isSubmittingFeedback ? 'Sending...' : 'Send Feedback'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportSettingsPage;
