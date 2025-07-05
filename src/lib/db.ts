import Dexie, { Table } from "dexie";

export interface Doc {
  id?: number;
  uid: string; // unique identifier
  title: string;
  parentId: string | null;
  workspaceType: "team" | "personal";
  type: "document" | "folder"; // 文档类型：文档或文件夹
  content?: string; // 文档内容 (JSON 格式)
  description?: string; // 文件夹描述
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

export class AppDatabase extends Dexie {
  docs!: Table<Doc>;

  constructor() {
    super("SynaplyDB");
    this.version(1).stores({
      docs: "++id, uid, parentId, workspaceType, createdAt, updatedAt",
    });

    // Version 2: 添加 type 和 description 字段
    this.version(2)
      .stores({
        docs: "++id, uid, parentId, workspaceType, type, createdAt, updatedAt",
      })
      .upgrade((tx) => {
        // 为现有文档添加默认 type
        return tx
          .table("docs")
          .toCollection()
          .modify((doc) => {
            doc.type = "document"; // 现有的都设为文档类型
          });
      });

    // Version 3: 添加 content 字段
    this.version(3)
      .stores({
        docs: "++id, uid, parentId, workspaceType, type, createdAt, updatedAt",
      })
      .upgrade((tx) => {
        // 为现有文档添加空的内容
        return tx
          .table("docs")
          .toCollection()
          .modify((doc) => {
            if (doc.type === "document" && !doc.content) {
              doc.content = JSON.stringify([
                {
                  id: "initial",
                  type: "paragraph",
                  content: [],
                },
              ]); // 空的 BlockNote 内容
            }
          });
      });
  }
}

export const db = new AppDatabase();
