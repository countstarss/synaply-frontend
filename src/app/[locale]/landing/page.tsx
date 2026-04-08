"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Shield, Cpu, Globe, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { DEFAULT_POST_LOGIN_ROUTE, getAuthParam } from "@/lib/auth-utils";
import { createClientComponentClient } from "@/lib/supabase";
import Image from "next/image";
import logo from "@/assets/icons/logo.png";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [supabase] = useState(() => createClientComponentClient());

  // 处理OAuth回调
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = getAuthParam("code");

      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            code
          );

          if (error) {
            console.error("OAuth代码交换失败:", error);
          } else if (data?.session) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
            router.replace(DEFAULT_POST_LOGIN_ROUTE);
          }
        } catch (err) {
          console.error("处理OAuth回调时出错:", err);
        }
      }
    };

    handleOAuthCallback();
  }, [router, supabase]);

  const handleGetStarted = () => {
    if (user) {
      router.push(DEFAULT_POST_LOGIN_ROUTE);
    } else {
      router.push("/auth");
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const features = [
    {
      icon: Shield,
      title: t("home.features.security.title"),
      description: t("home.features.security.description"),
    },
    {
      icon: Cpu,
      title: t("home.features.performance.title"),
      description: t("home.features.performance.description"),
    },
    {
      icon: Globe,
      title: t("home.features.design.title"),
      description: t("home.features.design.description"),
    },
  ];

  const featuresList = [
    t("home.featuresList.secureAuth"),
    t("home.featuresList.passwordReset"),
    t("home.featuresList.emailVerification"),
    t("home.featuresList.modernUI"),
    t("home.featuresList.responsive"),
    t("home.featuresList.realTime"),
    t("home.featuresList.routeProtection"),
    t("home.featuresList.errorHandling"),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* 导航栏 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Image
                src={logo}
                alt="Synaply"
                width={36}
                height={36}
                className=""
              />
              <h1 className="text-2xl font-bold text-white">Synaply</h1>
            </div>

            {/* 导航菜单 */}
            <div className="flex items-center space-x-4">
              {/* <LanguageSwitcher /> */}

              {!loading && (
                <div>
                  {user ? (
                    <button
                      type="button"
                      onClick={() => router.push(DEFAULT_POST_LOGIN_ROUTE)}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                    >
                      {t("nav.dashboard")}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => router.push("/auth")}
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        {t("nav.login")}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/auth")}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                      >
                        {t("nav.register")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* 背景动画效果 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* 主内容 */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="text-center space-y-16"
        >
          {/* 英雄区域 */}
          <div className="space-y-8">
            <motion.div variants={fadeInUp} className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                {t("home.title")}
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
                {t("home.subtitle")}
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={handleGetStarted}
                disabled={loading}
                type="button"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 transition-all duration-200 group"
              >
                {user ? t("home.enterDashboard") : t("home.getStarted")}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                className="inline-flex items-center px-8 py-4 bg-gray-800/50 text-white font-semibold rounded-lg hover:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all duration-200 border border-gray-700/50"
              >
                {t("home.learnMore")}
              </button>
            </motion.div>
          </div>

          {/* 功能特性 */}
          <motion.div variants={fadeInUp} className="space-y-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              {t("home.whyChoose")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 space-y-4 hover:border-green-500/30 transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <feature.icon className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 特性列表 */}
          <motion.div
            variants={fadeInUp}
            className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 space-y-6"
          >
            <h3 className="text-2xl font-bold text-white">
              {t("home.systemFeatures")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {featuresList.map((feature) => (
                <div key={feature} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* 底部 */}
      {/* <footer className="relative -bottom-4 z-10 border-t border-gray-700/50 bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>{t('home.copyright')}</p>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
