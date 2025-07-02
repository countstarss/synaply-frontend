'use client';

import React from 'react';
import WorkflowEditor from '../components/WorkflowEditor';

export default function Workflows() {
  return (
    <div className="h-full w-full">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">工作流管理</h1>
        <WorkflowEditor />
      </div>
    </div>
  );
}