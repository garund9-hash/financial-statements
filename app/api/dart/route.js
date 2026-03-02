import { NextResponse } from 'next/server';

const DART_ERROR_MESSAGES = {
  '010': 'API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  '011': '사용할 수 없는 OpenDart API 키입니다.',
  '012': '접근할 수 없는 IP 주소입니다.',
  '013': 'DART 공시 데이터가 없는 회사입니다.',
  '020': '해당 기간의 재무 데이터가 없습니다. 다른 기간을 선택해주세요.',
  '100': '필수 파라미터가 누락되었습니다.',
  '800': 'OpenDart 시스템 점검 중입니다.',
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const corp_code = searchParams.get('corp_code');
  const bsns_year = searchParams.get('year');
  const reprt_code = searchParams.get('period');

  if (!corp_code || !/^\d{8}$/.test(corp_code)) {
    return NextResponse.json({ error: '올바른 회사 코드가 아닙니다.' }, { status: 400 });
  }
  if (!bsns_year || !/^\d{4}$/.test(bsns_year)) {
    return NextResponse.json({ error: '올바른 연도가 아닙니다.' }, { status: 400 });
  }
  const validPeriods = ['11013', '11012', '11014', '11011'];
  if (!reprt_code || !validPeriods.includes(reprt_code)) {
    return NextResponse.json({ error: '올바른 보고서 기간이 아닙니다.' }, { status: 400 });
  }

  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
  }

  const url = new URL('https://opendart.fss.or.kr/api/fnlttSinglAcnt.json');
  url.searchParams.set('crtfc_key', apiKey);
  url.searchParams.set('corp_code', corp_code);
  url.searchParams.set('bsns_year', bsns_year);
  url.searchParams.set('reprt_code', reprt_code);

  try {
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'FinancialDashboard/1.0' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenDart 서버 오류: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.status !== '000') {
      const message = DART_ERROR_MESSAGES[data.status] || data.message || '알 수 없는 오류가 발생했습니다.';
      return NextResponse.json({ error: message, status: data.status }, { status: 422 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('DART proxy error:', err);
    return NextResponse.json({ error: 'OpenDart 데이터를 가져오는 데 실패했습니다.' }, { status: 500 });
  }
}
