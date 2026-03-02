import { NextResponse } from 'next/server';

function buildPrompt(companyName, year, period, balanceSheet, incomeStatement) {
  const periodLabels = {
    '11011': '연간',
    '11012': '반기(상반기)',
    '11014': '3분기',
    '11013': '1분기',
  };
  const periodLabel = periodLabels[period] || period;

  const fmt = (val) => {
    if (val === null || val === undefined) return '데이터 없음';
    if (val >= 10000) return `${(val / 10000).toFixed(1)}조원`;
    return `${val.toLocaleString('ko-KR')}억원`;
  };

  const bs = balanceSheet || {};
  const is = incomeStatement || {};

  const revenueMargin = (is.revenue && is.operatingProfit)
    ? ((is.operatingProfit / is.revenue) * 100).toFixed(1)
    : null;

  return `당신은 재무 전문가이지만, 금융 지식이 없는 일반인도 쉽게 이해할 수 있도록 설명해주는 분석가입니다.

다음은 **${companyName}**의 ${year}년 ${periodLabel} 재무 데이터입니다.

--- 재무상태표 주요 항목 ---
• 자산총계(회사가 가진 모든 것): ${fmt(bs.assets)}
  - 유동자산(1년 내 현금화 가능): ${fmt(bs.currentAssets)}
  - 비유동자산(장기 보유 자산): ${fmt(bs.nonCurrentAssets)}
• 부채총계(빚): ${fmt(bs.liabilities)}
  - 유동부채(1년 내 갚아야 할 빚): ${fmt(bs.currentLiabilities)}
  - 비유동부채(장기 부채): ${fmt(bs.nonCurrentLiabilities)}
• 자본총계(순자산, 자산에서 빚 뺀 것): ${fmt(bs.equity)}

--- 손익계산서 주요 항목 ---
• 매출액(총 수입): ${fmt(is.revenue)}
• 영업이익(장사해서 번 돈): ${fmt(is.operatingProfit)}${revenueMargin ? ` (영업이익률: ${revenueMargin}%)` : ''}
• 당기순이익(최종 이익): ${fmt(is.netIncome)}

${is.prevRevenue ? `전년도 대비 변화:
• 매출액: ${fmt(is.prevRevenue)} → ${fmt(is.revenue)}
• 영업이익: ${fmt(is.prevOperatingProfit)} → ${fmt(is.operatingProfit)}` : ''}

위 데이터를 바탕으로 아래 형식으로 한국어로 분석해 주세요. **전문 금융 용어 사용을 최소화**하고, 일상적인 언어로 설명해 주세요.

## 1. 한 줄 요약
이 회사의 재무 상태를 한 문장으로 표현해 주세요.

## 2. 긍정적인 신호 🟢
이 재무 데이터에서 좋은 점 2-3가지를 쉬운 말로 설명해 주세요. (비유나 일상적 표현 환영)

## 3. 주의할 점 🔴
투자자나 일반인이 알아야 할 리스크나 약점 2-3가지를 솔직하게 설명해 주세요.

## 4. 초보자를 위한 쉬운 설명 💡
이 회사가 돈을 얼마나 잘 버는지, 빚은 얼마나 있는지를 **동네 가게에 비유**하거나 일상 언어로 설명해 주세요. (예: "10억짜리 식당을 운영하는데...")

## 5. 투자 관련 인상 📊
이 재무 데이터만 보면 어떤 인상인지 중립적으로 한마디 해 주세요. (투자 권유가 아닌 순수한 데이터 해석)`;
}

export async function POST(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  }

  const { companyName, year, period, balanceSheet, incomeStatement } = body;

  if (!companyName || !year || !period) {
    return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
  }

  const prompt = buildPrompt(companyName, year, period, balanceSheet, incomeStatement);

  // gemini-3-flash-preview 먼저 시도, 429(할당량 초과) 시 gemini-2.5-flash로 폴백
  const models = ['gemini-3-flash-preview', 'gemini-2.5-flash'];
  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
    },
  });

  let response = null;
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
      if (response.status !== 429) break; // 429이 아니면 이 모델로 진행
    } catch (fetchErr) {
      console.error(`Gemini fetch error (${model}):`, fetchErr);
    }
  }

  try {
    if (!response || !response.ok) {
      const errData = response ? await response.json().catch(() => ({})) : {};
      console.error('Gemini API error:', errData);
      return NextResponse.json(
        { error: 'AI 분석 서비스에 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'AI 응답을 받을 수 없습니다.' }, { status: 502 });
    }

    return NextResponse.json({ analysis: text });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    return NextResponse.json({ error: 'AI 분석에 실패했습니다.' }, { status: 500 });
  }
}
