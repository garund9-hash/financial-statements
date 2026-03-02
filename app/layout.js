import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata = {
  title: '재무 분석 | 누구나 쉬운 기업 재무 데이터',
  description: '한국 상장기업 재무 데이터를 누구나 이해하기 쉽게 시각화하고 AI로 분석합니다.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body className="font-sans bg-navy-950 min-h-screen">
        <nav className="border-b border-navy-700 bg-navy-900/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-gold font-bold text-lg">📊 재무 분석</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="bg-navy-800 border border-navy-600 px-2 py-0.5 rounded-full">
                OpenDart
              </span>
              <span className="bg-navy-800 border border-navy-600 px-2 py-0.5 rounded-full">
                Gemini AI
              </span>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-navy-800 mt-16 py-6">
          <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-xs">
            <p>데이터 제공: 금융감독원 전자공시시스템 (DART) · AI 분석: Google Gemini</p>
            <p className="mt-1">이 서비스는 정보 제공 목적이며, 투자 권유가 아닙니다.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
