"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusPill } from "@/components/dashboard-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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

export type SettingsSectionKey =
  | "notifications"
  | "appearance"
  | "security"
  | "integrations"
  | "billing"
  | "support";

const SECTION_DESCRIPTION: Record<SettingsSectionKey, string> = {
  notifications:
    "Control how template events are routed so teams can extend notification logic later.",
  appearance:
    "Define foundational UI defaults for future modules without hardcoding product-specific behavior.",
  security:
    "Set baseline policy rules and controls for role-aware modules that will be added later.",
  integrations:
    "Manage external connector placeholders and webhook settings using mock configuration only.",
  billing:
    "Configure neutral billing controls and usage presentation for subscription-oriented products.",
  support:
    "Adjust support operations and help center defaults for your admin workspace.",
};

const CONNECTOR_CATALOG = [
  { id: "slack", name: "Slack", description: "Post workflow and incident alerts." },
  { id: "notion", name: "Notion", description: "Sync SOP pages and reference docs." },
  { id: "hubspot", name: "HubSpot", description: "Mirror customer lifecycle updates." },
];

interface SettingsSectionDetailProps {
  section: SettingsSectionKey;
  title: string;
}

export function SettingsSectionDetail({
  section,
  title,
}: SettingsSectionDetailProps) {
  const [emailMentions, setEmailMentions] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [digestSchedule, setDigestSchedule] = useState("monday-09");
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");

  const [themeMode, setThemeMode] = useState("system");
  const [uiDensity, setUiDensity] = useState("comfortable");
  const [dateFormat, setDateFormat] = useState("yyyy-mm-dd");
  const [showSidebarLabels, setShowSidebarLabels] = useState(true);
  const [highlightActiveTabs, setHighlightActiveTabs] = useState(true);

  const [enforceMfa, setEnforceMfa] = useState(true);
  const [allowPasswordLogin, setAllowPasswordLogin] = useState(true);
  const [sessionDuration, setSessionDuration] = useState("8h");
  const [ipAllowlist, setIpAllowlist] = useState(
    "10.10.0.0/16\n172.16.5.0/24",
  );

  const [connectorState, setConnectorState] = useState<Record<string, boolean>>({
    slack: true,
    notion: false,
    hubspot: false,
  });
  const [webhookEndpoint, setWebhookEndpoint] = useState(
    "https://example.com/hooks/admin",
  );
  const [webhookSecret, setWebhookSecret] = useState("whsec_xxxxxxxxxxxx");

  const [planName, setPlanName] = useState("Template Pro");
  const [invoiceEmail, setInvoiceEmail] = useState("finance@acme.dev");
  const [purchaseOrder, setPurchaseOrder] = useState("PO-2026-114");
  const [autoRenew, setAutoRenew] = useState(true);
  const [spendGuard, setSpendGuard] = useState("8000");

  const [supportEmail, setSupportEmail] = useState("support@acme.dev");
  const [supportChannel, setSupportChannel] = useState("portal");
  const [prioritySla, setPrioritySla] = useState(true);
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);

  const connectedCount = useMemo(
    () => Object.values(connectorState).filter(Boolean).length,
    [connectorState],
  );

  const saveLabel = `Save ${title.toLowerCase()} settings`;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {SECTION_DESCRIPTION[section]}
        </p>
      </header>

      {section === "notifications" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Delivery Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={emailMentions}
                  onCheckedChange={(checked) => setEmailMentions(checked === true)}
                />
                <span>Email mentions and assignments</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={slackAlerts}
                  onCheckedChange={(checked) => setSlackAlerts(checked === true)}
                />
                <span>Slack incident alerts</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={weeklyDigest}
                  onCheckedChange={(checked) => setWeeklyDigest(checked === true)}
                />
                <span>Weekly summary digest</span>
              </label>
            </CardContent>
          </Card>

          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Digest & Quiet Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Digest Schedule</Label>
                <Select value={digestSchedule} onValueChange={setDigestSchedule}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday-09">Monday 09:00</SelectItem>
                    <SelectItem value="wednesday-10">Wednesday 10:00</SelectItem>
                    <SelectItem value="friday-18">Friday 18:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Quiet Start</Label>
                  <Input
                    id="quiet-start"
                    value={quietHoursStart}
                    onChange={(event) => setQuietHoursStart(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">Quiet End</Label>
                  <Input
                    id="quiet-end"
                    value={quietHoursEnd}
                    onChange={(event) => setQuietHoursEnd(event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {section === "appearance" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Global Look & Feel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme Mode</Label>
                <Select value={themeMode} onValueChange={setThemeMode}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>UI Density</Label>
                <Select value={uiDensity} onValueChange={setUiDensity}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Navigation Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={showSidebarLabels}
                  onCheckedChange={(checked) =>
                    setShowSidebarLabels(checked === true)
                  }
                />
                <span>Show sidebar labels by default</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={highlightActiveTabs}
                  onCheckedChange={(checked) =>
                    setHighlightActiveTabs(checked === true)
                  }
                />
                <span>Highlight active tabs in infobar</span>
              </label>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {section === "security" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Access Control Baseline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={enforceMfa}
                  onCheckedChange={(checked) => setEnforceMfa(checked === true)}
                />
                <span>Require multi-factor authentication</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={allowPasswordLogin}
                  onCheckedChange={(checked) =>
                    setAllowPasswordLogin(checked === true)
                  }
                />
                <span>Allow email and password login</span>
              </label>
              <div className="space-y-2">
                <Label>Session Duration</Label>
                <Select value={sessionDuration} onValueChange={setSessionDuration}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="8h">8 hours</SelectItem>
                    <SelectItem value="24h">24 hours</SelectItem>
                    <SelectItem value="7d">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">IP Allowlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="ip-allowlist">Allowed CIDR Blocks</Label>
              <Textarea
                id="ip-allowlist"
                value={ipAllowlist}
                onChange={(event) => setIpAllowlist(event.target.value)}
                className="min-h-[130px]"
              />
              <p className="text-xs text-muted-foreground">
                One entry per line. Keep this as mock policy until backend access
                checks are connected.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {section === "integrations" ? (
        <Card className="border-app-border bg-app-content-bg">
          <CardHeader>
            <CardTitle className="text-base">Connector Registry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-app-border px-3 py-2 text-sm">
              <span>Connected Integrations</span>
              <Badge variant="outline">{connectedCount} active</Badge>
            </div>

            {CONNECTOR_CATALOG.map((connector) => {
              const connected = connectorState[connector.id];
              return (
                <div
                  key={connector.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-app-border px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{connector.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {connector.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={connected ? "Connected" : "Disconnected"} />
                    <Button
                      variant={connected ? "outline" : "default"}
                      size="sm"
                      onClick={() =>
                        setConnectorState((prev) => ({
                          ...prev,
                          [connector.id]: !connected,
                        }))
                      }
                    >
                      {connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              );
            })}

            <Separator />

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="webhook-endpoint">Webhook Endpoint</Label>
                <Input
                  id="webhook-endpoint"
                  value={webhookEndpoint}
                  onChange={(event) => setWebhookEndpoint(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Signing Secret</Label>
                <Input
                  id="webhook-secret"
                  value={webhookSecret}
                  onChange={(event) => setWebhookSecret(event.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {section === "billing" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Plan Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  value={planName}
                  onChange={(event) => setPlanName(event.target.value)}
                />
              </div>
              <div className="rounded-lg border border-app-border p-3">
                <p className="text-xs text-muted-foreground">Monthly Usage</p>
                <p className="mt-1 text-sm font-medium">$4,320 / $8,000</p>
                <div className="mt-2 h-2 rounded-full bg-app-bg">
                  <div className="h-2 w-[54%] rounded-full bg-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="spend-guard">Spend Guardrail (USD)</Label>
                <Input
                  id="spend-guard"
                  value={spendGuard}
                  onChange={(event) => setSpendGuard(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Billing Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="invoice-email">Invoice Email</Label>
                <Input
                  id="invoice-email"
                  value={invoiceEmail}
                  onChange={(event) => setInvoiceEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="po-number">Purchase Order</Label>
                <Input
                  id="po-number"
                  value={purchaseOrder}
                  onChange={(event) => setPurchaseOrder(event.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={autoRenew}
                  onCheckedChange={(checked) => setAutoRenew(checked === true)}
                />
                <span>Auto-renew subscription</span>
              </label>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {section === "support" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Support Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  value={supportEmail}
                  onChange={(event) => setSupportEmail(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Default Support Channel</Label>
                <Select value={supportChannel} onValueChange={setSupportChannel}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portal">Support Portal</SelectItem>
                    <SelectItem value="email">Email Queue</SelectItem>
                    <SelectItem value="chat">Live Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={prioritySla}
                  onCheckedChange={(checked) => setPrioritySla(checked === true)}
                />
                <span>Enable priority SLA routing</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={includeDiagnostics}
                  onCheckedChange={(checked) =>
                    setIncludeDiagnostics(checked === true)
                  }
                />
                <span>Attach diagnostics to support tickets</span>
              </label>
            </CardContent>
          </Card>

          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Reference Materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border border-app-border px-3 py-2">
                Incident Response Runbook
              </div>
              <div className="rounded-lg border border-app-border px-3 py-2">
                Customer Escalation Matrix
              </div>
              <div className="rounded-lg border border-app-border px-3 py-2">
                Template Troubleshooting FAQ
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex items-center justify-end">
        <Button onClick={() => toast.success(`${title} settings saved (mock).`)}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
