import React, { useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { token } = await api.login(username, password);
      localStorage.setItem('token', token);
      navigate('/');
    } catch (err: any) {
      setError('登录失败，请检查用户名和密码 (默认: admin / password123)');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-black text-white flex items-center justify-center rounded-xl text-3xl shadow-lg mb-4">
            📚
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">专属错题本</h1>
          <p className="mt-2 text-sm text-gray-500">登录您的专属管理后台</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 border p-3 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 border p-3 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white p-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            进入错题本
          </button>
        </form>
      </div>
    </div>
  );
}
