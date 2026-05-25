import React, { useState } from 'react';
import { api } from '../api';
import { QuestionDraft } from '../types';
import { Sparkles, Check, Trash2, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AddQuestion() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const navigate = useNavigate();

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const parsed = await api.parseTextWithAI(text);
      setDrafts(parsed);
      setText('');
    } catch (e) {
      alert('解析失败，请检重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (drafts.length === 0) return;
    setLoading(true);
    try {
      await api.batchAddQuestions(drafts);
      navigate('/questions');
    } catch (e) {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI 录入错题</h1>
        <p className="text-gray-500 mt-1">粘贴复制的题目文本，AI将自动排版并提取答案</p>
      </div>

      {!drafts.length ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在此粘贴错题文本... (例如：1. 下列哪个是前端框架？ A. Vue B. Django C. Flask D. Spring 答案:A)"
            className="w-full h-64 p-4 border-0 focus:ring-0 resize-none text-gray-700 bg-transparent"
          />
          <div className="absolute bottom-6 right-6">
            <button
              onClick={handleParse}
              disabled={loading || !text.trim()}
              className="bg-black text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
              {loading ? 'AI 正在解析...' : '开始解析'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-blue-50 text-blue-900 p-4 rounded-xl px-6">
            <span className="font-medium">AI 成功解析 {drafts.length} 道题目</span>
            <div className="flex gap-3">
              <button onClick={() => setDrafts([])} className="px-4 py-2 text-sm font-medium hover:bg-black/5 rounded-lg transition-colors">
                重新解析
              </button>
              <button 
                onClick={handleSaveAll}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Check size={18}/>
                确认录入题库
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {drafts.map((d, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-medium">预览 #{i+1} - {d.type === 'single' ? '单选' : '多选'}</span>
                    <button onClick={() => setDrafts(drafts.filter((_, idx)=> idx !== i))} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={20}/>
                    </button>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900 mb-4 whitespace-pre-wrap">{d.question}</h3>
                 <div className="space-y-2 mb-4">
                    {d.options?.map((opt, idx) => {
                      const isCorrect = Array.isArray(d.correctAnswers) && d.correctAnswers.includes(idx);
                      return (
                        <div key={idx} className={`p-3 rounded-xl border text-sm flex items-start gap-3 ${isCorrect ? "bg-green-50 border-green-200 text-green-900" : "bg-gray-50 border-gray-100"}`}>
                          <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border font-medium text-[11px] ${isCorrect ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-gray-500 bg-white"}`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="mt-0.5">{opt}</span>
                        </div>
                      );
                    })}
                 </div>
                 {d.explanation && (
                   <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
                      <span className="font-medium text-gray-900">解析：</span>{d.explanation}
                   </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
