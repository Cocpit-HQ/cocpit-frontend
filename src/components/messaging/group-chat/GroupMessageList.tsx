import React from "react";
import { Message } from "../../../types/messaging";
import SystemMessage from "./SystemMessage";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GroupMessageListProps {
    messages: Message[];
    currentUserId: string;
}

export default function GroupMessageList({ messages, currentUserId }: GroupMessageListProps) {
    return (
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
                {messages.map((msg, index) => {
                    const isSystem = msg.type === 'system';

                    if (isSystem) {
                        return <SystemMessage key={msg.id || index} message={msg} currentUserId={currentUserId} />;
                    }

                    // specific group chat logic
                    const senderId = msg.senderId || (msg.sender === 'me' ? currentUserId : undefined);
                    const isMe = msg.sender === 'me' || senderId === currentUserId;

                    const previousMsg = messages[index - 1];
                    const previousSenderId = previousMsg ? (previousMsg.senderId || ((previousMsg.sender === 'me') ? currentUserId : undefined)) : null;

                    const showSenderName = !isMe && (index === 0 || previousSenderId !== senderId);

                    return (
                        <div key={msg.id || index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            {showSenderName && (
                                <span className="text-xs text-muted-foreground mb-1 ml-1">
                                    {msg.senderName || "Unknown"}
                                </span>
                            )}
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe
                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                    : "bg-muted text-muted-foreground rounded-bl-none"
                                    }`}
                            >
                                <p className="text-sm">{msg.text || msg.text_content}</p>
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
            </div>
        </ScrollArea>
    );
}
