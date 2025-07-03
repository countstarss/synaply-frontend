"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomNode from "./CustomNode";
import NodePanel, { NodeType } from "./NodePanel";
import { initialNodes, initialEdges } from "./initialElements";
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
} from "../../../../../types/team";
import { generateId } from "../utils/storage";

const nodeTypes = {
  custom: CustomNode,
};

let id = 6;
const getId = () => `${id++}`;

interface WorkflowEditorProps {
  workflow?: Workflow | null;
  onSave?: (workflow: Workflow) => void;
  onCancel?: () => void;
}

function Flow({ workflow, onSave, onCancel }: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflow?.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    workflow?.edges || initialEdges
  );
  const [workflowName, setWorkflowName] = useState(workflow?.name || "");
  const [workflowDescription, setWorkflowDescription] = useState(
    workflow?.description || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const { project } = useReactFlow();

  // Update nodes and edges when workflow prop changes
  useEffect(() => {
    if (workflow) {
      setNodes(workflow.nodes || initialNodes);
      setEdges(workflow.edges || initialEdges);
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description);
    } else {
      setNodes(initialNodes);
      setEdges(initialEdges);
      setWorkflowName("");
      setWorkflowDescription("");
    }
  }, [workflow, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge = {
        ...params,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const data = event.dataTransfer.getData("application/reactflow");

      if (typeof data === "undefined" || !data || !reactFlowBounds) {
        return;
      }

      const nodeType: NodeType = JSON.parse(data);
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: getId(),
        type: "custom",
        position,
        data: {
          label: nodeType.label,
          role: nodeType.role,
          color: nodeType.color,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const newLabel = prompt("输入新的节点名称:", node.data.label);
      if (newLabel) {
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                data: { ...n.data, label: newLabel },
              };
            }
            return n;
          })
        );
      }
    },
    [setNodes]
  );

  const onAddNode = useCallback(
    (nodeType: NodeType) => {
      const newNode: Node = {
        id: getId(),
        type: "custom",
        position: { x: Math.random() * 500, y: Math.random() * 300 },
        data: {
          label: nodeType.label,
          role: nodeType.role,
          color: nodeType.color,
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleSave = async () => {
    if (!workflowName.trim()) {
      alert("请输入工作流名称");
      return;
    }

    setIsSaving(true);

    const workflowData: Workflow = {
      id: workflow?.id || generateId(),
      name: workflowName.trim(),
      description: workflowDescription.trim(),
      nodes: nodes as WorkflowNode[],
      edges: edges as WorkflowEdge[],
      createdAt: workflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: workflow?.createdBy || "当前用户", // 这里应该从用户上下文获取
      tags: workflow?.tags || [],
    };

    if (onSave) {
      onSave(workflowData);
    }

    setIsSaving(false);
  };

  const proOptions = { hideAttribution: true };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Workflow Info Form */}
      <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
        <div className="flex flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              工作流名称
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="输入工作流名称..."
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              描述
            </label>
            <input
              type="text"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              placeholder="输入工作流描述..."
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
              >
                取消
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !workflowName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isSaving ? "保存中..." : "保存工作流"}
            </button>
          </div>
        </div>
      </div>

      {/* ReactFlow Editor */}
      <div className="w-full h-[calc(100vh-300px)] bg-app-button-hover dark:bg-app-content-bg rounded-lg border border-app-border relative">
        <NodePanel onAddNode={onAddNode} />
        <div className="w-full h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={onNodeDoubleClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            proOptions={proOptions}
          >
            <Controls className="!bg-app-content-bg !border-app-border" />
            <MiniMap className="!bg-app-content-bg !border-app-border" />
            <Background
              variant={BackgroundVariant.Dots}
              gap={12}
              size={1}
              className="!bg-transparent"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowEditor({
  workflow,
  onSave,
  onCancel,
}: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <Flow workflow={workflow} onSave={onSave} onCancel={onCancel} />
    </ReactFlowProvider>
  );
}
