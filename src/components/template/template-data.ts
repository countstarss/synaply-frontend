import {
  DashboardMetric,
  DashboardQuickAction,
  DashboardRecord,
  DashboardTimelineItem,
} from "@/components/dashboard-kit";

export type TemplateScreenKey =
  | "dashboard"
  | "customers"
  | "orders"
  | "analytics"
  | "content";

export interface TemplateScreenData {
  title: string;
  description: string;
  badge: string;
  primaryAction: string;
  secondaryAction: string;
  metrics: DashboardMetric[];
  recordsTitle: string;
  records: DashboardRecord[];
  timelineTitle: string;
  timeline: DashboardTimelineItem[];
  checklistTitle: string;
  checklist: string[];
  quickActions: DashboardQuickAction[];
}

export const TEMPLATE_SCREEN_DATA: Record<TemplateScreenKey, TemplateScreenData> = {
  dashboard: {
    title: "Dashboard Overview",
    description:
      "A neutral command center section that can be adapted to any SaaS or internal tool.",
    badge: "UI Template",
    primaryAction: "Create Module",
    secondaryAction: "Import Data",
    metrics: [
      {
        id: "active-users",
        label: "Active Users",
        value: "12,480",
        trend: "+8.4%",
        tone: "positive",
        sparkline: [28, 40, 52, 44, 60, 72, 80],
        segment: "overview",
      },
      {
        id: "conversion",
        label: "Conversion",
        value: "4.92%",
        trend: "+0.7%",
        tone: "positive",
        sparkline: [18, 25, 36, 31, 45, 51, 58],
        segment: "revenue",
      },
      {
        id: "revenue",
        label: "Revenue",
        value: "$84,210",
        trend: "+12.1%",
        tone: "positive",
        sparkline: [24, 30, 41, 47, 56, 69, 88],
        segment: "revenue",
      },
      {
        id: "churn",
        label: "Churn",
        value: "1.2%",
        trend: "-0.4%",
        tone: "warning",
        sparkline: [75, 62, 59, 46, 34, 28, 21],
        segment: "operations",
      },
    ],
    recordsTitle: "Recent Workspaces",
    records: [
      { id: "WS-1021", name: "Acme Admin Suite", status: "Healthy", owner: "Product Team", updatedAt: "5 min ago" },
      { id: "WS-1018", name: "Billing Console", status: "Review", owner: "Ops Team", updatedAt: "20 min ago" },
      { id: "WS-1009", name: "Partner Portal", status: "Draft", owner: "Growth Team", updatedAt: "1 hr ago" },
    ],
    timelineTitle: "Activity Timeline",
    timeline: [
      { id: "1", title: "Template section added", detail: "New analytics widget configured and validated.", time: "10:21" },
      { id: "2", title: "Theme token updated", detail: "Primary color variable adjusted for better contrast.", time: "09:46" },
      { id: "3", title: "Navigation extended", detail: "Added a neutral module structure for faster product setup.", time: "08:12" },
    ],
    checklistTitle: "Quick Start",
    checklist: [
      "Replace mock data with your API response",
      "Map role permissions to your auth provider",
      "Rename modules to your business domain",
      "Connect actions to real workflows",
    ],
    quickActions: [
      {
        id: "a1",
        label: "Add data connector",
        description: "Plug in your primary API endpoint and auth token.",
        shortcut: "D",
      },
      {
        id: "a2",
        label: "Generate CRUD scaffold",
        description: "Create list/create/edit views for your first domain model.",
        shortcut: "G",
      },
    ],
  },
  customers: {
    title: "Customer Management",
    description:
      "Reusable list and profile layout for customer or account related modules.",
    badge: "Ready To Extend",
    primaryAction: "Add Customer",
    secondaryAction: "Export CSV",
    metrics: [
      { label: "Total Accounts", value: "3,128", trend: "+5.2%", tone: "positive", sparkline: [22, 31, 41, 55, 63, 70, 76] },
      { label: "Enterprise", value: "186", trend: "+2.1%", tone: "positive", sparkline: [14, 24, 29, 34, 39, 45, 53] },
      { label: "New This Week", value: "72", trend: "+9.7%", tone: "positive", sparkline: [8, 18, 30, 34, 49, 56, 68] },
      { label: "Satisfaction", value: "96%", trend: "+1.3%", tone: "neutral", sparkline: [46, 52, 55, 63, 71, 74, 78] },
    ],
    recordsTitle: "Customer List",
    records: [
      { id: "CU-3301", name: "Northwind Labs", status: "Active", owner: "Success Team", updatedAt: "Today" },
      { id: "CU-3294", name: "BluePeak Retail", status: "Onboarding", owner: "Sales Team", updatedAt: "Yesterday" },
      { id: "CU-3287", name: "Everline Tech", status: "Renewal", owner: "Account Team", updatedAt: "2 days ago" },
    ],
    timelineTitle: "Engagement Signals",
    timeline: [
      { id: "1", title: "Quarterly review booked", detail: "Account health review scheduled for next Thursday.", time: "11:08" },
      { id: "2", title: "New stakeholder added", detail: "Two decision makers were added to the account profile.", time: "09:35" },
      { id: "3", title: "Usage milestone reached", detail: "Monthly active seats crossed contract baseline.", time: "07:58" },
    ],
    checklistTitle: "Module Ideas",
    checklist: [
      "Add customer segmentation filters",
      "Integrate lifecycle stage automation",
      "Attach billing and contract snapshots",
      "Add timeline comments and mentions",
    ],
    quickActions: [
      {
        id: "b1",
        label: "Create onboarding pipeline",
        description: "Set default stages and SLA timers for new accounts.",
        shortcut: "O",
      },
      {
        id: "b2",
        label: "Sync CRM records",
        description: "Map customer owner and lifecycle fields.",
        shortcut: "S",
      },
    ],
  },
  orders: {
    title: "Order Operations",
    description:
      "General transaction dashboard block suitable for orders, tickets, or requests.",
    badge: "Operations Template",
    primaryAction: "Create Order",
    secondaryAction: "Bulk Update",
    metrics: [
      { label: "Open Orders", value: "412", trend: "+3.8%", tone: "positive", sparkline: [25, 28, 33, 47, 52, 63, 70] },
      { label: "Fulfilled", value: "1,942", trend: "+6.1%", tone: "positive", sparkline: [19, 24, 31, 48, 54, 67, 74] },
      { label: "Average Value", value: "$214", trend: "+2.7%", tone: "neutral", sparkline: [13, 16, 21, 30, 38, 42, 50] },
      { label: "Return Rate", value: "2.4%", trend: "-0.3%", tone: "warning", sparkline: [74, 68, 56, 43, 36, 29, 22] },
    ],
    recordsTitle: "Latest Transactions",
    records: [
      { id: "OR-7814", name: "Starter Plan - Annual", status: "Processing", owner: "Automation", updatedAt: "3 min ago" },
      { id: "OR-7811", name: "Pro Plan - Upgrade", status: "Completed", owner: "Billing", updatedAt: "14 min ago" },
      { id: "OR-7808", name: "Add-on Package", status: "Pending", owner: "Finance", updatedAt: "31 min ago" },
    ],
    timelineTitle: "Processing Queue",
    timeline: [
      { id: "1", title: "Webhook received", detail: "External payment status callback accepted.", time: "10:44" },
      { id: "2", title: "Retry logic triggered", detail: "One transaction entered auto-retry for timeout handling.", time: "10:03" },
      { id: "3", title: "Order archived", detail: "Completed transaction moved to historical table.", time: "08:50" },
    ],
    checklistTitle: "Extension Points",
    checklist: [
      "Map payment states to your provider",
      "Attach shipping or delivery status",
      "Connect refund and dispute workflows",
      "Plug in external webhooks",
    ],
    quickActions: [
      {
        id: "c1",
        label: "Create order state machine",
        description: "Define allowed transitions and rollback rules.",
        shortcut: "M",
      },
      {
        id: "c2",
        label: "Set notification triggers",
        description: "Configure internal alerts for failed and delayed orders.",
        shortcut: "N",
      },
    ],
  },
  analytics: {
    title: "Analytics Workspace",
    description:
      "Composable reporting UI with room for charts, cohorts, and funnel widgets.",
    badge: "Metrics Ready",
    primaryAction: "New Report",
    secondaryAction: "Share View",
    metrics: [
      { label: "Sessions", value: "98,240", trend: "+11.6%", tone: "positive", sparkline: [18, 28, 40, 51, 62, 75, 89] },
      { label: "Avg. Duration", value: "6m 12s", trend: "+0.9%", tone: "neutral", sparkline: [21, 24, 30, 34, 38, 45, 49] },
      { label: "CTR", value: "7.4%", trend: "+0.6%", tone: "positive", sparkline: [12, 20, 24, 29, 32, 41, 47] },
      { label: "Bounce", value: "28.1%", trend: "-1.1%", tone: "warning", sparkline: [70, 64, 56, 49, 41, 35, 26] },
    ],
    recordsTitle: "Top Reports",
    records: [
      { id: "RP-204", name: "Acquisition Funnel", status: "Published", owner: "Growth", updatedAt: "Today" },
      { id: "RP-197", name: "Retention Cohort", status: "Draft", owner: "Data Team", updatedAt: "Yesterday" },
      { id: "RP-188", name: "Campaign Attribution", status: "Published", owner: "Marketing", updatedAt: "2 days ago" },
    ],
    timelineTitle: "Data Refresh",
    timeline: [
      { id: "1", title: "Pipeline synced", detail: "Warehouse snapshot refreshed successfully.", time: "11:30" },
      { id: "2", title: "Anomaly detected", detail: "Traffic spike alert sent to analytics channel.", time: "09:10" },
      { id: "3", title: "Report exported", detail: "Weekly KPI report shared with stakeholders.", time: "07:42" },
    ],
    checklistTitle: "Analytics Setup",
    checklist: [
      "Connect event tracking and attribution",
      "Replace table with chart components",
      "Add date ranges and saved views",
      "Configure alert thresholds",
    ],
    quickActions: [
      {
        id: "d1",
        label: "Create KPI dictionary",
        description: "Define global formulas and ownership for each metric.",
        shortcut: "K",
      },
      {
        id: "d2",
        label: "Enable anomaly monitor",
        description: "Set baseline deviations and escalation channels.",
        shortcut: "A",
      },
    ],
  },
  content: {
    title: "Content Library",
    description:
      "Flexible CMS-style structure for assets, documents, or knowledge modules.",
    badge: "Content Ready",
    primaryAction: "Create Item",
    secondaryAction: "Bulk Publish",
    metrics: [
      { label: "Published", value: "684", trend: "+4.0%", tone: "positive", sparkline: [17, 25, 33, 42, 53, 62, 73] },
      { label: "Drafts", value: "126", trend: "+1.8%", tone: "neutral", sparkline: [14, 19, 27, 32, 36, 40, 45] },
      { label: "Contributors", value: "34", trend: "+3.2%", tone: "positive", sparkline: [12, 20, 28, 35, 42, 46, 51] },
      { label: "Approval SLA", value: "22h", trend: "-2h", tone: "warning", sparkline: [66, 58, 54, 45, 38, 31, 24] },
    ],
    recordsTitle: "Recent Content",
    records: [
      { id: "CT-902", name: "Getting Started Guide", status: "Published", owner: "Docs Team", updatedAt: "1 hour ago" },
      { id: "CT-897", name: "Release Notes Q2", status: "In Review", owner: "Product Marketing", updatedAt: "Today" },
      { id: "CT-893", name: "Onboarding Sequence", status: "Draft", owner: "Content Ops", updatedAt: "Yesterday" },
    ],
    timelineTitle: "Publishing Workflow",
    timeline: [
      { id: "1", title: "Asset approved", detail: "Brand team approved illustration set for reuse.", time: "10:16" },
      { id: "2", title: "Version created", detail: "A new draft version was branched for localization.", time: "08:54" },
      { id: "3", title: "Comment resolved", detail: "Editorial feedback thread marked as completed.", time: "07:25" },
    ],
    checklistTitle: "Content Workflow",
    checklist: [
      "Connect rich text editor for body fields",
      "Add tags, taxonomy, and search",
      "Implement approval states and role checks",
      "Integrate CDN or file storage",
    ],
    quickActions: [
      {
        id: "e1",
        label: "Set publishing policy",
        description: "Define required approvals before content can go live.",
        shortcut: "P",
      },
      {
        id: "e2",
        label: "Connect media storage",
        description: "Map asset upload and delivery URLs.",
        shortcut: "U",
      },
    ],
  },
};
