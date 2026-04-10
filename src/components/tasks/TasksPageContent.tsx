"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowUpRight,
  Bug,
  Clock3,
  Loader2,
  RefreshCw,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import WorkflowIssueDetail from "@/components/issue/WorkflowIssueDetail";
import InfoBarTabs from "@/components/layout/infobar/InfoBarTabs";
import NormalIssueDetail from "@/components/shared/issue/NormalIssueDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMyWork } from "@/hooks/useMyWork";
import {
  useAcceptWorkflowHandoff,
  useUpdateWorkflowRunStatus,
} from "@/hooks/useIssueApi";
import { useWorkspaceRealtime } from "@/hooks/realtime/useWorkspaceRealtime";
import { useWorkspace } from "@/hooks/useWorkspace";
import { priorityConfig } from "@/lib/data/issueConfig";
import { MyWorkItem, MyWorkResponse } from "@/lib/fetchers/my-work";
import { cn } from "@/lib/utils";
import { IssuePriority, IssueStatus } from "@/types/prisma";

type WorkTabId = "today" | "waiting" | "in-progress" | "blocked" | "completed";
type SectionId = "waitingForMe" | "inProgress" | "blocked" | "completedToday";

interface SectionMeta {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

interface SummaryMetricCardProps {
  tabId: WorkTabId;
  label: string;
  value: number;
  tone?: "default" | "attention" | "danger" | "success";
  active?: boolean;
  onSelect: (tabId: WorkTabId) => void;
  className?: string;
}

interface WorkSectionProps {
  meta: SectionMeta;
  items: MyWorkItem[];
  onOpenIssue: (item: MyWorkItem) => void;
  onMarkStarted: (item: MyWorkItem) => Promise<void>;
  onAcceptHandoff: (item: MyWorkItem) => Promise<void>;
  isMutatingIssueId: string | null;
}

interface WorkItemRowProps {
  item: MyWorkItem;
  onOpenIssue: (item: MyWorkItem) => void;
  onMarkStarted: (item: MyWorkItem) => Promise<void>;
  onAcceptHandoff: (item: MyWorkItem) => Promise<void>;
  isMutating: boolean;
}

const TAB_ORDER: Array<{ id: WorkTabId; label: string }> = [
  { id: "today", label: "Today" },
  { id: "waiting", label: "Waiting" },
  { id: "in-progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "completed", label: "Completed" },
];

const SECTION_META: Record<SectionId, SectionMeta> = {
  waitingForMe: {
    title: "Waiting For Me",
    description: "需要你开始、确认、review 或接手的事项。",
    emptyTitle: "现在没有需要你接球的事项",
    emptyDescription: "新的 handoff、review 和待开始工作会优先落在这里。",
  },
  inProgress: {
    title: "In Progress",
    description: "你已经开始推进、当前仍在执行中的工作。",
    emptyTitle: "当前没有进行中的事项",
    emptyDescription: "一旦你开始推进 issue 或 workflow，它会出现在这里。",
  },
  blocked: {
    title: "Blocked",
    description: "和你相关、但目前被阻塞的工作。",
    emptyTitle: "当前没有与你相关的阻塞项",
    emptyDescription: "阻塞项会集中显示在这里，避免状态散落在别处。",
  },
  completedToday: {
    title: "Completed Today",
    description: "今天已经推进完成或收尾的事项。",
    emptyTitle: "今天还没有完成项",
    emptyDescription: "当你完成 issue 或 workflow 节点后，这里会记录今天的推进结果。",
  },
};

function getSummaryToneClasses(tone: SummaryMetricCardProps["tone"]) {
  switch (tone) {
    case "attention":
      return {
        accent: "bg-sky-200/80",
        ambient:
          "radial-gradient(circle at top left, rgba(125, 211, 252, 0.14), transparent 34%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 44%)",
      };
    case "danger":
      return {
        accent: "bg-rose-300/80",
        ambient:
          "radial-gradient(circle at top left, rgba(251, 113, 133, 0.14), transparent 34%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 44%)",
      };
    case "success":
      return {
        accent: "bg-emerald-300/80",
        ambient:
          "radial-gradient(circle at top left, rgba(110, 231, 183, 0.14), transparent 34%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.08), transparent 44%)",
      };
    default:
      return {
        accent: "bg-white/60",
        ambient:
          "radial-gradient(circle at top left, rgba(255, 255, 255, 0.08), transparent 32%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.05), transparent 44%)",
      };
  }
}

function SummaryMetricCard({
  tabId,
  label,
  value,
  tone = "default",
  active = false,
  onSelect,
  className,
}: SummaryMetricCardProps) {
  const toneClasses = getSummaryToneClasses(tone);

  return (
    <button
      type="button"
      onClick={() => onSelect(tabId)}
      aria-pressed={active}
      className={cn(
        "group relative h-[118px] overflow-hidden rounded-[22px] border text-left backdrop-blur-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/12",
        active
          ? "border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.03))] shadow-[0_16px_36px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.1)]"
          : "border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.016))] shadow-[0_12px_30px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-white/10 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.058),rgba(255,255,255,0.02))] hover:shadow-[0_16px_34px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]",
        "hover:-translate-y-0.5",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-75"
        style={{ backgroundImage: toneClasses.ambient }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/[0.05] to-transparent opacity-60" />
      {active ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-4 bottom-0 h-px",
            toneClasses.accent,
          )}
        />
      ) : null}

      <div className="relative flex h-full flex-col justify-between px-4 py-4">
        <div className="text-[13px] font-medium text-app-text-secondary">
          {label}
        </div>
        <div className="text-[34px] font-semibold tracking-[-0.05em] text-app-text-primary">
          {value}
        </div>
      </div>
    </button>
  );
}

function getSummaryCardActiveState(activeTab: WorkTabId, tabId: WorkTabId) {
  if (tabId === "today") {
    return activeTab === "today";
  }

  return activeTab === tabId;
}

function renderSummaryCards(
  data: MyWorkResponse | undefined,
  activeTab: WorkTabId,
  onSelect: (tabId: WorkTabId) => void,
) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryMetricCard
        tabId="today"
        label="Today Focus"
        value={data?.counts.todayFocus || 0}
        tone="attention"
        active={getSummaryCardActiveState(activeTab, "today")}
        onSelect={onSelect}
      />
      <SummaryMetricCard
        tabId="waiting"
        label="Waiting"
        value={data?.counts.waitingForMe || 0}
        tone="attention"
        active={getSummaryCardActiveState(activeTab, "waiting")}
        onSelect={onSelect}
      />
      <SummaryMetricCard
        tabId="in-progress"
        label="In Progress"
        value={data?.counts.inProgress || 0}
        tone="default"
        active={getSummaryCardActiveState(activeTab, "in-progress")}
        onSelect={onSelect}
      />
      <SummaryMetricCard
        tabId="blocked"
        label="Blocked"
        value={data?.counts.blocked || 0}
        tone="danger"
        active={getSummaryCardActiveState(activeTab, "blocked")}
        onSelect={onSelect}
      />
      <SummaryMetricCard
        tabId="completed"
        label="Done Today"
        value={data?.counts.completedToday || 0}
        tone="success"
        active={getSummaryCardActiveState(activeTab, "completed")}
        onSelect={onSelect}
      />
    </div>
  );
}

