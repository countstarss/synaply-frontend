// synaply-frontend/src/components/AuthGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // 如果不在加载中且用户未登录，则重定向到认证页面
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // 在加载或用户未登录时显示加载状态或空内容
    return <div>Loading...</div>; // 或者一个更友好的加载组件
  }

  return <>{children}</>;
}
