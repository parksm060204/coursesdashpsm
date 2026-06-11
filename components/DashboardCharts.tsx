'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion } from 'framer-motion';

interface Course {
  '이수구분'?: string;
  '수업방법'?: string;
  '학점'?: string | number;
  '시간표(시간)'?: string;
  '수강'?: string | number;
  '정원'?: string | number;
  [key: string]: any;
}

interface DashboardChartsProps {
  courses?: Course[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function DashboardCharts({ courses = [] }: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    // 1. 이수구분별 강좌수
    const typeCountMap: Record<string, number> = {};
    // 2. 이수구분별 평균 수강인원
    const typeEnrolledMap: Record<string, { total: number; count: number }> = {};
    // 3. 수업방법 유형 분포
    const methodCountMap: Record<string, number> = {};
    // 4. 학점 구성 비율
    const creditCountMap: Record<string, number> = {};
    // 5. 요일별 강좌수
    const dayCountMap: Record<string, number> = { '월': 0, '화': 0, '수': 0, '목': 0, '금': 0, '토': 0, '일': 0 };
    // 6. 수업 시간별 강좌 수
    const timeCountMap: Record<string, number> = {};

    courses.forEach(course => {
      // 이수구분
      const type = course['이수구분'] || '기타';
      typeCountMap[type] = (typeCountMap[type] || 0) + 1;

      // 수강인원
      const enrolled = parseInt(String(course['수강']), 10) || 0;
      if (!typeEnrolledMap[type]) {
        typeEnrolledMap[type] = { total: 0, count: 0 };
      }
      typeEnrolledMap[type].total += enrolled;
      typeEnrolledMap[type].count += 1;

      // 수업방법
      let method = course['수업방법'] || '대면수업';
      if (method === '미상') {
        method = '대면수업';
      }
      methodCountMap[method] = (methodCountMap[method] || 0) + 1;

      // 학점
      const credit = String(course['학점']) || '0';
      const creditLabel = `${credit}학점`;
      creditCountMap[creditLabel] = (creditCountMap[creditLabel] || 0) + 1;

      // 시간표 파싱
      const courseName = course['교과목명'] || '';
      const timeStr = courseName.includes('현장교육실습') ? '' : (course['시간표(시간)'] || '');
      if (timeStr) {
        // 요일 카운트
        ['월', '화', '수', '목', '금', '토', '일'].forEach(day => {
          if (timeStr.includes(day)) {
            dayCountMap[day]++;
          }
        });

        // 시간대 파싱 ("~" 앞의 시간을 시작 시간으로 간주)
        const startTimes = new Set<string>();
        const starts = timeStr.match(/(\d{2}:\d{2})(?=~)/g);
        if (starts) {
          starts.forEach(t => startTimes.add(t));
        }
        
        startTimes.forEach(t => {
          // HH:00 형태로 시간 단위 정규화
          const hourPrefix = t.substring(0, 2) + ':00';
          timeCountMap[hourPrefix] = (timeCountMap[hourPrefix] || 0) + 1;
        });
      }
    });

    // 데이터를 Recharts 배열 포맷으로 변환
    const typeCountData = Object.keys(typeCountMap).map(key => ({ name: key, count: typeCountMap[key] })).sort((a, b) => b.count - a.count);
    const typeAvgEnrolledData = Object.keys(typeEnrolledMap).map(key => ({
      name: key,
      avg: Number((typeEnrolledMap[key].total / typeEnrolledMap[key].count).toFixed(1))
    })).sort((a, b) => b.avg - a.avg);
    const methodData = Object.keys(methodCountMap).map(key => ({ name: key, value: methodCountMap[key] }));
    const creditData = Object.keys(creditCountMap).map(key => ({ name: key, value: creditCountMap[key] }));
    
    // 요일 데이터 포맷팅
    const dayData = Object.keys(dayCountMap).map(key => ({ name: key, count: dayCountMap[key] }));
    
    // 시간 데이터 정렬 포맷팅
    const sortedTimes = Object.keys(timeCountMap).sort();
    const timeData = sortedTimes.map(key => ({ name: key, count: timeCountMap[key] }));

    return { typeCountData, typeAvgEnrolledData, methodData, creditData, dayData, timeData };
  }, [courses]);

  if (!isMounted || !courses || courses.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">📊 시각화 분석 차트 (Part 1 & 2)</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. 이수구분별 강좌수 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
        >
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>●</span> 이수구분별 강좌수
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={chartData.typeCountData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="goldGrad1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#fef08a" />
                  </linearGradient>
                  <linearGradient id="purpleGrad1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c7d2fe" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: '#4b5563', fontWeight: 600}} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Bar dataKey="count" radius={[0, 9999, 9999, 0]} barSize={16} name="강좌 수">
                  {chartData.typeCountData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#goldGrad1)' : 'url(#purpleGrad1)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 2. 이수구분별 평균 수강인원 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
        >
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>●</span> 이수구분별 평균 수강인원
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={chartData.typeAvgEnrolledData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#fef08a" />
                  </linearGradient>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c7d2fe" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: '#4b5563', fontWeight: 600}} tickLine={false} axisLine={false} width={80} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Bar dataKey="avg" radius={[0, 9999, 9999, 0]} barSize={16} name="평균 수강인원(명)">
                  {chartData.typeAvgEnrolledData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#goldGrad)' : 'url(#purpleGrad)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 3. 수업방법 유형 분포 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
          className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-gray-500 mb-4">수업방법 유형 분포</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie
                  data={chartData.methodData}
                  cx="50%" cy="45%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={({ percent }) => percent !== undefined && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                >
                  {chartData.methodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value}개`, '강좌 수']}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 4. 학점 구성 비율 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
          className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-gray-500 mb-4">학점 구성 비율</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie
                  data={chartData.creditData}
                  cx="50%" cy="45%"
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                  label={({ percent }) => percent !== undefined && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                >
                  {chartData.creditData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value}개`, '강좌 수']}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 5. 요일별 수업 강좌 수 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
          className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-gray-500 mb-4">요일별 수업 강좌 수</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={chartData.dayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={{stroke: '#d1d5db'}} />
                <YAxis tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="강좌 수" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 6. 수업 시간별 강좌 수 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6, ease: 'easeOut' }}
          className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
        >
          <h3 className="text-sm font-semibold text-gray-500 mb-4">수업 시간대별 시작 강좌 수</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={chartData.timeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={{stroke: '#d1d5db'}} />
                <YAxis tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} name="시작 강좌 수" dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
