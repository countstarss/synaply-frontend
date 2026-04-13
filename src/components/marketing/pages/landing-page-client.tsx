"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  LayoutTemplate,
  Layers3,
  MoveRight,
  SquareChartGantt,
  Workflow,
} from "lucide-react";
import { useEffect } from "react";

import { MarketingShell } from "@/components/marketing/site-shell";
import {
  MarketingFooter,
  type FooterSection,
} from "@/components/marketing/site-footer";
import { ProductPreview } from "@/components/marketing/product-preview";
import { SectionHeading } from "@/components/marketing/section-heading";
import { getSiteCopy } from "@/components/marketing/site-copy";
import {
  CardBody,
  CardContainer,
  CardItem,
} from "@/components/ui/3d-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CanvasText } from "@/components/ui/canvas-text";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Cover } from "@/components/ui/cover";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import {
  AUTH_ROUTE,
  DEFAULT_POST_LOGIN_ROUTE,
  getAuthParam,
} from "@/lib/auth-utils";
import { Link, useRouter } from "@/i18n/navigation";

const featureIcons = {
  Projects: Layers3,
  Issues: SquareChartGantt,
  Workflows: Workflow,
  Docs: FileText,
} as const;

const revealUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

interface LandingPageClientProps {
  locale: string;
}

