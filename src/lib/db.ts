import Dexie, { Table } from 'dexie';

export interface Doc {
  id?: number;
  uid: string; // unique identifier for Y.js
  title: string;
  parentId: string | null;
  workspaceType: 'team' | 'personal';
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export class AppDatabase extends Dexie {
  docs!: Table<Doc>;

  constructor() {
    super('SynaplyDB');
    this.version(1).stores({
      docs: '++id, uid, parentId, workspaceType, createdAt, updatedAt'
    });
  }
}

export const db = new AppDatabase();