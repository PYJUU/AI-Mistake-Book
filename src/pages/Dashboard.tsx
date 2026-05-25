import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Question } from '../types';
import { Link } from 'react-router-dom';
import { BookOpen, PenTool, Target, Layers } from 'lucide-react';

export default function Dashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getQuestions();
      setQuestions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">加载中...</div>;

  const total = questions.length;
  const marked = questions.filter(q => q.is_marked).length;
  const highError = questions.filter(q => q.error_count > q.correct_count).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">总览</h1>
          <p className="text-gray-500 mt-1">了解您的学习进度</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Layers size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">总题数</p>
              <h2 className="text-3xl font-bold text-gray-900">{total}</h2>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">易错题</p>
              <h2 className="text-3xl font-bold text-gray-900">{highError}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">标记重点</p>
              <h2 className="text-3xl font-bold text-gray-900">{marked}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link to="/practice" className="group block bg-black text-white p-8 rounded-3xl hover:opacity-90 transition-opacity">
          <PenTool size={32} className="mb-4 opacity-80 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-2">开始强化训练</h3>
          <p className="text-gray-400">系统将根据艾宾浩斯记忆曲线和您的错误率智能抽题</p>
        </Link>

        <Link to="/add" className="group block bg-gray-100 text-gray-900 p-8 rounded-3xl hover:bg-gray-200 transition-colors">
          <Layers size={32} className="mb-4 text-gray-600 group-hover:scale-110 transition-transform" />
          <h3 className="text-2xl font-bold mb-2">AI 录入错题</h3>
          <p className="text-gray-500">直接粘贴网课、试卷题目文本，AI一键解析排版</p>
        </Link>
      </div>
    </div>
  );
}
