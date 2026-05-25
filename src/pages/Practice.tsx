import React, { useState } from 'react';
import { api } from '../api';
import { Question } from '../types';
import { Play, CheckCircle2, XCircle, ChevronRight, RefreshCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function Practice() {
  const [limitType, setLimitType] = useState<number | 'all' | 'custom'>(10);
  const [customLimit, setCustomLimit] = useState<number>(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionResults, setSessionResults] = useState<{correct: number, total: number}>({correct: 0, total: 0});

  const handleStart = async () => {
    setLoading(true);
    let finalLimit = 10;
    if (limitType === 'all') {
      finalLimit = 999999;
    } else if (limitType === 'custom') {
      finalLimit = customLimit || 1;
    } else {
      finalLimit = Number(limitType);
    }
    
    try {
      const data = await api.getPracticeQuestions(finalLimit);
      if (data.length === 0) {
        alert('题库中没有可训练的错题');
        return;
      }

      // Randomize options for each question
      const randomizedData = data.map(q => {
        const optionsWithIndex = q.options.map((opt, i) => ({ text: opt, originalIndex: i }));
        
        // Fisher-Yates shuffle
        for (let i = optionsWithIndex.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
        }
        
        const newOptions = optionsWithIndex.map(o => o.text);
        const safeAnswers = q.correct_answers || [];
      const newCorrectAnswers = safeAnswers
            .map(ca => optionsWithIndex.findIndex(o => o.originalIndex === ca))
            .sort((a, b) => a - b);
            
        return { ...q, options: newOptions, correct_answers: newCorrectAnswers };
      });

      setQuestions(randomizedData);
      setIsStarted(true);
      setCurrentIndex(0);
      setSelectedAnswers([]);
      setShowResult(false);
      setSessionResults({correct: 0, total: data.length});
    } catch (e) {
      alert('获取题目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOption = (idx: number) => {
    if (showResult) return;
    const q = questions[currentIndex];
    if (q.type === 'single') {
      setSelectedAnswers([idx]);
    } else {
      setSelectedAnswers(prev => 
        prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
      );
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswers.length === 0) return;
    const q = questions[currentIndex];
    
    // Check if correct
    const safeCorrectAnswers = q.correct_answers || [];
    const isCorrect = 
      selectedAnswers.length === safeCorrectAnswers.length && 
      selectedAnswers.every(v => safeCorrectAnswers.includes(v));

    setShowResult(true);
    if (isCorrect) {
      setSessionResults(prev => ({...prev, correct: prev.correct + 1}));
    }

    try {
      await api.recordResult(q.id, isCorrect);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswers([]);
      setShowResult(false);
    } else {
      // Done
      setIsStarted(false);
    }
  };

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCcw size={40} className={loading ? "animate-spin" : ""} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">错题强化训练</h1>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            基于艾宾浩斯记忆曲线和权重算法，错误率越高的题目越容易被抽中。
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 mb-8">
            <div className="flex items-center justify-center gap-4">
              <span className="text-gray-600 font-medium">本次抽题数量：</span>
              <select 
                value={limitType}
                onChange={(e) => {
                  const val = e.target.value;
                  setLimitType(val === 'all' || val === 'custom' ? val : Number(val));
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value={5}>5 题</option>
                <option value={10}>10 题</option>
                <option value={20}>20 题</option>
                <option value={30}>30 题</option>
                <option value={50}>50 题</option>
                <option value={100}>100 题</option>
                <option value="all">全部</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            {limitType === 'custom' && (
              <div className="flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="number"
                  min="1"
                  value={customLimit}
                  onChange={(e) => setCustomLimit(Number(e.target.value))}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-black w-24 text-center"
                  placeholder="数量"
                />
                <span className="text-gray-600 font-medium">题</span>
              </div>
            )}
          </div>

          <button 
            onClick={handleStart}
            disabled={loading}
            className="bg-black text-white px-10 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
          >
            {loading ? '准备中...' : '开始训练'} <Play size={20} fill="currentColor"/>
          </button>

          {sessionResults.total > 0 && !loading && (
            <div className="mt-8 pt-8 border-t border-gray-100 animate-in fade-in">
              <p className="font-bold text-gray-900 text-xl">上次训练完成！</p>
              <p className="text-green-600 font-medium mt-1">正确率：{Math.round((sessionResults.correct / sessionResults.total) * 100)}% ({sessionResults.correct}/{sessionResults.total})</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  // Determine if entirely correct
  const safeCorrectAnswers = q.correct_answers || [];
  const isCorrect = 
    selectedAnswers.length === safeCorrectAnswers.length && 
    selectedAnswers.every(v => safeCorrectAnswers.includes(v));

  return (
    <div className="max-w-3xl mx-auto py-8">
       <div className="flex items-center justify-between mb-8">
         <span className="text-sm font-bold text-gray-400">进度：{currentIndex + 1} / {questions.length}</span>
         <div className="flex-1 max-w-xs mx-6 bg-gray-200 h-2 rounded-full overflow-hidden">
           <div className="bg-black h-full transition-all duration-500" style={{width: `${((currentIndex)/questions.length)*100}%`}}></div>
         </div>
       </div>

       <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-right-4">
          <div className="mb-4">
              <span className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-bold",
                q.type === 'single' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
              )}>
                {q.type === 'single' ? '单选' : '多选'}
              </span>
          </div>

          <h2 className="text-2xl tracking-tight font-medium text-gray-900 mb-8 whitespace-pre-wrap leading-relaxed">{q.question}</h2>

          <div className="space-y-4 mb-8">
            {q.options.map((opt, idx) => {
               const isSelected = selectedAnswers.includes(idx);
               const isOptionCorrect = safeCorrectAnswers.includes(idx);
               
               let stateClass = "border-gray-200 hover:border-gray-300 bg-white";
               if (showResult) {
                 if (isOptionCorrect && isSelected) stateClass = "border-green-500 bg-green-50 text-green-900 font-medium";
                 else if (isOptionCorrect && !isSelected) stateClass = "border-green-500 bg-white"; // Missed correct
                 else if (!isOptionCorrect && isSelected) stateClass = "border-red-500 bg-red-50 text-red-900 font-medium"; // Wrongly picked
                 else stateClass = "border-gray-100 bg-gray-50 opacity-50"; // Neutral ignored
               } else if (isSelected) {
                 stateClass = "border-black border-2 bg-gray-50";
               }

               return (
                 <button 
                   key={idx} 
                   onClick={() => handleToggleOption(idx)}
                   disabled={showResult}
                   className={cn(
                     "w-full text-left p-5 rounded-2xl border text-lg flex items-start gap-4 transition-all duration-200",
                     stateClass
                   )}
                 >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center border-2 font-bold text-sm transition-colors",
                      showResult && isOptionCorrect && isSelected ? "bg-green-500 border-green-500 text-white" : "",
                      showResult && !isOptionCorrect && isSelected ? "bg-red-500 border-red-500 text-white" : "",
                      !showResult && isSelected ? "bg-black border-black text-white" : "",
                      !showResult && !isSelected ? "border-gray-300 text-gray-500" : ""
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="mt-0.5">{opt}</span>
                 </button>
               )
            })}
          </div>

          {!showResult ? (
            <button 
              onClick={handleSubmit}
              disabled={selectedAnswers.length === 0}
              className="w-full bg-black text-white p-5 rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              提交答案
            </button>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2">
               <div className={cn(
                 "p-6 rounded-2xl mb-6 flex items-start gap-4",
                 isCorrect ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"
               )}>
                 {isCorrect ? <CheckCircle2 size={28} className="text-green-600 flex-shrink-0 mt-1"/> : <XCircle size={28} className="text-red-600 flex-shrink-0 mt-1"/>}
                 <div>
                   <h3 className="text-xl font-bold mb-1">{isCorrect ? '回答正确！' : '回答错误！'}</h3>
                   <p className="opacity-90">{isCorrect ? '再接再厉，该题的训练权重已降低。' : '已经记录该错题，后续会增加抽题概率。'}</p>
                 </div>
               </div>

               {q.explanation && (
                 <div className="bg-gray-50 p-6 rounded-2xl mb-6 border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-2">答案解析：</h4>
                    <p className="text-gray-700 leading-relaxed">{q.explanation}</p>
                 </div>
               )}

               <button 
                  onClick={handleNext}
                  className="w-full bg-blue-600 text-white p-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {currentIndex < questions.length - 1 ? '下一题' : '完成训练'} <ChevronRight size={24}/>
                </button>
            </div>
          )}
       </div>
    </div>
  );
}
