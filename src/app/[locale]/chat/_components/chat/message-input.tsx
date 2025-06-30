"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileIcon, ImageIcon, Send, SquarePlus, VideoIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
    className
}: MessageInputProps) => {
    const [isMobile, setIsMobile] = useState(false);
    
    // 检测移动设备
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        // 初始检查
        checkIsMobile();
        
        // 监听窗口大小变化
        window.addEventListener('resize', checkIsMobile);
        
        return () => {
            window.removeEventListener('resize', checkIsMobile);
        };
    }, []);

    return (
        <div className={cn(
            "p-4 border bg-background w-full h-20 z-10", 
            "fixed bottom-0 md:bottom-12",
            isMobile ? "rounded-none" : "rounded-t-lg mx-auto max-w-3xl left-0 right-0 mb-2",
            className
        )}>
            <div className="flex gap-2 w-full mb-3 h-full">
                <div className="">
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <SquarePlus strokeWidth={1.25} className="h-10 w-10 cursor-pointer text-muted-foreground rounded-xl" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>
                                <FileIcon className="h-4 w-4" />
                                <span>
                                    Add File<input type="file" className="opacity-0 w-2" />
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <ImageIcon className="h-4 w-4" />
                                <span>Add Picture</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <VideoIcon className="h-4 w-4" />
                                <span>Add Video</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onHandleSend();
                        }
                    }}
                    placeholder="输入消息..."
                    className="flex-1"
                />
                <Button onClick={() => onHandleSend()} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default MessageInput;