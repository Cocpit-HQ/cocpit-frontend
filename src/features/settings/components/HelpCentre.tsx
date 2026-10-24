"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface HelpCentreProps {
  onBack: () => void;
}

interface StructuredFaq {
  question: string;
  intro?: string;
  steps?: React.ReactNode[];
  plainAnswer?: string;
}

const DEFAULT_FAQS: StructuredFaq[] = [
  /*
  {
    question: "How do I change my primary email?",
    intro: "Updating your primary email is essential for account security and notifications. Follow these steps:",
    steps: [
      (
        <div key="step-1">
          <span className="text-ds-text-secondary ds-text-secondary">Navigate to </span>
          <span className="text-ds-accent ds-text-secondary font-medium">Settings</span>
          <span className="text-ds-text-secondary ds-text-secondary"> from your sidebar.</span>
        </div>
      ),
      (
        <div key="step-2">
          <span className="text-ds-text-secondary ds-text-secondary">Select the </span>
          <span className="text-ds-text-primary ds-text-body-1 font-medium">Account Access</span>
          <span className="text-ds-text-secondary ds-text-secondary"> tab.</span>
        </div>
      ),
      (
        <div key="step-3" className="text-ds-text-secondary ds-text-secondary">
          Click &quot;Add Email Address&quot; and enter your new address.
        </div>
      ),
      (
        <div key="step-4" className="text-ds-text-secondary ds-text-secondary">
          Verify the new email via the link sent to your inbox.
        </div>
      ),
      (
        <div key="step-5" className="text-ds-text-secondary ds-text-secondary">
          Once verified, click the Make Primary option.
        </div>
      ),
    ],
  },
  */
  {
    question: "What happens when I deactivate my account?",
    plainAnswer:
      "When you deactivate your account, your profile, posts, and activity are hidden from other users. Your account data is securely preserved, and you can reactivate at any time simply by logging back in.",
  },
  {
    question: "How do I enable two-factor authentication (2FA)?",
    plainAnswer:
      "Go to Settings > Account Access and locate the Two-Factor Authentication section. Enable 2FA and follow the on-screen instructions to connect your preferred authenticator app.",
  },
];

export function HelpCentre({ onBack }: HelpCentreProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="w-full max-w-[712px] p-0 md:px-4 md:py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-0 md:gap-3">
      {/* Header */}
      <div className="self-stretch flex items-center gap-2 shrink-0 px-4 h-6 mb-4 md:px-0 md:h-auto md:mb-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-5 h-5 p-0 text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer shrink-0"
          aria-label="Back to Support"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary stroke-[1.5]" />
        </button>
        <h1 className="text-ds-text-primary text-[16px] md:text-base font-medium md:font-semibold font-['DM_Sans'] leading-[24px] h-6 flex items-center m-0">
          Help centre
        </h1>
      </div>

      {/* Common questions section */}
      <div className="self-stretch px-4 md:px-0 flex flex-col justify-start items-start gap-3">
        <div className="self-stretch ds-text-body-1 text-ds-text-secondary">
          Common questions
        </div>

        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          {DEFAULT_FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className="self-stretch px-3 sm:px-4 py-3 rounded-lg border border-ds-border flex flex-col justify-center items-start transition-colors"
              >
                {/* Accordion trigger */}
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="self-stretch inline-flex justify-between items-center text-left bg-transparent border-none cursor-pointer p-0 ds-focus-ring rounded gap-2"
                >
                  <span className="ds-text-body-1 text-ds-text-primary font-medium flex-1 min-w-0 pr-2 sm:pr-4 break-words">
                    {faq.question}
                  </span>
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-ds-text-primary" strokeWidth={1.5} />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-ds-text-primary" strokeWidth={1.5} />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="self-stretch px-2 py-4 flex flex-col justify-start items-start gap-4">
                    {faq.intro && (
                      <div className="self-stretch ds-text-secondary text-ds-text-secondary">
                        {faq.intro}
                      </div>
                    )}
                    {faq.steps && faq.steps.length > 0 && (
                      <div className="self-stretch px-2 flex flex-col justify-start items-start gap-2">
                        {faq.steps.map((stepNode) => stepNode)}
                      </div>
                    )}
                    {faq.plainAnswer && (
                      <div className="self-stretch ds-text-secondary text-ds-text-secondary leading-relaxed">
                        {faq.plainAnswer}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HelpCentre;
