"use client"

import React from "react";
import { Poppins } from "next/font/google";
import { useAIChat, isJobRelatedQuery } from "../hooks/use-ai-chat";
import type { AIAttachment } from "../types/ai.types";
import AIChatHeader from "../components/ui/AIChatHeader";
import AIChatInput from "../components/ui/AIChatInput";
import AIEmptyState from "../components/ui/AIEmptyState";
import AILoadingState from "../components/ui/AILoadingState";
import AIErrorState from "../components/ui/AIErrorState";
import AIMessageList from "../components/ui/AIMessageList";
import { Icon } from "@iconify/react";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import MoreInfoPanel from "../components/ui/MoreInfoPanel";
import LunarPanel, { LunarPanelMode } from "../components/lunnar-panel/LunarPanel";
import ProjectScreen from "../project/ProjectScreen";
import type { Project } from "../project/project.types";

interface WebsiteResult {
  id: number;
  company: string;
}

function getWebsiteResultsFromMessage(content: string): WebsiteResult[] {
  const lower = content.toLowerCase();
  const websiteKeywords = [
    "website",
    "websites",
    "competitors",
    "reference sites",
    "similar products",
    "examples",
    "inspiration",
    "saas examples",
    "product examples",
    "landing pages",
  ];
  const isWebsiteRelated = websiteKeywords.some((kw) => lower.includes(kw));
  if (!isWebsiteRelated) return [];

  let count = 2; // Default
  const match = lower.match(/(\d+)\s*compan/);
  if (match) {
    count = parseInt(match[1], 10);
  } else {
    if (lower.includes("one compan")) count = 1;
    else if (lower.includes("two compan")) count = 2;
    else if (lower.includes("three compan")) count = 3;
    else if (lower.includes("four compan")) count = 4;
    else if (lower.includes("five compan")) count = 5;
  }

  const companiesList = ["Notion", "Cursor", "Linear", "Figma", "Slack"];
  const results: WebsiteResult[] = [];
  for (let i = 0; i < count; i++) {
    results.push({
      id: i + 1,
      company: companiesList[i % companiesList.length],
    });
  }
  return results;
}

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500"] });

const shouldShowMoreInfoPanel = (message: string): boolean => {
  const lowerMsg = message.toLowerCase();
  
  // If query is website related, do not show more info panel
  const websiteKeywords = [
    "website",
    "websites",
    "competitors",
    "reference sites",
    "similar products",
    "examples",
    "inspiration",
    "saas examples",
    "product examples",
    "landing pages",
  ];
  if (websiteKeywords.some(kw => lowerMsg.includes(kw))) {
    return false;
  }

  const keywords = [
    "app",
    "build app",
    "create app",
    "develop app",
    "mobile app",
    "dashboard",
    "product design",
    "software",
    "platform"
  ];
  return keywords.some(keyword => lowerMsg.includes(keyword));
};

