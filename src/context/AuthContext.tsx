// synaply-frontend/src/context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session, User, AuthError } from "@supabase/supabase-js";
import { createClientComponentClient } from "@/lib/supabase";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  // 创建 Supabase 客户端实例
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true; // 防止内存泄漏的标志

    // 获取初始会话
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return; // 组件已卸载，忽略结果

        if (error) {
          console.error("获取会话时出错:", error);
          setError(error.message);
        } else {
          setSession(session);
          setUser(session?.user || null);
          // FIXME: 临时输出用来测试
          if (session?.access_token) {
            console.log("Supabase Access Token:", session.access_token);
            console.log("Supabase Refresh Token:", session.user);
          }
        }
      } catch (err) {
        if (!mounted) return;
        console.error("获取会话时发生异常:", err);
        setError("获取会话时发生未知错误");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // console.log('认证状态变化:', event, session?.user?.email);

      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
      setError(null); // 清除之前的错误

      // 根据认证事件进行重定向
      if (event === "SIGNED_OUT") {
        // 退出登录后重定向到首页，让用户选择是否重新登录
        router.push("/");
      } else if (event === "SIGNED_IN") {
        // 如果用户已登录且当前在认证页面，则重定向到仪表盘
        if (pathname === "/auth") {
          router.push("/dashboard");
        }
      } else if (event === "INITIAL_SESSION" && session) {
        // 初始会话存在且当前在认证页面，重定向到仪表盘
        if (pathname === "/auth") {
          router.push("/dashboard");
        }
      }
    });

    // 清理函数
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname, locale, supabase.auth]);

  // MARK: 注册函数
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${
            locale === "en" ? "" : `/${locale}`
          }/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      console.error("注册时发生异常:", err);
      const errorMessage = "注册时发生未知错误";
      setError(errorMessage);
      return { error: new Error(errorMessage) as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // MARK: 登录函数
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      console.error("登录时发生异常:", err);
      const errorMessage = "登录时发生未知错误";
      setError(errorMessage);
      return { error: new Error(errorMessage) as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // MARK: Google登录函数
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${
            locale === "en" ? "" : `/${locale}`
          }/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      console.error("Google登录时发生异常:", err);
      const errorMessage = "Google登录时发生未知错误";
      setError(errorMessage);
      return { error: new Error(errorMessage) as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // MARK: 登出函数
  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      console.error("登出时发生异常:", err);
      const errorMessage = "登出时发生未知错误";
      setError(errorMessage);
      return { error: new Error(errorMessage) as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // MARK: 重置密码函数
  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${
          locale === "en" ? "" : `/${locale}`
        }/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      console.error("重置密码时发生异常:", err);
      const errorMessage = "重置密码时发生未知错误";
      setError(errorMessage);
      return { error: new Error(errorMessage) as AuthError };
    } finally {
      setLoading(false);
    }
  };

  // MARK: 清除错误
  const clearError = () => setError(null);

  const value = {
    session,
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