function formatDueLabel(dueAt: string | null) {
  if (!dueAt) {
    return null;
  }

  return format(new Date(dueAt), "MM-dd");
}

function getPriorityBadge(priority: IssuePriority | null) {
  if (!priority) {
    return null;
  }

  const tone = priorityConfig[priority];

  if (!tone) {
    return null;
  }

  return (
    <Badge variant="outline" className={cn("border", tone.color)}>
      {tone.label}
    </Badge>
  );
}

function getActionTone(item: MyWorkItem) {
  switch (item.currentActionType) {
    case "review":
      return "border-blue-500/30 bg-blue-500/10 text-blue-200";
    case "handoff":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
    case "blocked":
      return "border-red-500/30 bg-red-500/10 text-red-200";
    case "execution":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "done":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    default:
      return "border-white/[0.06] bg-white/[0.035] text-app-text-secondary";
  }
}

function getSourceMeta(item: MyWorkItem) {
  if (item.sourceType === "workflow") {
    return {
      label: "Workflow",
      icon: <Workflow className="size-3.5" />,
    };
  }

  return {
    label: "Issue",
    icon: <Bug className="size-3.5" />,
  };
}

function getQuickActionLabel(item: MyWorkItem) {
  if (
    item.sourceType === "workflow" &&
    item.currentActionType === "handoff"
  ) {
    return "Accept";
  }

  if (
    item.sourceType === "workflow" &&
    item.currentActionType === "todo" &&
    item.status === IssueStatus.TODO
  ) {
    return "Mark Started";
  }

  if (item.currentActionType === "review") {
    return "Open Review";
  }

  return "Open";
}

