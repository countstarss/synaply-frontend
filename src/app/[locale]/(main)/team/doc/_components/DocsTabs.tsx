'use client';

import React, { useState } from 'react';
import { RiCloseLine, RiFileTextLine, RiAddLine } from 'react-icons/ri';
import { Doc } from '../types';
import DocsSelector from './DocsSelector';

interface DocsTabsProps {
  openDocs: Doc[];
  activeDocId: string | null;
  onSelectDoc: (doc: Doc) => void;
  onCloseDoc: (docId: string) => void;
}

export default function DocsTabs({ openDocs, activeDocId, onSelectDoc, onCloseDoc }: DocsTabsProps) {
  const [showSelector, setShowSelector] = useState(false);

  if (openDocs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center border-b border-app-border bg-app-content-bg">
        <div className="flex items-center overflow-x-auto scrollbar-thin">
          {openDocs.map((doc) => {
            const isActive = doc.id === activeDocId;
            
            return (
              <div
                key={doc.id}
                className={`group flex items-center gap-2 px-4 py-2 border-r border-app-border cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-app-bg text-app-text-primary'
                    : 'hover:bg-app-button-hover text-app-text-secondary'
                }`}
                onClick={() => onSelectDoc(doc)}
              >
                <RiFileTextLine className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate max-w-[150px]">{doc.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseDoc(doc.id);
                  }}
                  className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <RiCloseLine className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        
        {/* Tab overflow indicator */}
        <div className="flex-1 h-full border-b-2 border-transparent" />
        
        {/* Add new doc button */}
        <button
          onClick={() => setShowSelector(true)}
          className="p-2 mr-2 hover:bg-app-button-hover rounded text-app-text-secondary hover:text-app-text-primary"
          title="打开文档"
        >
          <RiAddLine className="w-4 h-4" />
        </button>
      </div>

      {showSelector && (
        <DocsSelector onClose={() => setShowSelector(false)} />
      )}
    </>
  );
}