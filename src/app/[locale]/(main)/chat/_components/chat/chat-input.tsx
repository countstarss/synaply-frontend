"use client";

import { Plus, Smile, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, isLoading, placeholder = "发送消息..." }: ChatInputProps) {
  const [content, setContent] = useState("");

  const handleSend = async () => {
    if (!content.trim() || isLoading) return;
    
    try {
      await onSend(content);
      setContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-[#313338]">
      <div className="relative flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 transform -translate-y-1/2"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading}
          className="px-12 py-6 bg-[#383A40] border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-200"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-12 top-1/2 transform -translate-y-1/2"
        >
          <Smile className="h-5 w-5" />
        </Button>
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isLoading}
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}