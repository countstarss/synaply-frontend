'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 从 URL 获取当前会话
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('认证回调错误:', error);
          setStatus('error');
          setMessage(error.message || '认证过程中发生错误');
          return;
        }

        if (session) {
          setStatus('success');
          setMessage('账户验证成功！正在跳转到主页...');
          
          // 延迟跳转以显示成功消息
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        } else {
          // 如果没有会话，尝试从 URL 交换代码
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          
          if (code) {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('代码交换错误:', exchangeError);
              setStatus('error');
              setMessage(exchangeError.message || '验证过程中发生错误');
              return;
            }

            if (data?.session) {
              setStatus('success');
              setMessage('账户验证成功！正在跳转到主页...');
              
              setTimeout(() => {
                router.push('/dashboard');
              }, 2000);
            } else {
              setStatus('error');
              setMessage('未能验证您的账户，请重试');
            }
          } else {
            setStatus('error');
            setMessage('缺少验证代码，请重试');
          }
        }
      } catch (err) {
        console.error('处理认证回调时出错:', err);
        setStatus('error');
        setMessage('处理认证时发生未知错误');
      }
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -60 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center"
      >
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-green-400 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">验证中...</h1>
              <p className="text-gray-400">正在验证您的账户，请稍候</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">验证成功！</h1>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">验证失败</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => router.push('/auth')}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                返回登录页面
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
} 