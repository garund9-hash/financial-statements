'use client';

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { buildGeminiPayload, buildBalanceSheetData, buildIncomeStatementData, periodLabel } from '@/app/lib/financialUtils';

function MarkdownSection({ text }) {
  // 마크다운 간이 렌더링: ## 제목, **볼드**, 목록(•/-) 처리
  if (!text) return null;

  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h4 key={i} className="text-gold font-semibold mt-4 mb-1 text-sm">
              {line.replace('## ', '')}
            </h4>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h5 key={i} className="text-white font-medium mt-3 mb-1 text-sm">
              {line.replace('### ', '')}
            </h5>
          );
        }
        if (line.match(/^[\-•\*]\s/)) {
          return (
            <p key={i} className="text-slate-300 text-sm pl-4">
              {line.replace(/^[\-•\*]\s/, '• ').replace(/\*\*(.*?)\*\*/g, '$1')}
            </p>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;

        // **볼드** 처리
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="text-slate-300 text-sm leading-relaxed">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function GeminiAnalysis({ list, companyName, year, period }) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const bsData = buildBalanceSheetData(list);
      const isData = buildIncomeStatementData(list);
      const payload = buildGeminiPayload(bsData, isData);

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          year,
          period,
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'AI 분석 실패');
      setAnalysis(data.analysis);
      setIsExpanded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI 재무 분석</h3>
            <p className="text-slate-400 text-xs">Gemini가 누구나 이해할 수 있게 설명합니다</p>
          </div>
        </div>
        {analysis && (
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        )}
      </div>

      {!analysis && !isLoading && (
        <div className="text-center py-8">
          <p className="text-slate-400 text-sm mb-4">
            {companyName}의 {year}년 {periodLabel(period)} 재무 데이터를 AI가 쉽게 분석합니다
          </p>
          <button
            onClick={fetchAnalysis}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-light
              text-navy-950 font-bold rounded-xl transition-colors text-sm"
          >
            <Sparkles className="w-4 h-4" />
            AI 분석 받기
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-8 h-8 border-2 border-navy-600 border-t-gold rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Gemini가 분석 중입니다...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-6">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="text-gold text-sm hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {analysis && isExpanded && (
        <div className="border-t border-navy-600 pt-4">
          <MarkdownSection text={analysis} />
          <div className="mt-6 pt-4 border-t border-navy-700 flex justify-between items-center">
            <p className="text-slate-500 text-xs">
              * 이 분석은 AI가 생성한 정보이며, 투자 권유가 아닙니다.
            </p>
            <button
              onClick={fetchAnalysis}
              className="text-slate-400 hover:text-gold text-xs transition-colors"
            >
              재분석
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
