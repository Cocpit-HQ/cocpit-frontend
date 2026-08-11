"use client";

import React from "react";

interface UnavailableContentCardProps {
  title?: string;
  message?: string;
  className?: string;
}

export function UnavailableContentCard({
  title = "Message unavailable",
  message = "This content may have been deleted by its owner or hidden by their privacy settings",
  className = "",
}: UnavailableContentCardProps) {
  return (
    <div className={`p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-tl-xl rounded-tr-xl rounded-br-xl inline-flex flex-col justify-start items-start gap-1 max-w-[280px] border border-indigo-100 dark:border-indigo-900/30 ${className}`}>
      <div className="justify-center text-black dark:text-white text-xs font-normal font-['Poppins'] leading-4">
        {title}
      </div>
      <div className="w-56 justify-center text-gray-500 dark:text-gray-400 text-[10px] font-normal font-['Poppins']">
        {message}
      </div>
    </div>
  );
}

export default UnavailableContentCard;
