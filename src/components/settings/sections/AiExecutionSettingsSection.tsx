"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Bot,
  CheckCheck,
  Clock3,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAiExecutionCapabilities, useAiExecutionHistory, useExecuteAiAction } from "@/hooks/useAiExecution";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { ExecuteAiActionResult } from "@/lib/fetchers/ai-execution";

const APPROVAL_BADGE: Record<"AUTO" | "CONFIRM", string> = {
  AUTO: "自动执行",
  CONFIRM: "需确认",
};

const AVAILABILITY_BADGE: Record<
  "available" | "requires_target_check" | "unavailable",
  string
> = {
  available: "可直接使用",
  requires_target_check: "需目标校验",
  unavailable: "当前角色不可用",
};

const STATUS_BADGE: Record<
  "preview" | "succeeded" | "failed" | "blocked",
  "outline" | "secondary" | "destructive" | "default"
> = {
  preview: "outline",
  succeeded: "default",
  failed: "destructive",
  blocked: "secondary",
};

const HISTORY_STATUS_LABEL: Record<
  "PREVIEW" | "SUCCEEDED" | "FAILED" | "BLOCKED",
  string
> = {
  PREVIEW: "预演",
  SUCCEEDED: "成功",
  FAILED: "失败",
  BLOCKED: "拦截",
};

function formatPayload(payload: Record<string, unknown>) {
  return JSON.stringify(payload, null, 2);
}

