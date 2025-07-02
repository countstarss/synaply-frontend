import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface CustomNodeData {
  label: string;
  role: string;
  color: string;
  icon?: string;
}

const roleColors: Record<string, { border: string; bg: string; text: string }> = {
  product: { 
    border: 'border-blue-300', 
    bg: 'bg-blue-50', 
    text: 'text-blue-700' 
  },
  ui: { 
    border: 'border-purple-300', 
    bg: 'bg-purple-50', 
    text: 'text-purple-700' 
  },
  frontend: { 
    border: 'border-green-300', 
    bg: 'bg-green-50', 
    text: 'text-green-700' 
  },
  backend: { 
    border: 'border-orange-300', 
    bg: 'bg-orange-50', 
    text: 'text-orange-700' 
  },
  test: { 
    border: 'border-red-300', 
    bg: 'bg-red-50', 
    text: 'text-red-700' 
  },
  devops: { 
    border: 'border-gray-300', 
    bg: 'bg-gray-50', 
    text: 'text-gray-700' 
  },
};

const roleIcons: Record<string, string> = {
  product: '📋',
  ui: '🎨',
  frontend: '💻',
  backend: '⚙️',
  test: '🧪',
  devops: '🔧',
};

function CustomNode({ data, isConnectable }: NodeProps<CustomNodeData>) {
  const colors = roleColors[data.role] || {
    border: 'border-gray-300',
    bg: 'bg-gray-50',
    text: 'text-gray-700'
  };
  const icon = roleIcons[data.role] || '👤';

  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors.border} ${colors.bg} ${colors.text} min-w-[140px] shadow-sm hover:shadow-md transition-shadow`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        id="left"
      />
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="text-xs opacity-70">{data.role}</div>
          <div className="text-sm font-semibold">{data.label}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
        id="right"
      />
    </div>
  );
}

export default memo(CustomNode);