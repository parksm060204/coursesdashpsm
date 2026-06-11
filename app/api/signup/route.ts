import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, captcha } = body;

    if (!username || !password || !captcha) {
      return NextResponse.json(
        { success: false, error: '아이디, 비밀번호, 보안문자를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { success: false, error: '아이디는 최소 3자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    const idPattern = /^[a-zA-Z0-9_]+$/;
    if (!idPattern.test(username.trim())) {
      return NextResponse.json(
        { success: false, error: '아이디는 영문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const email = `${username.trim().toLowerCase()}@example.com`;

    // admin.createUser를 사용하여 이메일 확인 없이 바로 생성
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 확인 우회
      user_metadata: {
        username: username.trim().toLowerCase(),
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been registered')) {
        return NextResponse.json(
          { success: false, error: '이미 가입된 아이디입니다. 다른 아이디를 사용해주세요.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: `회원가입 중 오류가 발생했습니다: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: '회원가입에 실패했습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: '회원가입이 성공적으로 완료되었습니다!' },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
