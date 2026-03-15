import { DashboardTimelineItem } from "./types";
import { TimelinePanel } from "./TimelinePanel";

interface DashboardActivityFeedProps {
  title: string;
  items: DashboardTimelineItem[];
}

export function DashboardActivityFeed({
  title,
  items,
}: DashboardActivityFeedProps) {
  return <TimelinePanel title={title} items={items} />;
}
