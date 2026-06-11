'use client';

import React, { useState } from 'react';

// MENU_DATA 상수 정의: 대학(대분류) 및 소속 학과(중분류)
const MENU_DATA = [
  {
    id: '1',
    category: '대학전체',
    departments: [] // 전체 대시보드 버튼
  },
  {
    id: '2',
    category: '기초교육원',
    departments: ['교양']
  },
  {
    id: '3',
    category: '인문대학',
    departments: ['국어국문학과', '독어독문학과', '불어불문학과', '영어영문학과', '일본지역문화학과', '중어중국학과']
  },
  {
    id: '4',
    category: '자연과학대학',
    departments: ['물리학과', '수학과', '패션산업학과', '해양학과', '화학과']
  },
  {
    id: '5',
    category: '사회과학대학',
    departments: ['문헌정보학과', '미디어커뮤니케이션학과', '사회복지학과', '창의인재개발학과']
  },
  {
    id: '6',
    category: '글로벌정경대학',
    departments: ['Global Trade & Service학부', '경제학과', '경제학과(야)', '무역학부(야)', '소비자학과', '정치외교학과', '행정학과']
  },
  {
    id: '7',
    category: '공과대학',
    departments: ['기계공학과', '바이오-로봇시스템공학과', '반도체융합전공', '산업경영공학과', '신소재공학과', '안전공학과', '에너지화학공학과', '전기공학과', '전자공학과', '전자공학부', '전자공학전공']
  },
  {
    id: '8',
    category: '정보기술대학',
    departments: ['임베디드시스템공학과', '정보통신공학과', '컴퓨터공학부']
  },
  {
    id: '9',
    category: '경영대학',
    departments: ['경영학부', '데이터과학과', '세무회계학과']
  },
  {
    id: '10',
    category: '예술체육대학',
    departments: ['공연예술학과', '디자인학부', '서양화전공', '스포츠과학부', '운동건강학부', '조형예술학부', '한국화전공']
  },
  {
    id: '11',
    category: '사범대학',
    departments: ['국어교육과', '수학교육과', '역사교육과', '영어교육과', '유아교육과', '윤리교육과', '일어교육과', '체육교육과']
  },
  {
    id: '12',
    category: '도시과학대학',
    departments: ['건설환경공학전공', '건축공학전공', '도시건축학부', '도시건축학전공', '도시공학과', '도시행정학과', '도시환경공학부', '환경공학전공']
  },
  {
    id: '13',
    category: '생명과학기술대학',
    departments: ['나노바이오공학전공', '분자의생명전공', '생명공학부', '생명공학전공', '생명과학부', '생명과학전공']
  },
  {
    id: '14',
    category: '융합자유전공대학',
    departments: ['자유전공학부']
  },
  {
    id: '15',
    category: '동북아국제통상물류학부',
    departments: ['IBE전공', '동북아국제통상전공', '스마트물류공학전공']
  },
  {
    id: '16',
    category: '법학부',
    departments: ['법학부']
  }
];

interface SidebarProps {
  selectedDepartment: string;
  onSelectDepartment: (department: string) => void;
}

export default function Sidebar({ selectedDepartment, onSelectDepartment }: SidebarProps) {
  const handleSelect = (dept: string) => {
    onSelectDepartment(dept);
  };

  return (
    <aside className="w-72 h-screen flex flex-col bg-white border-r border-gray-200 shadow-sm flex-shrink-0">
      {/* 로고 영역 */}
      <div className="p-6 border-b border-gray-200 bg-white z-10 sticky top-0">
        <h1 className="text-xl font-extrabold text-gray-900 leading-tight">Incheon National<br/>University</h1>
        <p className="text-xs text-gray-500 mt-1.5 font-semibold tracking-wide">2026-1 Course Dashboard</p>
      </div>

      {/* 스크롤 가능한 메뉴 영역 (커스텀 스크롤바 적용) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-gray-50/50">
        <div className="p-4 space-y-6">
          
          {MENU_DATA.map((menu) => (
            <div key={menu.id} className="w-full">
              {menu.category === '대학전체' ? (
                <button
                  onClick={() => handleSelect(menu.category)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                    selectedDepartment === menu.category
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-purple-200 hover:text-purple-700'
                  }`}
                >
                  {menu.category}
                </button>
              ) : (
                <div className="mt-2">
                  {/* 대분류 (대학/학부) */}
                  <div className="px-3 mb-2 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></span>
                    <h2 className="text-sm font-bold text-gray-800 tracking-wide">
                      {menu.category}
                    </h2>
                  </div>
                  
                  {/* 소속 학과 (모두 펼쳐진 상태 유지) */}
                  <div className="space-y-1 mt-2 pl-3">
                    {menu.departments.map((dept, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelect(dept)}
                        className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all duration-200 flex items-center ${
                          selectedDepartment === dept
                            ? 'bg-purple-100 text-purple-800 font-semibold shadow-sm'
                            : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                        }`}
                      >
                        <span className="w-1 h-1 rounded-full bg-gray-300 mr-3"></span>
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* 커스텀 스크롤바 CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </aside>
  );
}
