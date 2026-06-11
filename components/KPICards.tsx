'use client';

import React from 'react';
import { BookOpen, Users, Percent, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CourseData {
  capacity: string | number;
  enrolled: string | number;
  foreign_lang: string;
  // 필요에 따라 다른 필드들을 추가할 수 있습니다.
  [key: string]: any;
}

interface KPICardsProps {
  courses?: CourseData[];
  isLoading?: boolean;
}

export default function KPICards({ courses, isLoading = false }: KPICardsProps) {
  // 데이터가 없거나 로딩 중일 때 표시할 스켈레톤 UI
  if (isLoading || !courses) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse flex justify-between items-start">
            <div className="space-y-3">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-8 w-24 bg-gray-300 rounded"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  // 1. 총 강좌수
  const totalCourses = courses.length;

  // 총 정원, 총 수강인원, 원어강의 수 계산
  let totalCapacity = 0;
  let totalEnrolled = 0;
  let foreignLangCount = 0;

  courses.forEach((course) => {
    // 실제 DB 컬럼명: '정원', '수강', '원어강의'
    const capacity = parseInt(String(course['정원'] ?? course.capacity), 10) || 0;
    const enrolled = parseInt(String(course['수강'] ?? course.enrolled), 10) || 0;

    totalCapacity += capacity;
    totalEnrolled += enrolled;

    // 원어강의 여부 체크 (Y 또는 y)
    const foreignLang = String(course['원어강의'] ?? course.foreign_lang ?? '');
    if (foreignLang.toUpperCase() === 'Y') {
      foreignLangCount++;
    }
  });

  // 2. 총 수강인원 (위에서 계산 완료)

  // 3. 평균 수강률 (%) 계산 - 분모가 0일 경우의 예외 처리
  const avgEnrollmentRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;
  const formattedAvgEnrollmentRate = avgEnrollmentRate.toFixed(1);

  // 4. 원어 강의 비율 (%) 계산
  const foreignLangRate = totalCourses > 0 ? (foreignLangCount / totalCourses) * 100 : 0;
  const formattedForeignLangRate = foreignLangRate.toFixed(1);

  const kpis = [
    {
      title: '총 강좌수',
      value: `${totalCourses.toLocaleString()}개`,
      icon: <BookOpen className="w-6 h-6 text-purple-600" />,
      bgColor: 'bg-purple-100',
    },
    {
      title: '총 수강인원',
      value: `${totalEnrolled.toLocaleString()}명`,
      icon: <Users className="w-6 h-6 text-blue-600" />,
      bgColor: 'bg-blue-100',
    },
    {
      title: '평균 수강률',
      value: `${formattedAvgEnrollmentRate}%`,
      icon: <Percent className="w-6 h-6 text-green-600" />,
      bgColor: 'bg-green-100',
    },
    {
      title: '원어 강의 비율',
      value: `${formattedForeignLangRate}%`,
      icon: <Globe className="w-6 h-6 text-orange-600" />,
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => (
        <motion.div 
          key={index} 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
          className="bg-white p-6 rounded-xl shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-gray-100"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">{kpi.title}</p>
              <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{kpi.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${kpi.bgColor} shadow-sm`}>
              {kpi.icon}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
