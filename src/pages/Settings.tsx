import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Save, Eye, EyeOff, Activity, User, Lock } from 'lucide-react';

export default function Settings() {
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getAISettings();
      setProvider(data.provider || 'gemini');
      setModel(data.model || '');
      setApiKey('');
      setHasApiKey(data.hasApiKey || false);
      setBaseUrl(data.baseUrl || '');
      
      const meData = await api.me();
      setUsername(meData.username || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.updateAISettings({ provider, model, apiKey, baseUrl });
      setMessage('保存成功！');
    } catch (e) {
      setMessage('保存失败，请稍后重试。');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleTestAPI = async () => {
    setTesting(true);
    setMessage('');
    try {
      await api.testAI({ provider, model, apiKey, baseUrl });
      setMessage('✅ 测试成功！API连接正常。');
    } catch (e: any) {
      setMessage(`❌ 测试失败: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    setAccountMessage('');
    try {
      await api.updateCredentials({ username: username || undefined, password: password || undefined });
      setAccountMessage('账户信息更新成功！如果您修改了密码，下次请使用新密码登录。');
      setPassword('');
    } catch (e: any) {
      setAccountMessage(`更新失败: ${e.message}`);
    } finally {
      setSavingAccount(false);
      setTimeout(() => setAccountMessage(''), 5000);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">加载中...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">系统配置</h1>
        <p className="text-gray-500 mt-1">管理 AI 模型参数与账户安全</p>
      </div>

      {/* AI Settings */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-6">AI 模型配置</h2>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">模型提供商 (Provider)</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI (含其他兼容 API 的平台如 DeepSeek, GLM 等)</option>
            </select>
            <p className="text-xs text-gray-400 mt-2">
              如果使用 DeepSeek, GLM, Moonshot 等国产大模型，请选择 OpenAI 兼容模式。
            </p>
          </div>

          {provider === 'openai' && (
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
               <input
                 type="text"
                 value={baseUrl}
                 onChange={(e) => setBaseUrl(e.target.value)}
                 placeholder="例如: https://api.deepseek.com/v1/chat/completions"
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
               />
               <p className="text-xs text-gray-400 mt-2">
                 完整的 API 端点路径，通常包含 /chat/completions。
               </p>
             </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">模型名称 (Model)</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={provider === 'gemini' ? '例如: gemini-3.5-flash' : '例如: deepseek-chat, gpt-4o'}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API 密钥 (API Key)</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasApiKey ? "（已设置）未更改则留空" : "sk-..."}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
            {message && (
               <span className={`text-sm ${message.includes('成功') ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}`}>
                 {message}
               </span>
            )}
            <div className="ml-auto flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleTestAPI}
                disabled={testing || (!apiKey && !hasApiKey)}
                className="flex-1 sm:flex-none justify-center bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                <Activity size={20} />
                {testing ? '测试中...' : '测试连接'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none justify-center bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Save size={20} />
                {saving ? '保存中...' : '保存配置'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Account Settings */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-6">账户安全</h2>
        <form onSubmit={handleSaveAccount} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="设置新用户名"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="不填则保持原密码"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
            {accountMessage && (
               <span className={`text-sm ${accountMessage.includes('成功') ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}`}>
                 {accountMessage}
               </span>
            )}
            <button
              type="submit"
              disabled={savingAccount}
              className="ml-auto flex-1 sm:flex-none justify-center bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save size={20} />
              {savingAccount ? '更新中...' : '更新账户'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
