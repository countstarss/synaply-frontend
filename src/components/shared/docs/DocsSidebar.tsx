"use client";

import React, { useState } from "react";
import {
  RiFileTextLine,
  RiFolder3Line,
  RiFolderOpenLine,
  RiArrowRightSLine,
  RiAddLine,
  RiSearchLine,
  RiMoreLine,
  RiDeleteBinLine,
  RiEditLine,
} from "react-icons/ri";
import { Doc } from "@/lib/db";
import { useDocs } from "./DocsContext";

interface DocsSidebarProps {
  docs: Doc[];
  activeDocId: string | null;
  onSelectDoc: (doc: Doc) => void;
}

interface TreeNodeProps {
  doc: Doc;
  docs: Doc[];
  level: number;
  activeDocId: string | null;
  onSelectDoc: (doc: Doc) => void;
  expandedIds: Set<string>;
  onToggleExpand: (uid: string) => void;
}

function TreeNode({
  doc,
  docs,
  level,
  activeDocId,
  onSelectDoc,
  expandedIds,
  onToggleExpand,
}: TreeNodeProps) {
  const { createDoc, deleteDoc, updateDocTitle } = useDocs();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(doc.title);
  const [showMenu, setShowMenu] = useState(false);

  const childDocs = docs.filter((d) => d.parentId === doc.uid);
  const hasChildren = childDocs.length > 0;
  const isExpanded = expandedIds.has(doc.uid);
  const isActive = activeDocId === doc.uid;

  const handleCreateChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await createDoc("新文档", doc.uid);
    onToggleExpand(doc.uid);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `确定要删除"${doc.title}"吗？${
          hasChildren ? "这将同时删除所有子文档。" : ""
        }`
      )
    ) {
      await deleteDoc(doc.uid);
    }
  };

  const handleRename = async () => {
    if (editTitle.trim() && editTitle !== doc.title) {
      await updateDocTitle(doc.uid, editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group ${
          isActive
            ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
            : "hover:bg-app-button-hover text-app-text-primary"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => !isEditing && onSelectDoc(doc)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(doc.uid);
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <RiArrowRightSLine
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          </button>
        )}

        <div className={`${!hasChildren ? "ml-5" : ""}`}>
          {hasChildren ? (
            isExpanded ? (
              <RiFolderOpenLine className="w-4 h-4" />
            ) : (
              <RiFolder3Line className="w-4 h-4" />
            )
          ) : (
            <RiFileTextLine className="w-4 h-4" />
          )}
        </div>

        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setEditTitle(doc.title);
                setIsEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm bg-transparent border-b border-app-border outline-none"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm truncate">{doc.title}</span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={handleCreateChild}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="新建子文档"
          >
            <RiAddLine className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <RiMoreLine className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 bg-app-content-bg border border-app-border rounded-md shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-app-button-hover w-full text-left text-sm"
                >
                  <RiEditLine className="w-3.5 h-3.5" />
                  重命名
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-app-button-hover w-full text-left text-sm text-red-600 dark:text-red-400"
                >
                  <RiDeleteBinLine className="w-3.5 h-3.5" />
                  删除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {childDocs.map((child) => (
            <TreeNode
              key={child.uid}
              doc={child}
              docs={docs}
              level={level + 1}
              activeDocId={activeDocId}
              onSelectDoc={onSelectDoc}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocsSidebar({
  docs,
  activeDocId,
  onSelectDoc,
}: DocsSidebarProps) {
  const { createDoc } = useDocs();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const rootDocs = docs.filter((doc) => !doc.parentId);

  const handleToggleExpand = (uid: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(uid)) {
      newExpanded.delete(uid);
    } else {
      newExpanded.add(uid);
    }
    setExpandedIds(newExpanded);
  };

  const handleCreateRootDoc = async () => {
    await createDoc("新文档", null);
  };

  const filteredDocs = searchQuery
    ? docs.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <div className="w-64 flex flex-col bg-app-content-bg border-r border-app-border">
      {/* Header */}
      <div className="p-3 border-b border-app-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-app-text-primary">文档</h2>
          <button
            onClick={handleCreateRootDoc}
            className="p-1.5 hover:bg-app-button-hover rounded-md text-app-text-secondary"
            title="新建文档"
          >
            <RiAddLine className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
          <input
            type="text"
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-app-button-hover border border-app-border rounded-md text-sm text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Document Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredDocs ? (
          <div className="space-y-1">
            {filteredDocs.map((doc) => (
              <div
                key={doc.uid}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer ${
                  activeDocId === doc.uid
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                    : "hover:bg-app-button-hover text-app-text-primary"
                }`}
                onClick={() => onSelectDoc(doc)}
              >
                <RiFileTextLine className="w-4 h-4" />
                <span className="text-sm truncate">{doc.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {rootDocs.length === 0 ? (
              <div className="text-center py-8 text-app-text-muted text-sm">
                <p>还没有文档</p>
                <p className="mt-2">点击上方 + 按钮创建</p>
              </div>
            ) : (
              rootDocs.map((doc) => (
                <TreeNode
                  key={doc.uid}
                  doc={doc}
                  docs={docs}
                  level={0}
                  activeDocId={activeDocId}
                  onSelectDoc={onSelectDoc}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
