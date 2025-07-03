'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RiFileTextLine, RiSearchLine, RiCloseLine } from 'react-icons/ri';
import { useDocs } from './DocsProvider';

interface DocsSelectorProps {
  onClose: () => void;
}

export default function DocsSelector({ onClose }: DocsSelectorProps) {
  const router = useRouter();
  const { docs, openDocs, openDoc, workspaceType } = useDocs();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectDoc = (doc: typeof docs[0]) => {
    openDoc(doc);
    const basePath = workspaceType === 'team' ? '/team/doc' : '/personal/doc';
    router.push(`${basePath}/${doc.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-md max-h-[60vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <h3 className="text-lg font-semibold text-app-text-primary">选择文档</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-app-button-hover rounded text-app-text-secondary"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-app-border">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
            <input
              type="text"
              placeholder="搜索文档..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-app-button-hover border border-app-border rounded-md text-sm text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              autoFocus
            />
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {filteredDocs.map(doc => {
              const isOpen = openDocs.some(d => d.id === doc.id);
              
              return (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-app-button-hover text-left transition-colors ${
                    isOpen ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <RiFileTextLine className={`w-4 h-4 flex-shrink-0 ${
                    isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-app-text-secondary'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${
                      isOpen ? 'text-blue-700 dark:text-blue-400 font-medium' : 'text-app-text-primary'
                    }`}>
                      {doc.title}
                    </p>
                    {doc.parentId && (
                      <p className="text-xs text-app-text-muted truncate">
                        {docs.find(d => d.uid === doc.parentId)?.title}
                      </p>
                    )}
                  </div>
                  {isOpen && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">已打开</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}