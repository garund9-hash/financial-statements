import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-red-400 font-medium mb-1">데이터 조회 오류</p>
        <p className="text-slate-400 text-sm max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-navy-700 hover:bg-navy-600
            border border-navy-500 rounded-lg text-sm text-white transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          다시 시도
        </button>
      )}
    </div>
  );
}
