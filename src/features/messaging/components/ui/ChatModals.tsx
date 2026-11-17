"use client";

import React from "react";
import { Message, ChatThread } from "@/types/messaging";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import { ReportModal } from "@/components/shared/ReportModal";
import MessageInfoModal from "../../MessageInfoModal";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { DeleteMessageModal } from "./DeleteMessageModal";
import { MuteDurationModal } from "./MuteDurationModal";
import MediaDetailViewer from "./MediaDetailViewer";
import { ChatModalsHandle } from "../../hooks/useChatModals";

interface ChatModalsProps {
  chat: ChatThread;
  modals: ChatModalsHandle;
  currentUserId?: string;
  // Selected Message Info Modal
  selectedMessage: Message | null;
  selectedMessages?: Message[];
  messageInfoMessage?: Message | null;
  setMessageInfoMessage?: (msg: Message | null) => void;
  isMessageInfoOpen: boolean;
  onCloseMessageInfo: () => void;
  // Delete Message Modal
  messageToDelete: Message | null;
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (open: boolean) => void;
  onDeleteForMe: (msg?: Message) => void;
  onDeleteForEveryone: (msg?: Message) => void;
  // Media Preview Modal
  previewMedia: {
    url: string;
    type: "image" | "video" | "document" | string;
    name?: string;
    mediaList?: { url: string; type: "image" | "video" | "document" | string; name?: string | null }[];
    initialIndex?: number;
  } | null;
  onCloseMediaPreview: () => void;
}

export default function ChatModals({
  chat,
  modals,
  currentUserId,
  selectedMessage,
  selectedMessages,
  messageInfoMessage,
  setMessageInfoMessage,
  isMessageInfoOpen,
  onCloseMessageInfo,
  messageToDelete,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  onDeleteForMe,
  onDeleteForEveryone,
  previewMedia,
  onCloseMediaPreview,
}: ChatModalsProps) {
  const targetId =
    chat.otherUserId ||
    (chat as unknown as { other_user_id?: string }).other_user_id ||
    "";

  return (
    <>
      {/* Message Info Modal */}
      {isMessageInfoOpen && (messageInfoMessage || selectedMessage) && (
        <MessageInfoModal
          isOpen={isMessageInfoOpen}
          onClose={() => {
            onCloseMessageInfo();
            setMessageInfoMessage?.(null);
          }}
          message={messageInfoMessage || selectedMessage}
          messageId={(messageInfoMessage || selectedMessage)!.id}
          messageContent={
            (messageInfoMessage || selectedMessage)!.text ||
            (messageInfoMessage || selectedMessage)!.text_content ||
            ""
          }
          readAt={(messageInfoMessage || selectedMessage)!.read_at}
          receiver={{ name: chat.name, avatar: chat.avatar }}
          chat={chat}
          currentUserId={currentUserId}
        />
      )}

      {/* Delete Message Modal */}
      {(messageToDelete || (selectedMessages && selectedMessages.length > 0)) && (
        <DeleteMessageModal
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
          count={selectedMessages && selectedMessages.length > 0 ? selectedMessages.length : 1}
          onDeleteForMe={() => onDeleteForMe(messageToDelete || undefined)}
          onDeleteForEveryone={() => onDeleteForEveryone(messageToDelete || undefined)}
          isSender={
            selectedMessages && selectedMessages.length > 0
              ? selectedMessages.every(
                  (m) =>
                    m.sender === "me" ||
                    m.senderId === currentUserId ||
                    m.senderId === "me"
                )
              : Boolean(
                  messageToDelete &&
                    (messageToDelete.sender === "me" ||
                      messageToDelete.senderId === currentUserId ||
                      messageToDelete.senderId === "me")
                )
          }
        />
      )}

      {/* Media Detail Viewer */}
      {previewMedia && (
        <MediaDetailViewer
          isOpen={!!previewMedia}
          onClose={onCloseMediaPreview}
          items={
            previewMedia.mediaList && previewMedia.mediaList.length > 0
              ? previewMedia.mediaList
              : [
                  {
                    url: previewMedia.url,
                    type: previewMedia.type,
                    name: previewMedia.name,
                  },
                ]
          }
          initialIndex={previewMedia.initialIndex ?? 0}
        />
      )}

      {/* Report Modal */}
      {modals.showReportConfirm && (
        <ReportModal
          isOpen={modals.showReportConfirm}
          onClose={() => modals.setShowReportConfirm(false)}
          targetType={chat.otherUserType === "COMPANY" ? "COMPANY" : "USER"}
          targetId={targetId}
        />
      )}

      {/* Block Confirmation Modal */}
      <CocpitConfirmBox
        isOpen={modals.showBlockConfirm}
        title="Block this user?"
        message="They won't be able to message or find you"
        confirmText="Block"
        cancelText="Cancel"
        onConfirm={modals.onConfirmBlock}
        onCancel={() => modals.setShowBlockConfirm(false)}
      />

      {/* Delete Chat Confirmation Modal */}
      <CocpitConfirmBox
        isOpen={modals.showDeleteConfirm}
        title="Delete this chat?"
        message="This will remove the chat from your inbox"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={modals.onConfirmDeleteChat}
        onCancel={() => modals.setShowDeleteConfirm(false)}
      />

      {/* Clear Chat Confirmation Modal */}
      <CocpitConfirmBox
        isOpen={modals.showClearConfirm}
        title="Clear this chat?"
        message="This will clear all messages in this conversation for you."
        confirmText="Clear"
        cancelText="Cancel"
        onConfirm={modals.onConfirmClearChat}
        onCancel={() => modals.setShowClearConfirm(false)}
      />

      {/* Mute Confirmation / Duration Selection Modal */}
      <MuteDurationModal
        open={modals.showMuteConfirm}
        onOpenChange={modals.setShowMuteConfirm}
        onSelectDuration={(hours) => modals.onConfirmMuteGroup(hours)}
        isGroup={!!chat.isGroup}
      />

      {/* Unmute Confirmation Modal */}
      <CocpitConfirmBox
        isOpen={modals.showUnmuteConfirm}
        title={chat.isGroup ? "Unmute this group?" : "Unmute this chat?"}
        message={chat.isGroup ? "You will receive notifications from this group again." : "You will receive notifications from this chat again."}
        confirmText="Unmute"
        cancelText="Cancel"
        onConfirm={modals.onConfirmUnmuteGroup}
        onCancel={() => modals.setShowUnmuteConfirm(false)}
      />

      {/* Leave Group Confirmation Modal */}
      <CocpitConfirmBox
        isOpen={modals.showLeaveConfirm}
        title="Leave this group?"
        message="You won't receive messages from this group anymore."
        confirmText="Leave"
        cancelText="Cancel"
        onConfirm={modals.onConfirmLeaveGroup}
        onCancel={() => modals.setShowLeaveConfirm(false)}
      />

      {/* Share Profile Modal */}
      <CocpitShareModel
        isOpen={modals.isShareModalOpen}
        onClose={() => modals.setIsShareModalOpen(false)}
        profileId={targetId}
        onShare={() => {
          modals.setIsShareModalOpen(false);
        }}
      />
    </>
  );
}
