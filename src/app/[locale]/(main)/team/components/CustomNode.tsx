import React, { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { RiEditLine, RiUserLine } from "react-icons/ri";

export interface CustomNodeData {
  label: string;
  role: string;
  color: string;
  icon?: string;
  assignee?: string;
  status?: "todo" | "in_progress" | "almost" | "done";
  isCurrentNode?: boolean;
}

const roleColors: Record<string, { border: string; bg: string; text: string }> =
  {
    product: {
      border: "border-blue-300 dark:border-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-700 dark:text-blue-400",
    },
    ui: {
      border: "border-purple-300 dark:border-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-700 dark:text-purple-400",
    },
    frontend: {
      border: "border-green-300 dark:border-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-700 dark:text-green-400",
    },
    backend: {
      border: "border-orange-300 dark:border-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-700 dark:text-orange-400",
    },
    test: {
      border: "border-red-300 dark:border-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-700 dark:text-red-400",
    },
    devops: {
      border: "border-gray-300 dark:border-gray-600",
      bg: "bg-gray-50 dark:bg-gray-900/20",
      text: "text-gray-700 dark:text-gray-400",
    },
  };

const roleIcons: Record<string, string> = {
  product: "📋",
  ui: "🎨",
  frontend: "💻",
  backend: "⚙️",
  test: "🧪",
  devops: "🔧",
};

function CustomNode({ data, isConnectable }: NodeProps<CustomNodeData>) {
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [tempAssignee, setTempAssignee] = useState(data.assignee || "");

  // 优先使用传入的颜色，如果没有则使用基于 role 的预设颜色
  const colors =
    data.color && data.color.includes(" ")
      ? // 如果 data.color 包含空格，说明是完整的 CSS 类名，直接使用
        data.color
      : // 否则使用基于 role 的预设颜色
      roleColors[data.role]
      ? `${roleColors[data.role].border} ${roleColors[data.role].bg} ${
          roleColors[data.role].text
        }`
      : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400";

  // 优先使用传入的图标，如果没有则使用基于 role 的预设图标
  const icon = data.icon || roleIcons[data.role] || "👤";

  // 状态颜色映射
  const statusColors = {
    todo: "bg-gray-400",
    in_progress: "bg-blue-500",
    almost: "bg-yellow-500",
    done: "bg-green-500",
  };

  const handleAssigneeEdit = () => {
    setTempAssignee(data.assignee || "");
    setIsEditingAssignee(true);
  };

  const handleAssigneeSave = () => {
    // 这里需要更新节点数据，在实际应用中应该通过回调函数处理
    // 暂时使用简单的方式演示
    data.assignee = tempAssignee;
    setIsEditingAssignee(false);
  };

  const handleAssigneeCancel = () => {
    setTempAssignee(data.assignee || "");
    setIsEditingAssignee(false);
  };

  return (
    <div
      className={`group px-4 py-3 rounded-lg border-2 ${colors} min-w-[140px] shadow-sm hover:shadow-md dark:shadow-black/20 transition-shadow relative ${
        data.isCurrentNode ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400 dark:bg-gray-600 border-2 border-white dark:border-app-content-bg"
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400 dark:bg-gray-600 border-2 border-white dark:border-app-content-bg"
        id="left"
      />

      {/* 状态指示器 */}
      {data.status && (
        <div
          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-app-content-bg ${
            statusColors[data.status]
          }`}
          title={`状态: ${data.status}`}
        />
      )}

      {/* 主要内容 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <div className="flex-1">
          <div className="text-xs opacity-70">{data.role}</div>
          <div className="text-sm font-semibold">{data.label}</div>
        </div>
      </div>

      {/* 负责人部分 */}
      <div className="flex items-center gap-1 text-xs">
        <RiUserLine className="w-3 h-3 opacity-70" />
        {isEditingAssignee ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              type="text"
              value={tempAssignee}
              onChange={(e) => setTempAssignee(e.target.value)}
              className="flex-1 px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="输入负责人"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAssigneeSave();
                if (e.key === "Escape") handleAssigneeCancel();
              }}
            />
            <button
              onClick={handleAssigneeSave}
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
            >
              ✓
            </button>
            <button
              onClick={handleAssigneeCancel}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-1">
            <span className="opacity-70">{data.assignee || "未分配"}</span>
            <button
              onClick={handleAssigneeEdit}
              className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-opacity"
            >
              <RiEditLine className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400 dark:bg-gray-600 border-2 border-white dark:border-app-content-bg"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400 dark:bg-gray-600 border-2 border-white dark:border-app-content-bg"
        id="right"
      />
    </div>
  );
}

export default memo(CustomNode);
