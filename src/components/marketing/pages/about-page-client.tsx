"use client";

import { motion } from "framer-motion";
import { Layers3, PenTool, Rocket, Workflow } from "lucide-react";
import Image from "next/image";

import { MarketingShell } from "@/components/marketing/site-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import {
  CardBody,
  CardContainer,
  CardItem,
} from "@/components/ui/3d-card";
import { CanvasText } from "@/components/ui/canvas-text";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Cover } from "@/components/ui/cover";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { EvervaultCard } from "@/components/ui/evervault-card";

const revealUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

interface AboutPageClientProps {
  locale: string;
}

export default function AboutPageClient({ locale }: AboutPageClientProps) {
  const isZh = locale === "zh";

  const principles = isZh
    ? [
        {
          icon: <Layers3 className="h-5 w-5" />,
          title: "统一上下文",
          description: "项目、Issue、Workflow 与 Docs 不再分散在不同工具里，而是天然属于同一个工作系统。",
        },
        {
          icon: <Workflow className="h-5 w-5" />,
          title: "流程优先于催促",
          description: "我们相信更好的协作不来自更多提醒，而来自更清晰的阶段、责任人与路径设计。",
        },
        {
          icon: <PenTool className="h-5 w-5" />,
          title: "文档属于执行过程",
          description: "需求、背景、决策与操作说明应该始终贴着工作对象本身，而不是沉到归档角落。",
        },
      ]
    : [
        {
          icon: <Layers3 className="h-5 w-5" />,
          title: "One shared context",
          description:
            "Projects, issues, workflows, and docs should not live in disconnected tools. They should belong to the same operating surface.",
        },
        {
          icon: <Workflow className="h-5 w-5" />,
          title: "Workflow over chasing",
          description:
            "Better collaboration comes from clearer stages, ownership, and paths forward, not from more reminders and follow-up messages.",
        },
        {
          icon: <PenTool className="h-5 w-5" />,
          title: "Docs inside execution",
          description:
            "Requirements, rationale, and operational notes should stay attached to the work itself rather than fading into archive space.",
        },
      ];

  const story = isZh
    ? [
        "Synaply 不是为了管理更多任务而设计。",
        "它更像一个为远程小团队准备的协作操作系统，让不同角色在同一个项目语境中自然流转。",
        "当流程清晰、上下文完整、文档紧贴执行，团队就能把精力放回交付本身。",
      ]
    : [
        "Synaply was not designed to help teams manage more tasks.",
        "It is closer to a collaboration operating system for small remote teams, where different roles can move through the same project context naturally.",
        "When workflow is legible, context is intact, and docs stay attached to execution, teams can focus on delivery again.",
      ];

  return (
    <MarketingShell current="about">
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-18">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <motion.div className="space-y-8" {...revealUp}>
            <div className="inline-flex border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/54">
              <EncryptedText
                text={isZh ? "关于 Synaply" : "About Synaply"}
                encryptedClassName="text-white/18"
                revealedClassName="text-white/54"
                revealDelayMs={18}
                flipDelayMs={20}
              />
            </div>

            <SectionHeading
              eyebrow={isZh ? "为什么做这个产品" : "Why it exists"}
              title={
                <span>
                  {isZh ? "我们想为远程小团队提供一套更" : "We want remote teams to work with more"}{" "}
                  <Cover className="text-white">
                    <span>{isZh ? "清晰的秩序" : "clarity"}</span>
                  </Cover>
                  {isZh ? "。" : "."}
                </span>
              }
              description={
                isZh
                  ? "Synaply 相信，真正好的协作不是信息搬运更快，而是让目标、流程、任务与文档从一开始就处在同一套逻辑里。"
                  : "Synaply is built on a simple belief: the best collaboration systems are not faster inboxes. They are clearer environments where goals, process, work, and documentation belong to one logic."
              }
            />

            <div className="text-2xl font-medium tracking-[-0.05em] text-white/82">
              <span className="sr-only">
                {isZh ? "秩序感与推进感并存" : "order with momentum"}
              </span>
              <CanvasText
                text={isZh ? "秩序感与推进感并存" : "order with momentum"}
                className="font-medium"
                backgroundClassName="bg-[#05070b]"
                colors={["#f5f5f5", "#a1a1aa", "#d4d4d8"]}
                animationDuration={8}
                lineGap={12}
                lineWidth={1.2}
                curveIntensity={34}
              />
            </div>

            <div className="space-y-3">
              {story.map((paragraph) => (
                <p key={paragraph} className="text-base leading-8 text-white/58">
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>

          <motion.div {...revealUp}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="border border-white/10 bg-white/[0.03] p-5">
                <CardContainer containerClassName="py-0" className="w-full">
                  <CardBody className="h-auto min-h-[28rem] w-full">
                    <CardItem translateZ={18} className="w-full">
                      <div className="overflow-hidden border border-white/10 bg-[#07090d]">
                        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-white/32">
                              {isZh ? "产品界面" : "Product surface"}
                            </p>
                            <p className="mt-1 text-sm text-white/64">
                              {isZh
                                ? "真实产品界面作为 Synaply 的工作语境证明。"
                                : "A live product surface instead of an abstract collaboration mock."}
                            </p>
                          </div>
                          <div className="border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/50">
                            Synaply app
                          </div>
                        </div>

                        <div className="relative aspect-[1.08/1] bg-[#05070b]">
                          <Image
                            src="/synaply.png"
                            alt="Synaply remote collaboration workspace for projects, issues, workflows, and docs"
                            fill
                            priority
                            className="object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,11,0)_0%,rgba(5,7,11,0.08)_62%,rgba(5,7,11,0.4)_100%)]" />
                        </div>
                      </div>
                    </CardItem>

                    <CardItem
                      translateX={18}
                      translateY={-14}
                      translateZ={44}
                        className="absolute right-5 top-5 hidden border border-white/10 bg-[#090b10]/94 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/54 xl:block"
                    >
                      {isZh ? "远程协作工作空间" : "Remote-first workspace"}
                    </CardItem>

                    <CardItem
                      translateX={-16}
                      translateY={18}
                      translateZ={38}
                      className="absolute bottom-5 left-5 hidden border border-white/10 bg-[#090b10]/94 px-3 py-2 text-xs text-white/72 xl:flex xl:items-center xl:gap-2"
                    >
                      <span className="h-2 w-2 bg-emerald-200/70" />
                      {isZh ? "真实产品视图" : "Live product view"}
                    </CardItem>
                  </CardBody>
                </CardContainer>
              </div>

              <div className="border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/34">
                  {isZh ? "产品符号" : "Operating symbol"}
                </div>
                <div className="mt-4 h-48">
                  <EvervaultCard text="OS" />
                </div>
                <p className="mt-4 text-sm leading-7 text-white/58">
                  {isZh
                    ? "对于我们来说，协作系统的价值不在于堆多少能力，而在于能否持续承接上下文。"
                    : "For us, a collaboration system is valuable only if it can keep holding context as work moves."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div {...revealUp}>
          <SectionHeading
            eyebrow={isZh ? "产品原则" : "Principles"}
            title={isZh ? "我们如何理解协作产品" : "How we think about collaboration software"}
            description={
              isZh
                ? "这不是另一个把任务堆起来的工具，而是一种让团队维持统一节奏的工作结构。"
                : "This is not another place to stack tasks. It is a structure that helps teams stay in the same rhythm."
            }
          />
        </motion.div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {principles.map((principle, index) => (
            <motion.div key={principle.title} {...revealUp}>
              <CardSpotlight
                className="h-full"
                color={index === 1 ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)"}
                revealColors={
                  index === 1
                    ? [
                        [229, 231, 235],
                        [148, 163, 184],
                      ]
                    : [
                        [235, 235, 235],
                        [110, 110, 110],
                      ]
                }
              >
                <div className="relative z-10 flex h-full flex-col gap-6 p-6">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.04] text-white/82">
                    {principle.icon}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white">
                      {principle.title}
                    </h3>
                    <p className="text-sm leading-7 text-white/58">
                      {principle.description}
                    </p>
                  </div>
                </div>
              </CardSpotlight>
            </motion.div>
          ))}
        </div>

        <motion.div className="mt-10 border border-white/10 bg-white/[0.03] p-6" {...revealUp}>
          <div className="flex items-center gap-3 text-sm text-white/70">
            <Rocket className="h-4 w-4" />
            {isZh
              ? "少一些来回确认，多一些自然流转。"
              : "Less checking in. More work arriving where it needs to be."}
          </div>
        </motion.div>
      </section>
    </MarketingShell>
  );
}
