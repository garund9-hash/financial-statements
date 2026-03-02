'use client';

import { useState, useCallback } from 'react';
import { TrendingUp, Search, BarChart2, Brain } from 'lucide-react';
import SearchBar from './components/SearchBar';
import CompanyCard from './components/CompanyCard';
import PeriodSelector from './components/PeriodSelector';
import FinancialCharts from './components/FinancialCharts';
import GeminiAnalysis from './components/GeminiAnalysis';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

const currentYear = new Date().getFullYear();

export default function Home() {
  const [selectedCorp, setSelectedCorp] = useState(null);
  const [year, setYear] = useState(String(currentYear - 1));
  const [period, setPeriod] = useState('11011');
  const [dartList, setDartList] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFinancialData = useCallback(async (corp, y, p) => {
    setIsLoading(true);
    setError(null);
    setDartList(null);

    try {
      const res = await fetch(`/api/dart?corp_code=${corp.c}&year=${y}&period=${p}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || '데이터 조회에 실패했습니다.');
      setDartList(data.list);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = (corp) => {
    setSelectedCorp(corp);
    setDartList(null);
    setError(null);
    fetchFinancialData(corp, year, period);
  };

  const handlePeriodChange = (y, p) => {
    setYear(y);
    setPeriod(p);
    if (selectedCorp) fetchFinancialData(selectedCorp, y, p);
  };

  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="text-center py-12 mb-8">
        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-1.5 mb-6">
          <TrendingUp className="w-4 h-4 text-gold" />
          <span className="text-gold text-sm font-medium">누구나 쉽게 이해하는 재무 데이터</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
          기업 재무 분석
        </h1>
        <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
          회사를 검색하면 DART 공시 재무 데이터를 차트로 보여주고<br />
          AI가 쉽게 설명해 드립니다
        </p>

        <SearchBar onSelect={handleSearch} />

        {/* 기능 소개 */}
        {!selectedCorp && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
            {[
              { icon: Search, title: '3,864개 기업 검색', desc: '회사명·영문명·종목코드로 검색' },
              { icon: BarChart2, title: '재무 차트 시각화', desc: '재무상태표·손익계산서를 한눈에' },
              { icon: Brain, title: 'AI 쉬운 해설', desc: 'Gemini AI가 일반인 눈높이로 설명' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-navy-800/50 border border-navy-700 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center mb-3 mx-auto">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <p className="text-white font-semibold text-sm mb-1">{title}</p>
                <p className="text-slate-400 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 결과 섹션 */}
      {selectedCorp && (
        <div className="space-y-6">
          <CompanyCard corp={selectedCorp} />

          <PeriodSelector
            year={year}
            period={period}
            onChange={handlePeriodChange}
            isLoading={isLoading}
          />

          {isLoading && <LoadingSpinner message={`${selectedCorp.n} ${year}년 데이터를 불러오는 중...`} />}

          {error && (
            <ErrorMessage
              message={error}
              onRetry={() => fetchFinancialData(selectedCorp, year, period)}
            />
          )}

          {dartList && !isLoading && (
            <div className="space-y-6">
              <FinancialCharts list={dartList} />
              <GeminiAnalysis
                list={dartList}
                companyName={selectedCorp.n}
                year={year}
                period={period}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