function getQueueMeta(item: MyWorkItem) {
  if (item.currentActionType === "review" && item.targetName) {
    return `Reviewer · ${item.targetName}`;
  }

  if (item.currentActionType === "handoff" && item.targetName) {
    return `Handoff · ${item.targetName}`;
  }

  if (item.assigneeName) {
    return `Owner · ${item.assigneeName}`;
  }

  return item.sourceType === "workflow" ? "Workflow run" : "Issue";
}

function getSignalCopy(item: MyWorkItem) {
  if (item.currentActionType === "blocked" && item.blockedReason) {
    return item.blockedReason;
  }

  if (item.currentStepName) {
    return item.currentStepName;
  }

  return item.statusLabel;
}

function WorkItemRow({
  item,
  onOpenIssue,
  onMarkStarted,
  onAcceptHandoff,
  isMutating,
}: WorkItemRowProps) {
  const sourceMeta = getSourceMeta(item);
  const priorityBadge = getPriorityBadge(item.priority);
  const dueLabel = formatDueLabel(item.dueAt);
  const showAcceptHandoff =
    item.sourceType === "workflow" && item.currentActionType === "handoff";
  const showMarkStarted =
    item.sourceType === "workflow" &&
    item.currentActionType === "todo" &&
    item.status === IssueStatus.TODO;

  const handleQuickAction = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (showAcceptHandoff) {
      await onAcceptHandoff(item);
      return;
    }

    if (showMarkStarted) {
      await onMarkStarted(item);
      return;
    }

    onOpenIssue(item);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onOpenIssue(item);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleRowKeyDown}
      onClick={() => onOpenIssue(item)}
      aria-label={`Open ${item.title}`}
      className="group block w-full px-2 py-2 text-left focus:outline-none"
    >
      <div
        className={cn(
          "grid items-start gap-4 rounded-[18px] border border-transparent px-4 py-4 transition-all duration-200 md:grid-cols-[minmax(0,1.6fr)_minmax(190px,0.85fr)_minmax(190px,0.9fr)_auto]",
          "group-hover:border-white/[0.06] group-hover:bg-white/[0.028] group-hover:shadow-[0_1px_0_rgba(255,255,255,0.02)_inset]",
          "group-focus-visible:border-white/[0.08] group-focus-visible:bg-white/[0.035] group-focus-visible:ring-1 group-focus-visible:ring-white/[0.08]",
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {item.issueKey ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-app-text-muted">
                {item.issueKey}
              </span>
            ) : null}
            <Badge
              variant="outline"
              className="gap-1 border-white/[0.06] bg-white/[0.03] text-app-text-secondary"
            >
              {sourceMeta.icon}
              {sourceMeta.label}
            </Badge>
            <Badge
              variant="outline"
              className={cn("border", getActionTone(item))}
            >
              {item.currentActionLabel}
            </Badge>
          </div>

          <div className="mt-3 flex items-start gap-3">
            <div
              className={cn(
                "mt-1 size-2 shrink-0 rounded-full",
              item.currentActionType === "blocked"
                ? "bg-red-400"
                : item.currentActionType === "done"
                  ? "bg-emerald-400"
                  : item.currentActionType === "execution"
                    ? "bg-amber-300"
                    : "bg-white/60",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-medium tracking-[-0.01em] text-app-text-primary">
                {item.title}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-app-text-muted">
                <span>{item.projectName || "未归属项目"}</span>
                <span>·</span>
                <span>{getQueueMeta(item)}</span>
              </div>
              {item.blockedReason && item.currentActionType !== "blocked" ? (
                <div className="mt-2 text-[12px] text-red-300">{item.blockedReason}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted">
            Context
          </div>
          <div className="mt-2 text-sm text-app-text-primary">
            {item.projectName || "Workspace queue"}
          </div>
          <div className="mt-1 text-[12px] text-app-text-muted">
            {item.currentStepName || item.statusLabel}
          </div>
        </div>

        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted">
            Signal
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {priorityBadge}
            {dueLabel ? (
              <Badge
                variant="outline"
                className={cn(
                  "border-white/[0.06] bg-white/[0.03]",
                  item.isOverdue ? "text-red-300" : "text-app-text-secondary",
                )}
              >
                Due {dueLabel}
              </Badge>
            ) : null}
          </div>
          <div
            className={cn(
              "mt-2 text-[12px] leading-5",
              item.currentActionType === "blocked"
                ? "text-red-300"
                : "text-app-text-muted",
            )}
          >
            {getSignalCopy(item)}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-start md:justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] text-app-text-secondary hover:border-white/[0.08] hover:bg-white/[0.045] hover:text-app-text-primary"
            onClick={handleQuickAction}
            disabled={isMutating}
          >
            {isMutating ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <ArrowUpRight data-icon="inline-start" />
            )}
            {getQuickActionLabel(item)}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptySectionState({ meta }: { meta: SectionMeta }) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
      <div className="text-sm font-medium text-app-text-primary">
        {meta.emptyTitle}
      </div>
      <div className="mt-2 text-sm text-app-text-muted">
        {meta.emptyDescription}
      </div>
    </div>
  );
}

function WorkSection({
  meta,
  items,
  onOpenIssue,
  onMarkStarted,
  onAcceptHandoff,
  isMutatingIssueId,
}: WorkSectionProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.018] shadow-[0_1px_0_rgba(255,255,255,0.015)_inset]">
      <CardHeader className="gap-2 border-b border-white/[0.045] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base text-app-text-primary">
              {meta.title}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-sm text-app-text-muted">
          {meta.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {items.length === 0 ? (
          <div className="px-5 py-5">
            <EmptySectionState meta={meta} />
          </div>
        ) : (
          <>
            <div className="hidden border-b border-white/[0.04] bg-white/[0.015] px-4 py-2 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(190px,0.85fr)_minmax(190px,0.9fr)_auto] md:gap-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted">
                Work
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted">
                Context
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted">
                Signal
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-app-text-muted md:text-right">
                Action
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {items.map((item) => (
                <WorkItemRow
                  key={item.id}
                  item={item}
                  onOpenIssue={onOpenIssue}
                  onMarkStarted={onMarkStarted}
                  onAcceptHandoff={onAcceptHandoff}
                  isMutating={isMutatingIssueId === item.issueId}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function buildTabs(data?: MyWorkResponse) {
  return TAB_ORDER.map((tab) => {
    if (tab.id === "waiting") {
      return {
        id: tab.id,
        label: `Waiting${data?.counts.waitingForMe ? ` (${data.counts.waitingForMe})` : ""}`,
      };
    }

    if (tab.id === "in-progress") {
      return {
        id: tab.id,
        label: `In Progress${data?.counts.inProgress ? ` (${data.counts.inProgress})` : ""}`,
      };
    }

    if (tab.id === "blocked") {
      return {
        id: tab.id,
        label: `Blocked${data?.counts.blocked ? ` (${data.counts.blocked})` : ""}`,
      };
    }

    if (tab.id === "completed") {
      return {
        id: tab.id,
        label: `Completed${data?.counts.completedToday ? ` (${data.counts.completedToday})` : ""}`,
      };
    }

    return {
      id: tab.id,
      label: `Today${data?.counts.todayFocus ? ` (${data.counts.todayFocus})` : ""}`,
    };
  });
}

function getActiveSection(activeTab: WorkTabId): SectionId | null {
  if (activeTab === "today") {
    return null;
  }

  if (activeTab === "waiting") {
    return "waitingForMe";
  }

  if (activeTab === "in-progress") {
    return "inProgress";
  }

  if (activeTab === "blocked") {
    return "blocked";
  }

  return "completedToday";
}

export default function TasksPageContent() {
  const [activeTab, setActiveTab] = useState<WorkTabId>("today");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedIssueIsWorkflow, setSelectedIssueIsWorkflow] = useState(false);
  const [isMutatingIssueId, setIsMutatingIssueId] = useState<string | null>(null);
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const { data, isLoading, error, refetch, isRefetching } = useMyWork(workspaceId);
  const updateWorkflowRunStatus = useUpdateWorkflowRunStatus();
  const acceptWorkflowHandoff = useAcceptWorkflowHandoff();

  useWorkspaceRealtime(workspaceId, {
    enabled: !selectedIssueId,
  });

  const tabs = useMemo(() => buildTabs(data), [data]);
  const sectionItems = useMemo(
    () => ({
      waitingForMe: data?.waitingForMe || [],
      inProgress: data?.inProgress || [],
      blocked: data?.blocked || [],
      completedToday: data?.completedToday || [],
    }),
    [data],
  );
  const activeSection = useMemo(() => getActiveSection(activeTab), [activeTab]);

  const handleOpenIssue = (item: MyWorkItem) => {
    setSelectedIssueId(item.issueId);
    setSelectedIssueIsWorkflow(item.sourceType === "workflow");
  };

  const handleCloseDetail = () => {
    setSelectedIssueId(null);
    setSelectedIssueIsWorkflow(false);
    void refetch();
  };

  const handleMarkStarted = async (item: MyWorkItem) => {
    if (item.sourceType !== "workflow") {
      handleOpenIssue(item);
      return;
    }

    try {
      setIsMutatingIssueId(item.issueId);
      await updateWorkflowRunStatus.mutateAsync({
        workspaceId,
        issueId: item.issueId,
        data: {
          status: IssueStatus.IN_PROGRESS,
        },
      });
      toast.success("已标记为开始执行");
      await refetch();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "更新执行状态失败，请重试",
      );
    } finally {
      setIsMutatingIssueId(null);
    }
  };

  const handleAcceptHandoff = async (item: MyWorkItem) => {
    if (item.sourceType !== "workflow") {
      handleOpenIssue(item);
      return;
    }

    try {
      setIsMutatingIssueId(item.issueId);
      await acceptWorkflowHandoff.mutateAsync({
        workspaceId,
        issueId: item.issueId,
        data: {},
      });
      toast.success("已接受 handoff");
      await refetch();
    } catch (mutationError) {
      toast.error(
        mutationError instanceof Error
          ? mutationError.message
          : "接受 handoff 失败，请重试",
      );
    } finally {
      setIsMutatingIssueId(null);
    }
  };

  if (selectedIssueId && selectedIssueIsWorkflow) {
    return (
      <div className="h-full w-full bg-app-bg p-2">
        <WorkflowIssueDetail
          issueId={selectedIssueId}
          workspaceId={workspaceId}
          isOpen={true}
          onClose={handleCloseDetail}
          onUpdate={handleCloseDetail}
          displayMode="page"
        />
      </div>
    );
  }

  if (selectedIssueId && !selectedIssueIsWorkflow) {
    return (
      <div className="h-full w-full bg-app-bg p-2">
        <NormalIssueDetail
          issueId={selectedIssueId}
          workspaceId={workspaceId}
          isOpen={true}
          onClose={handleCloseDetail}
          onUpdate={handleCloseDetail}
          displayMode="page"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-app-bg">
      <div className="border-b border-white/[0.045] px-4 py-3">
        <InfoBarTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as WorkTabId)}
        />
      </div>

      <div
        className="flex-1 overflow-y-auto"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 28%)",
        }}
      >
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32" />

          <div className="relative z-10 flex flex-col gap-6">
            {isLoading ? (
              <Card className="border border-white/[0.04] bg-white/[0.018] shadow-[0_1px_0_rgba(255,255,255,0.015)_inset]">
                <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-3 py-12">
                  <Loader2 className="size-5 animate-spin text-app-text-muted" />
                  <div className="text-sm text-app-text-muted">
                    正在整理你的工作队列...
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border border-red-500/18 bg-red-500/[0.07] shadow-none">
                <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 py-12 text-center">
                  <AlertTriangle className="size-5 text-red-300" />
                  <div>
                    <div className="text-sm font-medium text-app-text-primary">
                      个人工作聚合加载失败
                    </div>
                    <div className="mt-2 text-sm text-app-text-muted">
                      {error instanceof Error ? error.message : "请稍后再试"}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/[0.08] bg-transparent text-app-text-primary hover:bg-white/[0.04]"
                    onClick={() => void refetch()}
                  >
                    <RefreshCw data-icon="inline-start" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-3 rounded-[26px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] px-4 py-3 backdrop-blur-sm">
                    <div className="min-w-0 pr-2">
                      <h2 className="truncate text-[1.15rem] font-semibold tracking-[-0.03em] text-app-text-primary">
                        My Work Overview
                      </h2>
                    </div>

                    <div className="ml-auto flex flex-wrap gap-2">
                      <div className="rounded-full border border-white/8 bg-app-bg/55 px-3 py-1.5 text-xs font-medium text-app-text-secondary">
                        {data?.counts.total || 0} active
                      </div>
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-app-bg/55 px-3 py-1.5 text-xs font-medium text-app-text-secondary">
                        {isRefetching ? (
                          <RefreshCw className="size-3.5 animate-spin" />
                        ) : (
                          <Clock3 className="size-3.5" />
                        )}
                        {isRefetching
                          ? "Syncing"
                          : `Updated ${format(new Date(), "HH:mm")}`}
                      </div>
                    </div>
                  </div>

                  {renderSummaryCards(data, activeTab, setActiveTab)}
                </div>

                {activeTab === "today" ? (
                  <WorkSection
                    meta={{
                      title: "Today Focus",
                      description:
                        "今天先处理这些。它们综合了紧急度、阻塞、review 和你当前的执行状态。",
                      emptyTitle: "今天的焦点队列还是空的",
                      emptyDescription:
                        "当你有待处理、进行中或阻塞的工作时，它们会优先排到这里。",
                    }}
                    items={data?.todayFocus || []}
                    onOpenIssue={handleOpenIssue}
                    onMarkStarted={handleMarkStarted}
                    onAcceptHandoff={handleAcceptHandoff}
                    isMutatingIssueId={isMutatingIssueId}
                  />
                ) : activeSection ? (
                  <div className="grid gap-6">
                    <WorkSection
                      meta={SECTION_META[activeSection]}
                      items={sectionItems[activeSection]}
                      onOpenIssue={handleOpenIssue}
                      onMarkStarted={handleMarkStarted}
                      onAcceptHandoff={handleAcceptHandoff}
                      isMutatingIssueId={isMutatingIssueId}
                    />
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