export default function LandingPageClient({
  locale,
}: LandingPageClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const copy = getSiteCopy(locale);
  const isZh = locale === "zh";
  const proofSignals = isZh
    ? [
        "远程团队协作结构",
        "每一次交接都可见",
        "文档始终贴着执行",
        "团队共享同一节奏",
      ]
    : [
        "Remote-first structure",
        "Visible handoffs",
        "Docs inside execution",
        "One operating rhythm",
      ];

  const primaryHref = user ? DEFAULT_POST_LOGIN_ROUTE : AUTH_ROUTE;
  const primaryLabel = user ? copy.hero.returningCta : copy.hero.primaryCta;
  const canvasWord = isZh ? "清晰推进" : "clarity in motion";
  const coverWord = isZh ? "清晰" : "clarity";
  const footerSections: FooterSection[] = isZh
    ? [
        {
          title: "Pages",
          items: [
            { label: "首页", href: "/landing" },
            { label: "能力概览", href: "#capabilities" },
            { label: "协作流程", href: "#workflow" },
            { label: "方案", href: "/pricing" },
          ],
        },
        {
          title: "Product",
          items: [
            { label: "Projects", href: AUTH_ROUTE },
            { label: "Issues", href: AUTH_ROUTE },
            { label: "Workflows", href: AUTH_ROUTE },
            { label: "Docs", href: AUTH_ROUTE },
          ],
        },
        {
          title: "Company",
          items: [
            { label: "关于 Synaply", href: "/about" },
            { label: "Remote-first" },
            { label: "Structured execution" },
            { label: "Clarity over noise" },
          ],
        },
        {
          title: "Access",
          items: [
            { label: user ? "进入工作区" : "开始体验", href: primaryHref },
            { label: "登录", href: AUTH_ROUTE },
            { label: "查看方案", href: "/pricing" },
            { label: "了解我们", href: "/about" },
          ],
        },
      ]
    : [
        {
          title: "Pages",
          items: [
            { label: "Home", href: "/landing" },
            { label: "Capabilities", href: "#capabilities" },
            { label: "Workflow", href: "#workflow" },
            { label: "Pricing", href: "/pricing" },
          ],
        },
        {
          title: "Product",
          items: [
            { label: "Projects", href: AUTH_ROUTE },
            { label: "Issues", href: AUTH_ROUTE },
            { label: "Workflows", href: AUTH_ROUTE },
            { label: "Docs", href: AUTH_ROUTE },
          ],
        },
        {
          title: "Company",
          items: [
            { label: "About Synaply", href: "/about" },
            { label: "Remote-first" },
            { label: "Structured execution" },
            { label: "Clarity over noise" },
          ],
        },
        {
          title: "Access",
          items: [
            { label: user ? "Enter workspace" : "Start with clarity", href: primaryHref },
            { label: "Login", href: AUTH_ROUTE },
            { label: "Explore pricing", href: "/pricing" },
            { label: "About", href: "/about" },
          ],
        },
      ];

  useEffect(() => {
    const hasAuthParams = Boolean(
      getAuthParam("code") ||
        getAuthParam("access_token") ||
        getAuthParam("refresh_token"),
    );

    if (!user || !hasAuthParams) {
      return;
    }

    window.history.replaceState({}, "", window.location.pathname);
    router.replace(DEFAULT_POST_LOGIN_ROUTE);
  }, [router, user]);

  return (
    <MarketingShell current="home">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 pb-18 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-18">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
          <motion.div className="max-w-2xl space-y-8" {...revealUp}>
            <div className="inline-flex border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/54">
              <EncryptedText
                text={copy.hero.eyebrow}
                encryptedClassName="text-white/18"
                revealedClassName="text-white/54"
                revealDelayMs={18}
                flipDelayMs={20}
              />
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl xl:text-[4.9rem]">
                {copy.hero.title}
              </h1>
              <div className="text-2xl font-medium tracking-[-0.05em] text-white/86 sm:text-3xl">
                <span className="sr-only">{canvasWord}</span>
                <CanvasText
                  text={canvasWord}
                  className="font-medium"
                  backgroundClassName="bg-[#05070b]"
                  colors={["#f5f5f5", "#9ca3af", "#d4d4d8"]}
                  animationDuration={8}
                  lineGap={12}
                  lineWidth={1.2}
                  curveIntensity={36}
                />
              </div>
              <p className="max-w-xl text-base leading-8 text-white/58 sm:text-lg">
                {copy.hero.subtitle}
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 border border-white/10 bg-transparent px-6 text-sm font-medium text-white/76 hover:bg-white/[0.04] hover:text-white"
              >
                <a href="#capabilities">
                  {copy.hero.secondaryCta}
                  <MoveRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            <div className="inline-flex flex-wrap items-center gap-2 border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/62">
              <span>{isZh ? "从" : "Start with"}</span>
              <Cover className="text-white">
                <span className="font-medium tracking-[-0.03em]">{coverWord}</span>
              </Cover>
              <span>{isZh ? "，再让流程自然流动。" : "and let the workflow carry the rest."}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {proofSignals.map((item) => (
                <div
                  key={item}
                  className="border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/66"
                >
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...revealUp}>
            <CardContainer
              containerClassName="py-0"
              className="w-full"
            >
              <CardBody className="h-auto min-h-[34rem] w-full">
                <CardItem translateZ={22} className="w-full">
                  <ProductPreview />
                </CardItem>
                <CardItem
                  translateX={24}
                  translateY={-18}
                  translateZ={56}
                  className="absolute right-6 top-6 hidden border border-white/10 bg-[#090b10]/92 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/54 xl:block"
                >
                  {isZh
                    ? "Projects / Issues / Workflows / Docs"
                    : "Projects / Issues / Workflows / Docs"}
                </CardItem>
                <CardItem
                  translateX={-16}
                  translateY={18}
                  translateZ={48}
                  className="absolute bottom-6 left-6 hidden border border-white/10 bg-[#090b10]/94 px-3 py-2 text-xs text-white/72 xl:flex xl:items-center xl:gap-2"
                >
                  <span className="h-2 w-2 bg-emerald-200/70" />
                  {isZh
                    ? "远程协作始终保持同频"
                    : "Remote execution stays aligned"}
                </CardItem>
              </CardBody>
            </CardContainer>
          </motion.div>
        </div>

        <motion.div
          className="grid gap-4 border border-white/10 bg-white/[0.03] p-5 md:grid-cols-3"
          {...revealUp}
        >
          {copy.metrics.map((metric, index) => (
            <div key={metric.label} className="space-y-2">
              <p className="text-3xl font-semibold tracking-[-0.05em] text-white">
                {metric.value}
              </p>
              <p className="text-sm leading-6 text-white/52">{metric.label}</p>
              {index < copy.metrics.length - 1 ? (
                <Separator className="mt-4 hidden bg-white/8 md:block" />
              ) : null}
            </div>
          ))}
        </motion.div>
      </section>

      <section
        id="capabilities"
        className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8"
      >
        <motion.div {...revealUp}>
          <SectionHeading
            eyebrow={copy.capabilities.eyebrow}
            title={copy.capabilities.title}
            description={copy.capabilities.description}
          />
        </motion.div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {copy.capabilities.items.map((item, index) => {
            const Icon = featureIcons[item.name as keyof typeof featureIcons] ?? LayoutTemplate;

            return (
              <motion.div key={item.name} {...revealUp}>
                <CardSpotlight
                  className="h-full rounded-none"
                  color={index === 1  ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)"}
                  revealColors={
                    index === 0
                      ? [
                          [230, 230, 230],
                          [148, 163, 184],
                        ]
                      : [
                          [229, 231, 235],
                          [115, 115, 115],
                        ]
                  }
                  animationSpeed={4.5}
                >
                <div className="relative z-10 flex h-full flex-col gap-6 p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-white/82">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <Badge className="border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.22em] text-white/54">
                        {item.name}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold leading-8 text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-7 text-white/58">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardSpotlight>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section
        id="workflow"
        className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8"
      >
        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
          <motion.div className="space-y-6" {...revealUp}>
            <SectionHeading
              eyebrow={copy.workflow.eyebrow}
              title={copy.workflow.title}
              description={copy.workflow.description}
            />
            <div className="border border-white/10 bg-white/[0.03] p-5 text-sm leading-8 text-white/58">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                {isZh ? "协作原则" : "Operating principle"}
              </p>
              <p className="mt-3">
                {isZh
                  ? "当团队共享同一份上下文，推进就不再依赖提醒，而是依赖系统本身的秩序。"
                  : "When the team shares one context, progress stops depending on reminders and starts depending on system design."}
              </p>
            </div>
          </motion.div>

          <div className="space-y-4">
            {copy.workflow.steps.map((step) => (
              <motion.div key={step.step} {...revealUp}>
                <div className="grid gap-4 border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[72px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-sm font-semibold text-white/78">
                      {step.step}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-white/28">
                      Structured flow
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="text-sm leading-7 text-white/58">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="start"
        className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8 lg:pb-20"
      >
        <motion.div {...revealUp}>
          <div className="border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <SectionHeading
              eyebrow={copy.finalCta.title}
              title={
                <span>
                  {isZh ? "用更清晰的方式推进每一个项目。" : "Build each project with"}{" "}
                  <Cover className="text-white">
                    <span>{isZh ? "秩序感" : "order"}</span>
                  </Cover>
                </span>
              }
              description={copy.finalCta.description}
            />

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white hover:bg-white/[0.08]"
              >
                <Link href={primaryHref}>
                  {user ? copy.hero.returningCta : copy.finalCta.primary}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 border border-white/10 px-6 text-sm font-medium text-white/74 hover:bg-white/[0.04] hover:text-white"
              >
                <Link href="/pricing">
                  {isZh ? "查看协作方案与定价" : "Explore pricing"}
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <MarketingFooter
        description={copy.tagline}
        copyright={
          isZh
            ? `© ${new Date().getFullYear()} Synaply. 保留所有权利。`
            : `© ${new Date().getFullYear()} Synaply. All rights reserved.`
        }
        sections={footerSections}
        watermark="Synaply"
      />
    </MarketingShell>
  );
}
