import {
  BookAIcon,
  Bug,
  FolderOpen,
  Inbox,
  ListCheck,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  isReady?: boolean;
}

type WorkspaceNavVisibility = "all" | "team" | "personal";

interface ProductPageDefinition extends NavItem {
  id: string;
  segment: string;
  order: number;
  cached: boolean;
  navVisibility: WorkspaceNavVisibility;
  borderlessShellPatterns?: readonly string[];
}

export const productPages = [
  {
    id: "tasks",
    segment: "tasks",
    order: 1,
    cached: true,
    navVisibility: "all",
    icon: ListCheck,
    label: "My Work",
    href: "/tasks",
  },
  {
    id: "inbox",
    segment: "inbox",
    order: 2,
    cached: true,
    navVisibility: "all",
    icon: Inbox,
    label: "Inbox",
    href: "/inbox",
  },
  {
    id: "docs",
    segment: "docs",
    order: 3,
    cached: true,
    navVisibility: "all",
    icon: BookAIcon,
    label: "Docs",
    href: "/docs",
  },
  {
    id: "issues",
    segment: "issues",
    order: 4,
    cached: true,
    navVisibility: "all",
    icon: Bug,
    label: "Issues",
    href: "/issues",
    borderlessShellPatterns: ["/issues/:issueId"],
  },
  {
    id: "projects",
    segment: "projects",
    order: 5,
    cached: true,
    navVisibility: "all",
    icon: FolderOpen,
    label: "Projects",
    href: "/projects",
    borderlessShellPatterns: ["/projects/:projectId/:issueId"],
  },
  {
    id: "workflows",
    segment: "workflows",
    order: 6,
    cached: true,
    navVisibility: "team",
    icon: Workflow,
    label: "Workflows",
    href: "/workflows",
  },
  {
    id: "intelligence",
    segment: "intelligence",
    order: 7,
    cached: true,
    navVisibility: "all",
    icon: Sparkles,
    label: "Intelligence",
    href: "/intelligence",
    borderlessShellPatterns: ["/intelligence", "/intelligence/:threadId"],
  },
] as const satisfies readonly ProductPageDefinition[];

export type ProductPageId = (typeof productPages)[number]["id"];

const PRODUCT_PAGE_ID_BY_SEGMENT = new Map<string, ProductPageId>(
  productPages.map((page) => [page.segment, page.id]),
);

const PROJECT_SUBVIEW_ROUTE_SEGMENTS = new Set([
  "issues",
  "docs",
  "workflow",
  "sync",
]);

export const pageOrderById = productPages.reduce(
  (result, page) => {
    result[page.id] = page.order;
    return result;
  },
  {} as Record<ProductPageId, number>,
);

export const getReadyNavItems = <T extends NavItem>(items: readonly T[]) =>
  items.filter((item) => item.isReady !== false);

const getNavItemsByVisibility = (
  visibility: Exclude<WorkspaceNavVisibility, "all">,
) =>
  productPages.filter(
    (page) => page.navVisibility === "all" || page.navVisibility === visibility,
  );

export const mainNavItems = getNavItemsByVisibility("team");
export const personalNavItems = getNavItemsByVisibility("personal");

export const getWorkspaceNavItems = (workspaceType?: string | null) =>
  getReadyNavItems(workspaceType === "TEAM" ? mainNavItems : personalNavItems);

export const normalizeProductPathname = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(firstSegment)) {
    segments.shift();
  }

  return `/${segments.join("/")}` || "/";
};

const routeMatchesPattern = (pathname: string, routePattern: string) => {
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const routePatternSegments = routePattern.split("/").filter(Boolean);

  if (pathnameSegments.length !== routePatternSegments.length) {
    return false;
  }

  return routePatternSegments.every((segment, index) => {
    if (segment.startsWith(":")) {
      if (
        routePatternSegments[0] === "projects" &&
        segment === ":issueId" &&
        PROJECT_SUBVIEW_ROUTE_SEGMENTS.has(pathnameSegments[index])
      ) {
        return false;
      }

      return Boolean(pathnameSegments[index]);
    }

    return segment === pathnameSegments[index];
  });
};

export const borderlessContentShellRoutes = productPages.flatMap(
  (page: ProductPageDefinition) => page.borderlessShellPatterns ?? [],
);

export const shouldUseBorderlessContentShell = (pathname: string) => {
  const routePathname = normalizeProductPathname(pathname);

  return borderlessContentShellRoutes.some((route) =>
    routeMatchesPattern(routePathname, route),
  );
};

export const getProductPageIdFromPathname = (
  pathname: string,
): ProductPageId | null => {
  const routePathname = normalizeProductPathname(pathname);
  const [firstSegment] = routePathname.split("/").filter(Boolean);

  if (!firstSegment) {
    return null;
  }

  return PRODUCT_PAGE_ID_BY_SEGMENT.get(firstSegment) ?? null;
};
