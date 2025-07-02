'use client';

import React, { useState } from 'react';
import { 
  RiFileTextLine, 
  RiFolder3Line, 
  RiFolderOpenLine,
  RiArrowRightSLine,
  RiAddLine,
  RiSearchLine 
} from 'react-icons/ri';
import { Doc } from '../types';

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
  onToggleExpand: (id: string) => void;
}

function TreeNode({ doc, docs, level, activeDocId, onSelectDoc, expandedIds, onToggleExpand }: TreeNodeProps) {
  const hasChildren = doc.children.length > 0;
  const isExpanded = expandedIds.has(doc.id);
  const isActive = activeDocId === doc.id;

  const childDocs = doc.children.map(childId => docs.find(d => d.id === childId)).filter(Boolean) as Doc[];

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group ${
          isActive 
            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
            : 'hover:bg-app-button-hover text-app-text-primary'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelectDoc(doc)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(doc.id);
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <RiArrowRightSLine 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            />
          </button>
        )}
        
        <div className={`${!hasChildren ? 'ml-5' : ''}`}>
          {hasChildren ? (
            isExpanded ? <RiFolderOpenLine className="w-4 h-4" /> : <RiFolder3Line className="w-4 h-4" />
          ) : (
            <RiFileTextLine className="w-4 h-4" />
          )}
        </div>
        
        <span 
          className="flex-1 text-sm truncate"
          onDoubleClick={(e) => {
            e.stopPropagation();
            onSelectDoc(doc);
          }}
        >
          {doc.title}
        </span>
        
        <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
          <RiAddLine className="w-3.5 h-3.5" />
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {childDocs.map(child => (
            <TreeNode
              key={child.id}
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

export default function DocsSidebar({ docs, activeDocId, onSelectDoc }: DocsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1', '4']));

  const rootDocs = docs.filter(doc => !doc.parentId);

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const filteredDocs = searchQuery 
    ? docs.filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <div className="w-64 flex flex-col bg-app-content-bg border-r border-app-border">
      {/* Header */}
      <div className="p-4 border-b border-app-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-app-text-primary">文档</h2>
          <button className="p-1.5 hover:bg-app-button-hover rounded-md text-app-text-secondary">
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
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer ${
                  activeDocId === doc.id 
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                    : 'hover:bg-app-button-hover text-app-text-primary'
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
            {rootDocs.map(doc => (
              <TreeNode
                key={doc.id}
                doc={doc}
                docs={docs}
                level={0}
                activeDocId={activeDocId}
                onSelectDoc={onSelectDoc}
                expandedIds={expandedIds}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}