'use client';

import { motion } from 'framer-motion';
import { 
  User, 
  LogOut, 
  Settings, 
  Home,
  Zap,
  Mail,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function DashboardContent() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
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

  const cardHover = {
    hover: {
      scale: 1.02,
      y: -5,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* 导航栏 */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50"
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

            {/* 用户菜单 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-300">
                <User className="w-5 h-5" />
                <span className="hidden sm:block">{user?.email}</span>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-200 border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">退出</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* 欢迎区域 */}
          <motion.div variants={fadeInUp} className="text-center py-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              欢迎回来！
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              您已成功登录到 Synaply 系统。开始探索我们为您准备的功能吧。
            </p>
          </motion.div>

          {/* 统计卡片 */}
          <motion.div 
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* 用户信息卡片 */}
            <motion.div
              variants={cardHover}
              whileHover="hover"
              className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-green-400 text-sm font-medium">活跃</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">用户资料</h3>
              <p className="text-gray-400 text-sm">查看和编辑您的个人信息</p>
            </motion.div>

            {/* 安全设置卡片 */}
            <motion.div
              variants={cardHover}
              whileHover="hover"
              className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-blue-400 text-sm font-medium">安全</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">安全设置</h3>
              <p className="text-gray-400 text-sm">管理您的账户安全选项</p>
            </motion.div>

            {/* 通知卡片 */}
            <motion.div
              variants={cardHover}
              whileHover="hover"
              className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-purple-400 text-sm font-medium">3 条新消息</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">通知中心</h3>
              <p className="text-gray-400 text-sm">查看最新的系统通知</p>
            </motion.div>

            {/* 活动统计卡片 */}
            <motion.div
              variants={cardHover}
              whileHover="hover"
              className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-400" />
                </div>
                <span className="text-orange-400 text-sm font-medium">今日</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">活动统计</h3>
              <p className="text-gray-400 text-sm">查看您的使用情况统计</p>
            </motion.div>
          </motion.div>

          {/* 快速操作区域 */}
          <motion.div variants={fadeInUp} className="space-y-6">
            <h3 className="text-2xl font-bold text-white">快速操作</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 设置卡片 */}
              <motion.div
                variants={cardHover}
                whileHover="hover"
                className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 cursor-pointer"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-1">系统设置</h4>
                    <p className="text-gray-400">自定义您的系统偏好设置</p>
                  </div>
                </div>
                <button className="w-full py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-all duration-200 border border-green-500/20">
                  前往设置
                </button>
              </motion.div>

              {/* 主页卡片 */}
              <motion.div
                variants={cardHover}
                whileHover="hover"
                className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 cursor-pointer"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center">
                    <Home className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white mb-1">返回主页</h4>
                    <p className="text-gray-400">回到应用程序主界面</p>
                  </div>
                </div>
                <button className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all duration-200 border border-blue-500/20">
                  前往主页
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}