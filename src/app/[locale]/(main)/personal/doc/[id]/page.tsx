'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DocsSidebar, DocsEditor, DocsTabs, useDocs } from '@/components/shared/docs';

export default function PersonalDocDetail() {
  const params = useParams();
  const router = useRouter();
  const { docs, openDocs, activeDocId, setActiveDocId, openDoc, closeDoc } = useDocs();
  
  const docId = params.id as string;
  const currentDoc = docs.find(d => d.id === docId);

  useEffect(() => {
    if (currentDoc && !openDocs.find(d => d.id === docId)) {
      openDoc(currentDoc);
    }
  }, [currentDoc, docId, openDoc, openDocs]);

  if (!currentDoc) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-app-text-muted mb-2">文档不存在</p>
          <button 
            onClick={() => router.push('/personal/doc')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            返回文档列表
          </button>
        </div>
      </div>
    );
  }

  const activeDoc = openDocs.find(d => d.id === activeDocId);

  return (
    <div className="h-full flex bg-app-bg">
      {/* Sidebar */}
      <DocsSidebar 
        docs={docs}
        activeDocId={activeDocId}
        onSelectDoc={(doc) => {
          openDoc(doc);
          router.push(`/personal/doc/${doc.id}`);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <DocsTabs
          openDocs={openDocs}
          activeDocId={activeDocId}
          onSelectDoc={(doc) => {
            setActiveDocId(doc.id);
            router.push(`/personal/doc/${doc.id}`);
          }}
          onCloseDoc={(id) => {
            closeDoc(id);
            if (id === activeDocId && openDocs.length > 1) {
              const remainingDocs = openDocs.filter(d => d.id !== id);
              const nextDoc = remainingDocs[remainingDocs.length - 1];
              router.push(`/personal/doc/${nextDoc.id}`);
            } else if (openDocs.length === 1) {
              router.push('/personal/doc');
            }
          }}
        />

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {activeDoc ? (
            <DocsEditor doc={activeDoc} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-app-text-muted mb-2">加载中...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}