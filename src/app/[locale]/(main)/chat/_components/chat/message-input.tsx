"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CirclePlus, FileIcon, ImageIcon, Send, VideoIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (content: string) => void;
  onHandleSend: () => void;
  className?: string;
}

const MessageInput = ({
  newMessage,
  setNewMessage,
  onHandleSend,
  className,
}: MessageInputProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 bg-white/2",
        "w-full min-h-[72px]",
        className
      )}
    >
      {/* 附件按钮 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground transition-colors">
            <CirclePlus className="h-6 w-6" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem className="gap-2">
            <FileIcon className="h-4 w-4" />
            <span>添加文件</span>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="选择文件"
            />
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <ImageIcon className="h-4 w-4" />
            <span>添加图片</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <VideoIcon className="h-4 w-4" />
            <span>添加视频</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 输入框容器 */}
      <div className="flex-1 relative">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onHandleSend();
            }
          }}
          placeholder="输入消息... (Enter发送，Shift+Enter换行)"
          className={cn(
            "w-full pr-12 rounded-full border-2 border-border/50",
            "focus:border-primary/50 transition-all duration-200",
            "bg-background/50 placeholder:text-muted-foreground/70",
            "h-12 text-sm outline-none focus:outline-none"
          )}
        />

        {/* 发送按钮 */}
        <Button
          onClick={onHandleSend}
          disabled={!newMessage.trim()}
          size="icon"
          className={cn(
            "absolute right-1 top-1 h-10 w-10 rounded-full",
            "transition-all duration-200",
            newMessage.trim()
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
