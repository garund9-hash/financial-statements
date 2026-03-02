# 재무 데이터 시각화 분석 서비스 구현 계획

## Context

한국 상장기업의 재무 데이터를 **누구나 쉽게 이해할 수 있도록** 시각화·분석하는 React 서비스를 신규로 개발한다.
3단계: (1) corp.xml 기반 회사 검색 → (2) OpenDart API 재무 데이터 차트 시각화 → (3) Gemini AI 쉬운 해설.

현재 프로젝트에는 corp.xml(880KB, ~3,800개 기업) 파일만 존재하며, 코드는 전혀 없는 상태이다.

---

## 기술 스택 (선택 이유 포함)

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | **Next.js 14 App Router** | OpenDart CORS 문제를 API Routes로 해결, Vercel 최적화 |
| 스타일 | **Tailwind CSS** | 빠른 레이아웃 구성 |
| 차트 | **Recharts 2.x** | React-native, SSR-safe |
| 상태 관리 | **useState (Context)** | 단순한 선형 흐름에 충분 |
| 폰트 | **Noto Sans KR** | 한글 전체 커버, next/font 최적화 |

> CORS 해결이 Next.js 선택의 핵심 이유: 브라우저에서 OpenDart를 직접 호출하면 CORS 오류 발생 → Next.js API Routes가 서버에서 프록시 역할

---

## 프로젝트 디렉토리 구조

```
financial-statements/
├── corp.xml                      # 기존 파일 (원본 데이터)
├── .env.local                    # gitignore — API 키 (로컬용)
├── .env.example                  # 커밋 — 변수명 템플릿
├── .gitignore
├── next.config.mjs
├── tailwind.config.js            # navy/gold 테마
├── postcss.config.mjs
├── package.json
│
├── public/
│   └── corp-data.json            # 빌드 타임에 corp.xml → JSON 변환 결과
│
├── scripts/
│   └── convert-xml.mjs           # corp.xml → public/corp-data.json 변환 스크립트
│
└── app/
    ├── globals.css
    ├── layout.js                 # Noto Sans KR, nav, metadata
    ├── page.js                   # 메인 페이지 (상태 오케스트레이션)
    ├── lib/
    │   └── financialUtils.js     # 순수 함수: 금액 파싱, 억원 변환, 계정과목 추출
    ├── components/
    │   ├── SearchBar.js          # 클라이언트: 인메모리 검색
    │   ├── CompanyCard.js        # 선택된 회사 헤더 정보
    │   ├── PeriodSelector.js     # 연도 + 보고서 기간 드롭다운
    │   ├── FinancialCharts.js    # BS + IS 차트 오케스트레이터
    │   ├── BalanceSheetChart.js  # Recharts BarChart (자산/부채/자본)
    │   ├── IncomeStatementChart.js # Recharts ComposedChart (매출/이익/마진)
    │   ├── GeminiAnalysis.js     # AI 분석 버튼 + 결과 렌더링
    │   ├── LoadingSpinner.js
    │   └── ErrorMessage.js
    └── api/
        ├── dart/route.js         # GET /api/dart — OpenDart 프록시
        └── gemini/route.js       # POST /api/gemini — Gemini 프록시
```

---

## 구현 단계별 계획

### Step 1: 프로젝트 부트스트랩
```bash
cd /home/garund9/projects/financial-statements
npx create-next-app@14 . --js --tailwind --app --no-src-dir --no-turbopack
npm install recharts lucide-react
```

### Step 2: XML → JSON 변환 스크립트
**`scripts/convert-xml.mjs`**
- corp.xml을 읽어 `<list>` 블록을 파싱 (regex 기반, npm 의존성 없음)
- `stock_code`가 비어있는 비상장사 제외
- 단축 키로 JSON 배열 생성: `[{"c":"00126380","n":"삼성전자","e":"SAMSUNG ELECTRONICS CO,.LTD","s":"005930"}, ...]`
- 출력: `public/corp-data.json` (~271KB, 3,864개)
- `package.json` build 스크립트에 연결: `"build": "node scripts/convert-xml.mjs && next build"`

