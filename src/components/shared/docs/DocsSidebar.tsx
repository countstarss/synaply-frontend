"use client";

import React, { useState, useRef, useEffect } from "react";
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
  RiFolderAddLine,
  RiFileAddLine,
} from "react-icons/ri";
import { Doc } from "@/lib/db";
import { useDocs } from "./DocsContext";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";

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
  newlyCreatedDocId?: string; // 新创建的文档ID，用于自动进入编辑状态
  onNewDocCreated?: (docId: string) => void; // 新文档创建后的回调
}

// MARK: 文档树节点
function TreeNode({
  doc,
  docs,
  level,
  activeDocId,
  onSelectDoc,
  expandedIds,
  onToggleExpand,
  newlyCreatedDocId,
  onNewDocCreated,
}: TreeNodeProps) {
  const { createDoc, createFolder, deleteDoc, updateDocTitle } = useDocs();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(doc.title);
  const [showMenu, setShowMenu] = useState(false);
  const [isHoveringNode, setIsHoveringNode] = useState(false);

  // Refs for click outside and mouse leave detection
  const nodeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const childDocs = docs.filter((d) => d.parentId === doc.uid);
  const hasChildren = childDocs.length > 0;
  const isExpanded = expandedIds.has(doc.uid);
  const isActive = activeDocId === doc.uid;

  // 如果这是新创建的文档，自动进入编辑状态
  useEffect(() => {
    if (newlyCreatedDocId === doc.uid && doc.type === "document") {
      setIsEditing(true);
      setEditTitle(doc.title);
    }
  }, [newlyCreatedDocId, doc.uid, doc.title, doc.type]);

  // Close menu when clicking outside or when mouse leaves the node area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        nodeRef.current &&
        !nodeRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    const handleMouseLeave = (event: MouseEvent) => {
      const target = event.relatedTarget as Node;
      if (
        showMenu &&
        nodeRef.current &&
        menuRef.current &&
        target &&
        !nodeRef.current.contains(target) &&
        !menuRef.current.contains(target)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      const currentNodeRef = nodeRef.current;
      const currentMenuRef = menuRef.current;

      if (currentNodeRef) {
        currentNodeRef.addEventListener("mouseleave", handleMouseLeave);
      }
      if (currentMenuRef) {
        currentMenuRef.addEventListener("mouseleave", handleMouseLeave);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        if (currentNodeRef) {
          currentNodeRef.removeEventListener("mouseleave", handleMouseLeave);
        }
        if (currentMenuRef) {
          currentMenuRef.removeEventListener("mouseleave", handleMouseLeave);
        }
      };
    }
  }, [showMenu]);

  // Auto-close menu when mouse leaves and doesn't come back within a short time
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (showMenu && !isHoveringNode) {
      timeoutId = setTimeout(() => {
        setShowMenu(false);
      }, 300); // 300ms delay before closing
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showMenu, isHoveringNode]);

  const handleCreateChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    const newDoc = await createDoc("新文档", doc.uid);
    // 确保文件夹是展开状态（而不是切换）
    if (!isExpanded) {
      onToggleExpand(doc.uid);
    }
    // 通过回调将新创建的文档ID传递给父组件
    if (onNewDocCreated) {
      onNewDocCreated(newDoc.uid);
    }
  };

  const handleCreateChildFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    await createFolder("新文件夹", doc.uid);
    // 确保文件夹是展开状态（而不是切换）
    if (!isExpanded) {
      onToggleExpand(doc.uid);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
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

  // Close menu when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setShowMenu(false);
    }
  }, [isEditing]);

  return (
    <ContextMenuWrapper>
      <div className="select-none">
        <div
          ref={nodeRef}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group ${
            isActive
              ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
              : "hover:bg-app-button-hover text-app-text-primary"
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() =>
            !isEditing && doc.type === "document" && onSelectDoc(doc)
          }
          onMouseEnter={() => setIsHoveringNode(true)}
          onMouseLeave={() => setIsHoveringNode(false)}
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
                <div
                  ref={menuRef}
                  className="absolute right-0 top-6 bg-app-content-bg border border-app-border rounded-md shadow-lg py-1 z-50 min-w-[140px]"
                  onMouseEnter={() => setIsHoveringNode(true)}
                  onMouseLeave={() => setIsHoveringNode(false)}
                >
                  <button
                    onClick={handleCreateChild}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-app-button-hover w-full text-left text-sm"
                  >
                    <RiAddLine className="w-3.5 h-3.5" />
                    新建文档
                  </button>
                  <button
                    onClick={handleCreateChildFolder}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-app-button-hover w-full text-left text-sm"
                  >
                    <RiFolderAddLine className="w-3.5 h-3.5" />
                    新建文件夹
                  </button>
                  <hr className="my-1 border-app-border" />
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
                newlyCreatedDocId={newlyCreatedDocId}
                onNewDocCreated={onNewDocCreated}
              />
            ))}
          </div>
        )}
      </div>
    </ContextMenuWrapper>
  );
}

export default function DocsSidebar({
  docs,
  activeDocId,
  onSelectDoc,
}: DocsSidebarProps) {
  const { createDoc, createFolder } = useDocs();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newlyCreatedDocId, setNewlyCreatedDocId] = useState<
    string | undefined
  >(undefined);

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
    const newDoc = await createDoc("新文档", null);
    setNewlyCreatedDocId(newDoc.uid);
  };

  const handleCreateRootFolder = async () => {
    await createFolder("新文件夹", null);
  };

  const handleNewDocCreated = (docId: string) => {
    setNewlyCreatedDocId(docId);
  };

  // 清除新创建文档的状态（例如当用户完成编辑时）
  useEffect(() => {
    if (newlyCreatedDocId) {
      const timer = setTimeout(() => {
        setNewlyCreatedDocId(undefined);
      }, 5000); // 5秒后清除状态

      return () => clearTimeout(timer);
    }
  }, [newlyCreatedDocId]);

  const filteredDocs = searchQuery
    ? docs.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  return (
    <ContextMenuWrapper>
      <div className="w-64 flex flex-col bg-app-content-bg border-r border-app-border">
        {/* Header */}
        <div className="p-3 border-b border-app-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-app-text-primary">文档</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCreateRootDoc}
                className="p-1.5 hover:bg-app-button-hover rounded-md text-app-text-secondary"
                title="新建文档"
              >
                <RiFileAddLine className="w-4 h-4" />
              </button>
              <button
                onClick={handleCreateRootFolder}
                className="p-1.5 hover:bg-app-button-hover rounded-md text-app-text-secondary"
                title="新建文件夹"
              >
                <RiFolderAddLine className="w-4 h-4" />
              </button>
            </div>
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
        <div className="flex-1 h-[calc(100vh-160px)] p-2 z-20">
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
                    newlyCreatedDocId={newlyCreatedDocId}
                    onNewDocCreated={handleNewDocCreated}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </ContextMenuWrapper>
  );
}
