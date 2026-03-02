'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { buildBalanceSheetData, buildChartData, extractPeriodLabels, formatEok } from '@/app/lib/financialUtils';

const COLORS = {
  assets: '#3b82f6',
  liabilities: '#ef4444',
  equity: '#22c55e',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-navy-900 border border-navy-600 rounded-xl p-3 shadow-xl text-sm">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="text-white font-semibold">{formatEok(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function BalanceSheetChart({ list }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const bsData = buildBalanceSheetData(list);
  const periodLabels = extractPeriodLabels(list);
  const chartData = buildChartData(periodLabels, bsData, {
    assets: '자산총계',
    liabilities: '부채총계',
    equity: '자본총계',
  });

  if (!mounted) {
    return <div className="h-72 bg-navy-800 animate-pulse rounded-xl" />;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">재무상태표 (자산 · 부채 · 자본)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a70" />
          <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => formatEok(v)}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Legend
            formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: 12 }}>{value}</span>}
          />
          <Bar dataKey="자산총계" fill={COLORS.assets} radius={[4, 4, 0, 0]} maxBarSize={60} />
          <Bar dataKey="부채총계" fill={COLORS.liabilities} radius={[4, 4, 0, 0]} maxBarSize={60} />
          <Bar dataKey="자본총계" fill={COLORS.equity} radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>

      {/* 보조 지표 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        {[
          { label: '유동자산', value: bsData.currentAssets?.current, color: '#60a5fa' },
          { label: '비유동자산', value: bsData.nonCurrentAssets?.current, color: '#93c5fd' },
          { label: '유동부채', value: bsData.currentLiabilities?.current, color: '#f87171' },
          { label: '비유동부채', value: bsData.nonCurrentLiabilities?.current, color: '#fca5a5' },
          { label: '자본총계', value: bsData.equity?.current, color: '#4ade80' },
          {
            label: '부채비율',
            value: bsData.liabilities?.current && bsData.equity?.current
              ? `${((bsData.liabilities.current / bsData.equity.current) * 100).toFixed(0)}%`
              : null,
            color: '#fbbf24',
            isPercent: true,
          },
        ].map(({ label, value, color, isPercent }) => (
          <div key={label} className="bg-navy-900 rounded-xl p-3 border border-navy-700">
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="font-semibold text-sm" style={{ color }}>
              {isPercent ? (value ?? '-') : formatEok(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
