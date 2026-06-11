-- Supabase SQL Editor에서 실행할 장바구니 테이블 생성 SQL (수정판)
-- 이미 테이블이 있다면 아래 DROP 문을 먼저 실행하거나 ALTER만 실행하세요

-- 이미 carts 테이블이 있는 경우: 기존 정책 삭제 후 재생성
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'carts') THEN
    DROP POLICY IF EXISTS "Users can view own cart" ON carts;
    DROP POLICY IF EXISTS "Users can insert own cart" ON carts;
    DROP POLICY IF EXISTS "Users can delete own cart" ON carts;
    DROP POLICY IF EXISTS "Users can update own cart" ON carts;
    DROP POLICY IF EXISTS "Auth users can insert to carts" ON carts;
    DROP POLICY IF EXISTS "Auth users can delete from carts" ON carts;
    DROP POLICY IF EXISTS "Auth users can select from carts" ON carts;
    DROP POLICY IF EXISTS "Auth users can update carts" ON carts;
  END IF;
END $$;

-- 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS carts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  course_seq TEXT NOT NULL,
  course_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_seq)
);

-- RLS 활성화
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- 인증된 유저의 INSERT 허용 (user_id는 앱에서 직접 설정)
CREATE POLICY "Auth users can insert to carts" ON carts FOR INSERT TO authenticated WITH CHECK (true);

-- 인증된 유저는 자신의 데이터만 SELECT
CREATE POLICY "Auth users can select from carts" ON carts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 인증된 유저는 자신의 데이터만 DELETE
CREATE POLICY "Auth users can delete from carts" ON carts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 인증된 유저는 자신의 데이터만 UPDATE
CREATE POLICY "Auth users can update carts" ON carts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- PostgREST API 접근 권한
GRANT SELECT, INSERT, UPDATE, DELETE ON carts TO anon, authenticated;
GRANT USAGE ON SEQUENCE carts_id_seq TO anon, authenticated;
