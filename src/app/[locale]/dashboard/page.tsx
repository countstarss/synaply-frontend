'use client';

import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bell, 
  BarChart3, 
  Settings, 
  Home, 
  Zap,
  Users,
  Activity,
  TrendingUp
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import LanguageSwitcher from '@/components/LanguageSwitcher';

function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const t = useTranslations();

  const handleSignOut = async () => {
    try {
      console.log('开始退出登录...');
      const result = await signOut();
      
      if (result.error) {
        console.error('退出登录失败:', result.error);
        // 可以在这里添加错误提示
        return;
      }
      
      // 清除本地存储
      localStorage.removeItem('user');
      console.log('退出登录成功');
      
      // 让 AuthContext 的 onAuthStateChange 处理路由重定向
      // 不需要手动调用 router.push，避免路由冲突
    } catch (error) {
      console.error('退出登录时发生异常:', error);
    }
  };

  const statsCards = [
    {
      title: t('dashboard.active'),
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "text-green-400"
    },
    {
      title: t('dashboard.security'),
      value: "99.9%",
      change: "+0.1%",
      icon: Shield,
      color: "text-blue-400"
    },
    {
      title: "API",
      value: "156",
      change: "+8%",
      icon: Activity,
      color: "text-purple-400"
    },
    {
      title: t('dashboard.today'),
      value: "2.4K",
      change: "+16%",
      icon: TrendingUp,
      color: "text-emerald-400"
    }
  ];

  const quickActions = [
    {
      title: t('dashboard.userProfile'),
      description: t('dashboard.userProfileDesc'),
      icon: User,
      action: () => {},
      color: "from-blue-500 to-purple-600"
    },
    {
      title: t('dashboard.securitySettings'),
      description: t('dashboard.securitySettingsDesc'),
      icon: Shield,
      action: () => {},
      color: "from-green-500 to-emerald-600"
    },
    {
      title: t('dashboard.notifications'),
      description: t('dashboard.notificationsDesc'),
      icon: Bell,
      action: () => {},
      color: "from-yellow-500 to-orange-600"
    },
    {
      title: t('dashboard.activityStats'),
      description: t('dashboard.activityStatsDesc'),
      icon: BarChart3,
      action: () => {},
      color: "from-purple-500 to-pink-600"
    }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* 顶部导航栏 */}
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
              <LanguageSwitcher />
              
              <div className="flex items-center space-x-3 text-gray-300">
                <span className="hidden sm:block">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

      {/* 背景动画效果 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* 主要内容 */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* 欢迎区域 */}
          <motion.div variants={fadeInUp} className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {t('dashboard.welcome')}
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              {t('dashboard.subtitle')}
            </p>
          </motion.div>

          {/* 统计卡片 */}
          <motion.div 
            variants={fadeInUp} 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {statsCards.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl bg-gray-800/50 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">{stat.change}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* 快速操作 */}
          <motion.div variants={fadeInUp} className="space-y-6">
            <h2 className="text-2xl font-bold text-white">{t('dashboard.quickActions')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  onClick={action.action}
                  className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 text-left hover:border-green-500/30 transition-all duration-300 group"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} flex-shrink-0`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* 系统设置 */}
          <motion.div variants={fadeInUp} className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">{t('dashboard.systemSettings')}</h3>
            </div>
            
            <p className="text-gray-400 leading-relaxed">
              {t('dashboard.systemSettingsDesc')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleSignOut}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200">
                <Settings className="w-5 h-5 mr-2" />
                Sign Out
              </button>
              
              <button 
                onClick={() => router.push('/')}
                className="inline-flex items-center px-6 py-3 bg-gray-800/50 text-white font-semibold rounded-lg hover:bg-gray-800/70 border border-gray-700/50 transition-all duration-200"
              >
                <Home className="w-5 h-5 mr-2" />
                {t('dashboard.returnHome')}
              </button>
            </div>
          </motion.div>

          {/* 通知区域 */}
          <motion.div variants={fadeInUp} className="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">{t('dashboard.notifications')}</h3>
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">3 {t('dashboard.newMessages')}</span>
            </div>
            <p className="text-gray-400">
              {t('dashboard.notificationsDesc')}
            </p>
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