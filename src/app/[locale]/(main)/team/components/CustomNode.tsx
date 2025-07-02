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
    border: 'border-blue-300 dark:border-blue-600', 
    bg: 'bg-blue-50 dark:bg-blue-900/20', 
    text: 'text-blue-700 dark:text-blue-400' 
  },
  ui: { 
    border: 'border-purple-300 dark:border-purple-600', 
    bg: 'bg-purple-50 dark:bg-purple-900/20', 
    text: 'text-purple-700 dark:text-purple-400' 
  },
  frontend: { 
    border: 'border-green-300 dark:border-green-600', 
    bg: 'bg-green-50 dark:bg-green-900/20', 
    text: 'text-green-700 dark:text-green-400' 
  },
  backend: { 
    border: 'border-orange-300 dark:border-orange-600', 
    bg: 'bg-orange-50 dark:bg-orange-900/20', 
    text: 'text-orange-700 dark:text-orange-400' 
  },
  test: { 
    border: 'border-red-300 dark:border-red-600', 
    bg: 'bg-red-50 dark:bg-red-900/20', 
    text: 'text-red-700 dark:text-red-400' 
  },
  devops: { 
    border: 'border-gray-300 dark:border-gray-600', 
    bg: 'bg-gray-50 dark:bg-gray-900/20', 
    text: 'text-gray-700 dark:text-gray-400' 
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
    border: 'border-gray-300 dark:border-gray-600',
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    text: 'text-gray-700 dark:text-gray-400'
  };
  const icon = roleIcons[data.role] || '👤';

  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${colors.border} ${colors.bg} ${colors.text} min-w-[140px] shadow-sm hover:shadow-md dark:shadow-black/20 transition-shadow`}>
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