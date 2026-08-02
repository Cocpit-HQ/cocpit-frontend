"use client";

import React, { useState } from 'react';
import { Layout, Info, ChevronRight, Star, Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { HelpCentre } from './HelpCentre';
import { ContactSupport } from './ContactSupport';
import { submitFeedback } from '@/features/settings/api/support';
import { toast } from 'sonner';
import { useSettingsStore } from '@/store/settings.store';

export function SupportSettingsPage() {
  // Which sub-view (main/help/contact) is shown now lives in the shared
  // settings store instead of local useState.
  const view = useSettingsStore((state) => state.support.view);
  const setView = useSettingsStore((state) => state.setSupportView);
  const [rating, setRating] = useState<number>(1);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (rating < 1 || rating > 5) return;
    
    setIsSubmitting(true);
    try {
      await submitFeedback({ rating, comment, app_version: "v2.4.1" });
      toast.success("Feedback submitted successfully!");
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
          <h1 className="text-[24px] font-semibold text-black leading-[32px]">Support</h1>
          <p className="text-[16px] font-normal text-[#6B7280] leading-[24px] mt-1">Get help or share your feedback</p>
        </div>

        {/* Content */}
        <div className="flex flex-col w-full">
          
          {/* Platform version */}
          <div className="flex flex-row justify-between items-center py-3 w-full border-t border-transparent">
            <div className="flex flex-row items-center gap-4">
              <Layout className="w-6 h-6 text-black" strokeWidth={1.5} />
              <div className="flex flex-col justify-center">
                <h3 className="text-[16px] font-normal text-black leading-[24px]">Platform version</h3>
                <p className="text-[14px] font-normal text-[#6B7280] leading-[20px]">You are up to date</p>
              </div>
            </div>
            <span className="text-[16px] font-normal text-[#6B7280] leading-[24px] px-3 py-1 bg-white rounded-full">v2.4.1</span>
          </div>

          {/* Help center */}
          <div 
            className="flex flex-row justify-between items-center py-3 w-full border-t border-[#DADADA] cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setView('help')}
          >
            <div className="flex flex-row items-center gap-4">
              <Info className="w-6 h-6 text-black" strokeWidth={1.5} />
              <div className="flex flex-col justify-center">
                <h3 className="text-[16px] font-normal text-black leading-[24px]">Help center</h3>
                <p className="text-[14px] font-normal text-[#6B7280] leading-[20px]">Browse frequently asked questions</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-black" strokeWidth={1.5} />
          </div>

          {/* Contact support */}
          <div 
            className="flex flex-row justify-between items-center py-3 w-full border-t border-[#DADADA] cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setView('contact')}
          >
            <div className="flex flex-row items-center gap-4">
              <Icon icon="streamline:customer-support-1" className="w-6 h-6 text-black" />
              <div className="flex flex-col justify-center">
                <h3 className="text-[16px] font-normal text-black leading-[24px]">Contact support</h3>
                <p className="text-[14px] font-normal text-[#6B7280] leading-[20px]">We're here to help — our team typically responds within 24 hours</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-black" strokeWidth={1.5} />
          </div>

        </div>

        {/* Share feedback card */}
        <div className="flex flex-col justify-center p-4 gap-4 w-full border border-[#E0E7FF] rounded-[24px] mt-4">
          <div className="flex flex-col gap-1 w-full">
            <h3 className="text-[16px] font-normal text-black leading-[24px]">Share feedback</h3>
            <p className="text-[16px] font-normal text-[#6B7280] leading-[24px]">How is your experience with Cocpit?</p>
          </div>
          
          <div className="flex flex-row items-center gap-2 w-full">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star}
                onClick={() => setRating(star)}
                className={`w-6 h-6 cursor-pointer transition-colors ${rating >= star ? 'text-[#FBBF24] fill-[#FBBF24]' : 'text-[#6B7280]'}`}
                strokeWidth={1.5}
              />
            ))}
          </div>

          <textarea 
            className="w-full h-[72px] border border-[#DADADA] rounded-[12px] p-3 text-[16px] text-black font-poppins focus:outline-none focus:border-[#6366F1] resize-none placeholder-[#6B7280]"
            placeholder="Tell us what we can improve..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <div className="flex flex-row justify-end items-center w-full mt-2">
            <button 
              className="flex flex-row justify-center items-center py-2 px-4 min-w-[140px] h-[40px] bg-[#6366F1] hover:bg-[#4F46E5] rounded-[24px] transition-colors disabled:opacity-50"
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

      </div>
    </div>
  );
}
