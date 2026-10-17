"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Job {
  id: string;
  role: string;
  company: string;
  experience: string;
  location: string;
  description: string;
  skills: string[];
  aiInsight: string;
  postedAt: string;
}

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const isMobile = useIsMobile();
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "16px",
        gap: "12px",
        width: "100%",
        maxWidth: "427px",
        height: isMobile ? "auto" : "266px",
        minHeight: isMobile ? "266px" : undefined,
        background: "var(--background)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow-inner)",
        borderRadius: "24px",
        boxSizing: "border-box",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* 1. Job Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Left Content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <h3
            style={{
              fontWeight: 500,
              fontSize: "16px",
              lineHeight: "24px",
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            {job.role}
          </h3>
          <span
            style={{
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "20px",
              color: "var(--muted-foreground)",
              marginTop: "2px",
            }}
          >
            {job.company}
          </span>
        </div>

        {/* Right Icon Pill */}
        <div
          style={{
            background: "var(--primary-tint)",
            borderRadius: "24px",
            padding: "8px 16px",
            width: "56px",
            height: "40px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ position: "relative", width: "24px", height: "24px" }}>
            <Icon
              icon="hugeicons:job-search"
              style={{
                color: "var(--primary)",
                position: "absolute",
                left: "8.33%",
                right: "8.33%",
                top: "8.33%",
                bottom: "8.33%",
                width: "auto",
                height: "auto",
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Experience + Location Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Icon icon="solar:case-linear" width={18} height={18} style={{ color: "var(--foreground)", flexShrink: 0 }} />
        <span
          style={{
            fontSize: "14px",
            color: "var(--foreground)",
            fontFamily: "Poppins",
            whiteSpace: "nowrap",
          }}
        >
          {job.experience}
        </span>
        <div
          style={{
            width: "6px",
            height: "6px",
            backgroundColor: "var(--foreground)",
            borderRadius: "50%",
            flexShrink: 0,
          }}
        />
        <Icon icon="ph:map-pin" width={18} height={18} style={{ color: "var(--foreground)", flexShrink: 0 }} />
        <span
          style={{
            fontSize: "14px",
            color: "var(--foreground)",
            fontFamily: "Poppins",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          {job.location}
        </span>
      </div>

      {/* 3. Description Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Icon icon="solar:document-text-linear" width={18} height={18} style={{ color: "var(--foreground)", flexShrink: 0 }} />
        <p
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            color: "var(--muted-foreground)",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          {job.description}
        </p>
      </div>

      {/* 4. Skills Row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          boxSizing: "border-box",
          flexWrap: "wrap",
        }}
      >
        {job.skills.map((skill, index) => (
          <React.Fragment key={skill}>
            {index > 0 && (
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  backgroundColor: "var(--muted-foreground)",
                  borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontSize: "12px",
                lineHeight: "16px",
                color: "var(--muted-foreground)",
                fontFamily: "Poppins",
              }}
            >
              {skill}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* 5. AI Insight Banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "4px 8px",
          gap: "8px",
          background: "var(--primary-tint)",
          borderRadius: "12px",
          boxSizing: "border-box",
          maxWidth: "100%",
        }}
      >
        <img
          src="/assets/AI 2.svg"
          alt="AI sparkle icon"
          style={{
            width: "14px",
            height: "14px",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "12px",
            lineHeight: "16px",
            color: "var(--primary)",
            fontFamily: "Poppins",
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {job.aiInsight}
        </span>
      </div>

      {/* 6. Footer Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          boxSizing: "border-box",
          marginTop: "auto",
        }}
      >
        {/* Left Side Posted Time */}
        <span
          style={{
            fontSize: "12px",
            lineHeight: "16px",
            color: "var(--muted-foreground)",
            fontFamily: "Poppins",
            }}
        >
          {job.postedAt}
        </span>

        {/* Right Side Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Apply Button */}
          <button
            type="button"
            style={{
              background: "var(--primary)",
              border: "1px solid var(--background)",
              borderRadius: "24px",
              width: "120px",
              height: "40px",
              color: "var(--primary-foreground)",
              fontSize: "14px",
              lineHeight: "20px",
              fontFamily: "Poppins",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => alert(`Applying for ${job.role} at ${job.company}`)}
          >
            Apply
          </button>

          {/* Save Icon */}
          <button
            type="button"
            onClick={() => setIsSaved(!isSaved)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
            title={isSaved ? "Saved" : "Save Job"}
          >
            <Icon
              icon={isSaved ? "solar:bookmark-bold" : "solar:bookmark-linear"}
              width={24}
              height={24}
              style={{ color: isSaved ? "var(--primary)" : "var(--muted-foreground)" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
