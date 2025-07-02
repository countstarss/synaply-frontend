import React from "react";

export interface NodeType {
  role: string;
  label: string;
  color: string;
  icon: string;
}

const nodeTypes: NodeType[] = [
  {
    role: "product",
    label: "产品经理",
    color:
      "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    icon: "📋",
  },
  {
    role: "ui",
    label: "UI设计师",
    color:
      "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
    icon: "🎨",
  },
  {
    role: "frontend",
    label: "前端开发",
    color:
      "border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
    icon: "💻",
  },
  {
    role: "backend",
    label: "后端开发",
    color:
      "border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
    icon: "⚙️",
  },
  {
    role: "test",
    label: "测试工程师",
    color:
      "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
    icon: "🧪",
  },
  {
    role: "devops",
    label: "DevOps",
    color:
      "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400",
    icon: "🔧",
  },
];

interface NodePanelProps {
  onAddNode?: (nodeType: NodeType) => void;
}

export default function NodePanel({}: // onAddNode
NodePanelProps) {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(nodeType)
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="absolute top-4 left-4 bg-app-content-bg rounded-lg shadow-lg dark:shadow-black/20 p-4 z-10 border border-app-border">
      <h3 className="text-sm font-semibold mb-3 text-app-text-primary">
        节点类型
      </h3>
      <div className="space-y-2">
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.role}
            className={`${nodeType.color} border-2 px-3 py-2 rounded-lg cursor-move flex items-center gap-2 hover:shadow-md dark:hover:shadow-black/10 transition-shadow`}
            onDragStart={(event) => onDragStart(event, nodeType)}
            draggable
          >
            <span>{nodeType.icon}</span>
            <span className="text-sm font-medium">{nodeType.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
