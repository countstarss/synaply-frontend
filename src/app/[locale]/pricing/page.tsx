"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Layers3,
  MessageSquareMore,
  ShieldCheck,
} from "lucide-react";
import { useLocale } from "next-intl";

import { MarketingShell } from "@/components/marketing/site-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { EvervaultCard } from "@/components/ui/evervault-card";
import { GlareCard } from "@/components/ui/glare-card";
import { Link } from "@/i18n/navigation";
import { AUTH_ROUTE } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

const revealUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

function PlanGlyph() {
  return (
    <svg
      width="66"
      height="65"
      viewBox="0 0 66 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-7 w-7 text-white"
    >
      <path
        d="M8 8.05571C8 8.05571 54.9009 18.1782 57.8687 30.062C60.8365 41.9458 9.05432 57.4696 9.05432 57.4696"
        stroke="currentColor"
        strokeWidth="15"
        strokeMiterlimit="3.86874"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PricingPage() {
  const locale = useLocale();
  const isZh = locale === "zh";

  const plans = isZh
    ? [
        {
          name: "Launch",
          featured: false,
          price: "$9",
          priceHint: "每成员 / 月起",
          summary: "适合刚开始建立协作秩序",
          label: "适合刚建立协作秩序的团队",
          description: "从项目、Issue、Workflow 与 Docs 的统一语境开始，不必一开始就背上复杂流程。",
          badge: "Private beta",
          features: [
            "Projects / Issues / Workflows / Docs 一体化",
            "为 3-8 人远程团队优化",
            "快速上手，低摩擦切入",
          ],
        },
        {
          name: "Team",
          featured: true,
          price: "$19",
          priceHint: "每成员 / 月起",
          summary: "适合稳定推进的多角色团队",
          label: "适合多角色稳定协作的主力方案",
          description: "让产品、设计、研发、运营在同一套节奏中推进，交接、状态与文档都保持清晰。",
          badge: "Most aligned",
          features: [
            "更完整的 workflow 管理方式",
            "更适合 5-15 人混合角色团队",
            "让推进过程更稳定、更可追踪",
          ],
        },
        {
          name: "Custom",
          featured: false,
          price: "Custom",
          priceHint: "按团队规模定制报价",
          summary: "适合长期协作结构定制",
          label: "适合更长期的团队协作规划",
          description: "如果你希望围绕团队节奏、流程设计与协作规范一起打磨，我们可以提供更定制的接入方式。",
          badge: "Contact",
          features: [
            "定制接入与流程梳理",
            "适配更复杂的协作结构",
            "一起定义更长期的协作中枢",
          ],
        },
      ]
    : [
        {
          name: "Launch",
          featured: false,
          price: "$9",
          priceHint: "per member / mo",
          summary: "For teams setting up a calmer operating rhythm",
          label: "For teams establishing a calmer operating rhythm",
          description:
            "Start with projects, issues, workflows, and docs in one system without inheriting process weight on day one.",
          badge: "Private beta",
          features: [
            "Unified projects, issues, workflows, and docs",
            "Designed for remote teams with 3-8 people",
            "Fast adoption with low coordination overhead",
          ],
        },
        {
          name: "Team",
          featured: true,
          price: "$19",
          priceHint: "per member / mo",
          summary: "For multi-role teams running steady execution",
          label: "For mixed-discipline teams running steady execution",
          description:
            "Keep product, design, engineering, and operations moving in one rhythm with visible handoffs and attached context.",
          badge: "Most aligned",
          features: [
            "More complete workflow control",
            "Optimized for 5-15 person cross-functional teams",
            "More reliable status, ownership, and follow-through",
          ],
        },
        {
          name: "Custom",
          featured: false,
          price: "Custom",
          priceHint: "tailored quote",
          summary: "For longer-term workflow design and rollout",
          label: "For long-term operating design and tailored rollout",
          description:
            "If the team wants to shape process, structure, and collaboration norms deliberately, Synaply can be introduced more intentionally.",
          badge: "Contact",
          features: [
            "Tailored rollout and operating consultation",
            "Support for more complex collaboration structures",
            "Built around the team’s long-term rhythm",
          ],
        },
      ];

  const included = isZh
    ? [
        "没有碎片化模块堆叠，只有统一协作语境",
        "重点不是增加功能数量，而是减少推进摩擦",
        "方案划分围绕团队协作状态，而不是功能锁定",
      ]
    : [
        "No fragmented module sprawl, just one operating context",
        "The goal is less coordination drag, not more feature volume",
        "Packaging maps to team maturity, not arbitrary feature locks",
      ];

  return (
    <MarketingShell current="pricing">
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-18">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
          <motion.div className="space-y-8" {...revealUp}>
            <SectionHeading
              eyebrow={isZh ? "Pricing" : "Pricing"}
              title={
                <span>
                  {isZh ? "定价应该像产品本身一样" : "Pricing should feel as"}{" "}
                  <Cover className="text-white">
                    <span>{isZh ? "清晰" : "clear"}</span>
                  </Cover>
                  {isZh ? "。": "."}
                </span>
              }
              description={
                isZh
                  ? "Synaply 的方案不是为了制造复杂度，而是为了让不同阶段的小团队都能以合适的方式进入同一套协作系统。"
                  : "Synaply packaging is meant to preserve clarity. Different team stages should be able to enter the same operating system without unnecessary complexity."
              }
            />

            <div className="grid gap-3 sm:grid-cols-3">
              {included.map((item) => (
                <div
                  key={item}
                  className="border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/62"
                >
                  {item}
                </div>
              ))}
            </div>

            <Button
              asChild
              size="lg"
              className="h-12 border border-white/12 bg-white/[0.05] px-6 text-sm font-medium text-white hover:bg-white/[0.08]"
            >
              <Link href={AUTH_ROUTE}>
                {isZh ? "开始使用 Synaply" : "Start with Synaply"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          <motion.div {...revealUp}>
            <div className="border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                    Plan signal
                  </p>
                  <p className="mt-2 text-sm text-white/62">
                    {isZh
                      ? "不是堆更多功能，而是让团队更稳地进入同一套推进节奏。"
                      : "The aim is not more surface area. It is a steadier way into the same operating rhythm."}
                  </p>
                </div>
                <div className="h-32 w-32">
                  <EvervaultCard text="SYNC" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: <Layers3 className="h-4 w-4" />,
                    text: isZh ? "统一工作空间" : "Unified workspace",
                  },
                  {
                    icon: <MessageSquareMore className="h-4 w-4" />,
                    text: isZh ? "更少重复确认" : "Less follow-up noise",
                  },
                  {
                    icon: <ShieldCheck className="h-4 w-4" />,
                    text: isZh ? "更稳定的协作秩序" : "More reliable coordination",
                  },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="border border-white/10 bg-[#090b10] px-4 py-4 text-sm text-white/66"
                  >
                    <div className="mb-3 text-white/74">{item.icon}</div>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              {...revealUp}
              className={cn(plan.featured && "lg:-translate-y-3")}
            >
              <div className="relative h-full">
                <div
                  className={cn(
                    "absolute right-4 top-3 z-10 px-3 py-1 text-[11px] uppercase tracking-[0.2em]",
                    plan.featured
                      ? "border border-white/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(191,219,254,0.08))] text-white"
                      : "border border-white/10 bg-[#090b10] text-white/54",
                  )}
                >
                  {plan.badge}
                </div>

                <GlareCard
                  containerClassName="[--radius:28px]"
                  className={cn(
                    "flex min-h-[22rem] flex-col items-center justify-center rounded-[28px] px-6 text-center",
                    plan.featured
                      ? "bg-[linear-gradient(180deg,rgba(7,10,28,0.98),rgba(2,6,23,1))]"
                      : "bg-[#020617]",
                  )}
                >
                  <PlanGlyph />
                  <p className="mt-4 text-xl font-bold text-white">{plan.name}</p>
                  <div className="mt-6">
                    <p className="text-4xl font-semibold tracking-[-0.06em] text-white">
                      {plan.price}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/38">
                      {plan.priceHint}
                    </p>
                  </div>
                  <div className="mt-8 max-w-[16rem] space-y-3">
                    <p className="text-sm leading-7 text-white/62">
                      {plan.summary}
                    </p>
                    <div className="mx-auto h-px w-16 bg-white/10" />
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/30">
                      {plan.featured
                        ? isZh
                          ? "推荐团队规模 5-15"
                          : "Best for 5-15 seats"
                        : plan.name === "Launch"
                          ? isZh
                            ? "推荐团队规模 3-8"
                            : "Best for 3-8 seats"
                          : isZh
                            ? "按团队规模定制"
                            : "Tailored to team size"}
                    </p>
                    <Link
                      href={AUTH_ROUTE}
                      className={cn(
                        "group relative inline-flex h-11 w-full items-center justify-center overflow-hidden border px-4 text-sm font-medium text-white transition",
                        plan.featured
                          ? "border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] hover:border-white/28 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))]"
                          : "border-white/12 bg-white/[0.05] hover:border-white/18 hover:bg-white/[0.08]",
                      )}
                    >
                      <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-80" />
                      <span className="relative">
                        {isZh ? "申请体验" : "Request access"}
                      </span>
                    </Link>
                  </div>
                </GlareCard>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
