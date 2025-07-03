"use client";

import React, { useMemo, useEffect, useState } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "./blocknote.css";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import { Doc } from "@/lib/db";

interface BlockNoteEditorProps {
  doc: Doc;
  workspaceType: "team" | "personal";
}

export default function BlockNoteEditorComponent({
  doc,
  workspaceType,
}: BlockNoteEditorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  // 监听主题变化
  useEffect(() => {
    const updateTheme = () => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    };

    updateTheme();

    // 监听主题变化
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const ydoc = useMemo(() => new Y.Doc(), []);

  // 使用 IndexedDB 持久化
  const persistence = useMemo(() => {
    return new IndexeddbPersistence(`doc-${workspaceType}-${doc.uid}`, ydoc);
  }, [doc.uid, workspaceType, ydoc]);

  // WebSocket 提供者用于多人协作
  const provider = useMemo(() => {
    // 如果没有配置 WebSocket 服务器，则不启用协作
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      console.log("WebSocket URL not configured, collaboration disabled");
      return null;
    }

    try {
      const provider = new WebsocketProvider(
        wsUrl,
        `doc-${workspaceType}-${doc.uid}`,
        ydoc,
        {
          connect: true,
        }
      );

      provider.on("status", (event: { status: string }) => {
        setIsConnected(event.status === "connected");
      });

      return provider;
    } catch (error) {
      console.error("Failed to create WebSocket provider:", error);
      return null;
    }
  }, [doc.uid, workspaceType, ydoc]);

  // 创建 BlockNote 编辑器
  const editor: BlockNoteEditor = useCreateBlockNote({
    collaboration: provider
      ? {
          provider,
          fragment: ydoc.getXmlFragment("document-store"),
          user: {
            // TODO: 从用户上下文获取真实用户信息
            name: "用户",
            color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          },
        }
      : undefined,
  });

  // 清理
  useEffect(() => {
    return () => {
      provider?.destroy();
      persistence.destroy();
      ydoc.destroy();
    };
  }, [provider, persistence, ydoc]);

  return (
    <div className="h-full w-full bg-app-content-bg">
      {provider && (
        <div className="px-8 py-2 text-xs text-app-text-muted flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {isConnected ? "已连接协作服务器" : "未连接协作服务器"}
        </div>
      )}
      <BlockNoteView editor={editor} theme={theme} className="h-full" />
    </div>
  );
}
