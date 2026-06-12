"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface InlineErrorProps {
  error?: string | null;
}

export default function InlineError({ error }: InlineErrorProps) {
  const isConnectionLost = error?.toLowerCase().includes("connection") || 
                           error?.toLowerCase().includes("send") || 
                           error?.toLowerCase().includes("lost");
  const errorText = isConnectionLost
    ? "Couldn't send, try again"
    : "Sorry, something went wrong on our end. Please try again";
  const errorWidthClass = isConnectionLost ? "w-[220px]" : "w-[459px]";

  return (
    <div className="flex flex-row items-center p-0 gap-2 w-[912px] max-w-full h-6 flex-none order-2 self-stretch grow-0 mt-2">
      {/* Icon Container */}
      <div className="relative w-6 h-6 flex-none order-0 grow-0">
        <div className="absolute left-[11.46%] right-[11.46%] top-[11.46%] bottom-[11.46%] flex items-center justify-center">
          <Icon
            icon="solar:info-circle-linear"
            className="w-full h-full text-[#FF6B6B]"
          />
        </div>
      </div>

      {/* Error Text */}
      <span
        className={`max-w-full h-6 font-['Poppins'] not-italic font-normal text-[16px] leading-[24px] flex items-center text-[#FF6B6B] flex-none order-1 grow-0 ${errorWidthClass}`}
      >
        {errorText}
      </span>
    </div>
  );
}
