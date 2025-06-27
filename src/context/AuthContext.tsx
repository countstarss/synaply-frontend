// synaply-frontend/src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation'; // 导入 useRouter

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // 初始化 useRouter

  useEffect(() => {
    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);

      // 根据认证事件进行重定向
      if (_event === 'SIGNED_OUT') {
        router.push('/auth'); // 用户登出时重定向到登录页
      } else if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
        // 如果用户已登录且当前在认证页面，则重定向到仪表盘
        if (window.location.pathname === '/auth') {
          router.push('/dashboard'); // 假设你的仪表盘路由是 /dashboard
        }
      }
    });

    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    // 清理订阅
    return () => {
      subscription.unsubscribe();
    };
  }, [router]); // 将 router 添加到依赖数组

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      setLoading(false);
    }
    // onAuthStateChange 会自动处理 session/user 为 null 并重定向
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
