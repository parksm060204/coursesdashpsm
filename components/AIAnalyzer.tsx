'use client';

import React, { useState, useEffect } from 'react';
import { Bot, FileDown, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAnalyzerProps {
  departmentName: string;
  courses: any[];
}

export default function AIAnalyzer({ departmentName, courses }: AIAnalyzerProps) {
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [typedText, setTypedText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 타이핑 애니메이션 효과
  useEffect(() => {
    if (!analysisResult) {
      setTypedText('');
      return;
    }
    
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      setTypedText(analysisResult.substring(0, currentIndex));
      currentIndex++;
      if (currentIndex > analysisResult.length) {
        clearInterval(intervalId);
      }
    }, 15); // 타이핑 속도 조절

    return () => clearInterval(intervalId);
  }, [analysisResult]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError('');
    setAnalysisResult('');
    
    // 수강생 수 기준 내림차순 정렬하여 상위 5개 인기 과목 추출
    const sortedByEnrollment = [...courses].sort((a, b) => (parseInt(b['수강'], 10) || 0) - (parseInt(a['수강'], 10) || 0));
    const topCourses = sortedByEnrollment.slice(0, 5).map(c => `${c['교과목명']} (${c['수강']}명)`);

    // 데이터 요약 생성
    const summary = {
      totalCourses: courses.length,
      totalEnrolled: courses.reduce((sum, c) => sum + (parseInt(c['수강'], 10) || 0), 0),
      avgEnrolled: courses.length > 0 
        ? (courses.reduce((sum, c) => sum + (parseInt(c['수강'], 10) || 0), 0) / courses.length).toFixed(1) 
        : 0,
      courseTypes: courses.reduce((acc, c) => {
        const type = c['이수구분'] || '기타';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      topCourses,
    };

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentName, summary })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '분석 중 오류가 발생했습니다.');
      }

      setAnalysisResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!analysisResult) return;
    
    // Markdown 파일 다운로드
    const blob = new Blob([analysisResult], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AI 강의 데이터 종합 분석 예시.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (courses.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden mb-8">
      <div className="p-5 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">✨ AI 강의 트렌드 분석</h3>
            <p className="text-xs text-gray-500 mt-0.5">Gemini 3.1 Flash-Lite 모델이 해당 학과의 현황을 전문적으로 분석합니다.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition-colors shadow-sm"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 분석 중...</>
            ) : (
              '분석 시작'
            )}
          </button>
        </div>
      </div>
      
      {/* 로딩 애니메이션 영역 */}
      {isAnalyzing && (
        <div className="p-12 flex flex-col items-center justify-center bg-gray-50/50 space-y-4">
          <div className="relative">
            <Bot className="w-12 h-12 text-purple-300 animate-pulse" />
            <Sparkles className="w-6 h-6 text-purple-500 absolute -top-2 -right-2 animate-bounce" />
          </div>
          <p className="text-purple-600 font-medium animate-pulse">
            AI가 강의 데이터를 분석 중입니다...
          </p>
        </div>
      )}

      {/* 결과 및 에러 영역 */}
      {!isAnalyzing && (analysisResult || error) && (
        <div className="p-8 bg-white">
          {error ? (
            <div className="text-red-500 text-sm font-medium p-4 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          ) : (
            <div className="flex flex-col space-y-6">
              <div className="prose prose-purple max-w-none text-gray-800 leading-relaxed">
                {/* 타이핑 효과가 적용된 텍스트를 react-markdown으로 렌더링 */}
                <ReactMarkdown>{typedText}</ReactMarkdown>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  분석 결과 다운로드 (.md)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
