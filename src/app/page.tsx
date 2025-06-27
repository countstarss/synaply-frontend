'use client';

import { motion } from 'framer-motion';
import { 
  Zap, 
  ArrowRight, 
  Shield, 
  Cpu, 
  Globe,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: Shield,
      title: "安全认证",
      description: "采用 Supabase 提供的企业级安全认证系统"
    },
    {
      icon: Cpu,
      title: "高性能",
      description: "基于 Next.js 构建，提供最佳的用户体验"
    },
    {
      icon: Globe,
      title: "现代化设计",
      description: "响应式设计，支持各种设备和屏幕尺寸"
    }
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
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Synaply</h1>
            </div>

            {/* 导航菜单 */}
            <div className="flex items-center space-x-4">
              {!loading && (
                <>
                  {user ? (
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                    >
                      仪表盘
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push('/auth')}
                        className="text-gray-300 hover:text-white transition-colors"
                      >
                        登录
                      </button>
                      <button
                        onClick={() => router.push('/auth')}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                      >
                        注册
                      </button>
                    </>
                  )}
                </>
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
                欢迎来到
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  {" "}Synaply
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
                现代化的认证系统，为您的应用程序提供安全、可靠的用户管理解决方案
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                disabled={loading}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 transition-all duration-200 group"
              >
                {user ? '进入仪表盘' : '开始使用'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="inline-flex items-center px-8 py-4 bg-gray-800/50 text-white font-semibold rounded-lg hover:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all duration-200 border border-gray-700/50">
                了解更多
              </button>
            </motion.div>
          </div>

          {/* 功能特性 */}
          <motion.div variants={fadeInUp} className="space-y-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              为什么选择 Synaply？
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 space-y-4 hover:border-green-500/30 transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <feature.icon className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 特性列表 */}
          <motion.div variants={fadeInUp} className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 space-y-6">
            <h3 className="text-2xl font-bold text-white">系统特性</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {[
                "安全的用户注册和登录",
                "密码重置功能",
                "邮箱验证",
                "现代化的用户界面",
                "响应式设计",
                "实时状态更新",
                "路由保护",
                "错误处理"
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* 底部 */}
      <footer className="relative z-10 border-t border-gray-700/50 bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>© 2024 Synaply. 保留所有权利.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
