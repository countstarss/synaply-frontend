'use client';

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Doc } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { useDocStore } from '@/stores/doc-store'; // 导入 Zustand store

interface DocsContextType {
  docs: Doc[];
  openDocs: Doc[];
  activeDocId: string | null;
  // setActiveDocId: (id: string | null) => void; // 由 Zustand 管理
  openDoc: (doc: Doc) => void;
  closeDoc: (uid: string) => void;
  createDoc: (title: string, parentId: string | null) => Promise<Doc>;
  deleteDoc: (uid: string) => Promise<void>;
  updateDocTitle: (uid: string, title: string) => Promise<void>;
  workspaceType: 'team' | 'personal';
}

const DocsContext = createContext<DocsContextType | undefined>(undefined);

export const useDocs = () => {
  const context = useContext(DocsContext);
  if (!context) {
    throw new Error('useDocs must be used within a DocsProvider');
  }
  return context;
};

interface DocsProviderProps {
  children: React.ReactNode;
  workspaceType: 'team' | 'personal';
}

export default function DocsProvider({ children, workspaceType }: DocsProviderProps) {
  const [openDocs, setOpenDocs] = useState<Doc[]>([]);
  const [initialized, setInitialized] = useState(false);

  // 从 Zustand store 获取 activeDocId 和 setActiveDocId
  const activeDocId = useDocStore((state) => state.activeDocId);
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);

  // 使用 Dexie 查询数据库中的文档
  const docs = useLiveQuery(
    () => db.docs
      .where('workspaceType')
      .equals(workspaceType)
      .toArray(),
    [workspaceType]
  ) || [];

  // 初始化示例文档
  useEffect(() => {
    const initDemoData = async () => {
      const existingDocs = await db.docs
        .where('workspaceType')
        .equals(workspaceType)
        .count();
      
      if (existingDocs === 0) {
        // 创建示例文档
        if (workspaceType === 'team') {
          const teamFolderId = uuidv4();
          const projectFolderId = uuidv4();
          
          await db.docs.bulkAdd([
            {
              uid: teamFolderId,
              title: '团队规范',
              parentId: null,
              workspaceType: 'team',
              createdAt: new Date(),
              updatedAt: new Date(),
              order: 0
            },
            {
              uid: uuidv4(),
              title: '代码规范',
              parentId: teamFolderId,
              workspaceType: 'team',
              createdAt: new Date(),
              updatedAt: new Date(),
              order: 0
            },
            {
              uid: uuidv4(),
              title: 'Git 工作流',
              parentId: teamFolderId,
              workspaceType: 'team',
              createdAt: new Date(),
              updatedAt: new Date(),
              order: 1
            },
            {
              uid: projectFolderId,
              title: '项目文档',
              parentId: null,
              workspaceType: 'team',
              createdAt: new Date(),
              updatedAt: new Date(),
              order: 1
            },
            {
              uid: uuidv4(),
              title: 'API 文档',
              parentId: projectFolderId,
              workspaceType: 'team',
              createdAt: new Date(),
              updatedAt: new Date(),
              order: 0
            }
          ]);
        } else {
          const personalFolderId = uuidv4();
          
          await db.docs.bulkAdd([
            {
              uid: personalFolderId,
              title: '个人笔记',
              parentId: null,
              workspaceType: 'personal',
              createdAt: new Date(),
              updatedAt: new Date(),
              order: 0
            },
            {
              uid: uuidv4(),
              title: 'React 学习笔记',
              parentId: personalFolderId,
              workspaceType: 'personal',
              createdAt: new Date(),
              updatedAt: new Date(),
              order: 0
            },
            {
              uid: uuidv4(),
              title: 'TypeScript 进阶',
              parentId: personalFolderId,
              workspaceType: 'personal',
              createdAt: new Date(),
              updatedAt: new Date(),
              order: 1
            },
            {
              uid: uuidv4(),
              title: '工作日志',
              parentId: null,
              workspaceType: 'personal',
              createdAt: new Date(),
              updatedAt: new Date(),
              order: 1
            }
          ]);
        }
      }
      setInitialized(true);
    };

    if (!initialized) {
      initDemoData();
    }
  }, [workspaceType, initialized]);

  // 从 localStorage 恢复打开的文档
  useEffect(() => {
    const storageKey = `synaply-open-docs-${workspaceType}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const openDocIds = JSON.parse(stored);
        const restoredDocs = docs.filter(doc => openDocIds.includes(doc.uid));
        setOpenDocs(restoredDocs);
        if (restoredDocs.length > 0) {
          setActiveDocId(restoredDocs[0].uid);
        }
      } catch (error) {
        console.error('Failed to restore open docs:', error);
      }
    }
  }, [docs, workspaceType]);

  // 保存打开的文档到 localStorage
  useEffect(() => {
    const storageKey = `synaply-open-docs-${workspaceType}`;
    const openDocIds = openDocs.map(doc => doc.uid);
    localStorage.setItem(storageKey, JSON.stringify(openDocIds));
  }, [openDocs, workspaceType]);

  const openDoc = (doc: Doc) => {
    if (!openDocs.find(d => d.uid === doc.uid)) {
      setOpenDocs([...openDocs, doc]);
    }
    setActiveDocId(doc.uid);
  };

  const closeDoc = (uid: string) => {
    setOpenDocs(openDocs.filter(d => d.uid !== uid));
    if (activeDocId === uid) {
      const remaining = openDocs.filter(d => d.uid !== uid);
      setActiveDocId(remaining.length > 0 ? remaining[0].uid : null);
    }
  };

  const createDoc = async (title: string, parentId: string | null = null): Promise<Doc> => {
    const newDoc: Omit<Doc, 'id'> = {
      uid: uuidv4(),
      title,
      parentId,
      workspaceType,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: docs.length
    };

    const id = await db.docs.add(newDoc as Doc);
    const doc = await db.docs.get(id);
    if (!doc) throw new Error('Failed to create document');
    
    openDoc(doc);
    return doc;
  };

  const deleteDoc = async (uid: string) => {
    const doc = docs.find(d => d.uid === uid);
    if (!doc || !doc.id) return;

    // 删除子文档
    const childDocs = docs.filter(d => d.parentId === uid);
    for (const child of childDocs) {
      await deleteDoc(child.uid);
    }

    // 删除文档
    await db.docs.delete(doc.id);
    closeDoc(uid);
  };

  const updateDocTitle = async (uid: string, title: string) => {
    const doc = docs.find(d => d.uid === uid);
    if (!doc || !doc.id) return;

    await db.docs.update(doc.id, {
      title,
      updatedAt: new Date()
    });
  };

  return (
    <DocsContext.Provider
      value={{
        docs,
        openDocs,
        activeDocId,
        // setActiveDocId, // 由 Zustand 管理
        openDoc,
        closeDoc,
        createDoc,
        deleteDoc,
        updateDocTitle,
        workspaceType
      }}
    >
      {children}
    </DocsContext.Provider>
  );
}