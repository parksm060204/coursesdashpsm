<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# ⚠️ 최우선 필수 규칙 (프롬프트 자동 기록)

**에이전트는 사용자가 새로운 지시(프롬프트)를 내릴 때마다, 사용자가 명시적으로 요구하지 않더라도 무조건 `README.md` 파일 하단에 해당 프롬프트 내용을 자동으로 추가 기록해야 합니다.** (과제 제출용 목적이므로 누락 없이 모든 대화/지시가 README.md에 쌓여야 함)

---

# 프로젝트 핵심 로직 및 제약사항

에이전트는 프로젝트 개발 시 다음 규칙들을 반드시 준수해야 합니다:

1. **기술 스택**: Next.js (App Router), Tailwind CSS
2. **사이드바 메뉴 데이터**: 
   - 대분류: 대학전체, 기초교육원, 인문대학, 자연과학대학, 사회과학대학, 글로벌정경대학, 공과대학, 정보기술대학, 경영대학, 예술체육대학, 사범대학, 도시과학대학, 생명과학기술대학, 융합자유전공대학, 동북아국제통상물류학부, 법학부
   - `MENU_DATA` 상수를 사용하여 배열 형태로 관리 (더미 데이터 포함)
3. **핵심 제약조건 (100% 준수)**:
   - **사이드바 소속 학과는 기본적으로 렌더링될 때 '모두 펼쳐진(Expanded)' 상태로 고정** (접기/펴기 기능이 있더라도 기본값은 무조건 `true`)
4. **UI/UX 디자인 가이드**:
   - 상단 로고: 'Incheon National University', 서브 텍스트: '2026-1 Course Dashboard'
   - 전체 대시보드 버튼: 보라색 계열 활성화 상태 반영
   - 클릭 및 호버 효과(Tailwind CSS 활용)
   - 사이드바 내부 커스텀 스크롤바(가늘고 깔끔한 형태) 적용
5. **기능 제약사항**:
   - 특정 학과 클릭 시 부모 레이아웃으로 상태를 전달하는 `onSelectDepartment` 속성 필수 구현
6. **Supabase 연동 정보 및 보안 정책 (RLS & GRANT)**:
   - `.env.local`에 기입된 환경변수를 활용하여 연동 준비. 추후 '종합강의시간표_1학기_전체.csv' 데이터를 활용하여 동적 추출 및 매핑 예정.
   - **(신규 추가 정책)** 앞으로 테이블을 생성할 때와 액세스할 때는 **반드시** 아래 사항을 항상 적용할 것:
     - `anon`과 `authenticated` 역할(Role)이 PostgREST API를 통해 이 테이블에 접근할 수 있도록 명시적인 GRANT SQL 문(`SELECT`, `INSERT`, `UPDATE`, `DELETE` 등)을 반드시 포함할 것.
     - RLS(Row Level Security)를 활성화하고, 인증된 유저(`authenticated`)만 본인의 데이터(예: 일기 등)를 읽고 쓸 수 있도록 Policy도 함께 작성할 것.
