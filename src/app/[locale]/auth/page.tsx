"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-100 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Template Auth UI</CardTitle>
            <p className="text-sm text-zinc-400">
              This page is presentation-only. Connect your own auth provider and
              submit handlers.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {mode === "register" && (
              <label className="block text-sm">
                <span className="mb-1 inline-flex items-center gap-2 text-zinc-400">
                  <User className="h-4 w-4" />
                  Name
                </span>
                <input
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  placeholder="Taylor Morgan"
                  disabled
                />
              </label>
            )}

            <label className="block text-sm">
              <span className="mb-1 inline-flex items-center gap-2 text-zinc-400">
                <Mail className="h-4 w-4" />
                Email
              </span>
              <input
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                placeholder="you@company.com"
                disabled
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 inline-flex items-center gap-2 text-zinc-400">
                <Lock className="h-4 w-4" />
                Password
              </span>
              <input
                className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                placeholder="••••••••"
                disabled
              />
            </label>

            <Button className="w-full" disabled>
              {mode === "login" ? "Sign in (Connect Backend)" : "Create account (Connect Backend)"}
            </Button>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="w-full text-center text-sm text-zinc-400 hover:text-zinc-200"
            >
              {mode === "login" ? "Need an account? Switch to register" : "Already have an account? Switch to sign in"}
            </button>

            <div className="border-t border-zinc-800 pt-4 text-center text-xs text-zinc-500">
              <p>Demo mode only. No credentials are submitted.</p>
              <Link href="/dashboard" className="mt-2 inline-block text-zinc-300 hover:text-white">
                Go to template dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
