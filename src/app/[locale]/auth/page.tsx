"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "register";

const MIN_PASSWORD_LENGTH = 8;

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isAuthenticated, isLoading, login, register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const submitLabel = useMemo(
    () => (mode === "login" ? "Sign in" : "Create account"),
    [mode],
  );

  const helperLabel =
    mode === "login"
      ? "Use your email and password to enter TuneAdmin."
      : "Create a new account with email and password.";

  const toggleLabel =
    mode === "login"
      ? "Need an account? Switch to register"
      : "Already have an account? Switch to sign in";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!normalizedEmail) {
      toast.error("Please enter your email address");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    if (mode === "register" && trimmedName.length > 64) {
      toast.error("Name must be 64 characters or fewer");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "register") {
        await register({
          name: trimmedName || undefined,
          email: normalizedEmail,
          password,
        });
        toast.success("Registration successful");
      } else {
        await login({
          email: normalizedEmail,
          password,
        });
        toast.success("Login successful");
      }

      router.replace("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Auth request failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f5] px-4 py-8 text-zinc-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(24,24,27,0.08),transparent_45%)]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="relative w-full max-w-[920px]"
      >
        <Card className="grid overflow-hidden border-zinc-200/90 bg-white/95 shadow-xl backdrop-blur lg:grid-cols-[1.1fr_1fr]">
          <div className="hidden border-r border-zinc-200 bg-zinc-50/80 p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                TuneAdmin
              </p>
              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900">
                Inspired by the clarity of Notion and Linear
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                Sign in to manage teachers, bookings, and users from one focused admin workspace.
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
              <p className="font-medium text-zinc-800">Current auth mode</p>
              <p className="mt-1">Email + password only</p>
              {user && (
                <p className="mt-3 text-xs text-zinc-500">Current user: {user.name || user.email}</p>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <CardHeader className="space-y-2 p-0">
              <CardTitle className="text-2xl font-semibold text-zinc-900">{submitLabel}</CardTitle>
              <CardDescription className="text-zinc-500">{helperLabel}</CardDescription>
            </CardHeader>

            <CardContent className="mt-6 p-0">
              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-700">
                      <User className="h-4 w-4" />
                      Name
                    </Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-700">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-700">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Please wait..." : submitLabel}
                  {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="mt-4 w-full text-center text-sm text-zinc-500 transition-colors hover:text-zinc-900"
              >
                {toggleLabel}
              </button>

              <div className="mt-6 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500">
                <Link href="/dashboard" className="font-medium text-zinc-700 hover:text-zinc-900">
                  Continue to dashboard template
                </Link>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
