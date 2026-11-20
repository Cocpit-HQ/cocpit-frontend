"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useMutation, InfiniteData, QueryClient } from "@tanstack/react-query";
import { Message, ChatThread } from "@/types/messaging";
import {
  deleteMessage,
  editMessage,
  addOrUpdateReaction,
  clearReaction,
  pinMessage,
} from "@/services/api/messaging";
import { getMessageCopyText } from "@/features/messaging/utils/messageCopy";
import {
  getPinnedMessageId,
  setPinnedMessageId,
} from "@/features/messaging/utils/pinMessageUtils";
import { unmarkJobContextSent } from "./useChatSharedContext";

interface ToastFunction {
  (props: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
  }): void;
}

interface ActiveProfileLike {
  type?: string;
  id?: string;
  name?: string;
}

interface SessionLike {
  user?: {
    id?: string;
    name?: string | null;
  };
}

interface UseMessageActionsProps {
  chat: ChatThread;
  currentUserId: string;
  queryClient: QueryClient;
  toast: ToastFunction;
  activeProfile: ActiveProfileLike | null;
  session: SessionLike | null;
  onRetryMessage?: (message: Message) => void;
}

export function useMessageActions({
  chat,
  currentUserId,
  queryClient,
  toast,
  activeProfile,
  session,
  onRetryMessage,
}: UseMessageActionsProps) {
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const isMessageSelected = selectedMessages.length > 0;
  const selectedMessage = selectedMessages[selectedMessages.length - 1] || null;
  const selectedMessageIds = useMemo(() => selectedMessages.map((m) => m.id), [selectedMessages]);

  const [isMessageInfoOpen, setIsMessageInfoOpen] = useState(false);
  const [messageInfoMessage, setMessageInfoMessage] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  const [pinnedMessageId, setPinnedMessageIdState] = useState<string | null>(() => {
    return chat?.pinned_message_id || getPinnedMessageId(chat?.id, activeProfile?.type, activeProfile?.id);
  });
  const pinnedMessageIdRef = useRef<string | null>(pinnedMessageId);
  useEffect(() => {
    pinnedMessageIdRef.current = pinnedMessageId;
  }, [pinnedMessageId]);

  const [pendingPinMessageId, setPendingPinMessageId] = useState<string | null>(null);
  const [isReplacePinModalOpen, setIsReplacePinModalOpen] = useState(false);
  const [isRemovePinModalOpen, setIsRemovePinModalOpen] = useState(false);

  useEffect(() => {
    const initialPinnedId = chat?.pinned_message_id || getPinnedMessageId(chat?.id, activeProfile?.type, activeProfile?.id);
    setPinnedMessageIdState(initialPinnedId);
    pinnedMessageIdRef.current = initialPinnedId;
    if (chat?.pinned_message_id && chat?.id) {
      setPinnedMessageId(chat.id, chat.pinned_message_id, activeProfile?.type, activeProfile?.id);
    }
  }, [chat?.id, chat?.pinned_message_id, activeProfile?.type, activeProfile?.id]);

  const executePinMessage = useCallback((msgId: string) => {
    const companyId = activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
    setPinnedMessageId(chat.id, msgId, activeProfile?.type, activeProfile?.id);
    setPinnedMessageIdState(String(msgId));
    pinnedMessageIdRef.current = String(msgId);
    toast({ description: "A message was pinned" });
    pinMessage(String(chat.id), String(msgId), true, companyId).catch((err) => {
      console.error("Failed to pin message on server:", err);
    });
  }, [activeProfile?.id, activeProfile?.type, chat.id, toast]);

  const executeUnpinMessage = useCallback(() => {
    const companyId = activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
    setPinnedMessageId(chat.id, null, activeProfile?.type, activeProfile?.id);
    setPinnedMessageIdState(null);
    pinnedMessageIdRef.current = null;
    toast({ description: "A message was unpinned" });
    pinMessage(String(chat.id), null, false, companyId).catch((err) => {
      console.error("Failed to unpin message on server:", err);
    });
  }, [activeProfile?.id, activeProfile?.type, chat.id, toast]);

  const confirmReplacePin = useCallback(() => {
    if (pendingPinMessageId) {
      executePinMessage(pendingPinMessageId);
      setPendingPinMessageId(null);
    }
    setIsReplacePinModalOpen(false);
  }, [executePinMessage, pendingPinMessageId]);

  const cancelReplacePin = useCallback(() => {
    setPendingPinMessageId(null);
    setIsReplacePinModalOpen(false);
  }, []);

  const confirmRemovePin = useCallback(() => {
    executeUnpinMessage();
    setIsRemovePinModalOpen(false);
  }, [executeUnpinMessage]);

  const cancelRemovePin = useCallback(() => {
    setIsRemovePinModalOpen(false);
  }, []);

  const requestPinMessage = useCallback((msgId: string) => {
    const currentPinnedId = pinnedMessageIdRef.current || pinnedMessageId;
    if (currentPinnedId && String(currentPinnedId) !== String(msgId)) {
      setPendingPinMessageId(String(msgId));
      setIsReplacePinModalOpen(true);
    } else {
      executePinMessage(String(msgId));
    }
  }, [executePinMessage, pinnedMessageId]);

  const requestUnpinMessage = useCallback(() => {
    setIsRemovePinModalOpen(true);
  }, []);

  const setSelectedMessage = useCallback((msg: Message | null) => {
    if (!msg) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages([msg]);
    }
  }, []);

  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: "image" | "video" | "document" | string;
    name?: string;
    mediaList?: { url: string; type: "image" | "video" | "document" | string; name?: string | null }[];
    initialIndex?: number;
  } | null>(null);

  const [replyingTo, setReplyingTo] = useState<{
    messageId: string;
    senderName: string;
    content: string;
    isMe?: boolean;
    mediaType?: "image" | "video" | "document" | string | null;
    mediaName?: string | null;
    mediaUrl?: string | null;
    sharedPostId?: string | null;
    sharedProfileId?: string | null;
    sharedProfileType?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    isAttachment?: boolean;
    sharedProfile?: {
      name: string;
      avatar?: string | null;
      headline?: string;
    } | null;
    sharedPost?: {
      id?: string;
      content?: string;
      caption?: string;
      media?: { url: string; type?: string }[];
      poll?: any;
      post_type?: string;
    } | null;
    poll?: any;
  } | null>(null);

  // Multi-message selection toggle
  const handleMessageClick = useCallback((message: Message) => {
    if (editingMessageId) return;
    setSelectedMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      if (exists) {
        return prev.filter((m) => m.id !== message.id);
      } else {
        return [...prev, message];
      }
    });
  }, [editingMessageId]);

  const handleClearSelection = useCallback(() => {
    setSelectedMessages([]);
    setMessageToDelete(null);
  }, []);

  // Delete message for me (single or batch)
  const handleDeleteForMe = async (msg?: Message) => {
    const targetMsgs = msg ? [msg] : (messageToDelete ? [messageToDelete] : selectedMessages);
    if (targetMsgs.length === 0) return;
    const targetIds = new Set(targetMsgs.map((m) => m.id));

    // Clear selection immediately
    setSelectedMessages([]);
    setIsDeleteModalOpen(false);
    setMessageToDelete(null);

    if (pinnedMessageId && targetIds.has(pinnedMessageId)) {
      setPinnedMessageId(chat.id, null, activeProfile?.type, activeProfile?.id);
      setPinnedMessageIdState(null);
      // Delete for Me hides the pinned message locally for this user only; does not unpin for the other participant
    }

    try {
      queryClient.setQueryData(
        ["messages", chat.id],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return undefined;
          const newPages = old.pages.map((page) =>
            page.map((m) => {
              if (targetIds.has(m.id)) {
                return {
                  ...m,
                  text: "This message was deleted for you.",
                  text_content: "This message was deleted for you.",
                  sharedPost: null,
                  sharedProfile: null,
                  sharedProfileId: undefined,
                  sharedPostId: undefined,
                  entityType: undefined,
                  entityId: undefined,
                  media: [],
                  reactions: [],
                  is_deleted: true,
                  is_deleted_for_me: true,
                };
              }
              return m;
            }),
          );
          return { ...old, pages: newPages };
        },
      );

      await Promise.allSettled(targetMsgs.map((m) => deleteMessage(m.id, false)));
      toast({
        description:
          targetMsgs.length > 1
            ? `${targetMsgs.length} messages deleted`
            : "Message deleted successfully",
      });
    } catch (error: unknown) {
      console.error("Failed to delete message", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete message";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["messages", chat.id] });
    }
  };

  // Delete message for everyone (single or batch)
  const handleDeleteForEveryone = async (msg?: Message) => {
    const targetMsgs = msg ? [msg] : (messageToDelete ? [messageToDelete] : selectedMessages);
    if (targetMsgs.length === 0) return;

    // Safety check: verify all targeted messages were sent by current user
    const allMine = targetMsgs.every(
      (m) => m.sender === "me" || m.senderId === currentUserId || m.senderId === "me"
    );
    if (!allMine) {
      toast({
        title: "Permission Denied",
        description: "You can only delete your own messages for everyone",
        variant: "destructive",
      });
      return;
    }

    const targetIds = new Set(targetMsgs.map((m) => m.id));

    setSelectedMessages([]);
    setIsDeleteModalOpen(false);
    setMessageToDelete(null);

    if (pinnedMessageId && targetIds.has(pinnedMessageId)) {
      setPinnedMessageId(chat.id, null, activeProfile?.type, activeProfile?.id);
      setPinnedMessageIdState(null);
      const companyId = activeProfile?.type === "COMPANY" ? activeProfile.id : undefined;
      pinMessage(String(chat.id), null, false, companyId).catch((err) => {
        console.error("Failed to unpin deleted message on server:", err);
      });
    }

    const updateCache = (old: InfiniteData<Message[]> | undefined) => {
      if (!old) return undefined;
      const newPages = old.pages.map((page) =>
        page.map((m) => {
          if (targetIds.has(m.id)) {
            return {
              ...m,
              text: "This message was deleted for everyone",
              text_content: "This message was deleted for everyone",
              sharedPost: null,
              sharedProfile: null,
              sharedProfileId: undefined,
              sharedPostId: undefined,
              entityType: undefined,
              entityId: undefined,
              media: [],
              reactions: [],
              is_deleted: true,
              is_deleted_for_everyone: true,
            };
          }
          return m;
        }),
      );
      return { ...old, pages: newPages };
    };

    queryClient.setQueryData(
      ["messages", chat.id, activeProfile?.id || "USER"],
      updateCache,
    );
    queryClient.setQueryData(["messages", chat.id], updateCache);

    // If job/offer card message was deleted for everyone, clear the sent record for that specific entityId
    // so subsequent actions from the application dashboard for that job can re-attach the context
    targetMsgs.forEach((m) => {
      const mType = (m as any).entityType || (m as any).entity_type;
      const mId = (m as any).entityId || (m as any).entity_id;
      if (mType === "job" || mType === "offer") {
        unmarkJobContextSent(chat.id, mId);
      }
    });

    try {
      await Promise.allSettled(targetMsgs.map((m) => deleteMessage(m.id, true)));
      toast({
        description:
          targetMsgs.length > 1
            ? `${targetMsgs.length} messages deleted for everyone`
            : "Message deleted for everyone",
      });
    } catch (error: unknown) {
      console.error("Failed to delete message for everyone", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete message for everyone";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["messages", chat.id] });
    }
  };

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({
      messageId,
      text,
    }: {
      messageId: string;
      text: string;
    }) => {
      return editMessage(messageId, text);
    },
    onSuccess: () => {
      setEditingMessageId(null);
    },
    onError: (error) => {
      console.error("Failed to edit message:", error);
    },
  });

  const handleSaveEdit = (messageId: string, text: string) => {
    editMessageMutation.mutate({ messageId, text });
  };

  // Reaction logic with optimistic update and rollback
  const handleReactionSelect = async (
    message: Message,
    selectedEmoji: string,
  ) => {
    const myReaction = message.reactions?.find(
      (r) => r.user_id === currentUserId,
    );
    if (myReaction && myReaction.emoji === selectedEmoji) return;

    // Optimistically update
    queryClient.setQueryData(
      ["messages", chat.id],
      (old: InfiniteData<Message[]> | undefined) => {
        if (!old) return old;
        const newPages = old.pages.map((page) =>
          page.map((m) => {
            if (m.id !== message.id) return m;
            const reactions = m.reactions || [];
            const existingIdx = reactions.findIndex(
              (r) => r.user_id === currentUserId,
            );
            let newReactions;
            if (existingIdx !== -1) {
              newReactions = reactions.map((r, i) =>
                i === existingIdx
                  ? { ...r, emoji: selectedEmoji, updated_at: new Date().toISOString() }
                  : r,
              );
            } else {
              newReactions = [
                ...reactions,
                {
                  user_id: currentUserId,
                  emoji: selectedEmoji,
                  full_name: session?.user?.name || "",
                  avatar: null,
                  updated_at: new Date().toISOString(),
                },
              ];
            }
            return { ...m, reactions: newReactions };
          }),
        );
        return { ...old, pages: newPages };
      },
    );

    try {
      if (selectedEmoji === "") {
        await clearReaction(message.id);
      } else {
        await addOrUpdateReaction(message.id, selectedEmoji);
      }
    } catch {
      // Rollback
      queryClient.setQueryData(
        ["messages", chat.id],
        (old: InfiniteData<Message[]> | undefined) => {
          if (!old) return old;
          const newPages = old.pages.map((page) =>
            page.map((m) => {
              if (m.id !== message.id) return m;
              const reactions = m.reactions || [];
              let newReactions;
              if (myReaction) {
                newReactions = reactions.map((r) =>
                  r.user_id === currentUserId ? myReaction : r,
                );
              } else {
                newReactions = reactions.filter(
                  (r) => r.user_id !== currentUserId,
                );
              }
              return { ...m, reactions: newReactions };
            }),
          );
          return { ...old, pages: newPages };
        },
      );
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    }
  };

  // Reply handler
  const handleReply = (msg: Message) => {
    const isSelf =
      msg.sender === "me" ||
      Boolean(currentUserId && msg.senderId === currentUserId);
    const firstMedia = msg.media?.[0];
    let detectedMediaType = firstMedia?.type || msg.messageType;
    const textContent = (msg.text || msg.text_content || "").trim();

    const hasPost = Boolean(
      msg.sharedPost ||
      (msg as any).shared_post ||
      msg.sharedPostId ||
      (msg as any).shared_post_id ||
      msg.entityType === "post" ||
      msg.entityType === "article" ||
      (msg as any).entity_type === "post" ||
      (msg as any).entity_type === "article"
    );
    const hasJob = Boolean(
      msg.entityType === "job" ||
      msg.entityType === "offer" ||
      (msg as any).entity_type === "job" ||
      (msg as any).entity_type === "offer"
    );
    const hasProfile = Boolean(
      msg.sharedProfile ||
      (msg as any).shared_profile ||
      msg.sharedProfileId ||
      (msg as any).shared_profile_id ||
      msg.entityType === "profile" ||
      msg.entityType === "company" ||
      (msg as any).entity_type === "profile" ||
      (msg as any).entity_type === "company"
    );
    const isAttachmentCard = hasPost || hasJob || hasProfile;

    if (!detectedMediaType && textContent) {
      const textLower = textContent.toLowerCase();
      if (textLower.endsWith(".pdf") || textLower.endsWith(".doc") || textLower.endsWith(".docx")) {
        detectedMediaType = "document";
      } else if (
        textLower.endsWith(".mp4") ||
        textLower.endsWith(".mov") ||
        textLower.endsWith(".webm")
      ) {
        detectedMediaType = "video";
      } else if (
        textLower.endsWith(".jpg") ||
        textLower.endsWith(".jpeg") ||
        textLower.endsWith(".png") ||
        textLower.endsWith(".webp")
      ) {
        detectedMediaType = "image";
      }
    }

    const isGenericText = [
      "attachment",
      "photo",
      "video",
      "document",
      "sent a photo",
      "sent a video",
      "sent a document",
      "shared a post",
    ].includes(textContent.toLowerCase());

    const hasRealMessageText = Boolean(textContent && !isGenericText && textContent !== firstMedia?.name);

    const postUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/(?:(?:channels\/[^\/\s]+\/article)|(?:channel\/article)|(?:post\/article)|(?:article\/edit)|(?:article)|(?:posts?))\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}|[a-zA-Z0-9_-]+)/i;
    const extractedPostId = textContent.match(postUrlRegex)?.[1];
    const targetPostId =
      msg.sharedPostId ||
      (msg as any).shared_post_id ||
      (msg.entityType === 'post' || msg.entityType === 'article' ? msg.entityId : null) ||
      msg.sharedPost?.id ||
      extractedPostId;
    const cachedPost = targetPostId ? queryClient.getQueryData<any>(["sharedPost", targetPostId]) : null;

    const pollObj =
      (msg as any).poll ||
      msg.sharedPost?.poll ||
      (msg as any).shared_post?.poll ||
      cachedPost?.poll ||
      (cachedPost?.post_type === 'poll' ? { question: cachedPost.content } : null) ||
      null;

    const profileObj = msg.sharedProfile || (msg as any).shared_profile || null;
    const postObj = msg.sharedPost || (msg as any).shared_post || cachedPost || null;
    const postMediaUrl = postObj?.media?.[0]?.url || null;
    const resolvedMediaUrl = firstMedia?.url || postMediaUrl || null;
    const resolvedMediaType =
      firstMedia?.type ||
      (postMediaUrl ? (postObj?.media?.[0]?.type || 'image') : null) ||
      detectedMediaType;

    let finalContent = "";
    if (pollObj) {
      const pollQ = (pollObj as any)?.question || cachedPost?.content || msg.sharedPost?.content;
      finalContent = pollQ && !pollQ.startsWith('http') && pollQ.trim().toLowerCase() !== 'poll' ? pollQ : (cachedPost?.content || "Poll");
    } else if (profileObj?.name) {
      finalContent = profileObj.name;
    } else if (postObj?.content || postObj?.caption) {
      finalContent = postObj.content || postObj.caption || "";
    } else if (hasRealMessageText && !textContent.startsWith('http')) {
      finalContent = textContent;
    } else if (detectedMediaType === "document") {
      finalContent = firstMedia?.name || textContent || "Document";
    } else if (isAttachmentCard) {
      finalContent = "Attachment";
    }

    setReplyingTo({
      messageId: msg.id,
      senderName: msg.senderName || "Unknown",
      content: finalContent,
      isMe: isSelf,
      mediaType: isAttachmentCard && !postMediaUrl ? "attachment" : resolvedMediaType,
      mediaName: firstMedia?.name || (detectedMediaType === "document" ? textContent : null),
      mediaUrl: resolvedMediaUrl,
      sharedPostId: targetPostId || msg.sharedPostId || (msg as any).shared_post_id || null,
      sharedProfileId: msg.sharedProfileId || (msg as any).shared_profile_id || null,
      sharedProfileType: (msg as any).shared_profile_type || null,
      entityType: msg.entityType || (msg as any).entity_type || (hasPost || targetPostId ? "post" : hasJob ? "job" : hasProfile ? "profile" : null),
      entityId: msg.entityId || (msg as any).entity_id || targetPostId || null,
      isAttachment: isAttachmentCard,
      sharedProfile: profileObj,
      sharedPost: postObj,
      poll: pollObj ? { ...(typeof pollObj === 'object' ? pollObj : {}), question: finalContent } : null,
    });

    // If post metadata was not immediately cached, fetch asynchronously to update preview and reply state
    if (targetPostId && !cachedPost) {
      import("@/services/api/posts").then(({ getPostById }) => {
        getPostById(targetPostId).then((backendPost) => {
          if (!backendPost) return;
          const media = backendPost.media?.map((m) => ({
            url: m.url,
            type: m.media_type as "image" | "video",
          })) || [];
          const postData = {
            id: backendPost.post_id,
            content: backendPost.content || "",
            post_type: backendPost.post_type,
            poll: backendPost.poll,
            media,
          };
          queryClient.setQueryData(["sharedPost", targetPostId], postData);
          queryClient.setQueryData(["repliedPostPreview", targetPostId], postData);
          setReplyingTo((prev) => {
            if (!prev || prev.messageId !== msg.id) return prev;
            const updatedPoll =
              backendPost.poll ||
              (backendPost.post_type === 'poll' ? { question: backendPost.content } : null);
            const updatedMediaUrl = media[0]?.url || prev.mediaUrl;
            const pollQ = (updatedPoll as any)?.question || backendPost.content;
            const updatedContent = pollQ && !pollQ.startsWith('http') && pollQ.trim().toLowerCase() !== 'poll' ? pollQ : prev.content;
            return {
              ...prev,
              content: updatedContent,
              mediaUrl: updatedMediaUrl,
              mediaType: media[0]?.type || (updatedMediaUrl ? 'image' : prev.mediaType),
              sharedPost: postData,
              poll: updatedPoll ? { ...(typeof updatedPoll === 'object' ? updatedPoll : {}), question: updatedContent } : null,
            };
          });
        }).catch(console.error);
      });
    }
  };

  const handleMediaClick = (
    url: string,
    type: "image" | "video" | "document" | string,
    name?: string,
    allMedia?: { url: string; type: string; name?: string | null }[],
    index?: number,
  ) => {
    setPreviewMedia({
      url,
      type,
      name,
      mediaList: allMedia as any,
      initialIndex: index ?? 0,
    });
  };

  // Message action dispatcher
  const handleMessageActionWithMsg = (action: string, message?: Message) => {
    const targetMsg = message || selectedMessage;
    if (!targetMsg && selectedMessages.length === 0 && action !== "close") return;

    if (action === "delete") {
      setMessageToDelete(targetMsg || null);
      setIsDeleteModalOpen(true);
    } else if (action === "delete_for_me") {
      handleDeleteForMe(message);
    } else if (action === "delete_for_everyone") {
      handleDeleteForEveryone(message);
    } else if (action === "edit") {
      if (targetMsg) {
        const createdAtStr = targetMsg.created_at || (targetMsg as any).createdAt || (targetMsg as any).timestamp;
        const createdAtTime = createdAtStr ? new Date(createdAtStr).getTime() : NaN;
        if (!isNaN(createdAtTime) && (Date.now() - createdAtTime) / (1000 * 60) > 15) {
          toast({
            description: "Messages can only be edited within 15 minutes of sending",
            variant: "destructive",
          });
          setSelectedMessages([]);
          return;
        }
        setEditingMessageId(targetMsg.id);
      }
      setSelectedMessages([]);
    } else if (action === "copy") {
      const msgsToCopy = selectedMessages.length > 0 ? selectedMessages : (targetMsg ? [targetMsg] : []);
      if (msgsToCopy.length > 0) {
        const textToCopy = msgsToCopy
          .map((m) => getMessageCopyText(m))
          .filter(Boolean)
          .join("\n\n");
        if (textToCopy) {
          navigator.clipboard.writeText(textToCopy);
          toast({
            description:
              msgsToCopy.length > 1
                ? `${msgsToCopy.length} messages copied`
                : "Message copied",
          });
        }
      }
      setSelectedMessages([]);
    } else if (action === "pin") {
      if (targetMsg) {
        requestPinMessage(String(targetMsg.id));
      }
      setSelectedMessages([]);
    } else if (action === "unpin") {
      requestUnpinMessage();
      setSelectedMessages([]);
    } else if (action === "info") {
      const msgForInfo = targetMsg || (selectedMessages.length > 0 ? selectedMessages[0] : null);
      if (msgForInfo) {
        setMessageInfoMessage(msgForInfo);
        setIsMessageInfoOpen(true);
      }
    // Trigger retry callback for failed message
    } else if (action === "retry") {
      if (targetMsg) onRetryMessage?.(targetMsg);
    } else if (action === "close") {
      setSelectedMessages([]);
      setMessageToDelete(null);
    }
  };

  return {
    selectedMessage,
    selectedMessages,
    selectedMessageIds,
    setSelectedMessage,
    setSelectedMessages,
    isMessageSelected,
    setIsMessageSelected: (val: boolean) => {
      if (!val) setSelectedMessages([]);
    },
    editingMessageId,
    setEditingMessageId,
    isMessageInfoOpen,
    setIsMessageInfoOpen,
    messageInfoMessage,
    setMessageInfoMessage,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    messageToDelete,
    setMessageToDelete,
    previewMedia,
    setPreviewMedia,
    replyingTo,
    setReplyingTo,
    handleMessageClick,
    handleClearSelection,
    handleDeleteForMe,
    handleDeleteForEveryone,
    handleSaveEdit,
    handleReactionSelect,
    handleReply,
    pinnedMessageId,
    setPinnedMessageId: setPinnedMessageIdState,
    isReplacePinModalOpen,
    isRemovePinModalOpen,
    confirmReplacePin,
    cancelReplacePin,
    confirmRemovePin,
    cancelRemovePin,
    handlePinMessage: requestPinMessage,
    handleUnpinMessage: requestUnpinMessage,
    handleMediaClick,
    handleMessageActionWithMsg,
  };
}
