"use client";

import React, { useState, useEffect } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { getLegalDocs } from '@/features/settings/api/support';
import { toast } from 'sonner';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface LegalDoc {
  title: string;
  url: string;
}

const DEFAULT_LEGAL_DOCS: LegalDoc[] = [
  { title: "Privacy Policy", url: "https://res.cloudinary.com/doxkaqqt4/raw/upload/v1/cocpit_legal/privacy_policy.pdf" },
  { title: "Terms of Service", url: "https://res.cloudinary.com/doxkaqqt4/raw/upload/v1/cocpit_legal/terms_of_service.pdf" },
  { title: "Community Guidelines", url: "https://res.cloudinary.com/doxkaqqt4/raw/upload/v1/cocpit_legal/community_guidelines.pdf" },
  { title: "Cookie Policy", url: "https://res.cloudinary.com/doxkaqqt4/raw/upload/v1/cocpit_legal/cookie_policy.pdf" },
];

export function LegalSettingsPage() {
  const { isCompany } = useActiveProfile();
  const [docs, setDocs] = useState<LegalDoc[]>(DEFAULT_LEGAL_DOCS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await getLegalDocs();
        if (res?.docs && Array.isArray(res.docs) && res.docs.length > 0) {
          setDocs(res.docs);
        }
      } catch (error) {
        console.error("Failed to fetch legal documents, using default Cloudinary links", error);
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
          <h1 className="text-[24px] font-semibold text-black dark:text-foreground leading-[32px]">Legal</h1>
          <p className="text-[16px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[24px] mt-1">Review our policies and terms</p>
        </div>

        {/* Content Box */}
        <div className="flex flex-col w-full">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className={`w-8 h-8 animate-spin ${isCompany ? 'text-[#1A73E8] dark:text-company-primary' : 'text-[#6366F1] dark:text-primary'}`} />
            </div>
          ) : (
            docs.map((item, index) => (
              <div 
                key={index}
                onClick={() => window.open(item.url, '_blank')}
                className={`flex flex-row justify-between items-center py-3 w-full cursor-pointer hover:bg-gray-50 dark:hover:bg-secondary transition-colors ${
                  index === 0 ? 'border-t border-transparent' : 'border-t border-[#DADADA] dark:border-border'
                }`}
              >
                <div className="flex flex-col justify-center">
                  <h3 className="text-[16px] font-normal text-black dark:text-foreground leading-[24px]">{item.title}</h3>
                  <p className="text-[14px] font-normal text-[#6B7280] dark:text-muted-foreground leading-[20px]">{getSubtitle(item.title)}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-black dark:text-foreground" strokeWidth={1.5} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
