"use client";

import { motion } from "framer-motion";
import { ArrowRight, Blocks, LayoutTemplate, Palette, PlugZap } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: LayoutTemplate,
    title: "Neutral Information Architecture",
    description: "Prebuilt module structure that can be adapted to any domain.",
  },
  {
    icon: Blocks,
    title: "Composable Sections",
    description: "Cards, table blocks, timeline and settings placeholders out of the box.",
  },
  {
    icon: PlugZap,
    title: "Backend Agnostic",
    description: "Use mock data first, then connect any REST, GraphQL, or BaaS stack.",
  },
  {
    icon: Palette,
    title: "Theme Ready",
    description: "Color variables and reusable primitives are already wired together.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Marketplace UI Template</p>
            <h1 className="mt-2 text-2xl font-semibold">TuneAdmin Template</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Auth UI
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
            >
              Open Template
            </Link>
          </div>
        </motion.header>

        <main className="flex flex-1 flex-col justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-400">Ready to sell and extend</p>
            <h2 className="mt-4 text-5xl font-bold leading-tight md:text-6xl">
              A business-neutral admin UI starter for rapid product delivery.
            </h2>
            <p className="mt-6 max-w-2xl text-lg text-zinc-300">
              Remove domain lock-in, start from a polished baseline, and ship your own
              product workflows faster. Every core page is pre-built with mock data and
              reusable patterns.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
              >
                Preview Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/settings"
                className="rounded-lg border border-zinc-700 px-5 py-3 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                View Settings Scaffolding
              </Link>
            </div>
          </motion.div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur"
              >
                <feature.icon className="h-6 w-6 text-zinc-100" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
