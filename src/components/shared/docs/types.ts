export interface Doc {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  children: string[];
  createdAt: string;
  updatedAt: string;
  workspace?: 'team' | 'personal';
}

export type WorkspaceType = 'team' | 'personal';