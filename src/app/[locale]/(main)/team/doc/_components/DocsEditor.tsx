'use client';

import React, { useState } from 'react';
import { 
  RiBold, 
  RiItalic, 
  RiUnderline,
  RiListOrdered,
  RiListUnordered,
  RiH1,
  RiH2,
  RiCodeSSlashLine,
  RiQuoteText,
  RiLink,
  RiImageLine,
  RiMore2Fill
} from 'react-icons/ri';
import { Doc } from '../types';

interface DocsEditorProps {
  doc: Doc;
}

export default function DocsEditor({ doc }: DocsEditorProps) {
  const [content, setContent] = useState(doc.content);
  const [isEditing, setIsEditing] = useState(false);

  const toolbarItems = [
    { icon: <RiBold />, action: 'bold', tooltip: '粗体' },
    { icon: <RiItalic />, action: 'italic', tooltip: '斜体' },
    { icon: <RiUnderline />, action: 'underline', tooltip: '下划线' },
    { divider: true },
    { icon: <RiH1 />, action: 'h1', tooltip: '标题 1' },
    { icon: <RiH2 />, action: 'h2', tooltip: '标题 2' },
    { divider: true },
    { icon: <RiListUnordered />, action: 'ul', tooltip: '无序列表' },
    { icon: <RiListOrdered />, action: 'ol', tooltip: '有序列表' },
    { divider: true },
    { icon: <RiQuoteText />, action: 'quote', tooltip: '引用' },
    { icon: <RiCodeSSlashLine />, action: 'code', tooltip: '代码' },
    { divider: true },
    { icon: <RiLink />, action: 'link', tooltip: '链接' },
    { icon: <RiImageLine />, action: 'image', tooltip: '图片' },
  ];

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* Toolbar */}
      <div className="border-b border-app-border px-6 py-2">
        <div className="flex items-center gap-1">
          {toolbarItems.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="w-px h-6 bg-app-border mx-1" />;
            }
            
            return (
              <button
                key={index}
                className="p-2 hover:bg-app-button-hover rounded text-app-text-secondary hover:text-app-text-primary transition-colors"
                title={item.tooltip}
              >
                {item.icon}
              </button>
            );
          })}
          
          <div className="flex-1" />
          
          <button className="p-2 hover:bg-app-button-hover rounded text-app-text-secondary">
            <RiMore2Fill />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={() => setIsEditing(false)}
              className="w-full min-h-[500px] p-4 bg-transparent text-app-text-primary resize-none focus:outline-none"
              autoFocus
            />
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className="prose prose-lg dark:prose-invert max-w-none cursor-text min-h-[500px]"
            >
              <div className="text-app-text-primary">
                <h1 className="text-3xl font-bold mb-4">{doc.title}</h1>
                <div className="whitespace-pre-wrap">{content}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-app-border px-6 py-2">
        <div className="flex items-center justify-between text-xs text-app-text-muted">
          <span>最后更新: {doc.updatedAt}</span>
          <span>{content.length} 字符</span>
        </div>
      </div>
    </div>
  );
}