export default function AIChatPage() {
  const {
    messages,
    uiState,
    isLoading,
    isStreaming,
    error,
    streamingMessageId,
    suggestions,
    sendMessage,
    clearChat,
    stopStreaming,
    retryLastMessage,
    setUIState,
    editMessage,
    loadMockConversation,
  } = useAIChat();

  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [isNewChatHovered, setIsNewChatHovered] = React.useState(false);
  const [isNewChatClicked, setIsNewChatClicked] = React.useState(false);
  const [showMoreInfo, setShowMoreInfo] = React.useState(false);
  const [isLunarPanelOpen, setIsLunarPanelOpen] = React.useState(false);
  const [activeGraphTitle, setActiveGraphTitle] = React.useState("Revenue Analysis");
  const [lunarPanelMode, setLunarPanelMode] = React.useState<LunarPanelMode>("graph");
  const [selectedCompany, setSelectedCompany] = React.useState<string | undefined>(undefined);
  const [websiteCompanies, setWebsiteCompanies] = React.useState<Array<{ id: number; company: string }> | undefined>(undefined);
  const [isProjectOpen, setIsProjectOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);

  const updateProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
  };


  const lastProcessedMsgIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage.role === "assistant" &&
      lastMessage.status === "done" &&
      lastMessage.id !== lastProcessedMsgIdRef.current
    ) {
      lastProcessedMsgIdRef.current = lastMessage.id;
      
      const index = messages.indexOf(lastMessage);
      const userMsg = index !== -1
        ? messages.slice(0, index).reverse().find((m) => m.role === "user")
        : null;

      if (userMsg) {
        if (isJobRelatedQuery(userMsg.content)) {
          setIsLunarPanelOpen(true);
          setLunarPanelMode("job-list");
        } else {
          const results = getWebsiteResultsFromMessage(userMsg.content);
          if (results.length > 0) {
            setIsLunarPanelOpen(true);
            setLunarPanelMode("website");
            setSelectedCompany(results[0].company);
            setWebsiteCompanies(results);
          }
        }
      }
    }
  }, [messages]);

  const getDynamicTitle = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    if (lower.includes("business") || lower.includes("idea")) {
      return "Business Ideas Report";
    }
    if (lower.includes("revenue") || lower.includes("sale") || lower.includes("finance") || lower.includes("money")) {
      return "Revenue Analysis";
    }
    if (lower.includes("growth") || lower.includes("trend")) {
      return "Growth Trends";
    }
    if (lower.includes("market") || lower.includes("insight")) {
      return "Market Insights";
    }
    if (lower.includes("analytics")) return "Analytics Report";
    if (lower.includes("chart")) return "Chart Analytics";
    if (lower.includes("statistics")) return "Statistical Analysis";
    if (lower.includes("metrics")) return "Metrics Overview";
    if (lower.includes("report")) return "Data Report";
    return "Data Visualization";
  };

  const handleNewChatClick = () => {
    setIsNewChatClicked(true);
    setTimeout(() => {
      setIsNewChatClicked(false);
      handleClearChat();
    }, 150);
  };

  const handleSendMessage = (content: string, attachments?: AIAttachment[], isFromSuggestionPanel = false) => {
    sendMessage(content, attachments);
    if (!isFromSuggestionPanel && shouldShowMoreInfoPanel(content)) {
      setShowMoreInfo(true);
    } else {
      setShowMoreInfo(false);
    }

    const keywords = [
      "graph",
      "chart",
      "analytics",
      "analysis",
      "trend",
      "growth",
      "statistics",
      "report",
      "data visualization",
      "metrics"
    ];
    const websiteKeywords = [
      "website",
      "websites",
      "competitors",
      "reference sites",
      "similar products",
      "examples",
      "inspiration",
      "saas examples",
      "product examples",
      "landing pages"
    ];
    const lowerContent = content.toLowerCase();
    if (keywords.some(kw => lowerContent.includes(kw))) {
      setIsLunarPanelOpen(true);
      setActiveGraphTitle(getDynamicTitle(content));
      setLunarPanelMode(lowerContent.includes("chart") ? "pie" : "graph");
    }
  };

  const handleSuggestionClick = (prompt: string, attachments?: AIAttachment[]) => {
    setUIState("streaming");
    sendMessage(prompt, attachments);
    if (shouldShowMoreInfoPanel(prompt)) {
      setShowMoreInfo(true);
    } else {
      setShowMoreInfo(false);
    }

    const keywords = [
      "graph",
      "chart",
      "analytics",
      "analysis",
      "trend",
      "growth",
      "statistics",
      "report",
      "data visualization",
      "metrics"
    ];
    const websiteKeywords = [
      "website",
      "websites",
      "competitors",
      "reference sites",
      "similar products",
      "examples",
      "inspiration",
      "saas examples",
      "product examples",
      "landing pages"
    ];
    const lowerPrompt = prompt.toLowerCase();
    if (keywords.some(kw => lowerPrompt.includes(kw))) {
      setIsLunarPanelOpen(true);
      setActiveGraphTitle(getDynamicTitle(prompt));
      setLunarPanelMode(lowerPrompt.includes("chart") ? "pie" : "graph");
    }
  };

  const handleClearChat = () => {
    clearChat();
    setShowMoreInfo(false);
    setIsLunarPanelOpen(false);
  };

  const handleRetry = () => {
    retryLastMessage();
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      handleSendMessage(lastUser.content);
    }
  };

  const isInputDisabled = isLoading || isStreaming;
  const isInEmptyState = uiState === "empty" || uiState === "empty_with_suggestions";
  const inputPlaceholder = isStreaming ? "AI is typing..." : "Ask me, I'm ready";

  const renderContent = () => {
    switch (uiState) {
      case "empty":
      case "empty_with_suggestions":
        return (
          <AIEmptyState
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            isLoading={isInputDisabled}
            onOpenHistory={() => {
              if (isLunarPanelOpen && lunarPanelMode === "history") {
                setIsLunarPanelOpen(false);
              } else {
                setIsLunarPanelOpen(true);
                setLunarPanelMode("history");
              }
            }}
            isHistoryOpen={isLunarPanelOpen && lunarPanelMode === "history"}
            onOpenProject={() => setIsProjectOpen(true)}
          />
        );

      case "loading":
        return <AILoadingState />;

      case "error":
        return (
          <AIMessageList
            messages={messages}
            streamingMessageId={streamingMessageId}
            isStreaming={isStreaming}
            onEditMessage={editMessage}
            onOpenLunarPanel={(title, mode, selectedComp, comps) => {
              setIsLunarPanelOpen(true);
              setActiveGraphTitle(title);
              setLunarPanelMode((mode as LunarPanelMode) || "graph");
              if (mode === "website") {
                setSelectedCompany(selectedComp);
                setWebsiteCompanies(comps);
              }
            }}
            error={error}
            onSend={handleSendMessage}
            activeLunarMode={isLunarPanelOpen ? lunarPanelMode : undefined}
          />
        );


      case "streaming":
      case "active":
        return (
          <AIMessageList
            messages={messages}
            streamingMessageId={streamingMessageId}
            isStreaming={isStreaming}
            onEditMessage={editMessage}
            onOpenLunarPanel={(title, mode, selectedComp, comps) => {
              setIsLunarPanelOpen(true);
              setActiveGraphTitle(title);
              setLunarPanelMode((mode as LunarPanelMode) || "graph");
              if (mode === "website") {
                setSelectedCompany(selectedComp);
                setWebsiteCompanies(comps);
              }
            }}
            error={error}
            onSend={handleSendMessage}
            activeLunarMode={isLunarPanelOpen ? lunarPanelMode : undefined}
          />
        );

      default:
        return (
          <AIEmptyState
            suggestions={suggestions}
            onSuggestionClick={handleSuggestionClick}
            isLoading={isInputDisabled}
            onOpenProject={() => setIsProjectOpen(true)}
          />
        );
    }
  };

  return (
    <div
      className={`${poppins.className} w-full h-full min-h-full bg-white box-border ${
        isLunarPanelOpen ? "static" : "relative"
      }`}
    >
      <div
        className={`transition-all duration-300 ${
          isLunarPanelOpen
            ? "flex flex-row justify-center items-start p-4 px-6 gap-4 absolute w-[1237px] bottom-6 left-[calc(50%-1237px/2+118px)] top-[80px] bg-white box-border"
            : "flex flex-col flex-grow min-h-0 h-full w-full max-w-[912px] mx-auto bg-white box-border py-6 px-0"
        }`}
      >
        {/* Message Panel Frame (Frame 2608939) */}
        <div
          className={`transition-all duration-300 ${
            isLunarPanelOpen
              ? lunarPanelMode === "job-list"
                ? "flex flex-col items-start p-0 gap-2 w-[714px] h-full flex-none order-0 self-stretch flex-grow box-border min-h-0"
                : lunarPanelMode === "history"
                ? "flex flex-col items-start p-0 gap-2 w-[873px] h-full flex-none order-0 self-stretch flex-grow box-border min-h-0"
                : "flex flex-col items-start p-0 gap-2 w-[800px] h-full flex-none order-0 self-stretch flex-grow box-border min-h-0"
              : "flex flex-col flex-1 min-h-0 h-full w-full box-border"
          }`}
        >
          {isProjectOpen ? (
            <ProjectScreen
              onClose={() => setIsProjectOpen(false)}
              projects={projects}
              onUpdateProjects={updateProjects}
            />
          ) : (
            <>
              {!isInEmptyState && (
                <div className="flex justify-between items-center w-full max-w-[912px] h-10 p-0 box-border grow-0 self-stretch">
                  {/* LEFT SIDE: Fullscreen button */}
                  <button
                    type="button"
                    className="flex flex-row items-center p-2 gap-[10px] w-10 h-10 bg-white rounded-[24px] border-none cursor-pointer hover:bg-[#F9FAFB] transition-all duration-200"
                  >
                    <Icon icon="mingcute:fullscreen-line" width="24" height="24" className="text-black" />
                  </button>

                  {/* RIGHT SIDE ICONS: actions row */}
                  <div className="flex flex-row items-center gap-2">
                    {/* Share Icon */}
                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center justify-center w-10 h-10 p-2 rounded-[24px] bg-white border-none cursor-pointer shadow-[0_0_4px_rgba(99,102,241,0.05)] hover:bg-[#F9FAFB] transition-all duration-200"
                      title="Share"
                    >
                      <Icon icon="fluent:share-28-regular" width={24} height={24} className="text-black" />
                    </button>

                    {/* History Icon */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isLunarPanelOpen && lunarPanelMode === "history") {
                          setIsLunarPanelOpen(false);
                        } else {
                          setIsLunarPanelOpen(true);
                          setLunarPanelMode("history");
                        }
                      }}
                      className={`flex items-center justify-center w-10 h-10 p-2 rounded-[24px] bg-white border-none cursor-pointer shadow-[0_0_4px_rgba(99,102,241,0.05)] hover:bg-[#F9FAFB] transition-all duration-200 ${
                        isLunarPanelOpen && lunarPanelMode === "history" ? "bg-[#EEF2FF] text-[#6366F1]" : "text-black"
                      }`}
                      title="History"
                    >
                      <Icon
                        icon="carbon:recently-viewed"
                        width={24}
                        height={24}
                        className={isLunarPanelOpen && lunarPanelMode === "history" ? "text-[#6366F1]" : "text-black"}
                      />
                    </button>

                    {/* Project Icon */}
                    <button
                      type="button"
                      onClick={() => setIsProjectOpen(true)}
                      className="flex items-center justify-center w-10 h-10 p-2 rounded-[24px] bg-white border-none cursor-pointer shadow-[0_0_4px_rgba(99,102,241,0.05)] hover:bg-[#F9FAFB] transition-all duration-200"
                      title="Project"
                    >
                      <Icon icon="codicon:github-project" width={24} height={24} className="text-black" />
                    </button>

                    {/* Special New Chat Button */}
                    <button
                      type="button"
                      onClick={handleNewChatClick}
                      onMouseEnter={() => setIsNewChatHovered(true)}
                      onMouseLeave={() => setIsNewChatHovered(false)}
                      className={`flex items-center justify-center w-10 h-10 p-2 rounded-xl border-none cursor-pointer transition-all duration-200 ${
                        isNewChatHovered || isNewChatClicked ? "bg-[#EEF2FF]" : "bg-transparent"
                      }`}
                      title="New Chat"
                    >
                      <Icon
                        icon="iconoir:chat-plus-in"
                        width={24}
                        height={24}
                        className={(isNewChatHovered || isNewChatClicked) ? "text-[#6366F1]" : "text-black"}
                      />
                    </button>
                  </div>
                </div>
              )}

              <div className={`flex-1 min-h-0 flex flex-col w-full max-w-[912px] scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
                isInEmptyState ? "overflow-y-hidden" : "overflow-y-auto"
              }`}>
                {renderContent()}
              </div>

              {!isInEmptyState && showMoreInfo && (
                <div className="w-full flex justify-center -mb-2">
                  <MoreInfoPanel
                    onClose={() => setShowMoreInfo(false)}
                    onSend={(content) => handleSendMessage(content, undefined, true)}
                  />
                </div>
              )}

              {!isInEmptyState && (
                <AIChatInput
                  onSend={handleSendMessage}
                  disabled={isInputDisabled}
                  placeholder={inputPlaceholder}
                  isEmptyState={false}
                  isStreaming={isStreaming || isLoading}
                  onStop={stopStreaming}
                />
              )}
            </>
          )}
        </div>

        {/* Lunar Panel Frame (Frame 2608940) */}
        {isLunarPanelOpen && (
          <LunarPanel
            mode={lunarPanelMode}
            onClose={() => setIsLunarPanelOpen(false)}
            onShare={() => setIsShareModalOpen(true)}
            title={activeGraphTitle}
            selectedCompany={selectedCompany}
            companies={websiteCompanies}
            onSelectHistoryItem={loadMockConversation}
          />
        )}
      </div>

      <CocpitShareModel
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