export default function AiExecutionSettingsSection() {
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id ?? null;
  const capabilitiesQuery = useAiExecutionCapabilities(workspaceId);
  const historyQuery = useAiExecutionHistory(workspaceId, 12);
  const executeMutation = useExecuteAiAction();

  const actions = React.useMemo(
    () => capabilitiesQuery.data?.actions ?? [],
    [capabilitiesQuery.data?.actions],
  );
  const [selectedActionKey, setSelectedActionKey] = React.useState<string>("");
  const [payloadText, setPayloadText] = React.useState("{}");
  const [payloadError, setPayloadError] = React.useState<string | null>(null);
  const [lastResult, setLastResult] = React.useState<ExecuteAiActionResult | null>(
    null,
  );

  React.useEffect(() => {
    if (!actions.length) {
      return;
    }

    setSelectedActionKey((currentKey) => {
      if (currentKey && actions.some((action) => action.key === currentKey)) {
        return currentKey;
      }

      return actions[0].key;
    });
  }, [actions]);

  const selectedAction = React.useMemo(
    () => actions.find((action) => action.key === selectedActionKey) ?? null,
    [actions, selectedActionKey],
  );

  React.useEffect(() => {
    if (!selectedAction) {
      return;
    }

    setPayloadText(formatPayload(selectedAction.sampleInput));
    setPayloadError(null);
    setLastResult(null);
  }, [selectedAction]);

  const stats = React.useMemo(() => {
    const autoCount = actions.filter(
      (action) => action.approvalMode === "AUTO",
    ).length;
    const confirmCount = actions.filter(
      (action) => action.approvalMode === "CONFIRM",
    ).length;
    const unavailableCount = actions.filter(
      (action) => action.availability.status === "unavailable",
    ).length;

    return {
      total: actions.length,
      autoCount,
      confirmCount,
      unavailableCount,
    };
  }, [actions]);

  const parsePayload = () => {
    try {
      const parsed = JSON.parse(payloadText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("输入必须是 JSON object。");
      }
      setPayloadError(null);
      return parsed as Record<string, unknown>;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "JSON 解析失败";
      setPayloadError(message);
      throw error;
    }
  };

  const runAction = async (mode: "preview" | "execute" | "confirm") => {
    if (!workspaceId || !selectedAction) {
      return;
    }

    let parsedPayload: Record<string, unknown>;

    try {
      parsedPayload = parsePayload();
    } catch {
      return;
    }

    const result = await executeMutation.mutateAsync({
      workspaceId,
      actionKey: selectedAction.key,
      data: {
        input: parsedPayload,
        dryRun: mode === "preview",
        confirmed: mode === "confirm",
      },
    });

    setLastResult(result);
  };

  if (!workspaceId || !currentWorkspace) {
    return (
      <Card className="border-none">
        <CardHeader>
          <CardTitle>AI 执行层</CardTitle>
          <CardDescription>请先进入一个工作空间后再配置。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-5 py-1">
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-none">
          <CardHeader className="pb-3">
            <CardDescription>已接入动作</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none">
          <CardHeader className="pb-3">
            <CardDescription>自动执行</CardDescription>
            <CardTitle className="text-2xl">{stats.autoCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none">
          <CardHeader className="pb-3">
            <CardDescription>需要确认</CardDescription>
            <CardTitle className="text-2xl">{stats.confirmCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none">
          <CardHeader className="pb-3">
            <CardDescription>当前角色不可用</CardDescription>
            <CardTitle className="text-2xl">{stats.unavailableCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-none">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="border border-app-border bg-app-bg/40 p-2 text-muted-foreground">
                  <ShieldCheck className="size-4" />
                </div>
                <CardTitle>能力与权限</CardTitle>
              </div>
              <CardDescription className="max-w-3xl">
                这层不是聊天模块，而是 AI 调用真实系统动作前的统一能力面。
                每个动作都声明了审批模式、目标对象和当前角色可用性，后面无论接哪种模型，都走同一套 contract。
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">
                工作空间: {currentWorkspace.type === "TEAM" ? "团队" : "个人"}
              </Badge>
              <Badge variant="outline">
                当前角色: {capabilitiesQuery.data?.actorRole ?? "加载中"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {capabilitiesQuery.isLoading && (
            <div className="text-sm text-muted-foreground">能力清单加载中...</div>
          )}
          {capabilitiesQuery.error && (
            <div className="text-sm text-destructive">
              {(capabilitiesQuery.error as Error).message || "能力清单加载失败"}
            </div>
          )}
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => setSelectedActionKey(action.key)}
              className={`rounded-md border px-4 py-4 text-left transition-colors ${
                selectedActionKey === action.key
                  ? "border-foreground/30 bg-app-button-hover"
                  : "border-app-border bg-app-bg/20 hover:bg-app-bg/40"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-foreground">
                  {action.label}
                </div>
                <Badge variant="outline">
                  {APPROVAL_BADGE[action.approvalMode]}
                </Badge>
                <Badge variant="outline">
                  {AVAILABILITY_BADGE[action.availability.status]}
                </Badge>
              </div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                {action.description}
              </div>
              {action.availability.reason && (
                <div className="mt-3 text-xs leading-5 text-muted-foreground">
                  {action.availability.reason}
                </div>
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="border border-app-border bg-app-bg/40 p-2 text-muted-foreground">
                <Bot className="size-4" />
              </div>
              <div>
                <CardTitle>动作调试台</CardTitle>
                <CardDescription>
                  用同一套 AI action API 做预演、确认和执行，先把链路跑通。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>动作</Label>
              <Select
                value={selectedActionKey}
                onValueChange={setSelectedActionKey}
                disabled={!actions.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择一个动作" />
                </SelectTrigger>
                <SelectContent>
                  {actions.map((action) => (
                    <SelectItem key={action.key} value={action.key}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAction && (
              <>
                <div className="rounded-md border border-app-border bg-app-bg/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-medium text-foreground">
                      {selectedAction.label}
                    </div>
                    <Badge variant="outline">
                      {APPROVAL_BADGE[selectedAction.approvalMode]}
                    </Badge>
                    <Badge variant="outline">
                      {selectedAction.targetType}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selectedAction.description}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>输入 JSON</Label>
                  <Textarea
                    value={payloadText}
                    onChange={(event) => setPayloadText(event.target.value)}
                    className="min-h-[260px] font-mono text-xs leading-6"
                    spellCheck={false}
                  />
                  {payloadError && (
                    <div className="text-sm text-destructive">{payloadError}</div>
                  )}
                </div>

                <div className="rounded-md border border-app-border bg-app-bg/20 p-4">
                  <div className="text-sm font-medium text-foreground">
                    输入字段
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {selectedAction.fields.map((field) => (
                      <div
                        key={field.name}
                        className="rounded-md border border-app-border bg-background/40 px-3 py-3"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          {field.label}
                          {field.required && (
                            <Badge variant="outline">必填</Badge>
                          )}
                        </div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {field.name}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-muted-foreground">
                          {field.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void runAction("preview")}
                    disabled={
                      executeMutation.isPending ||
                      selectedAction.availability.status === "unavailable"
                    }
                  >
                    <Play className="mr-2 size-4" />
                    预演
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void runAction("execute")}
                    disabled={
                      executeMutation.isPending ||
                      selectedAction.availability.status === "unavailable" ||
                      selectedAction.approvalMode === "CONFIRM"
                    }
                  >
                    <Sparkles className="mr-2 size-4" />
                    直接执行
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void runAction("confirm")}
                    disabled={
                      executeMutation.isPending ||
                      selectedAction.availability.status === "unavailable" ||
                      selectedAction.approvalMode !== "CONFIRM"
                    }
                  >
                    <CheckCheck className="mr-2 size-4" />
                    确认执行
                  </Button>
                </div>

                {executeMutation.error && (
                  <div className="text-sm text-destructive">
                    {(executeMutation.error as Error).message || "执行失败"}
                  </div>
                )}

                {lastResult && (
                  <div className="space-y-3 rounded-md border border-app-border bg-app-bg/20 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-foreground">
                        最近一次结果
                      </div>
                      <Badge variant={STATUS_BADGE[lastResult.status]}>
                        {lastResult.status}
                      </Badge>
                      {lastResult.needsConfirmation && (
                        <Badge variant="outline">等待确认</Badge>
                      )}
                    </div>
                    <div className="text-sm leading-6 text-muted-foreground">
                      {lastResult.message}
                    </div>
                    <Separator />
                    <pre className="overflow-auto rounded-md bg-background/60 p-3 text-xs leading-6 text-muted-foreground">
                      {JSON.stringify(lastResult, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="border border-app-border bg-app-bg/40 p-2 text-muted-foreground">
                <Clock3 className="size-4" />
              </div>
              <div>
                <CardTitle>最近执行</CardTitle>
                <CardDescription>
                  所有预演、成功、失败和拦截都会落审计记录。
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyQuery.isLoading && (
              <div className="text-sm text-muted-foreground">执行记录加载中...</div>
            )}
            {historyQuery.error && (
              <div className="text-sm text-destructive">
                {(historyQuery.error as Error).message || "执行记录加载失败"}
              </div>
            )}
            {historyQuery.data?.map((record) => (
              <div
                key={record.id}
                className="rounded-md border border-app-border bg-app-bg/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-medium text-foreground">
                    {record.actionLabel}
                  </div>
                  <Badge variant="outline">
                    {HISTORY_STATUS_LABEL[record.status]}
                  </Badge>
                  <Badge variant="outline">
                    {record.approvalMode === "AUTO" ? "自动" : "确认"}
                  </Badge>
                </div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">
                  {record.summary || "无摘要"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(record.createdAt), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </div>
                {record.error?.message && (
                  <div className="mt-2 text-xs leading-5 text-destructive">
                    {record.error.message}
                  </div>
                )}
              </div>
            ))}
            {!historyQuery.isLoading &&
              !historyQuery.error &&
              historyQuery.data?.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  还没有执行记录，可以先从左侧调试台做一次预演。
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
