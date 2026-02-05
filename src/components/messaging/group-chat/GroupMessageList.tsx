import React from "react";
import { Message } from "../../../types/messaging";
import SystemMessage from "./SystemMessage";


interface GroupMessageListProps {
    messages: Message[];
    currentUserId: string;
}

export default function GroupMessageList({ messages, currentUserId }: GroupMessageListProps) {
    const bottomRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
            <div className="space-y-4">
                {messages.map((msg, index) => {
                    const isSystem = msg.type === 'system';

                    if (isSystem) {
                        return <SystemMessage key={msg.id || index} message={msg} currentUserId={currentUserId} />;
                    }

                    // specific group chat logic
                    const senderId = msg.senderId;
                    const isMe = msg.sender === 'me' || (senderId && currentUserId && String(senderId) === String(currentUserId));

                    const previousMsg = messages[index - 1];
                    const isPreviousSystem = previousMsg?.type === 'system';
                    const previousSenderId = previousMsg ? (previousMsg.senderId || ((previousMsg.sender === 'me') ? currentUserId : `unknown-${index - 1}`)) : null;

                    // Show name if:
                    // 1. It's not me
                    // 2. AND (First message OR Previous was system OR Previous sender is different)
                    const showSenderName = !isMe && (index === 0 || isPreviousSystem || previousSenderId !== senderId);

                    return (
                        <div key={msg.id || index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            {showSenderName && (
                                <span className="text-xs text-muted-foreground mb-1 ml-1 font-medium">
                                    {msg.senderName || "Unknown"}
                                </span>
                            )}
                            <div
                                className={`max-w-[75%] md:max-w-[60%] px-3 py-2 md:px-4 md:py-2.5 relative break-words ${isMe
                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                    : "bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border shadow-sm"
                                    }`}
                            >
                                <span className="leading-snug block text-sm md:text-base">{msg.text || msg.text_content}</span>
                                <span className="text-[10px] opacity-70 block text-right mt-1">
                                    {/* Handle various time formats */}
                                    {msg.created_at
                                        ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : msg.time
                                    }
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
