import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { getFAQs } from '@/features/settings/api/support';
import { toast } from 'sonner';

interface HelpCentreProps {
  onBack: () => void;
}

interface FAQ {
  question: string;
  answer: string;
}

export function HelpCentre({ onBack }: HelpCentreProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await getFAQs();
        setFaqs(res.faqs || []);
      } catch (error) {
        toast.error("Failed to fetch FAQs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">
        {/* Header */}
        <div className="flex flex-row items-center gap-4 mb-2">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-12 h-12 rounded-full border border-[#DADADA] hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6 text-[#6B7280]" strokeWidth={1.5} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-medium text-black leading-[26px]">Help centre</h1>
            <p className="text-[14px] font-normal text-[#6B7280] leading-[20px]">Browse frequently asked questions</p>
          </div>
        </div>

        <h2 className="text-[16px] font-normal text-[#6B7280] leading-[24px] mt-2">Common questions</h2>

        <div className="flex flex-col gap-2 w-full">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
            </div>
          ) : (
            faqs.map((faq, index) => (
              <div 
                key={index}
                className="flex flex-col p-4 w-full border border-[#E0E7FF] rounded-[12px] bg-white cursor-pointer" 
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <div className="flex flex-row justify-between items-start w-full">
                  <span className="text-[14px] font-normal text-black leading-[20px] pr-4">{faq.question}</span>
                  {expandedFaq === index ? <ChevronUp className="w-6 h-6 text-black flex-shrink-0" strokeWidth={1.5} /> : <ChevronDown className="w-6 h-6 text-black flex-shrink-0" strokeWidth={1.5} />}
                </div>
                
                {expandedFaq === index && (
                  <div className="flex flex-col gap-4 mt-4 w-full">
                    <p className="text-[14px] font-normal text-[#6B7280] leading-[20px] whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
