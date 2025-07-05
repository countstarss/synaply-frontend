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
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
} from "../../../../../types/team";
import { generateId } from "../utils/storage";
import NodeSettingsModal from "./NodeSettingsModal";
import { nodeStorage } from "../utils/node-storage";
import WorkflowEditorToolbar from "./WorkflowEditorToolbar";
import { getColorClasses } from "./SimpleColorPicker";

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
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);
  const [workflowName, setWorkflowName] = useState(workflow?.name || "");
  const [workflowDescription, setWorkflowDescription] = useState(
    workflow?.description || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isNodePanelCollapsed, setIsNodePanelCollapsed] = useState(false);
  const [isNodeSettingsModalOpen, setIsNodeSettingsModalOpen] = useState(false);
  const [customNodeTypes, setCustomNodeTypes] = useState<NodeType[]>([]);
  const [isDraft, setIsDraft] = useState(workflow?.isDraft || false);
  const { project } = useReactFlow();

  // Load custom node types
  useEffect(() => {
    setCustomNodeTypes(nodeStorage.getAll());
  }, []);

  const toggleNodePanelCollapse = () => {
    setIsNodePanelCollapsed(!isNodePanelCollapsed);
  };

  const handleCustomNodesSave = (nodes: NodeType[]) => {
    setCustomNodeTypes(nodes);
  };

  // Update nodes and edges when workflow prop changes
  useEffect(() => {
    if (workflow) {
      setNodes(workflow.nodes || []);
      setEdges(workflow.edges || []);
      setWorkflowName(workflow.name || "");
      setWorkflowDescription(workflow.description || "");
      setIsDraft(workflow.isDraft || false);
    } else {
      setNodes([]);
      setEdges([]);
      setWorkflowName("");
      setWorkflowDescription("");
      setIsDraft(true);
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
          color: nodeType.color.includes(" ")
            ? nodeType.color
            : getColorClasses(nodeType.color),
          icon: nodeType.icon,
          assignee: undefined,
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

  const handleSave = async (saveAsDraft = false) => {
    setIsSaving(true);

    const finalName = workflowName.trim() || "未命名工作流";

    const workflowData: Workflow = {
      id: workflow?.id || generateId(),
      name: finalName,
      description: workflowDescription.trim(),
      nodes: nodes as WorkflowNode[],
      edges: edges as WorkflowEdge[],
      createdAt: workflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: workflow?.createdBy || "当前用户", // 这里应该从用户上下文获取
      tags: workflow?.tags || [],
      isDraft: saveAsDraft,
    };

    if (onSave) {
      onSave(workflowData);
    }

    setIsDraft(saveAsDraft);
    setIsSaving(false);
  };

  const handleSaveWorkflow = () => handleSave(false);
  const handleSaveAsDraft = () => handleSave(true);

  const proOptions = { hideAttribution: true };

  return (
    <div className="w-full h-full relative">
      {/* Workflow Editor Toolbar */}
      <WorkflowEditorToolbar
        workflowName={workflowName || "未命名工作流"}
        isDraft={isDraft}
        isSaving={isSaving}
        onSave={handleSaveWorkflow}
        onSaveAsDraft={handleSaveAsDraft}
        onGoBack={onCancel || (() => {})}
        disabled={false}
      />

      {/* Node Panel */}
      <NodePanel
        isCollapsed={isNodePanelCollapsed}
        onToggleCollapse={toggleNodePanelCollapse}
        onManageNodes={() => setIsNodeSettingsModalOpen(true)}
        customNodeTypes={customNodeTypes}
      />

      {/* ReactFlow Editor */}
      <div className="w-full h-full bg-app-bg" ref={reactFlowWrapper}>
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

      {/* Modals */}
      <NodeSettingsModal
        isOpen={isNodeSettingsModalOpen}
        onClose={() => setIsNodeSettingsModalOpen(false)}
        onSave={handleCustomNodesSave}
      />
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
