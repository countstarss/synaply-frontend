'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Doc, WorkspaceType } from './types';

interface DocsContextType {
  docs: Doc[];
  openDocs: Doc[];
  activeDocId: string | null;
  setActiveDocId: (id: string | null) => void;
  openDoc: (doc: Doc) => void;
  closeDoc: (docId: string) => void;
  workspaceType: WorkspaceType;
}

const DocsContext = createContext<DocsContextType | undefined>(undefined);

// Mock data - 实际项目中应该从 API 获取
const mockTeamDocs: Doc[] = [
  {
    id: '1',
    title: '团队规范',
    content: '# 团队规范\n\n这是我们团队的开发规范文档...',
    parentId: null,
    children: ['2', '3'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    workspace: 'team'
  },
  {
    id: '2',
    title: '代码规范',
    content: '## 代码规范\n\n### JavaScript/TypeScript\n- 使用 ESLint\n- 使用 Prettier',
    parentId: '1',
    children: [],
    createdAt: '2024-01-02',
    updatedAt: '2024-01-10',
    workspace: 'team'
  },
  {
    id: '3',
    title: 'Git 规范',
    content: '## Git 规范\n\n### 分支命名\n- feature/xxx\n- fix/xxx\n- hotfix/xxx',
    parentId: '1',
    children: [],
    createdAt: '2024-01-03',
    updatedAt: '2024-01-12',
    workspace: 'team'
  },
  {
    id: '4',
    title: '项目文档',
    content: '# 项目文档\n\n项目相关的技术文档',
    parentId: null,
    children: ['5'],
    createdAt: '2024-01-05',
    updatedAt: '2024-01-16',
    workspace: 'team'
  },
  {
    id: '5',
    title: 'API 文档',
    content: '## API 文档\n\n### 用户接口\n- GET /api/users\n- POST /api/users',
    parentId: '4',
    children: [],
    createdAt: '2024-01-06',
    updatedAt: '2024-01-14',
    workspace: 'team'
  }
];

const mockPersonalDocs: Doc[] = [
  {
    id: 'p1',
    title: '个人笔记',
    content: '# 个人笔记\n\n我的学习和工作笔记',
    parentId: null,
    children: ['p2', 'p3'],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    workspace: 'personal'
  },
  {
    id: 'p2',
    title: 'React 学习笔记',
    content: '## React Hooks\n\n- useState\n- useEffect\n- useContext',
    parentId: 'p1',
    children: [],
    createdAt: '2024-01-11',
    updatedAt: '2024-01-17',
    workspace: 'personal'
  },
  {
    id: 'p3',
    title: 'TypeScript 进阶',
    content: '## TypeScript 高级类型\n\n- 泛型\n- 类型推断\n- 条件类型',
    parentId: 'p1',
    children: [],
    createdAt: '2024-01-12',
    updatedAt: '2024-01-16',
    workspace: 'personal'
  },
  {
    id: 'p4',
    title: '工作日志',
    content: '# 工作日志\n\n记录日常工作内容',
    parentId: null,
    children: [],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-18',
    workspace: 'personal'
  }
];

interface DocsProviderProps {
  children: React.ReactNode;
  workspaceType: WorkspaceType;
}

export default function DocsProvider({ children, workspaceType }: DocsProviderProps) {
  const [docs] = useState<Doc[]>(workspaceType === 'team' ? mockTeamDocs : mockPersonalDocs);
  const [openDocs, setOpenDocs] = useState<Doc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // 使用不同的 storage key 来区分 workspace
  const STORAGE_KEY = `synaply-open-docs-${workspaceType}`;

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
  }, [docs, STORAGE_KEY]);

  // 保存打开的文档到 localStorage
  useEffect(() => {
    const openDocIds = openDocs.map(d => d.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ openDocIds, activeDocId }));
  }, [openDocs, activeDocId, STORAGE_KEY]);

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
      closeDoc,
      workspaceType
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