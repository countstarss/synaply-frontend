import { useState } from "react";
import { Node, Edge } from "reactflow";
import { toast } from "sonner";
import { Workflow, WorkflowNode, WorkflowEdge } from "@/types/team";
import { generateId } from "../_utils/storage";

interface WorkflowJsonData {
  id: string;
  name: string;
  description: string;
  nodes: Node[] | WorkflowNode[];
  edges: Edge[] | WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags?: string[];
  isDraft?: boolean;
  version: string;
}

interface UseWorkflowJsonOptions {
  workflow: Workflow | null | undefined;
  nodes: Node[];
  edges: Edge[];
  workflowName: string;
  workflowDescription: string;
  isDraft: boolean;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
}

export function useWorkflowJson({
  workflow,
  nodes,
  edges,
  workflowName,
  workflowDescription,
  isDraft,
  setNodes,
  setEdges,
  setWorkflowName,
  setWorkflowDescription,
}: UseWorkflowJsonOptions) {
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  // MARK: 构建工作流JSON
  const buildWorkflowJsonData = (): WorkflowJsonData => {
    return {
      id: workflow?.id || generateId(),
      name: workflowName.trim() || "未命名工作流",
      description: workflowDescription.trim(),
      nodes,
      edges,
      createdAt: workflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: workflow?.createdBy || "当前用户",
      tags: workflow?.tags || [],
      isDraft,
      version: "v1",
    };
  };

  // MARK: Flow导出为JSON
  const exportWorkflowJson = () => {
    try {
      const workflowData = buildWorkflowJsonData();

      // 生成JSON数据
      const jsonString = JSON.stringify(workflowData, null, 2);

      // 创建Blob并生成下载链接
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // 创建下载链接并触发点击
      const a = document.createElement("a");
      a.href = url;
      a.download = `${workflowName || "workflow"}-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();

      // 清理
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("导出成功", {
        description: `工作流已导出为JSON文件`,
      });
    } catch (error) {
      console.error("导出工作流失败:", error);
      toast.error("导出失败", {
        description: "导出工作流时发生错误",
      });
    }
  };

  // MARK: 导入工作流JSON
  const importWorkflowJson = () => {
    // 创建文件输入控件
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            const jsonData = JSON.parse(event.target?.result as string);
            // 验证和处理JSON数据
            if (jsonData.nodes && jsonData.edges) {
              setNodes(jsonData.nodes);
              setEdges(jsonData.edges);
              if (jsonData.name) setWorkflowName(jsonData.name);
              if (jsonData.description)
                setWorkflowDescription(jsonData.description);

              toast.success("导入成功", {
                description: `工作流"${jsonData.name || "未命名"}"已导入`,
              });
            } else {
              throw new Error("无效的工作流JSON格式");
            }
          } catch (error) {
            console.error("导入工作流失败:", error);
            toast.error("导入失败", {
              description: "无效的工作流JSON格式",
            });
          }
        };

        reader.readAsText(file);
      }
    };

    // 触发文件选择对话框
    fileInput.click();
  };

  // MARK: 查看工作流JSON
  const viewWorkflowJson = () => {
    // 构建当前工作流的JSON数据
    const workflowData = buildWorkflowJsonData();

    // 在控制台输出格式化的JSON
    console.log("工作流JSON数据:", workflowData);

    // 打开JSON查看模态框
    setIsJsonModalOpen(true);
  };

  // 记录保存的工作流数据
  const logSavedWorkflow = (workflowData: Workflow) => {
    console.log("保存的工作流数据:", workflowData);
  };

  return {
    exportWorkflowJson,
    importWorkflowJson,
    viewWorkflowJson,
    logSavedWorkflow,
    isJsonModalOpen,
    setIsJsonModalOpen,
    buildWorkflowJsonData,
  };
}
