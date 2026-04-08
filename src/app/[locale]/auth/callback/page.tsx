'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  AUTH_ROUTE,
  DEFAULT_POST_LOGIN_ROUTE,
  getAuthParam,
} from '@/lib/auth-utils';
import { createClientComponentClient } from '@/lib/supabase';

type CallbackStatus = 'loading' | 'success' | 'error';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [message, setMessage] = useState('');
  const [supabase] = useState(() => createClientComponentClient());
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    let mounted = true;
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;
    let verificationTimer: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: (() => void) | null = null;

    const clearAuthUrl = () => {
      window.history.replaceState({}, '', window.location.pathname);
    };

    const finishSuccess = () => {
      if (!mounted) {
        return;
      }

      if (verificationTimer) {
        clearTimeout(verificationTimer);
        verificationTimer = null;
      }

      unsubscribe?.();
      unsubscribe = null;
      clearAuthUrl();
      setStatus('success');
      setMessage(t('auth.accountVerificationSuccess'));
      redirectTimer = setTimeout(() => {
        router.replace(DEFAULT_POST_LOGIN_ROUTE);
      }, 1500);
    };

    const finishError = (nextMessage: string) => {
      if (!mounted) {
        return;
      }

      if (verificationTimer) {
        clearTimeout(verificationTimer);
        verificationTimer = null;
      }

      unsubscribe?.();
      unsubscribe = null;
      setStatus('error');
      setMessage(nextMessage);
    };

    const resolveExistingSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('认证回调错误:', error);
        finishError(error.message || t('auth.failedToVerify'));
        return true;
      }

      if (session) {
        finishSuccess();
        return true;
      }

      return false;
    };

    const handleAuthCallback = async () => {
      try {
        const urlError = getAuthParam('error_description') ?? getAuthParam('error');

        if (urlError) {
          finishError(urlError);
          return;
        }

        const code = getAuthParam('code');

        if (await resolveExistingSession()) {
          return;
        }

        if (!code) {
          finishError(t('auth.failedToVerify'));
          return;
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!mounted || !nextSession) {
            return;
          }

          finishSuccess();
        });

        unsubscribe = () => subscription.unsubscribe();

        verificationTimer = setTimeout(async () => {
          if (await resolveExistingSession()) {
            return;
          }

          finishError(t('auth.failedToVerify'));
        }, 5000);
      } catch (err) {
        console.error('处理认证回调时出错:', err);
        finishError(t('auth.failedToVerify'));
      }
    };

    void handleAuthCallback();

    return () => {
      mounted = false;

      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }

      if (verificationTimer) {
        clearTimeout(verificationTimer);
      }

      unsubscribe?.();
    };
  }, [router, supabase, t]);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -60 },
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
              <h1 className="text-2xl font-bold text-white mb-2">{t('auth.verifying')}</h1>
              <p className="text-gray-400">{t('auth.verifyingAccount')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('auth.verificationSuccess')}
              </h1>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('auth.verificationFailed')}
              </h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => router.replace(AUTH_ROUTE)}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                {t('auth.returnToLogin')}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
