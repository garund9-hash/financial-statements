# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # 개발 서버 (localhost:3000)
npm run build      # XML 변환 후 프로덕션 빌드 (node scripts/convert-xml.mjs && next build)
npm run lint       # ESLint 검사
```

corp.xml 구조가 변경된 경우 수동 변환:
```bash
node scripts/convert-xml.mjs
```

API 라우트 로컬 테스트:
```bash
curl "http://localhost:3000/api/dart?corp_code=00126380&year=2023&period=11011"
curl -X POST "http://localhost:3000/api/gemini" -H "Content-Type: application/json" \
  -d '{"companyName":"삼성전자","year":"2023","period":"11011","balanceSheet":{},"incomeStatement":{}}'
```

## Architecture

### Data Flow
```
corp.xml → (빌드 시) scripts/convert-xml.mjs → public/corp-data.json
                                                      ↓
브라우저: SearchBar (인메모리 검색) → 회사 선택
                                          ↓
app/page.js → GET /api/dart → OpenDart API (CORS 프록시)
                   ↓
           FinancialCharts (Recharts)
                   ↓
           GeminiAnalysis 버튼 클릭 → POST /api/gemini → Gemini API
```

### Why Next.js (not Vite)
브라우저에서 OpenDart API를 직접 호출하면 CORS 오류 발생. `app/api/dart/route.js`가 서버사이드 프록시 역할을 하므로 Next.js App Router가 필수.

### Key Conventions

**corp-data.json 키 구조**: XML의 긴 필드명을 단축 (`c`=corp_code, `n`=corp_name, `e`=corp_eng_name, `s`=stock_code). SearchBar와 financialUtils 모두 이 구조를 사용.

**금액 단위**: OpenDart는 원화 문자열(`"174,697,424,000,000"`)로 반환. `app/lib/financialUtils.js`의 `parseAmount()`가 억원 정수로 변환. 모든 차트·AI 분석은 억원 단위 사용.

**CFS/OFS 우선순위**: `findAccount()`는 연결재무제표(CFS)를 우선 사용하고 없으면 개별재무제표(OFS)로 폴백.

**SSR 안전 처리**: Recharts는 DOM API를 사용하므로 모든 차트 컴포넌트에서 `mounted` state로 hydration 후 렌더링.

**Gemini 모델 폴백**: `gemini-3-flash-preview` 우선, 429(할당량 초과) 시 `gemini-2.5-flash`로 자동 폴백 (`app/api/gemini/route.js`).

### Environment Variables
`.env.local`에 설정 (서버 전용, `NEXT_PUBLIC_` 접두사 없음):
- `DART_API_KEY` — OpenDart 인증키 (40자리, 따옴표 없이)
- `GEMINI_API_KEY` — Google Gemini API 키

Vercel 배포 시 동일한 이름으로 환경변수 등록. **주의**: `vercel env pull`로 가져온 값은 따옴표가 포함될 수 있으므로 직접 편집 필요.

### Import Alias
`@/*` → 프로젝트 루트 (`jsconfig.json` 설정). 예: `import { parseAmount } from '@/app/lib/financialUtils'`
