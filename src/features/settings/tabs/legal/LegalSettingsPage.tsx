"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { getLegalDocs } from '@/features/settings/api/support';
import { toast } from 'sonner';

interface LegalDoc {
  title: string;
  url: string;
}

export function LegalSettingsPage() {
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await getLegalDocs();
        setDocs(res.docs || []);
      } catch (error) {
        toast.error("Failed to fetch legal documents");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const getSubtitle = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('privacy')) return 'How we handle your data';
    if (lower.includes('terms')) return 'Rules for using Cocpit';
    if (lower.includes('community')) return 'Standards for posts and behavior';
    if (lower.includes('cookie')) return 'How we use cookies';
    return 'Review our policies and terms';
  };


  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20 relative">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">
        {/* Header section */}
        <div className="flex flex-col items-start justify-center mb-2">
          <h1 className="text-[24px] font-semibold text-black leading-[32px]">Legal</h1>
          <p className="text-[16px] font-normal text-[#6B7280] leading-[24px] mt-1">Review our policies and terms</p>
        </div>

        {/* Content Box */}
        <div className="flex flex-col w-full">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
            </div>
          ) : (
            docs.map((item, index) => (
              <div 
                key={index}
                onClick={() => window.open(item.url, '_blank')}
                className={`flex flex-row justify-between items-center py-3 w-full cursor-pointer hover:bg-gray-50 transition-colors ${
                  index === 0 ? 'border-t border-transparent' : 'border-t border-[#DADADA]'
                }`}
              >
                <div className="flex flex-col justify-center">
                  <h3 className="text-[16px] font-normal text-black leading-[24px]">{item.title}</h3>
                  <p className="text-[14px] font-normal text-[#6B7280] leading-[20px]">{getSubtitle(item.title)}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-black" strokeWidth={1.5} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
