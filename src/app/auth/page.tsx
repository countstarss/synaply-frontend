// synaply-frontend/src/app/auth/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // 导入 Supabase 客户端

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); // 控制显示登录还是注册表单
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // 用于显示成功/错误消息

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(`登录失败: ${error.message}`);
    } else {
      setMessage('登录成功！');
      // 登录成功后可以重定向用户
      // router.push('/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(`注册失败: ${error.message}`);
    } else {
      setMessage('注册成功！请检查您的邮箱进行确认。 ');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setMessage(`重置密码失败: ${error.message}`);
    } else {
      setMessage('密码重置邮件已发送，请检查您的邮箱。 ');
    }
  };

  // 修改密码功能需要用户已登录，并且通过邮件链接跳转过来
  // 这里暂时不实现表单，只提供一个占位符
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('此功能需要通过邮件链接访问。 ');
    // const { error } = await supabase.auth.updateUser({ password });
    // if (error) {
    //   setMessage(`修改密码失败: ${error.message}`);
    // } else {
    //   setMessage('密码修改成功！');
    // }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <h1 className="text-3xl font-bold mb-8 text-center text-green-400">
          {isLogin ? '登录' : '注册'}
        </h1>

        {message && (
          <div className="mb-4 p-3 rounded-md bg-green-900 text-white">
            {message}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleSignUp}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
              邮箱
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-green-500 placeholder-gray-400"
              placeholder="your@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
              密码
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 bg-gray-700 text-white mb-3 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-green-500 placeholder-gray-400"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-200"
            >
              {isLogin ? '登录' : '注册'}
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="inline-block align-baseline font-bold text-sm text-green-400 hover:text-green-500 transition duration-200"
            >
              {isLogin ? '没有账号？注册' : '已有账号？登录'}
            </button>
          </div>
        </form>

        {isLogin && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResetPassword}
              className="inline-block align-baseline font-bold text-sm text-gray-400 hover:text-gray-300 transition duration-200"
            >
              忘记密码？
            </button>
          </div>
        )}

        {/* 占位符：修改密码功能 */}
        {!isLogin && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleChangePassword}
              className="inline-block align-baseline font-bold text-sm text-gray-400 hover:text-gray-300 transition duration-200"
            >
              修改密码 (通过邮件链接)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
