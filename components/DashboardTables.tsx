'use client';

import React, { useState, useMemo, useEffect } from 'react';

interface Course {
  '대학(원)'?: string;
  '대학'?: string;
  '학과'?: string;
  '이수구분'?: string;
  '교과목명'?: string;
  '담당교수'?: string;
  '학점'?: string | number;
  '수강'?: string | number;
  '정원'?: string | number;
  [key: string]: any;
}

interface DashboardTablesProps {
  courses?: Course[];
  cart?: any[];
  onToggleCart?: (course: any) => void;
  user?: any;
  onRequireLogin?: () => void;
}

const formatClassPeriod = (str?: string) => {
  if (!str) return '-';
  const trimmed = str.trim();
  if (trimmed.includes(':')) {
    return trimmed.split(':').slice(1).join(':').replace(/\]$/, '');
  }
  return trimmed.replace(/^\[|\]$/g, '');
};

export default function DashboardTables({ 
  courses = [], 
  cart = [], 
  onToggleCart,
  user = null,
  onRequireLogin
}: DashboardTablesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 15;

  // 대학(원)별 강좌 분석 요약 테이블 데이터 생성
  const summaryData = useMemo(() => {
    const map: Record<string, { totalCourses: number; totalEnrolled: number; totalCapacity: number }> = {};

    courses.forEach(c => {
      // 대학(원) 컬럼 우선, 없으면 대학 컬럼
      const college = c['대학(원)'] || c['대학'] || '미상';
      const enrolled = parseInt(String(c['수강']), 10) || 0;
      const capacity = parseInt(String(c['정원']), 10) || 0;

      if (!map[college]) {
        map[college] = { totalCourses: 0, totalEnrolled: 0, totalCapacity: 0 };
      }
      map[college].totalCourses += 1;
      map[college].totalEnrolled += enrolled;
      map[college].totalCapacity += capacity;
    });

    return Object.keys(map).map(college => {
      const avgEnrolled = map[college].totalCourses > 0 
        ? (map[college].totalEnrolled / map[college].totalCourses).toFixed(1) 
        : '0.0';
      
      const avgEnrolmentRate = map[college].totalCapacity > 0
        ? ((map[college].totalEnrolled / map[college].totalCapacity) * 100).toFixed(1)
        : '0.0';
        
      return {
        college,
        totalCourses: map[college].totalCourses,
        totalEnrolled: map[college].totalEnrolled,
        avgEnrolled,
        avgEnrolmentRate
      };
    }).sort((a, b) => b.totalCourses - a.totalCourses); // 강좌수 많은 순 정렬
  }, [courses]);

  // 교과목명 검색 필터링
  const searchedCourses = useMemo(() => {
    if (!searchTerm) return courses;
    return courses.filter(c => String(c['교과목명'] || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [courses, searchTerm]);

  // 검색어 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 상세 강좌 정보 페이지네이션
  const totalPages = Math.ceil(searchedCourses.length / itemsPerPage);
  const currentData = searchedCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  if (!courses || courses.length === 0) return null;

  return (
    <div className="space-y-8 mb-12">
      
      {/* 1. 대학(원)별 강좌 분석 요약 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">🏫 대학(원)별 강좌 분석 요약</h3>
        </div>
        <div className="overflow-y-auto max-h-80 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm z-10 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="py-3 px-6">소속 대학명</th>
                <th className="py-3 px-6 text-right">총 강좌수</th>
                <th className="py-3 px-6 text-right">총 수강인원</th>
                <th className="py-3 px-6 text-right">평균 수강인원</th>
                <th className="py-3 px-6 text-right">평균 수강률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {summaryData.length > 0 ? summaryData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-gray-900">{row.college}</td>
                  <td className="py-3 px-6 text-right">{row.totalCourses.toLocaleString()}개</td>
                  <td className="py-3 px-6 text-right">{row.totalEnrolled.toLocaleString()}명</td>
                  <td className="py-3 px-6 text-right text-purple-600 font-semibold">{row.avgEnrolled}명</td>
                  <td className="py-3 px-6 text-right text-indigo-600 font-semibold">{row.avgEnrolmentRate}%</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 상세 강좌 정보 데이터 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-800">📋 상세 강좌 정보</h3>
            <span className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
              총 {searchedCourses.length.toLocaleString()}건
            </span>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="교과목명 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-white text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">대학</th>
                <th className="py-3 px-4">학과</th>
                <th className="py-3 px-4">이수구분</th>
                <th className="py-3 px-4">교과목명</th>
                <th className="py-3 px-4">담당교수</th>
                <th className="py-3 px-4 text-center">학점</th>
                <th className="py-3 px-4 text-center">시간표(교시)</th>
                <th className="py-3 px-4 text-center">수강/정원</th>
                <th className="py-3 px-4 text-center">수강률</th>
                {user && <th className="py-3 px-4 text-center">장바구니</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {currentData.length > 0 ? currentData.map((course, idx) => (
                <tr key={idx} className="hover:bg-purple-50 transition-colors">
                  <td className="py-3 px-4">{course['대학(원)'] || course['대학'] || '-'}</td>
                  <td className="py-3 px-4 text-gray-500">{course['학과'] || '-'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                      {course['이수구분'] || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 truncate max-w-xs" title={course['교과목명']}>
                    <div className="font-semibold text-gray-900">{course['교과목명'] || '-'}</div>
                    {course['시간표(시간)'] && (
                      <div className="text-xs text-gray-400 font-normal mt-0.5" title={course['시간표(시간)']}>
                        {course['시간표(시간)'].trim()}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">{course['담당교수'] || '-'}</td>
                  <td className="py-3 px-4 text-center">{course['학점'] || '-'}</td>
                  <td className="py-3 px-4 text-center text-xs text-gray-500 font-medium">
                    {formatClassPeriod(course['시간표(교시)'])}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-purple-600 font-semibold">{course['수강'] || 0}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-gray-500">{course['정원'] || 0}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {(() => {
                      const enrolled = parseInt(String(course['수강']), 10) || 0;
                      const capacity = parseInt(String(course['정원']), 10) || 0;
                      const rate = capacity > 0 ? (enrolled / capacity) * 100 : 0;
                      
                      let badgeColor = 'bg-gray-100 text-gray-600';
                      if (rate >= 100) badgeColor = 'bg-red-50 text-red-600 border border-red-100';
                      else if (rate >= 80) badgeColor = 'bg-purple-50 text-purple-600 border border-purple-100';
                      else if (rate >= 50) badgeColor = 'bg-blue-50 text-blue-600 border border-blue-100';
                      
                      return (
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${badgeColor}`}>
                          {rate.toFixed(1)}%
                        </span>
                      );
                    })()}
                  </td>
                  {user && (
                    <td className="py-3 px-4 text-center">
                      {(() => {
                        const isAdded = cart.some(c => c['순번'] === course['순번']);
                        return (
                          <button
                            onClick={() => onToggleCart?.(course)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              isAdded 
                                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
                                : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100 border border-yellow-200'
                            }`}
                          >
                            {isAdded ? '취소' : '⭐ 담기'}
                          </button>
                        );
                      })()}
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={user ? 10 : 9} className="py-8 text-center text-gray-500">데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
            <span className="text-sm text-gray-500">
              페이지 <span className="font-semibold text-gray-900">{currentPage}</span> / {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={handlePrev} 
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              <button 
                onClick={handleNext} 
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
