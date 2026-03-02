import { Building2, Hash } from 'lucide-react';

export default function CompanyCard({ corp }) {
  if (!corp) return null;

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white">{corp.n}</h2>
          <p className="text-slate-400 text-sm mt-0.5 truncate">{corp.e}</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 bg-navy-900 rounded-lg px-3 py-1.5">
              <Hash className="w-3.5 h-3.5 text-gold" />
              <span className="text-gold font-mono text-sm font-medium">{corp.s}</span>
              <span className="text-slate-500 text-xs ml-1">종목코드</span>
            </div>
            <div className="flex items-center gap-1.5 bg-navy-900 rounded-lg px-3 py-1.5">
              <span className="text-slate-400 text-xs">기업코드</span>
              <span className="text-slate-300 font-mono text-sm">{corp.c}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
