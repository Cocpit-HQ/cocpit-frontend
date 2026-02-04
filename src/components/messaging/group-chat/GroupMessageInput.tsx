import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, FilePlus, Mic, Smile } from "lucide-react"; // Icons

interface GroupMessageInputProps {
    onSendMessage: (text: string) => void;
    isLoading?: boolean;
}

export default function GroupMessageInput({ onSendMessage, isLoading }: GroupMessageInputProps) {
    const [message, setMessage] = useState("");

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage("");
        }
    };

    return (
        <form onSubmit={handleSend} className="p-4 border-t border-border bg-card/50 backdrop-blur-sm flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
                <FilePlus className="w-5 h-5" />
            </Button>

            <div className="relative flex-1">
                <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isLoading}
                    className="pr-12 rounded-full border-muted-foreground/20 focus-visible:ring-primary/50"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                >
                    <Smile className="w-5 h-5" />
                </Button>
            </div>

            {message.trim() ? (
                <Button type="submit" size="icon" disabled={isLoading} className="rounded-full">
                    <Send className="w-5 h-5" />
                </Button>
            ) : (
                <Button type="button" variant="ghost" size="icon" className="text-muted-foreground">
                    <Mic className="w-5 h-5" />
                </Button>
            )}
        </form>
    );
}
