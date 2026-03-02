'use client';

import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  buildIncomeStatementData,
  buildChartData,
  extractPeriodLabels,
  formatEok,
} from '@/app/lib/financialUtils';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-navy-900 border border-navy-600 rounded-xl p-3 shadow-xl text-sm">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-white font-semibold">
            {entry.name === '영업이익률' ? `${entry.value?.toFixed(1)}%` : formatEok(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function IncomeStatementChart({ list }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isData = buildIncomeStatementData(list);
  const periodLabels = extractPeriodLabels(list);

  const rawData = buildChartData(periodLabels, isData, {
    revenue: '매출액',
    operatingProfit: '영업이익',
    netIncome: '당기순이익',
  });

  // 영업이익률 추가
  const chartData = rawData.map((d) => ({
    ...d,
    영업이익률: d['매출액'] && d['영업이익']
      ? parseFloat(((d['영업이익'] / d['매출액']) * 100).toFixed(1))
      : null,
  }));

  if (!mounted) {
    return <div className="h-72 bg-navy-800 animate-pulse rounded-xl" />;
  }

  const current = isData.revenue?.current;
  const prev = isData.revenue?.prev;
  const growthRate = (current && prev && prev !== 0)
    ? (((current - prev) / Math.abs(prev)) * 100).toFixed(1)
    : null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">손익계산서 (매출 · 이익 · 이익률)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a70" />
          <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => formatEok(v)}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Legend
            formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: 12 }}>{value}</span>}
          />
          <Bar yAxisId="left" dataKey="매출액" fill="#c9a84c" radius={[4, 4, 0, 0]} maxBarSize={60} />
          <Bar yAxisId="left" dataKey="영업이익" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={60} />
          <Bar yAxisId="left" dataKey="당기순이익" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={60} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="영업이익률"
            stroke="#ffffff"
            strokeWidth={2}
            dot={{ fill: '#ffffff', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 보조 지표 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: '매출액', value: formatEok(isData.revenue?.current), color: '#e8c96a' },
          { label: '영업이익', value: formatEok(isData.operatingProfit?.current), color: '#a78bfa' },
          { label: '당기순이익', value: formatEok(isData.netIncome?.current), color: '#22d3ee' },
          {
            label: '매출 성장률',
            value: growthRate !== null ? `${growthRate > 0 ? '+' : ''}${growthRate}%` : '-',
            color: growthRate > 0 ? '#4ade80' : growthRate < 0 ? '#f87171' : '#94a3b8',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-navy-900 rounded-xl p-3 border border-navy-700">
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="font-semibold text-sm" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
