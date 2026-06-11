import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 장바구니 조회
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'user_id가 필요합니다.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('carts')
      .select('course_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 장바구니 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, course_seq, course_data } = body;

    if (!user_id || !course_seq) {
      return NextResponse.json({ success: false, error: 'user_id와 course_seq가 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('carts')
      .upsert({
        user_id,
        course_seq,
        course_data: course_data || {},
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id, course_seq' });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 장바구니 삭제
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, course_seq } = body;

    if (!user_id || !course_seq) {
      return NextResponse.json({ success: false, error: 'user_id와 course_seq가 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('carts')
      .delete()
      .eq('user_id', user_id)
      .eq('course_seq', course_seq);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
