import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// POST 핸들러
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { departmentName, summary } = body;

    if (!departmentName || !summary) {
      return NextResponse.json(
        { error: 'departmentName과 summary 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // Gemini API 클라이언트 초기화
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '서버에 GEMINI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 필수 조건: gemini-3.1-flash-lite 모델 명시
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    // 프롬프트 구성
    const prompt = `
학과명: ${departmentName}
강좌 통계 요약: 
${JSON.stringify(summary, null, 2)}

지시사항:
제공된 위 데이터(총 강좌 수, 수강 인원, 이수구분 비율, 수강생이 가장 많은 인기 강좌 등)를 바탕으로, "${departmentName}"의 2026-1학기 강의 현황과 트렌드를 마크다운(Markdown) 포맷으로 전문적이고 친절하게 3~4문단으로 분석해 줘. 
어떤 과목이 인기 있는지, 학과의 주력 이수구분은 무엇인지 등을 포함해서 풍부하게 분석해.
`;

    // API 요청
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });
  } catch (error: any) {
    console.error('AI 분석 중 오류 발생:', error);
    return NextResponse.json(
      { error: 'AI 분석 요청을 처리하는 중 서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
