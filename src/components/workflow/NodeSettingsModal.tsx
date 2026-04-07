import React, { useState, useEffect } from "react";
import {
  RiCloseLine,
  RiEditLine,
  RiDeleteBinLine,
  RiSaveLine,
  RiUploadCloudLine,
  RiDownloadCloudLine,
  RiUserLine,
} from "react-icons/ri";
import { NodeType } from "./NodePanel";
import { nodeStorage } from "@/app/[locale]/(main)/(team)/team/_utils/node-storage";
import { generateId } from "@/app/[locale]/(main)/(team)/team/_utils/storage";
import SimpleColorPicker from "@/app/[locale]/(main)/(team)/team/_components/SimpleColorPicker";
import { useTeamMembers } from "@/hooks/useTeam";
import { useCurrentTeam } from "@/hooks/useTeam";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // MARK: 获取团队成员
  const { team } = useCurrentTeam();
  const { data: teamMembers = [], isLoading: isLoadingMembers } =
    useTeamMembers(team?.id);

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

  const handleAssigneeChange = (value: string) => {
    // 通过 user.id 查找成员，获取展示用名称
    const member = teamMembers.find((m) => m.user.id === value);
    const displayName =
      member?.user.name || member?.user.email.split("@")[0] || value;

    setNewNodeForm((prev) => ({
      ...prev,
      assigneeId: value,
      assigneeName: displayName,
    }));
  };

  // MARK: 保存节点
  const handleSaveNode = () => {
    if (
      !newNodeForm.label ||
      !newNodeForm.role ||
      !newNodeForm.color ||
      !newNodeForm.icon ||
      !newNodeForm.assigneeId ||
      !newNodeForm.assigneeName
    ) {
      alert("请填写所有必填字段");
      return;
    }

    let updatedNodes: NodeType[];
    if (editingNode) {
      updatedNodes = customNodes.map((node) =>
        node.id === editingNode.id
          ? ({
              ...editingNode,
              ...newNodeForm,
              id: editingNode.id,
              assigneeId: newNodeForm.assigneeId,
              assigneeName: newNodeForm.assigneeName,
            } as NodeType)
          : node
      );
    } else {
      const newNode: NodeType = {
        id: generateId(),
        ...newNodeForm,
        assigneeId: newNodeForm.assigneeId,
        assigneeName: newNodeForm.assigneeName,
      } as NodeType;
      updatedNodes = [...customNodes, newNode];
    }

    nodeStorage.saveAll(updatedNodes);
    setCustomNodes(updatedNodes);
    setEditingNode(null);
    setNewNodeForm({});
    onSave(updatedNodes); // 通知父组件更新
  };

  // MARK: 编辑节点
  const handleEditClick = (node: NodeType) => {
    setEditingNode(node);
    setNewNodeForm({
      ...node,
      assigneeId: node.assigneeId || "",
      assigneeName: node.assigneeName || "",
    });
  };

  // MARK: 删除节点
  const handleDeleteNode = (id: string) => {
    if (confirm("确定要删除这个节点类型吗？")) {
      const updatedNodes = customNodes.filter((node) => node.id !== id);
      nodeStorage.saveAll(updatedNodes);
      setCustomNodes(updatedNodes);
      onSave(updatedNodes); // 通知父组件更新
    }
  };

  // MARK: 取消编辑
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
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-app-text-secondary">
                            {node.role}
                          </span>
                          {node.assigneeName && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full flex items-center gap-1">
                              <RiUserLine className="w-3 h-3" />
                              {node.assigneeName}
                            </span>
                          )}
                        </div>
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
                  负责人 *
                </label>
                {isLoadingMembers ? (
                  <div className="text-sm text-app-text-muted">
                    加载团队成员中...
                  </div>
                ) : (
                  <Select
                    value={newNodeForm.assigneeId || ""}
                    onValueChange={handleAssigneeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择负责人" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.length > 0 ? (
                        teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.user.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                                {member.user.avatar_url ? (
                                  <img
                                    src={member.user.avatar_url}
                                    alt={member.user.name}
                                    className="w-full h-full rounded-full"
                                  />
                                ) : (
                                  (member.user.name || member.user.email)[0]
                                )}
                              </div>
                              <span>
                                {member.user.name ||
                                  member.user.email.split("@")[0]}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="未找到团队成员" disabled>
                          未找到团队成员
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
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
