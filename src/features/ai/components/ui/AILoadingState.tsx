"use client"

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AILoadingState() {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col w-full px-6 py-4">
      {/* Frame 2608649 */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          padding: "0px",
          gap: "10px",
          width: isMobile ? "100%" : "912px",
          maxWidth: "100%",
          height: "24px",
          background: "#FFFFFF",
          borderRadius: "12px 12px 12px 0px",
          boxSizing: "border-box",
        }}
      >
        {/* Thinking... Text */}
        <div
          style={{
            width: isMobile ? "100%" : "912px",
            maxWidth: "100%",
            height: "24px",
            fontFamily: "Poppins",
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: "24px",
            display: "flex",
            alignItems: "center",
            color: "#6B7280",
            boxSizing: "border-box",
            flexGrow: 1,
          }}
        >
          Thinking...
        </div>
      </div>
    </div>
  );
}