"use client";

import React from "react";
import LunarPanelHeader from "./LunarPanelHeader";
import LunarPanelGraphView from "./graph-view/LunarPanelGraphView";
import LunarPanelChartView from "./chart-view/LunarPanelChartView";
import LunarPanelWebsiteView from "./website-view/LunarPanelWebsiteView";
import LunarPanelJobListView from "./job-list-view/LunarPanelJobListView";
import HistoryPanel from "./history-panel/HistoryPanel";
import html2canvas from "html2canvas";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";

export type LunarPanelMode =
  | "graph"
  | "website"
  | "pie"
  | "history"
  | "jobs"
  | "notion"
  | "job-list";

interface LunarPanelProps {
  mode?: LunarPanelMode;
  onClose: () => void;
  onShare: () => void;
  title?: string;
  selectedCompany?: string;
  companies?: Array<{ id: number; company: string }>;
  onSelectHistoryItem?: () => void;
}

export default function LunarPanel({
  mode = "graph",
  onClose,
  onShare,
  title = "Revenue Analysis",
  selectedCompany,
  companies,
  onSelectHistoryItem,
}: LunarPanelProps) {
  const isMobile = useIsMobile();
  const { theme, resolvedTheme } = useTheme();

  const handleDownload = async () => {
    const element = document.getElementById("lunar-panel-download-target");
    if (!element) return;
    try {
      const bgColor = resolvedTheme === "dark" || theme === "dark"
        ? "#0B0F19"
        : (resolvedTheme === "navy" || theme === "navy" ? "#171c28" : "#FFFFFF");
      const canvas = await html2canvas(element, {
        backgroundColor: bgColor,
        useCORS: true,
        scale: 2,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      link.download = `${safeTitle || "lunar"}-graph.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error exporting graph to PNG:", error);
    }
  };

  const renderContent = () => {
    switch (mode) {
      case "graph":
        return <LunarPanelGraphView />;
      case "website":
        return (
          <LunarPanelWebsiteView
            selectedCompany={selectedCompany}
            companies={companies}
          />
        );
      case "job-list":
        return <LunarPanelJobListView />;
      case "pie":
        return <LunarPanelChartView />;
      case "history":
        return <HistoryPanel onClose={onClose} onShare={onShare} onSelectHistoryItem={onSelectHistoryItem} />;
      case "jobs":
      case "notion":
        return (
          <div className="box-border w-[276px] flex-1 min-h-0 flex flex-col items-center justify-center gap-3 bg-[var(--background)] rounded-xl border border-dashed border-[var(--border)] font-sans text-center text-[var(--muted-foreground)] p-6">
            <h3 className="text-[16px] font-semibold text-[var(--foreground)] m-0">
              {mode.charAt(0).toUpperCase() + mode.slice(1)} View
            </h3>
            <p className="text-[12px] text-[var(--muted-foreground)] m-0 leading-[1.5]">
              This view is currently under development. Fully supported interface structures will be added in a future update.
            </p>
          </div>
        );
      default:
        return <LunarPanelGraphView />;
    }
  };

  return (
    <div
      className={`box-border flex flex-col items-end h-full border border-[var(--border)] bg-[var(--card)] drop-shadow-[var(--card-shadow-inner)] ${
        isMobile ? "rounded-t-[24px] rounded-b-none border-x-0 border-b-0" : "rounded-[24px]"
      }`}
      style={{
        padding: mode === "history" ? "16px 8px" : "16px",
        gap: "10px",
        width: isMobile ? "100%" : mode === "job-list" ? "459px" : mode === "history" ? "300px" : (mode === "graph" || mode === "pie") ? "308px" : "373px",
      }}
    >
      <LunarPanelHeader
        onShare={onShare}
        onDownload={handleDownload}
        onClose={onClose}
        mode={mode}
      />
      {renderContent()}

      {/* Hidden container for exporting all graphs/charts at high quality & full width */}
      <div 
        id="lunar-panel-download-target" 
        className="absolute -left-[9999px] -top-[9999px] w-[800px] bg-[var(--background)] p-6 flex flex-col gap-6"
      >
        <div className="flex justify-between items-center w-full pb-4 border-b border-[var(--border)] mb-2">
          <h2 className="m-0 font-medium text-[20px] leading-[30px] bg-[var(--gradient-primary)] bg-clip-text text-transparent font-sans">
            {title} - Lunar Panel Reports
          </h2>
          <span className="text-[12px] text-[var(--muted-foreground)] font-sans">Exported on {new Date().toLocaleDateString()}</span>
        </div>
        {mode === "pie" ? (
          <LunarPanelChartView isDownload={true} />
        ) : (
          <LunarPanelGraphView isDownload={true} />
        )}
      </div>
    </div>
  );
}
