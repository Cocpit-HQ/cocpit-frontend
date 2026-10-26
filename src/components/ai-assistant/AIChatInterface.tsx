"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, User } from "lucide-react";
import Image from "next/image";

const CYPHEX_LOGO = "/assets/AI 2.svg";


interface Message {
    id: string;
    type: "ai" | "user";
    content: string | React.ReactNode;
    timestamp: Date;
}

export function AIChatInterface() {
    const [messages, setMessages] = useState<Message[]>(() => [
        { id: "1", type: "ai", content: "Hi there! I'm Cyphex, your AI Assistant. I've been analyzing your profile and the latest market trends.", timestamp: new Date(Date.now() - 60000 * 5) },
        { id: "2", type: "ai", content: <div className="space-y-2"><p>Based on your recent activity, I&apos;ve curated some tailored opportunities for you today.</p><ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground mt-2"><li>Found 3 high-match roles in Frontend Development</li><li>Identified 1 upcoming networking event in your area</li><li>Noticed a new skill trend: React Server Components</li></ul></div>, timestamp: new Date(Date.now() - 60000 * 4) },
        { id: "3", type: "user", content: "That sounds great! Can you show me the job matches?", timestamp: new Date(Date.now() - 60000 * 2) },
    ]);
    const [isTyping, setIsTyping] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Simulate AI typing a response
        const timer = setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: "4",
                    type: "ai",
                    content: "Absolutely! I've populated your Daily Insights panel on the right with the best matches. Let me know if you want me to refine the search parameters.",
                    timestamp: new Date(),
                },
            ]);
            setIsTyping(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-sidebar/50 backdrop-blur-sm z-10">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white shadow-purple overflow-hidden">
                        <Image src={CYPHEX_LOGO} alt="Cyphex logo" width={40} height={40} className="object-cover w-full h-full" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                </div>
                <div>
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                        Cyphex
                        {/* <Sparkles className="w-4 h-4 text-purple-400" /> */}
                    </h2>
                    <p className="text-xs text-muted-foreground">Always here to help</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                <div className="flex justify-center mb-8">
                    <span className="text-xs text-muted-foreground bg-sidebar-accent/50 px-3 py-1 rounded-full border border-border">
                        Today
                    </span>
                </div>

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${msg.type === "user" ? "ml-auto flex-row-reverse" : ""
                            } animate-fade-in-up`}
                    >
                        {/* Avatar */}
                        <div
                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 overflow-hidden ${msg.type === "ai"
                                ? "bg-gradient-to-br from-primary to-purple-500 shadow-sm"
                                : "bg-sidebar-accent border border-border"
                                }`}
                        >
                            {msg.type === "ai" ? (
                                <Image src={CYPHEX_LOGO} alt="Cyphex" width={32} height={32} className="object-cover w-full h-full" />
                            ) : (
                                <User className="w-4 h-4 text-muted-foreground" />
                            )}
                        </div>

                        {/* Bubble */}
                        <div
                            className={`p-3 md:p-4 rounded-2xl ${msg.type === "user"
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-sidebar border border-border text-foreground rounded-tl-sm shadow-sm"
                                }`}
                        >
                            <div className="text-sm leading-relaxed">{msg.content}</div>
                            <div
                                className={`text-[10px] mt-2 text-right ${msg.type === "user"
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                    }`}
                            >
                                {msg.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex gap-3 max-w-[85%] animate-fade-in-up">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mt-1 shadow-sm overflow-hidden">
                            <Image src={CYPHEX_LOGO} alt="Cyphex" width={32} height={32} className="object-cover w-full h-full" />
                        </div>
                        <div className="bg-sidebar border border-border p-4 rounded-2xl rounded-tl-sm flex items-center gap-1 shadow-sm">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-sidebar/50 backdrop-blur-sm z-10">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        placeholder="Ask AI Assistant anything... (Demo Mode)"
                        disabled
                        className="w-full bg-background border border-border rounded-full py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-70 disabled:cursor-default transition-all"
                    />
                    <button
                        disabled
                        className="absolute right-2 p-2 bg-primary/20 text-primary rounded-full disabled:opacity-50 disabled:cursor-default"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-2">
                    AI responses are generated based on platform data and your profile settings.
                </p>
            </div>
        </div>
    );
}
