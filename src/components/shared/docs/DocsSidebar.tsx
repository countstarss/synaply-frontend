"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
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
import { useDocs, DocsDocument } from "./DocsContext";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DocCreateDialog from "./DocCreateDialog";

interface DocsSidebarProps {
  onSelectDoc: (doc: DocsDocument) => void;
}

interface TreeNodeProps {
  doc: DocsDocument;
  level: number;
  onSelectDoc: (doc: DocsDocument) => void;
  expandedIds: Set<string>;
  onToggleExpand: (uid: string) => void;
  newlyCreatedDocId?: string;
  onNewDocCreated?: (docId: string) => void;
}

function TreeNode({
  doc,
  level,
  onSelectDoc,
  expandedIds,
  onToggleExpand,
  newlyCreatedDocId,
  onNewDocCreated,
}: TreeNodeProps) {
  const tDocs = useTranslations("docs");
  const {
    createFolder,
    deleteDoc,
    updateDocTitle,
    openDoc,
    activeDocId,
    documents,
  } = useDocs();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(doc.title);
  const [showMenu, setShowMenu] = useState(false);
  const [isHoveringNode, setIsHoveringNode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateChildDialogOpen, setIsCreateChildDialogOpen] = useState(false);

  // Refs for click outside and mouse leave detection
  const nodeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const childDocs = documents.filter((child) => child.parentDocument === doc._id);

  const hasChildren = childDocs.length > 0;
  const isExpanded = expandedIds.has(doc._id);
  const isActive = activeDocId === doc._id;

  useEffect(() => {
    if (newlyCreatedDocId === doc._id && doc.type === "document") {
      setIsEditing(true);
      setEditTitle(doc.title);
    }
  }, [newlyCreatedDocId, doc._id, doc.title, doc.type]);

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

  const handleCreateChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setIsCreateChildDialogOpen(true);
  };

  const handleCreateChildFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    await createFolder(tDocs("creation.newFolder"), doc._id);
    if (!isExpanded) {
      onToggleExpand(doc._id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    await deleteDoc(doc._id);
    setIsDeleteDialogOpen(false);
  };

  const handleRename = async () => {
    if (editTitle.trim() && editTitle !== doc.title) {
      await updateDocTitle(doc._id, editTitle.trim());
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing) {
      setShowMenu(false);
    }
  }, [isEditing]);

  return (
    <>
      <ContextMenuWrapper>
        <div className="select-none">
        <div
          ref={nodeRef}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group ${
            isActive
              ? "bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
              : "hover:bg-app-button-hover text-app-text-primary"
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() =>
            !isEditing && doc.type === "document"
              ? onSelectDoc(doc)
              : openDoc(doc)
          }
          onMouseEnter={() => setIsHoveringNode(true)}
          onMouseLeave={() => setIsHoveringNode(false)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(doc._id);
              }}
              className="rounded p-0.5 hover:bg-app-button-hover"
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
            {doc.type === "folder" && (
              <button
                onClick={handleCreateChild}
                className="rounded p-0.5 hover:bg-app-button-hover"
                title={tDocs("sidebar.newChildDoc")}
              >
                <RiAddLine className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="rounded p-0.5 hover:bg-app-button-hover"
              >
                <RiMoreLine className="w-3.5 h-3.5" />
              </button>

              {showMenu && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-6 z-50 min-w-[140px] rounded-xl border border-app-border bg-app-content-bg py-1 shadow-[0_16px_36px_rgba(15,23,42,0.12)]"
                  onMouseEnter={() => setIsHoveringNode(true)}
                  onMouseLeave={() => setIsHoveringNode(false)}
                >
                  <button
                    onClick={handleCreateChild}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-app-button-hover w-full text-left text-sm"
                  >
                    <RiAddLine className="w-3.5 h-3.5" />
                    {tDocs("sidebar.newDoc")}
                  </button>
                  <button
                    onClick={handleCreateChildFolder}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-app-button-hover w-full text-left text-sm"
                  >
                    <RiFolderAddLine className="w-3.5 h-3.5" />
                    {tDocs("sidebar.newFolder")}
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
                    {tDocs("sidebar.rename")}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-app-button-hover w-full text-left text-sm text-red-600 dark:text-red-400"
                  >
                    <RiDeleteBinLine className="w-3.5 h-3.5" />
                    {tDocs("sidebar.delete")}
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
                key={child._id}
                doc={child}
                level={level + 1}
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tDocs("sidebar.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {tDocs("sidebar.deleteDialog.description", {
                title: doc.title,
                children: hasChildren ? tDocs("sidebar.deleteDialog.children") : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="rounded-md border border-app-border px-3 py-2 text-sm text-app-text-secondary transition-colors hover:bg-app-button-hover hover:text-app-text-primary"
            >
              {tDocs("sidebar.deleteDialog.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmDelete()}
              className="rounded-md bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700"
            >
              {tDocs("sidebar.deleteDialog.confirm")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocCreateDialog
        open={isCreateChildDialogOpen}
        onOpenChange={setIsCreateChildDialogOpen}
        parentId={doc._id}
        onCreated={(createdDoc) => {
          onNewDocCreated?.(createdDoc._id);
          if (!isExpanded) {
            onToggleExpand(doc._id);
          }
        }}
      />
    </>
  );
}

export default function DocsSidebar({
  onSelectDoc,
}: DocsSidebarProps) {
  const tDocs = useTranslations("docs");
  const { documents, createFolder, isLoading, projectId } = useDocs();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newlyCreatedDocId, setNewlyCreatedDocId] = useState<
    string | undefined
  >(undefined);
  const [isCreateRootDocDialogOpen, setIsCreateRootDocDialogOpen] =
    useState(false);

  const handleToggleExpand = (uid: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(uid)) {
      newExpanded.delete(uid);
    } else {
      newExpanded.add(uid);
    }
    setExpandedIds(newExpanded);
  };

  const handleCreateRootFolder = async () => {
    await createFolder(tDocs("creation.newFolder"));
  };

  const handleNewDocCreated = (docId: string) => {
    setNewlyCreatedDocId(docId);
  };

  useEffect(() => {
    if (newlyCreatedDocId) {
      const timer = setTimeout(() => {
        setNewlyCreatedDocId(undefined);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [newlyCreatedDocId]);

  const filteredDocs = searchQuery
    ? documents.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;
  const rootDocs = documents.filter((doc) => !doc.parentDocument);

  if (isLoading) {
    return (
      <div className="flex h-full w-64 flex-col border-r border-app-border bg-app-content-bg">
        <div className="p-3 border-b border-app-border">
          <h2 className="font-semibold text-app-text-primary">{tDocs("sidebar.title")}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-app-text-muted">{tDocs("states.loadingSidebar")}</p>
        </div>
      </div>
    );
  }

  return (
    <ContextMenuWrapper>
      <div className="flex h-full w-64 flex-col border-r border-app-border bg-app-content-bg">
        {/* Header */}
        <div className="p-3 border-b border-app-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-app-text-primary">{tDocs("sidebar.title")}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCreateRootDocDialogOpen(true)}
                className="rounded-lg p-1.5 text-app-text-secondary hover:bg-app-button-hover"
                title={tDocs("sidebar.newDoc")}
              >
                <RiFileAddLine className="w-4 h-4" />
              </button>
              <button
                onClick={handleCreateRootFolder}
                className="rounded-lg p-1.5 text-app-text-secondary hover:bg-app-button-hover"
                title={tDocs("sidebar.newFolder")}
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
              placeholder={tDocs("sidebar.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-app-border bg-app-bg py-2 pl-9 pr-3 text-sm text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>

        {/* Document Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredDocs ? (
            <div className="space-y-1">
              {filteredDocs.map((doc) => (
                <div
                  key={doc._id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 ${"text-app-text-primary hover:bg-app-button-hover"}`}
                  onClick={() => onSelectDoc(doc)}
                >
                  {doc.type === "folder" ? (
                    <RiFolder3Line className="w-4 h-4" />
                  ) : (
                    <RiFileTextLine className="w-4 h-4" />
                  )}
                  <span className="text-sm truncate">{doc.title}</span>
                </div>
              ))}
              {filteredDocs.length === 0 && (
                <div className="text-center py-8 text-app-text-muted text-sm">
                  <p>{tDocs("sidebar.emptySearch")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-app-text-muted text-sm">
                  <p>{tDocs("sidebar.emptyTitle")}</p>
                  <p className="mt-2">{tDocs("sidebar.emptyDescription")}</p>
                </div>
              ) : (
                rootDocs.map((doc) => (
                  <TreeNode
                    key={doc._id}
                    doc={doc}
                    level={0}
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

      <DocCreateDialog
        open={isCreateRootDocDialogOpen}
        onOpenChange={setIsCreateRootDocDialogOpen}
        projectId={projectId}
        defaultTemplateKey={projectId ? "project-brief-v1" : "blank"}
        onCreated={(createdDoc) => handleNewDocCreated(createdDoc._id)}
      />
    </ContextMenuWrapper>
  );
}
