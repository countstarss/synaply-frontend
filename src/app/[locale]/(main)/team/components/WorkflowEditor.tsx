"use client";

import React, { useCallback, useRef } from "react";
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

const nodeTypes = {
  custom: CustomNode,
};

let id = 6;
const getId = () => `${id++}`;

function Flow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { project } = useReactFlow();

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

  const proOptions = { hideAttribution: true };

  return (
    <div className="w-full h-[calc(100vh-160px)] bg-app-button-hover dark:bg-app-content-bg rounded-lg border border-app-border relative">
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
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} className="!bg-transparent" />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function WorkflowEditor() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
