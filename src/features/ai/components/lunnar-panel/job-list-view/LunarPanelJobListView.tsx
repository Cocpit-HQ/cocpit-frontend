"use client";

import React from "react";
import jobsData from "./jobs.mock.json";
import JobCard from "../../cards/JobCard";
import { useIsMobile } from "@/hooks/use-mobile";

export default function LunarPanelJobListView() {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: isMobile ? "100%" : "427px",
        flexGrow: 1,
        minHeight: 0,
        overflowY: "auto",
        boxSizing: "border-box",
      }}
      className="scrollbar-hide [&::-webkit-scrollbar]:hidden pb-4"
    >
      {jobsData.map((job) => (
        <div key={job.id} style={{ width: "100%", flexShrink: 0 }}>
          <JobCard job={job} />
        </div>
      ))}
    </div>
  );
}
