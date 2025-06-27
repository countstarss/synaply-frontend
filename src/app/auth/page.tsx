// synaply-frontend/src/app/auth/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'register' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { signIn, signUp, resetPassword, error, clearError, loading } = useAuth();

  // 清除错误信息当切换模式时
  useEffect(() => {
    clearError();
    setMessage(null);
  }, [mode, clearError]);

  // 清除消息在一定时间后
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || (!password && mode !== 'reset')) {
      setMessage({ type: 'error', text: '请填写所有必填字段' });
      return;
    }

    setIsSubmitting(true);
    clearError();
    setMessage(null);

    try {
      let result;
      
      switch (mode) {
        case 'login':
          result = await signIn(email, password);
          if (!result.error) {
            setMessage({ type: 'success', text: '登录成功！正在跳转...' });
          }
          break;
          
        case 'register':
          result = await signUp(email, password);
          if (!result.error) {
            setMessage({ type: 'success', text: '注册成功！请检查您的邮箱确认账户。' });
            setMode('login');
          }
          break;
          
        case 'reset':
          result = await resetPassword(email);
          if (!result.error) {
            setMessage({ type: 'success', text: '密码重置邮件已发送！请检查您的邮箱。' });
            setMode('login');
          }
          break;
      }
    } catch (err) {
      console.error('提交表单时出错:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -60 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const currentError = error || (message?.type === 'error' ? message.text : null);
  const currentSuccess = message?.type === 'success' ? message.text : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景动画效果 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* 主卡片 */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8">
          {/* 标题区域 */}
          <motion.div
            className="text-center mb-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeInUp} className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-3xl font-bold text-white mb-2">
              Synaply
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-gray-400">
              {mode === 'login' && '欢迎回来'}
              {mode === 'register' && '创建您的账户'}
              {mode === 'reset' && '重置您的密码'}
            </motion.p>
          </motion.div>

          {/* 错误/成功消息 */}
          <AnimatePresence>
            {(currentError || currentSuccess) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
                  currentError 
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                    : 'bg-green-500/10 border border-green-500/20 text-green-400'
                }`}
              >
                {currentError ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{currentError || currentSuccess}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {/* 邮箱输入 */}
              <motion.div variants={fadeInUp}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                    placeholder="your@example.com"
                    required
                  />
                </div>
              </motion.div>

              {/* 密码输入 */}
              {mode !== 'reset' && (
                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-200"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* 提交按钮 */}
            <motion.div variants={fadeInUp}>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting || loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' && <User className="w-5 h-5" />}
                    {mode === 'register' && <User className="w-5 h-5" />}
                    {mode === 'reset' && <Mail className="w-5 h-5" />}
                    
                    {mode === 'login' && '登录'}
                    {mode === 'register' && '注册'}
                    {mode === 'reset' && '发送重置邮件'}
                    
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* 切换模式 */}
          <motion.div 
            variants={fadeInUp}
            className="mt-6 text-center space-y-2"
          >
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-gray-400 hover:text-green-400 transition-colors text-sm"
                >
                  没有账户？<span className="font-semibold">立即注册</span>
                </button>
                <br />
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-gray-400 hover:text-green-400 transition-colors text-sm"
                >
                  忘记密码？
                </button>
              </>
            )}
            
            {mode === 'register' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-gray-400 hover:text-green-400 transition-colors text-sm"
              >
                已有账户？<span className="font-semibold">立即登录</span>
              </button>
            )}
            
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-gray-400 hover:text-green-400 transition-colors text-sm"
              >
                返回<span className="font-semibold">登录页面</span>
              </button>
            )}
          </motion.div>
        </div>

        {/* 底部装饰 */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-gray-500 text-sm"
        >
          © 2024 Synaply. 保留所有权利.
        </motion.div>
      </motion.div>
    </div>
  );
}