### Step 3: 환경변수 설정
**`.env.local`** (gitignore)
```
DART_API_KEY=your_opendart_api_key
GEMINI_API_KEY=your_gemini_api_key
```
**`.env.example`** (커밋용)
```
DART_API_KEY=your_opendart_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 4: Tailwind 테마 설정
**`tailwind.config.js`** — 금융 서비스 느낌의 navy/gold 다크 테마
```js
colors: {
  navy: { 950: '#040d1a', 900: '#0a1628', 800: '#0f2040', 700: '#172d58' },
  gold: { DEFAULT: '#c9a84c', light: '#e8c96a' },
}
```

### Step 5: API Routes (핵심)
**`app/api/dart/route.js`** — OpenDart CORS 프록시
- 입력 검증: corp_code(8자리), year(4자리), period(허용값 목록)
- `process.env.DART_API_KEY` 사용 (서버 전용, 브라우저 노출 없음)
- OpenDart 호출: `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json`
- Vercel 캐시: `next: { revalidate: 3600 }` (동일 요청 1시간 캐시)
- OpenDart 오류 코드 처리: `status !== '000'` → 한국어 오류 메시지 반환

**`app/api/gemini/route.js`** — Gemini AI 프록시
- POST body: `{ companyName, year, period, balanceSheet, incomeStatement }`
- 모델: `gemini-3-flash-preview` (기본), 429 시 `gemini-2.5-flash` 폴백
- `temperature: 0.4`, `maxOutputTokens: 4096`
- Gemini 프롬프트 구조 (buildGeminiPrompt 함수):
  - 재무 데이터를 억원 단위로 포맷
  - "전문 용어 사용 금지, 동네 가게 비유 환영" 지시
  - 5개 섹션 요청: 한줄요약 / 긍정적인 신호 / 주의할 점 / 초보자 쉬운 설명 / 투자 관련 인상
  - 응답 형식: 마크다운

### Step 6: 데이터 유틸리티
**`app/lib/financialUtils.js`** — 순수 함수들
- `parseAmount(str)`: `"174,697,424,000,000"` → `1,746,974` (억원)
- `formatEok(value)`: 조 단위 이상이면 "X.X조", 이하면 "X,XXX억"
- `findAccount(list, name)`: CFS 우선, 없으면 OFS fallback
- `buildBalanceSheetData(list)`: 자산총계/부채총계/자본총계 당기/전기/전전기 추출
- `buildIncomeStatementData(list)`: 매출액/영업이익/당기순이익 + 영업이익률
- `buildGeminiPayload(bsData, isData)`: Gemini API 요청용 간략 데이터 구조

### Step 7: 핵심 컴포넌트
**`SearchBar.js`**
- mount 시 `/corp-data.json` fetch → 메모리 저장
- 입력할 때마다 한국어명/영문명/종목코드 필터링 (상위 10개)
- 완전 클라이언트 검색 (네트워크 요청 없음)

**`PeriodSelector.js`**
- 연도: 작년부터 2015년까지 드롭다운
- 기간: 연간(11011) / 3분기(11014) / 반기(11012) / 1분기(11013)

**`BalanceSheetChart.js`**
- Recharts `BarChart` (그룹 바)
- X축: "당기" / "전기" / "전전기"
- Y축: 억원 단위 포맷
- 색상: 자산(파랑) / 부채(빨강) / 자본(초록)
- SSR 안전: `mounted` 상태 확인 후 렌더링

**`IncomeStatementChart.js`**
- Recharts `ComposedChart`
- Bar: 매출액(금색), 영업이익(보라), 당기순이익(시안)
- Line: 영업이익률% (흰색, 우측 Y축)

**`GeminiAnalysis.js`**
- "AI 분석 받기" 버튼 — 수동 트리거 (자동 호출 없음)
- 로딩 스피너 → 마크다운 결과 렌더링

### Step 8: 메인 페이지
**`app/page.js`** — 상태 흐름
1. SearchBar → 회사 선택
2. PeriodSelector → 연도/기간 선택
3. `/api/dart` 호출 → dartData 저장
4. FinancialCharts 렌더링
5. GeminiAnalysis 버튼 → `/api/gemini` 호출

---

## OpenDart 오류 처리

| 오류 코드 | 표시 메시지 |
|-----------|------------|
| `020` | 해당 기간의 재무 데이터가 없습니다. 다른 기간을 선택해주세요. |
| `010` | API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요. |
| `013` | DART 공시 데이터가 없는 회사입니다. |

---

## Vercel 배포 설정

1. `.env.local`은 gitignore (절대 커밋 금지)
2. Vercel 대시보드 > Settings > Environment Variables에 두 키 등록
   - `DART_API_KEY` — `NEXT_PUBLIC_` 접두사 없음 (서버 전용)
   - `GEMINI_API_KEY` — `NEXT_PUBLIC_` 접두사 없음 (서버 전용)
3. `public/corp-data.json`은 커밋에 포함 (빌드 중 자동 재생성)

---

## 검증 방법

### 로컬 테스트
```bash
# 1. XML 변환 확인
node scripts/convert-xml.mjs
# → "Converted 3,864 companies to public/corp-data.json (271 KB)"

# 2. 개발 서버 시작
npm run dev

# 3. OpenDart 프록시 테스트 (삼성전자 2023 연간)
curl "http://localhost:3000/api/dart?corp_code=00126380&year=2023&period=11011"
# → {"status":"000","list":[...]}

# 4. Gemini 프록시 테스트
curl -X POST "http://localhost:3000/api/gemini" \
  -H "Content-Type: application/json" \
  -d '{"companyName":"삼성전자","year":"2023","period":"11011",...}'
```

### UI 검증 시나리오
1. "삼성전자" 검색 → 드롭다운에서 선택 확인
2. 2023년 연간 데이터 → 재무상태표/손익계산서 차트 표시 확인
3. "AI 분석 받기" 클릭 → 한국어 쉬운 설명 표시 확인
4. 존재하지 않는 기간 선택 → 오류 메시지 표시 확인
5. 다른 회사로 전환 → 데이터 초기화 및 새 데이터 로딩 확인
