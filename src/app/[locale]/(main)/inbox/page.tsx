"use client";

import React, { useState } from "react";
import { Mail, MailOpen, Star, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InboxPage() {
  const [messages] = useState([
    {
      id: "1",
      from: "John Doe",
      subject: "Project Update Required",
      preview: "Hi, I need an update on the current project status...",
      time: "2 hours ago",
      isRead: false,
      isStarred: true,
    },
    {
      id: "2",
      from: "Sarah Wilson",
      subject: "Meeting Reminder",
      preview: "Don't forget about our meeting tomorrow at 10 AM...",
      time: "5 hours ago",
      isRead: true,
      isStarred: false,
    },
    {
      id: "3",
      from: "Team Lead",
      subject: "New Task Assignment",
      preview: "You have been assigned a new task that requires immediate...",
      time: "1 day ago",
      isRead: false,
      isStarred: false,
    },
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* 页面头部操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="border-app-border hover:bg-app-content-bg"
          >
            <MailOpen className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
          <Button
            variant="outline"
            className="border-app-border hover:bg-app-content-bg"
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
        </div>
        <div className="text-sm text-gray-400">
          {messages.filter((m) => !m.isRead).length} unread messages
        </div>
      </div>

      {/* 消息列表 */}
      <div className="space-y-2 mt-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-center gap-4 p-4 rounded-lg border hover:bg-app-bg transition-colors cursor-pointer ${
              !message.isRead
                ? "bg-blue-950/30 border-blue-800"
                : "bg-app-content-bg border-app-border"
            }`}
          >
            {/* 已读/未读指示器 */}
            <div className="flex items-center gap-2">
              {!message.isRead ? (
                <Mail className="w-4 h-4 text-blue-400" />
              ) : (
                <MailOpen className="w-4 h-4 text-gray-400" />
              )}
              <button>
                <Star
                  className={`w-4 h-4 ${
                    message.isStarred
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-400 hover:text-yellow-500"
                  }`}
                />
              </button>
            </div>

            {/* 消息内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm ${
                      !message.isRead
                        ? "font-semibold"
                        : "font-medium text-gray-300"
                    }`}
                  >
                    {message.from}
                  </span>
                  <span className="text-xs text-gray-400">{message.time}</span>
                </div>
              </div>
              <div className="mt-1">
                <h3
                  className={`text-sm ${
                    !message.isRead
                      ? "font-semibold"
                      : "font-medium text-gray-300"
                  }`}
                >
                  {message.subject}
                </h3>
                <p className="text-sm text-gray-400 mt-1 truncate">
                  {message.preview}
                </p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-app-bg"
              >
                <Archive className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-app-bg"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态提示 */}
      {messages.length === 0 && (
        <div className="text-center py-12">
          <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <div className="text-gray-400">
            <p className="text-lg font-medium">Inbox is empty</p>
            <p className="mt-2">You&apos;re all caught up!</p>
          </div>
        </div>
      )}
    </div>
  );
}
