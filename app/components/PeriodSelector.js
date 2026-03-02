'use client';

import { Calendar, ChevronDown } from 'lucide-react';

const PERIODS = [
  { label: '연간 (Annual)', value: '11011' },
  { label: '3분기 (Q3)', value: '11014' },
  { label: '반기 (H1)', value: '11012' },
  { label: '1분기 (Q1)', value: '11013' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2014 }, (_, i) =>
  String(currentYear - 1 - i)
);

export default function PeriodSelector({ year, period, onChange, isLoading }) {
  const handleYear = (e) => onChange(e.target.value, period);
  const handlePeriod = (e) => onChange(year, e.target.value);

  const selectClass = `
    appearance-none bg-navy-800 border border-navy-600 text-white rounded-xl
    pl-4 pr-10 py-3 focus:outline-none focus:border-gold transition-colors
    cursor-pointer disabled:opacity-50 text-sm font-medium
  `;

  return (
    <div className="flex flex-wrap gap-3 items-center mb-6">
      <div className="flex items-center gap-2 text-slate-400">
        <Calendar className="w-4 h-4 text-gold" />
        <span className="text-sm">조회 기간</span>
      </div>

      <div className="relative">
        <select
          value={year}
          onChange={handleYear}
          disabled={isLoading}
          className={selectClass}
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      <div className="relative">
        <select
          value={period}
          onChange={handlePeriod}
          disabled={isLoading}
          className={selectClass}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
