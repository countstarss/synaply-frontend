import React from 'react';

export interface NodeType {
  role: string;
  label: string;
  color: string;
  icon: string;
}

const nodeTypes: NodeType[] = [
  { role: 'product', label: '产品经理', color: 'border-blue-300 bg-blue-50 text-blue-700', icon: '📋' },
  { role: 'ui', label: 'UI设计师', color: 'border-purple-300 bg-purple-50 text-purple-700', icon: '🎨' },
  { role: 'frontend', label: '前端开发', color: 'border-green-300 bg-green-50 text-green-700', icon: '💻' },
  { role: 'backend', label: '后端开发', color: 'border-orange-300 bg-orange-50 text-orange-700', icon: '⚙️' },
  { role: 'test', label: '测试工程师', color: 'border-red-300 bg-red-50 text-red-700', icon: '🧪' },
  { role: 'devops', label: 'DevOps', color: 'border-gray-300 bg-gray-50 text-gray-700', icon: '🔧' },
];

interface NodePanelProps {
  onAddNode: (nodeType: NodeType) => void;
}

export default function NodePanel({ onAddNode }: NodePanelProps) {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
      <h3 className="text-sm font-semibold mb-3">节点类型</h3>
      <div className="space-y-2">
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.role}
            className={`${nodeType.color} border-2 px-3 py-2 rounded-lg cursor-move flex items-center gap-2 hover:shadow-md transition-shadow`}
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