import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Question } from '../types';
import { Edit2, Trash2, Star, CheckCircle2, BookmarkCheck, Target } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Questions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Question | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  const loadQuestions = async () => {
    try {
      const data = await api.getQuestions();
      setQuestions(data);
    } catch (e) {
      console.error(e);
      showError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMark = async (q: Question) => {
    try {
      await api.updateQuestion(q.id, { is_marked: !q.is_marked });
      setQuestions(questions.map(x => x.id === q.id ? { ...x, is_marked: !q.is_marked } : x));
    } catch (e) {
      showError('操作失败');
    }
  };

  const confirmDelete = async (id: number) => {
    try {
      await api.deleteQuestion(id);
      setQuestions(questions.filter(x => x.id !== id));
      setDeletingId(null);
    } catch (e) {
      showError('删除失败');
    }
  };

  const startEdit = (q: Question) => {
    setEditingId(q.id);
    setEditDraft(JSON.parse(JSON.stringify(q)));
  };

  const saveEdit = async (q: Question) => {
    if (!editDraft || editDraft.question.trim() === '') return;
    try {
      await api.updateQuestion(q.id, { 
        question: editDraft.question,
        options: editDraft.options,
        correct_answers: editDraft.correct_answers,
        explanation: editDraft.explanation,
        type: editDraft.type
      });
      setQuestions(questions.map(x => x.id === q.id ? { ...x, ...editDraft } : x));
      setEditingId(null);
    } catch (e) {
      showError('修改失败');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">加载中...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">题库管理</h1>
          <p className="text-gray-500 mt-1">共 {questions.length} 道错题</p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium text-center">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        {questions.length === 0 && (
          <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500">题库空空如也，快去添加错题吧！</p>
          </div>
        )}
        {questions.map((q) => (
          <div key={q.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group overflow-visible">
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-gray-100 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-all">
               {deletingId === q.id ? (
                 <div className="flex items-center gap-2 px-2">
                   <span className="text-xs font-medium text-red-600">确定删除?</span>
                   <button onClick={() => confirmDelete(q.id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">是</button>
                   <button onClick={() => setDeletingId(null)} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100">否</button>
                 </div>
               ) : editingId === q.id ? (
                 <div className="flex items-center gap-2 px-2">
                   <button onClick={() => saveEdit(q)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">保存</button>
                   <button onClick={() => setEditingId(null)} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100">取消</button>
                 </div>
               ) : (
                 <>
                   <button onClick={() => startEdit(q)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4"/>
                   </button>
                   <button onClick={() => handleToggleMark(q)} className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors">
                      {q.is_marked ? <BookmarkCheck className="text-yellow-500 w-4 h-4"/> : <Star className="w-4 h-4"/>}
                   </button>
                   <button onClick={() => setDeletingId(q.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4"/>
                   </button>
                 </>
               )}
            </div>

            <div className="flex items-center gap-2 mb-3 mt-4 sm:mt-0">
              <span className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium",
                q.type === 'single' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
              )}>
                {q.type === 'single' ? '单选' : '多选'}
              </span>
              <span className="text-xs text-gray-400 font-mono">ID: {q.id}</span>
              {q.is_marked && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md font-medium flex items-center gap-1"><BookmarkCheck size={12}/>重点关注</span>}
            </div>
            
            {editingId === q.id && editDraft ? (
              <div className="space-y-4 mb-6 relative">
                 <div className="flex gap-2 mb-2">
                    <select
                       value={editDraft.type}
                       onChange={e => setEditDraft({...editDraft, type: e.target.value as 'single'|'multiple', correct_answers: []})}
                       className="border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-100 bg-blue-50/30 text-sm font-medium"
                    >
                       <option value="single">单选</option>
                       <option value="multiple">多选</option>
                    </select>
                 </div>
                 <textarea 
                  value={editDraft.question}
                  onChange={e => setEditDraft({...editDraft, question: e.target.value})}
                  className="w-full border border-blue-200 rounded-lg p-3 text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-blue-50/30"
                  rows={3}
                  placeholder="题干"
                 />
                 
                 <div className="space-y-2">
                    {editDraft.options.map((opt, i) => (
                       <div key={i} className="flex items-center gap-2">
                          <button
                            onClick={() => {
                               let newCorrect = [...(editDraft.correct_answers || [])];
                               if (editDraft.type === 'single') {
                                  newCorrect = [i];
                               } else {
                                  if (newCorrect.includes(i)) newCorrect = newCorrect.filter(x => x !== i);
                                  else newCorrect.push(i);
                               }
                               setEditDraft({...editDraft, correct_answers: newCorrect});
                            }}
                            className={cn(
                               "w-8 h-8 rounded-lg border font-bold flex items-center justify-center flex-shrink-0 transition-colors",
                               (editDraft.correct_answers || []).includes(i) ? "bg-green-500 border-green-600 text-white" : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            )}>
                            {String.fromCharCode(65 + i)}
                          </button>
                          <input 
                            value={opt}
                            onChange={(e) => {
                               const newOptions = [...editDraft.options];
                               newOptions[i] = e.target.value;
                               setEditDraft({...editDraft, options: newOptions});
                            }}
                            className="flex-1 border border-blue-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-blue-50/30 text-sm"
                            placeholder={`选项 ${String.fromCharCode(65 + i)}`}
                          />
                          <button onClick={() => {
                             const newOptions = editDraft.options.filter((_, idx) => idx !== i);
                             const newCorrect = (editDraft.correct_answers || []).filter(x => x !== i).map(x => x > i ? x - 1 : x);
                             setEditDraft({...editDraft, options: newOptions, correct_answers: newCorrect});
                          }} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg">
                             <Trash2 className="w-4 h-4"/>
                          </button>
                       </div>
                    ))}
                    <button onClick={() => setEditDraft({...editDraft, options: [...editDraft.options, '']})} className="text-sm text-blue-600 hover:text-blue-700 font-medium py-1">
                       + 添加选项
                    </button>
                 </div>

                 <textarea 
                  value={editDraft.explanation || ''}
                  onChange={e => setEditDraft({...editDraft, explanation: e.target.value})}
                  className="w-full border border-blue-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-blue-50/30 mt-4"
                  rows={2}
                  placeholder="解析（可选）"
                 />
              </div>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-4 whitespace-pre-wrap pr-12">{q.question}</h3>
                
                <div className="space-y-2 mb-6">
                  {q.options.map((opt, i) => {
                    const isCorrect = (q.correct_answers || []).includes(i);
                    return (
                      <div key={i} className={cn(
                        "p-3 rounded-xl border text-sm flex items-start gap-3",
                        isCorrect ? "bg-green-50/50 border-green-200 text-green-900" : "border-gray-100 text-gray-700 bg-gray-50/50"
                      )}>
                        <div className={cn(
                          "w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border font-medium text-[11px]",
                          isCorrect ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-gray-500 bg-white"
                        )}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="mt-0.5">{opt}</span>
                        {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto flex-shrink-0 mt-0.5" />}
                      </div>
                    )
                  })}
                </div>

                {(q.explanation || q.error_count > 0) && (
                  <div className="bg-gray-50 rounded-xl p-4 text-sm mt-4 border border-gray-100">
                    <div className="flex items-center gap-6 mb-2 text-xs font-mono text-gray-500">
                      <span className="flex items-center gap-1"><Target size={14}/> 错误: {q.error_count}次</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={14}/> 正确: {q.correct_count}次</span>
                      <span>训练权重: {q.weight.toFixed(2)}</span>
                    </div>
                    {q.explanation && (
                      <div className="text-gray-600 mt-2">
                        <span className="font-medium text-gray-900">解析：</span>{q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
