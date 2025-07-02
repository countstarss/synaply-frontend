'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Doc } from '../types';

interface DocsContextType {
  docs: Doc[];
  openDocs: Doc[];
  activeDocId: string | null;
  setActiveDocId: (id: string | null) => void;
  openDoc: (doc: Doc) => void;
  closeDoc: (docId: string) => void;
}

const DocsContext = createContext<DocsContextType | undefined>(undefined);

// Mock data - 实际项目中应该从 API 获取
const mockDocs: Doc[] = [
  {
    id: '1',
    title: '团队规范',
    content: '# 团队规范\n\n这是我们团队的开发规范文档...',
    parentId: null,
    children: ['2', '3'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    title: '代码规范',
    content: '## 代码规范\n\n### JavaScript/TypeScript\n- 使用 ESLint\n- 使用 Prettier',
    parentId: '1',
    children: [],
    createdAt: '2024-01-02',
    updatedAt: '2024-01-10'
  },
  {
    id: '3',
    title: 'Git 规范',
    content: '## Git 规范\n\n### 分支命名\n- feature/xxx\n- fix/xxx\n- hotfix/xxx',
    parentId: '1',
    children: [],
    createdAt: '2024-01-03',
    updatedAt: '2024-01-12'
  },
  {
    id: '4',
    title: '项目文档',
    content: '# 项目文档\n\n项目相关的技术文档',
    parentId: null,
    children: ['5'],
    createdAt: '2024-01-05',
    updatedAt: '2024-01-16'
  },
  {
    id: '5',
    title: 'API 文档',
    content: '## API 文档\n\n### 用户接口\n- GET /api/users\n- POST /api/users',
    parentId: '4',
    children: [],
    createdAt: '2024-01-06',
    updatedAt: '2024-01-14'
  }
];

// 使用全局存储来保持打开的文档状态
const STORAGE_KEY = 'synaply-open-docs';

export default function DocsProvider({ children }: { children: React.ReactNode }) {
  const [docs] = useState<Doc[]>(mockDocs);
  const [openDocs, setOpenDocs] = useState<Doc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // 从 localStorage 恢复打开的文档
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { openDocIds, activeDocId: storedActiveId } = JSON.parse(stored);
        const restoredDocs = openDocIds
          .map((id: string) => docs.find(d => d.id === id))
          .filter(Boolean) as Doc[];
        
        setOpenDocs(restoredDocs);
        if (storedActiveId && restoredDocs.find(d => d.id === storedActiveId)) {
          setActiveDocId(storedActiveId);
        }
      } catch (e) {
        console.error('Failed to restore open docs:', e);
      }
    }
  }, [docs]);

  // 保存打开的文档到 localStorage
  useEffect(() => {
    const openDocIds = openDocs.map(d => d.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ openDocIds, activeDocId }));
  }, [openDocs, activeDocId]);

  const openDoc = (doc: Doc) => {
    const isOpen = openDocs.find(d => d.id === doc.id);
    
    if (!isOpen) {
      setOpenDocs([...openDocs, doc]);
    }
    
    setActiveDocId(doc.id);
  };

  const closeDoc = (docId: string) => {
    const newOpenDocs = openDocs.filter(d => d.id !== docId);
    setOpenDocs(newOpenDocs);
    
    if (activeDocId === docId) {
      setActiveDocId(newOpenDocs.length > 0 ? newOpenDocs[newOpenDocs.length - 1].id : null);
    }
  };

  return (
    <DocsContext.Provider value={{
      docs,
      openDocs,
      activeDocId,
      setActiveDocId,
      openDoc,
      closeDoc
    }}>
      {children}
    </DocsContext.Provider>
  );
}

export function useDocs() {
  const context = useContext(DocsContext);
  if (!context) {
    throw new Error('useDocs must be used within DocsProvider');
  }
  return context;
}