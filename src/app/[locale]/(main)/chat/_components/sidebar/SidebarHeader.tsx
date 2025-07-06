import { Button } from "@/components/ui/button";
import { UserPlus, ArrowLeft } from "lucide-react";
import { ViewMode } from "./types";

interface SidebarHeaderProps {
  viewMode: ViewMode;
  onContactsView: () => void;
  onChatsView: () => void;
}

export function SidebarHeader({
  viewMode,
  onContactsView,
  onChatsView,
}: SidebarHeaderProps) {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {viewMode === "chats" ? "聊天" : "联系人"}
        </h2>
        <div className="flex gap-2">
          {viewMode === "chats" ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={onContactsView}
            >
              <UserPlus className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={onChatsView}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
