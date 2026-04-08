// synaply-frontend/src/app/auth/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
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
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { SESSION_EXPIRED_REASON } from '@/lib/auth-utils';

// Google图标组件
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

type AuthMode = 'login' | 'register' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // MARK: useAuth
  const { signIn, signUp, signInWithGoogle, resetPassword, error, clearError, loading } = useAuth();
  const t = useTranslations();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('reason') === SESSION_EXPIRED_REASON) {
      setMode('login');
      setMessage({ type: 'error', text: t('auth.sessionExpired') });
    }
  }, [searchParams, t]);

  // 清除消息在一定时间后
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // MARK: 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || (!password && mode !== 'reset')) {
      setMessage({ type: 'error', text: t('auth.fillAllFields') });
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
            setMessage({ type: 'success', text: t('auth.loginSuccess') });
          }
          break;
          
        case 'register':
          result = await signUp(email, password);
          if (!result.error) {
            setMessage({ type: 'success', text: t('auth.registerSuccess') });
            setMode('login');
          }
          break;
          
        case 'reset':
          result = await resetPassword(email);
          if (!result.error) {
            setMessage({ type: 'success', text: t('auth.resetEmailSent') });
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

  // MARK: Google登录
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    clearError();
    setMessage(null);

    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setMessage({ type: 'error', text: t('auth.googleAuthError') });
      }
    } catch (err) {
      console.error('Google登录时出错:', err);
      setMessage({ type: 'error', text: t('auth.googleAuthError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeChange = (nextMode: AuthMode) => {
    clearError();
    setMessage(null);
    setMode(nextMode);
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

  const getModeTitle = () => {
    switch (mode) {
      case 'login':
        return t('auth.welcomeBack');
      case 'register':
        return t('auth.createAccount');
      case 'reset':
        return t('auth.resetPassword');
      default:
        return t('auth.welcomeBack');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 语言切换器 - 固定在右上角 */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

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
              {getModeTitle()}
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

          {/* Google登录按钮 - 只在登录和注册模式下显示 */}
          {mode !== 'reset' && (
            <motion.div variants={fadeInUp} className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || loading}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
              >
                {isSubmitting || loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <GoogleIcon className="w-5 h-5" />
                    {mode === 'login' ? t('auth.signInWithGoogle') : t('auth.continueWithGoogle')}
                  </>
                )}
              </button>
              
              {/* 分隔线 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-900 text-gray-400">{t('auth.orDivider')}</span>
                </div>
              </div>
            </motion.div>
          )}

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
                  {t('auth.emailAddress')}
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
                    {t('auth.password')}
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
                    
                    {mode === 'login' && t('auth.signIn')}
                    {mode === 'register' && t('auth.signUp')}
                    {mode === 'reset' && t('auth.sendResetEmail')}
                    
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
                  onClick={() => handleModeChange('register')}
                  className="text-gray-400 hover:text-green-400 transition-colors text-sm"
                >
                  {t('auth.noAccount')} <span className="font-semibold">{t('auth.registerNow')}</span>
                </button>
                <br />
                <button
                  type="button"
                  onClick={() => handleModeChange('reset')}
                  className="text-gray-400 hover:text-green-400 transition-colors text-sm"
                >
                  {t('auth.forgotPassword')}
                </button>
              </>
            )}
            
            {mode === 'register' && (
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-gray-400 hover:text-green-400 transition-colors text-sm"
              >
                {t('auth.hasAccount')} <span className="font-semibold">{t('auth.loginNow')}</span>
              </button>
            )}
            
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="text-gray-400 hover:text-green-400 transition-colors text-sm"
              >
                {t('auth.backToLogin')}
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
          {t('home.copyright')}
        </motion.div>
      </motion.div>
    </div>
  );
}
