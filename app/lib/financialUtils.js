// OpenDart 금액 문자열을 억원 단위 숫자로 변환
// 예: "174,697,424,000,000" → 1746974
export function parseAmount(amountStr) {
  if (!amountStr || amountStr.trim() === '') return null;
  const cleaned = amountStr.replace(/,/g, '').trim();
  if (cleaned === '-' || cleaned === '') return null;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return Math.round(num / 100_000_000);
}

// 억원 숫자를 사람이 읽기 좋은 형태로 표시
export function formatEok(value) {
  if (value === null || value === undefined) return '-';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 10000) {
    return `${sign}${(abs / 10000).toFixed(1)}조`;
  }
  return `${sign}${abs.toLocaleString('ko-KR')}억`;
}

// 보고서 기간 코드를 한글로 변환
export function periodLabel(reprt_code) {
  const map = {
    '11011': '연간',
    '11012': '반기',
    '11014': '3분기',
    '11013': '1분기',
  };
  return map[reprt_code] || reprt_code;
}

// OpenDart 목록에서 특정 계정과목 데이터 추출
// CFS(연결재무제표) 우선, 없으면 OFS(개별재무제표) 사용
function findAccount(list, accountName, sjDiv) {
  const cfs = list.find(
    (item) => item.account_nm === accountName && item.fs_div === 'CFS' && item.sj_div === sjDiv
  );
  if (cfs) return cfs;
  return list.find(
    (item) => item.account_nm === accountName && item.sj_div === sjDiv
  ) || null;
}

// X축 레이블 추출 (당기명, 전기명, 전전기명)
export function extractPeriodLabels(list) {
  const first = list[0];
  if (!first) return ['당기', '전기', '전전기'];
  return [
    first.thstrm_nm || '당기',
    first.frmtrm_nm || '전기',
    first.bfefrmtrm_nm || '전전기',
  ];
}

// 재무상태표 데이터 구조 생성
export function buildBalanceSheetData(list) {
  const accounts = [
    { key: 'assets', name: '자산총계', sj: 'BS' },
    { key: 'currentAssets', name: '유동자산', sj: 'BS' },
    { key: 'nonCurrentAssets', name: '비유동자산', sj: 'BS' },
    { key: 'liabilities', name: '부채총계', sj: 'BS' },
    { key: 'currentLiabilities', name: '유동부채', sj: 'BS' },
    { key: 'nonCurrentLiabilities', name: '비유동부채', sj: 'BS' },
    { key: 'equity', name: '자본총계', sj: 'BS' },
  ];

  const result = {};
  for (const { key, name, sj } of accounts) {
    const item = findAccount(list, name, sj);
    if (item) {
      result[key] = {
        current: parseAmount(item.thstrm_amount),
        prev: parseAmount(item.frmtrm_amount),
        prev2: parseAmount(item.bfefrmtrm_amount),
      };
    } else {
      result[key] = { current: null, prev: null, prev2: null };
    }
  }
  return result;
}

// 손익계산서 데이터 구조 생성
export function buildIncomeStatementData(list) {
  const accounts = [
    { key: 'revenue', name: '매출액', sj: 'IS' },
    { key: 'operatingProfit', name: '영업이익', sj: 'IS' },
    { key: 'pretaxIncome', name: '법인세차감전 순이익', sj: 'IS' },
    { key: 'netIncome', name: '당기순이익(손실)', sj: 'IS' },
  ];

  // '당기순이익(손실)' 없으면 '당기순이익'으로 fallback
  const result = {};
  for (const { key, name, sj } of accounts) {
    let item = findAccount(list, name, sj);
    if (!item && name === '당기순이익(손실)') {
      item = findAccount(list, '당기순이익', sj);
    }
    if (item) {
      result[key] = {
        current: parseAmount(item.thstrm_amount),
        prev: parseAmount(item.frmtrm_amount),
        prev2: parseAmount(item.bfefrmtrm_amount),
      };
    } else {
      result[key] = { current: null, prev: null, prev2: null };
    }
  }
  return result;
}

// Gemini API 요청용 간략 데이터 구조 생성
export function buildGeminiPayload(bsData, isData) {
  return {
    balanceSheet: {
      assets: bsData.assets?.current,
      currentAssets: bsData.currentAssets?.current,
      nonCurrentAssets: bsData.nonCurrentAssets?.current,
      liabilities: bsData.liabilities?.current,
      currentLiabilities: bsData.currentLiabilities?.current,
      nonCurrentLiabilities: bsData.nonCurrentLiabilities?.current,
      equity: bsData.equity?.current,
    },
    incomeStatement: {
      revenue: isData.revenue?.current,
      operatingProfit: isData.operatingProfit?.current,
      netIncome: isData.netIncome?.current,
      prevRevenue: isData.revenue?.prev,
      prevOperatingProfit: isData.operatingProfit?.prev,
    },
  };
}

// 차트용 데이터 배열 생성 (X축: 당기/전기/전전기)
export function buildChartData(periodLabels, data, keys) {
  return periodLabels.map((label, idx) => {
    const periodKey = idx === 0 ? 'current' : idx === 1 ? 'prev' : 'prev2';
    const point = { period: label };
    for (const [k, displayKey] of Object.entries(keys)) {
      point[displayKey] = data[k]?.[periodKey] ?? null;
    }
    return point;
  });
}
