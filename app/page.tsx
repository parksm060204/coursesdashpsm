'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import KPICards from '@/components/KPICards';
import dynamic from 'next/dynamic';
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false });
import DashboardTables from '@/components/DashboardTables';
import AIAnalyzer from '@/components/AIAnalyzer';
import Breadcrumb from '@/components/Breadcrumb';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import TimetableModal from '@/components/TimetableModal';
import { UserIcon, LogOut, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('대학전체');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);

  // Supabase 클라이언트 초기화
  const supabase = createClient();

  // 장바구니 토글 함수 (API Route 경유 - service_role로 RLS 우회)
  const handleToggleCart = async (course: any) => {
    const courseSeq = String(course['순번']);
    const isExist = cart.some(c => String(c['순번']) === courseSeq);
    
    // Optimistic UI 업데이트
    if (isExist) {
      setCart(prev => prev.filter(c => String(c['순번']) !== courseSeq));
    } else {
      setCart(prev => [...prev, course]);
    }
    
    // 로그인된 경우에만 API 호출
    if (user) {
      try {
        if (isExist) {
          // 삭제 API 호출
          const res = await fetch('/api/cart', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, course_seq: courseSeq })
          });
          const result = await res.json();
          if (!result.success) {
            console.error('장바구니 삭제 실패:', result.error);
          }
        } else {
          // 추가 API 호출
          const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, course_seq: courseSeq, course_data: course })
          });
          const result = await res.json();
          if (!result.success) {
            setCart(prev => prev.filter(c => String(c['순번']) !== courseSeq));
            console.error('장바구니 추가 실패:', result.error);
            toast.error(`장바구니 저장 실패: ${result.error}`);
          }
        }
      } catch (err: any) {
        setCart(prev => prev.filter(c => String(c['순번']) !== courseSeq));
        console.error('장바구니 API 오류:', err);
        toast.error('장바구니 처리 중 오류가 발생했습니다.');
      }
    }
  };

  // 총 학점 계산
  const totalCredits = cart.reduce((sum, c) => {
    const credits = parseFloat(c['학점']) || 0;
    return sum + credits;
  }, 0);

  // 인증 상태 추적
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const loginStr = localStorage.getItem('login_timestamp');
        if (loginStr) {
          const loginTime = parseInt(loginStr, 10);
          const now = Date.now();
          const FOUR_HOURS = 4 * 60 * 60 * 1000;
          
          if (now - loginTime > FOUR_HOURS) {
            await supabase.auth.signOut();
            setUser(null);
            localStorage.removeItem('login_timestamp');
            return;
          }
        } else {
          // 로그인 되어있지만 기록이 없다면 지금 시간으로 저장
          localStorage.setItem('login_timestamp', Date.now().toString());
        }
      }
      
      setUser(session?.user || null);
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          localStorage.setItem('login_timestamp', Date.now().toString());
        }
        setUser(session?.user || null);
        // 로그아웃 시 장바구니 초기화 및 로그인 시간 초기화
        if (event === 'SIGNED_OUT') {
          setCart([]);
          localStorage.removeItem('login_timestamp');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // 로그인 유저 변경 시 장바구니 데이터 불러오기/초기화 (API Route 경유)
  useEffect(() => {
    if (user) {
      const loadCart = async () => {
        try {
          const res = await fetch(`/api/cart?user_id=${user.id}`);
          const result = await res.json();
          if (result.success && result.data) {
            setCart(result.data.map((row: any) => row.course_data));
          } else {
            console.error('장바구니 불러오기 실패:', result.error);
          }
        } catch (err) {
          console.error('장바구니 API 오류:', err);
        }
      };
      loadCart();
    } else {
      setCart([]);
    }
  }, [user]);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const STEP = 1000;

        // 1단계: 총 행 수를 먼저 파악 (count 쿼리는 매우 빠름)
        const { count, error: countError } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true });

        if (countError || count === null) {
          console.error('데이터 총 개수 조회 에러:', countError?.message);
          setIsLoading(false);
          return;
        }

        // 2단계: 필요한 페이지 범위를 계산하여 모두 동시에 요청 (병렬 처리)
        const pages = Math.ceil(count / STEP);
        const requests = Array.from({ length: pages }, (_, i) =>
          supabase
            .from('courses')
            .select('*')
            .range(i * STEP, (i + 1) * STEP - 1)
        );

        const results = await Promise.all(requests);

        let allData: any[] = [];
        for (const { data, error } of results) {
          if (error) {
            console.error('Supabase 데이터 조회 중 에러 발생:', error.message);
            break;
          }
          if (data) allData = allData.concat(data);
        }

        // 요약/합계 행(학기나 교과목명이 null 또는 비어있는 행) 필터링
        const validCourses = allData.filter(
          course => course['학기'] && course['교과목명'] && String(course['순번']).trim() !== ''
        );
        console.log(`✅ 성공적으로 데이터를 불러왔습니다. 총 ${validCourses.length}개 (원본 ${allData.length}개, ${pages}개 병렬 요청)`);
        setCourses(validCourses);
      } catch (err) {
        console.error('예기치 못한 에러가 발생했습니다:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 선택된 학과/대학에 따른 데이터 필터링 로직
  // CSV 데이터의 컬럼명 변수에 대비하여 여러 컬럼('개설대학', '소속', '대학(원)', '대학', '학과')을 모두 확인
  const filteredCourses = selectedDepartment === '대학전체' 
    ? courses 
    : courses.filter(course => {
        // 구 학과명에서 신 학과명(DB 기준)으로 변환 매핑
        const targetDept = 
          selectedDepartment === '일어일문학과' ? '일본지역문화학과' :
          selectedDepartment === '중어중문학과' ? '중어중국학과' :
          selectedDepartment === '정보통신학과' ? '정보통신공학과' :
          selectedDepartment === '메카트로닉스공학부' ? '바이오-로봇시스템공학과' :
          selectedDepartment === '무역학부' ? 'Global Trade & Service학부' :
          selectedDepartment === '융합자유전공학부' ? '자유전공학부' :
          selectedDepartment === '체육학부' || selectedDepartment === '체육학과' ? '스포츠과학부' :
          selectedDepartment === '기초교육학부' ? '기초교육원' :
          selectedDepartment;

        // 기초교육원(교양) 특별 처리: 소속이 기초교육원이거나 대학(원)이 교양인 모든 강좌 포함
        if (targetDept === '기초교육원' || targetDept === '교양') {
          return (
            course['개설대학'] === '기초교육원' ||
            course['소속'] === '기초교육원' ||
            course['대학(원)'] === '기초교육원' ||
            course['대학(원)'] === '교양' ||
            course['대학'] === '기초교육원' ||
            course['학과'] === '기초교육원' ||
            course['학과(부)'] === '기초교육원'
          );
        }

        // 사범대학 공통 교직 과목 특별 처리: 사범대학 학과들이 선택되었을 때, 소속이 '사범대학'인 공통 교직 과목들도 함께 노출
        const educationDepts = ['국어교육과', '수학교육과', '역사교육과', '영어교육과', '유아교육과', '윤리교육과', '일어교육과', '체육교육과'];
        if (educationDepts.includes(targetDept)) {
          if (course['소속'] === '사범대학' && course['대학(원)'] === '교직') {
            return true;
          }
        }

        // 산업경영공학과(공과대학) 필터링 시, 소속은 산경공이지만 경영대학(경영학부) 과목인 원가회계, 회계감사 등은 제외
        if (targetDept === '산업경영공학과') {
          const college = course['대학(원)'] || course['대학'] || '';
          if (college === '경영대학') {
            return false;
          }
        }

        return (
          course['개설대학'] === targetDept ||
          course['소속'] === targetDept ||
          course['대학(원)'] === targetDept || 
          course['대학'] === targetDept ||
          course['학과'] === targetDept ||
          course['학과(부)'] === targetDept
        );
      });

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* 사이드바 컴포넌트 */}
      <Sidebar selectedDepartment={selectedDepartment} onSelectDepartment={setSelectedDepartment} />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-[1600px] mx-auto space-y-8">
          
          <Breadcrumb selectedDepartment={selectedDepartment} />

          <header className="mb-8 border-b border-gray-200 pb-4 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {selectedDepartment}
              </h1>
              <p className="text-gray-500 mt-2 font-medium">
                2026학년도 1학기 {selectedDepartment} 소속 종합 강의 통계
              </p>
            </div>

            {/* 내 수강 바구니 & 로그인 영역 */}
            <div>
              {user ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <UserIcon className="w-4 h-4" />
                    <span>{user.email && user.email.endsWith('@example.com') ? user.email.split('@')[0] : user.email}</span>
                    <button 
                      onClick={() => supabase.auth.signOut()}
                      className="ml-2 flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      로그아웃
                    </button>
                  </div>
                  <div className="bg-white border border-purple-200 rounded-xl px-5 py-3 shadow-sm flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-0.5">내 수강 바구니</span>
                      <span className="text-sm font-medium text-gray-600">
                        <span className="text-lg font-extrabold text-gray-900 mr-1">{cart.length}</span>개 강좌 담김
                      </span>
                    </div>
                    <div className="w-px h-10 bg-gray-200 mx-1"></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">총 담은 학점</span>
                      <span className="text-sm font-medium text-gray-600">
                        <span className="text-lg font-extrabold text-gray-900 mr-1">{totalCredits}</span>학점
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsTimetableOpen(true)}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold py-2 px-4 rounded-lg transition-colors border border-purple-200 shadow-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    나의 시간표 보기
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                >
                  로그인
                </button>
              )}
            </div>
          </header>

          {/* KPI 카드 컴포넌트 */}
          <KPICards courses={filteredCourses} isLoading={isLoading} />

          {!isLoading && filteredCourses.length > 0 ? (
            <>
              {/* AI 강의 분석 컴포넌트 */}
              <AIAnalyzer departmentName={selectedDepartment} courses={filteredCourses} />

              {/* 시각화 차트 컴포넌트 */}
              <DashboardCharts courses={filteredCourses} />

              {/* 데이터 요약 및 상세 테이블 컴포넌트 */}
              <DashboardTables 
                courses={filteredCourses} 
                cart={cart} 
                onToggleCart={handleToggleCart} 
                user={user}
                onRequireLogin={() => {
                  toast.error("로그인 후 이용할 수 있습니다.", {
                    style: {
                      borderRadius: '10px',
                      background: '#333',
                      color: '#fff',
                    },
                  });
                  setIsAuthModalOpen(true);
                }}
              />
            </>
          ) : !isLoading && filteredCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
              <p className="text-gray-500 text-lg">해당 조건에 맞는 강좌 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-500 font-medium">데이터를 불러오는 중입니다...</p>
            </div>
          )}

          {/* 푸터 컴포넌트 */}
          <Footer />
        </div>
      </main>

      {/* 로그인 모달 */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      
      {/* 나의 시간표 보기 모달 */}
      <TimetableModal isOpen={isTimetableOpen} onClose={() => setIsTimetableOpen(false)} cart={cart} />
    </div>
  );
}
