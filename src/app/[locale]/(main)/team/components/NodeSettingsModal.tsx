import React, { useState, useEffect } from "react";
import {
  RiCloseLine,
  RiEditLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiUploadCloudLine,
  RiDownloadCloudLine,
} from "react-icons/ri";
import { NodeType } from "./NodePanel";
import { nodeStorage } from "../utils/node-storage";
import { generateId } from "../utils/storage";
import SimpleColorPicker from "./SimpleColorPicker";

interface NodeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodes: NodeType[]) => void;
}

export default function NodeSettingsModal({
  isOpen,
  onClose,
  onSave,
}: NodeSettingsModalProps) {
  const [customNodes, setCustomNodes] = useState<NodeType[]>([]);
  const [editingNode, setEditingNode] = useState<NodeType | null>(null);
  const [newNodeForm, setNewNodeForm] = useState<Partial<NodeType>>({});

  useEffect(() => {
    if (isOpen) {
      setCustomNodes(nodeStorage.getAll());
      setEditingNode(null);
      setNewNodeForm({});
    }
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewNodeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveNode = () => {
    if (
      !newNodeForm.label ||
      !newNodeForm.role ||
      !newNodeForm.color ||
      !newNodeForm.icon
    ) {
      alert("请填写所有必填字段");
      return;
    }

    let updatedNodes: NodeType[];
    if (editingNode) {
      updatedNodes = customNodes.map((node) =>
        node.id === editingNode.id
          ? ({ ...editingNode, ...newNodeForm, id: editingNode.id } as NodeType)
          : node
      );
    } else {
      const newNode: NodeType = {
        id: generateId(),
        ...newNodeForm,
      } as NodeType;
      updatedNodes = [...customNodes, newNode];
    }

    nodeStorage.saveAll(updatedNodes);
    setCustomNodes(updatedNodes);
    setEditingNode(null);
    setNewNodeForm({});
    onSave(updatedNodes); // 通知父组件更新
  };

  const handleEditClick = (node: NodeType) => {
    setEditingNode(node);
    setNewNodeForm(node);
  };

  const handleDeleteNode = (id: string) => {
    if (confirm("确定要删除这个节点类型吗？")) {
      const updatedNodes = customNodes.filter((node) => node.id !== id);
      nodeStorage.saveAll(updatedNodes);
      setCustomNodes(updatedNodes);
      onSave(updatedNodes); // 通知父组件更新
    }
  };

  const handleCancelEdit = () => {
    setEditingNode(null);
    setNewNodeForm({});
  };

  const handleSyncToBackend = () => {
    alert("同步到后端功能待实现");
    // TODO: 实现与后端同步的逻辑
  };

  const handleImportNodes = () => {
    alert("导入节点功能待实现");
    // TODO: 实现导入节点逻辑
  };

  const handleExportNodes = () => {
    alert("导出节点功能待实现");
    // TODO: 实现导出节点逻辑
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 dark:bg-black bg-opacity-50 flex items-center justify-center z-50 select-none">
      <div className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h2 className="text-xl font-semibold text-app-text-primary">
            管理节点类型
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-app-button-hover rounded-lg transition-colors"
          >
            <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Node List */}
          <div>
            <h3 className="text-lg font-semibold text-app-text-primary mb-4">
              现有节点
            </h3>
            <div className="space-y-3 h-[85%] overflow-y-auto pr-2">
              {customNodes.length === 0 ? (
                <p className="text-app-text-muted">暂无自定义节点</p>
              ) : (
                customNodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-3 bg-app-bg border border-app-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{node.icon}</span>
                      <div>
                        <p className="font-medium text-app-text-primary">
                          {node.label}
                        </p>
                        <p className="text-sm text-app-text-secondary">
                          {node.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(node)}
                        className="p-1.5 text-app-text-secondary hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="编辑"
                      >
                        <RiEditLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNode(node.id)}
                        className="p-1.5 text-app-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="删除"
                      >
                        <RiDeleteBinLine className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleImportNodes}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
              >
                <RiDownloadCloudLine className="w-4 h-4" />
                导入
              </button>
              <button
                onClick={handleExportNodes}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
              >
                <RiUploadCloudLine className="w-4 h-4" />
                导出
              </button>
              <button
                onClick={handleSyncToBackend}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                <RiSaveLine className="w-4 h-4" />
                同步到后端
              </button>
            </div>
          </div>

          {/* Node Form */}
          <div>
            <h3 className="text-lg font-semibold text-app-text-primary mb-4">
              {editingNode ? "编辑节点" : "新建节点"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  名称 *
                </label>
                <input
                  type="text"
                  name="label"
                  value={newNodeForm.label || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：产品经理"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  角色 *
                </label>
                <input
                  type="text"
                  name="role"
                  value={newNodeForm.role || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：product"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  图标 * (Emoji 或图片URL)
                </label>
                <input
                  type="text"
                  name="icon"
                  value={newNodeForm.icon || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：📋 或 https://example.com/icon.png"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  颜色 *
                </label>
                <SimpleColorPicker
                  value={newNodeForm.color || "blue"}
                  onChange={(colorValue) =>
                    setNewNodeForm((prev) => ({ ...prev, color: colorValue }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  标签 (逗号分隔)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={(newNodeForm.tags || []).join(",")}
                  onChange={(e) =>
                    setNewNodeForm((prev) => ({
                      ...prev,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag),
                    }))
                  }
                  className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：前端,开发"
                />
              </div>
              <div className="flex justify-end gap-3">
                {editingNode && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
                  >
                    取消编辑
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveNode}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingNode ? "保存修改" : "添加节点"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
