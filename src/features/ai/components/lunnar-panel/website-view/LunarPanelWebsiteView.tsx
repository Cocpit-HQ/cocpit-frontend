"use client";

import React, { useRef, useEffect } from "react";
import CompanyCard from "../../cards/CompanyCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface LunarPanelWebsiteViewProps {
  selectedCompany?: string;
  companies?: Array<{ id: number; company: string }>;
}

export default function LunarPanelWebsiteView({
  selectedCompany,
  companies = [
    { id: 1, company: "Notion" },
    { id: 2, company: "Linear" },
  ],
}: LunarPanelWebsiteViewProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!selectedCompany || !containerRef.current) return;

    const firstCompany = companies[0]?.company;
    if (selectedCompany.toLowerCase() === firstCompany?.toLowerCase()) {
      // Scroll to top
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Find the card element and scroll it into view
      const targetElement = containerRef.current.querySelector(
        `[data-company="${selectedCompany.toLowerCase()}"]`
      );
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedCompany, companies]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: isMobile ? "100%" : "341px",
        flexGrow: 1,
        overflowY: "auto",
        boxSizing: "border-box",
      }}
      className="scrollbar-hide [&::-webkit-scrollbar]:hidden pb-4"
    >
      {companies.map((item) => (
        <div
          key={item.id}
          data-company={item.company.toLowerCase()}
          style={{ width: isMobile ? "100%" : "341px", flexShrink: 0 }}
        >
          <CompanyCard
            id={item.id}
            company={item.company}
            isSelected={selectedCompany?.toLowerCase() === item.company.toLowerCase()}
          />
        </div>
      ))}
    </div>
  );
}
