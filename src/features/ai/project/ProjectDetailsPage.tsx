"use client";

import React, { useState } from "react";
import ProjectHeader from "./ProjectHeader";
import ProjectSidebar from "./ProjectSidebar";
import AIEmptyState from "../components/ui/AIEmptyState";
import AIMessageList from "../components/ui/AIMessageList";
import AIChatInput from "../components/ui/AIChatInput";
import type { AIMessage, AIAttachment } from "../types/ai.types";
import type { ProjectChat, Project } from "./project.types";
import ActiveProjectChatHeader from "./ActiveProjectChatHeader";
import RenameChatDialog from "./RenameChatDialog";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";

interface ProjectDetailsPageProps {
  projectName: string;
  onClose: () => void;
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
}

// 4 Initial dummy chats as per Figma requirements
export const initialChatsData = (projectName: string): ProjectChat[] => [
  {
    id: "1",
    title: "Greetings",
    lastMessageTime: "Last message 2 minutes ago",
    isPinned: false,
    projectId: "1",
    messages: [
      {
        id: "msg-1-1",
        role: "user",
        content: "Greetings",
        status: "done",
        createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
      },
      {
        id: "msg-1-2",
        role: "assistant",
        content: "Hello! Welcome to the AI Research Architecture project. How can I help you design your system today?",
        status: "done",
        createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
      },
      {
        id: "msg-1-3",
        role: "user",
        content: "Help me with m new project",
        status: "done",
        createdAt: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: "msg-1-4",
        role: "assistant",
        content: "Yes, I'd love to help with your project. Before we begin, I need a bit more information so I can provide accurate and valuable answers.",
        status: "done",
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "2",
    title: "Architecture Discussion",
    lastMessageTime: "Last message 1 hour ago",
    isPinned: false,
    projectId: "1",
    messages: [
      {
        id: "msg-2-1",
        role: "user",
        content: "How should we structure our microservices?",
        status: "done",
        createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
      },
      {
        id: "msg-2-2",
        role: "assistant",
        content: "We should organize microservices by business capabilities, keeping database-per-service patterns, and using an API gateway for client communication.",
        status: "done",
        createdAt: new Date(Date.now() - 59 * 60000).toISOString(),
      },
    ],
  },
  {
    id: "3",
    title: "API Planning",
    lastMessageTime: "Last message 3 hours ago",
    isPinned: false,
    projectId: "1",
    messages: [
      {
        id: "msg-3-1",
        role: "user",
        content: "Let's define the REST endpoints for user authentication.",
        status: "done",
        createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
      },
      {
        id: "msg-3-2",
        role: "assistant",
        content: "Sure! We need `/auth/login`, `/auth/register`, `/auth/refresh-token`, and `/auth/logout`. I recommend using JWTs stored in secure, httpOnly cookies.",
        status: "done",
        createdAt: new Date(Date.now() - 179 * 60000).toISOString(),
      },
    ],
  },
  {
    id: "4",
    title: "UI Review",
    lastMessageTime: "Last message 1 day ago",
    isPinned: false,
    projectId: "1",
    messages: [
      {
        id: "msg-4-1",
        role: "user",
        content: "Can you review the mockup for the dashboard?",
        status: "done",
        createdAt: new Date(Date.now() - 1440 * 60000).toISOString(),
      },
      {
        id: "msg-4-2",
        role: "assistant",
        content: "The dashboard mockup looks clean! I suggest increasing contrast for key action items and adding hover states for list cards.",
        status: "done",
        createdAt: new Date(Date.now() - 1439 * 60000).toISOString(),
      },
    ],
  },
];

export default function ProjectDetailsPage({
  projectName,
  onClose,
  projects,
  onUpdateProjects,
}: ProjectDetailsPageProps) {
  const project = projects.find((p) => p.name === projectName);
  const chats = project?.chats || [];

  // Local active chat ID state: always start in empty state when opening project
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  // Dialog State
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);

  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [removeChatId, setRemoveChatId] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);

  const [isShareOpen, setIsShareOpen] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Keep refs to avoid stale closures in timeouts
  const chatsRef = React.useRef(chats);
  chatsRef.current = chats;

  const updateChats = (newChats: ProjectChat[]) => {
    const updatedProjects = projects.map((p) => {
      if (p.name === projectName) {
        return {
          ...p,
          chats: newChats,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    onUpdateProjects(updatedProjects);
  };

  // Handles sending message to the active chat
  const handleSendMessage = (content: string, attachments?: AIAttachment[]) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    if (!activeChatId) {
      handleCreateNewChat(content, attachments);
      return;
    }

    // Create user message
    const userMsgId = Date.now().toString();
    const userMessage: AIMessage = {
      id: userMsgId,
      role: "user",
      content: content.trim(),
      status: "done",
      createdAt: new Date().toISOString(),
      attachments,
    };

    const currentChats = chatsRef.current;
    const updatedChats = currentChats.map((c) => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMessageTime: "Last message just now",
          messages: [...c.messages, userMessage],
        };
      }
      return c;
    });
    updateChats(updatedChats);

    setIsLoading(true);

    // Mock response
    setTimeout(() => {
      setIsLoading(false);
      setIsStreaming(true);
      const assistantMsgId = (Date.now() + 1).toString();
      setStreamingMessageId(assistantMsgId);

      const assistantMessage: AIMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: `I've received your query: "${content}". This is a mock response from Cyphex for the project "${projectName}".`,
        status: "done",
        createdAt: new Date().toISOString(),
      };

      const latestChats = chatsRef.current.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            messages: [...c.messages, assistantMessage],
          };
        }
        return c;
      });
      updateChats(latestChats);
      setIsStreaming(false);
      setStreamingMessageId(null);
    }, 1000);
  };

  // Handles creating a new chat (from Left Panel "Ask anything" input or empty state click)
  const handleCreateNewChat = (query: string, attachments?: AIAttachment[]) => {
    const newChatId = Date.now().toString();
    const newChat: ProjectChat = {
      id: newChatId,
      title: query.substring(0, 30) || "New Chat",
      lastMessageTime: "Last message just now",
      isPinned: false,
      projectId: "1",
      messages: [
        {
          id: Date.now().toString(),
          role: "user",
          content: query,
          status: "done",
          createdAt: new Date().toISOString(),
          attachments,
        },
      ],
    };

    const currentChats = chatsRef.current;
    updateChats([newChat, ...currentChats]);
    setActiveChatId(newChatId);
    setIsLoading(true);

    // Mock response
    setTimeout(() => {
      setIsLoading(false);
      setIsStreaming(true);
      const assistantMsgId = (Date.now() + 1).toString();
      setStreamingMessageId(assistantMsgId);

      const assistantMessage: AIMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: `I've received your query: "${query}". This is a mock response from Cyphex for the project "${projectName}".`,
        status: "done",
        createdAt: new Date().toISOString(),
      };

      const latestChats = chatsRef.current.map((c) => {
        if (c.id === newChatId) {
          return {
            ...c,
            messages: [...c.messages, assistantMessage],
          };
        }
        return c;
      });
      updateChats(latestChats);
      setIsStreaming(false);
      setStreamingMessageId(null);
    }, 1000);
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!activeChatId) return;
    const updatedChats = chats.map((c) => {
      if (c.id === activeChatId) {
        return {
          ...c,
          messages: c.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content: newContent } : msg
          ),
        };
      }
      return c;
    });
    updateChats(updatedChats);
  };

  // Chat Actions
  const handleRenameChat = (newName: string) => {
    if (renameChatId) {
      const updatedChats = chats.map((c) => (c.id === renameChatId ? { ...c, title: newName } : c));
      updateChats(updatedChats);
    }
  };

  const handleTogglePinChat = (id: string) => {
    const updatedChats = chats.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c));
    updateChats(updatedChats);
  };

  const handleConfirmRemove = () => {
    if (removeChatId) {
      const remaining = chats.filter((c) => c.id !== removeChatId);
      updateChats(remaining);
      if (activeChatId === removeChatId) {
        if (remaining.length > 0) {
          const sorted = [...remaining].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
          });
          setActiveChatId(sorted[0].id);
        } else {
          setActiveChatId(null);
        }
      }
      setRemoveChatId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteChatId) {
      const remaining = chats.filter((c) => c.id !== deleteChatId);
      updateChats(remaining);
      if (activeChatId === deleteChatId) {
        if (remaining.length > 0) {
          const sorted = [...remaining].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
          });
          setActiveChatId(sorted[0].id);
        } else {
          setActiveChatId(null);
        }
      }
      setDeleteChatId(null);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        right: "20px",
        height: "calc(100% - 20px)",
        boxSizing: "border-box",
      }}
      className="project-details-outer-container w-[calc(100%-40px)] h-full"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          padding: "16px",
          gap: "16px",
          background: "#FFFFFF",
          width: "100%",
          height: "100%",
          borderRadius: "24px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
        className="project-details-container"
      >
        {/* Header Section */}
        <ProjectHeader
          variant="details"
          title={projectName}
          onClose={onClose}
        />

        {/* Main Content Section */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            width: "100%",
            flexGrow: 1,
            minHeight: 0,
          }}
          className="flex-col lg:flex-row"
        >
          {/* Left Panel / Sidebar */}
          <ProjectSidebar
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={setActiveChatId}
            onRenameChat={(id) => {
              setRenameChatId(id);
              setIsRenameOpen(true);
            }}
            onTogglePinChat={handleTogglePinChat}
            onRemoveChat={(id) => {
              setRemoveChatId(id);
              setIsRemoveOpen(true);
            }}
            onShareChat={(id) => {
              setIsShareOpen(true);
            }}
            onDeleteChat={(id) => {
              setDeleteChatId(id);
              setIsDeleteOpen(true);
            }}
            onSearch={handleCreateNewChat}
            instructions={project?.instructions || ""}
            onSaveInstructions={(newInstructions) => {
              const updatedProjects = projects.map((p) => {
                if (p.name === projectName) {
                  return {
                    ...p,
                    instructions: newInstructions,
                    updatedAt: new Date().toISOString(),
                  };
                }
                return p;
              });
              onUpdateProjects(updatedProjects);
            }}
          />

          {/* Right Content Panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              background: "#FFFFFF",
              borderRadius: "24px",
              boxSizing: "border-box",
              overflow: "hidden",
              height: "100%",
              position: "relative",
            }}
            className="flex-1 min-w-0"
          >
            {!activeChat ? (
              <AIEmptyState
                suggestions={[]}
                onSuggestionClick={handleCreateNewChat}
                isLoading={isLoading || isStreaming}
                hideHeaderActions={true}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  width: "100%",
                  boxSizing: "border-box",
                  justifyContent: "space-between",
                  overflow: "hidden",
                }}
              >
                {/* Active Chat Header */}
                <ActiveProjectChatHeader
                  chatTitle={activeChat.title}
                  projectName={projectName}
                  isPinned={activeChat.isPinned}
                  onRename={() => {
                    setRenameChatId(activeChat.id);
                    setIsRenameOpen(true);
                  }}
                  onTogglePin={() => handleTogglePinChat(activeChat.id)}
                  onRemoveFromProject={() => {
                    setRemoveChatId(activeChat.id);
                    setIsRemoveOpen(true);
                  }}
                  onShare={() => setIsShareOpen(true)}
                  onDelete={() => {
                    setDeleteChatId(activeChat.id);
                    setIsDeleteOpen(true);
                  }}
                />

                {/* Message List */}
                <div style={{ flexGrow: 1, overflowY: "auto", minHeight: 0, padding: "16px", marginBottom: "0px" }}>
                  <AIMessageList
                    messages={activeChat.messages}
                    streamingMessageId={streamingMessageId}
                    isStreaming={isStreaming}
                    onEditMessage={handleEditMessage}
                    error={null}
                  />
                </div>

                {/* Input Area */}
                <div style={{ padding: "0 16px 16px 16px" }}>
                  <AIChatInput
                    onSend={handleSendMessage}
                    disabled={isLoading || isStreaming}
                    placeholder={isStreaming ? "AI is typing..." : "Ask me, I'm ready"}
                    isEmptyState={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rename Dialog */}
      {isRenameOpen && renameChatId && (
        <RenameChatDialog
          isOpen={isRenameOpen}
          onClose={() => {
            setIsRenameOpen(false);
            setRenameChatId(null);
          }}
          currentName={chats.find((c) => c.id === renameChatId)?.title || ""}
          onRename={handleRenameChat}
        />
      )}

      {/* Remove from Project Confirmation Dialog */}
      <CocpitConfirmBox
        isOpen={!!removeChatId && isRemoveOpen}
        title="Remove from project"
        message="Remove this chat from the project?"
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={handleConfirmRemove}
        onCancel={() => {
          setIsRemoveOpen(false);
          setRemoveChatId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <CocpitConfirmBox
        isOpen={!!deleteChatId && isDeleteOpen}
        title="Delete chat"
        message="Delete this chat permanently?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteChatId(null);
        }}
      />

      {/* Share Modal */}
      <CocpitShareModel
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}
