'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlusCircle, Settings, List } from 'lucide-react';

interface Course {
  '교과목명'?: string;
  '담당교수'?: string;
  '시간표(시간)'?: string;
  [key: string]: any;
}

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Course[];
}

const DAYS = ['월', '화', '수', '목', '금', '토'];
const START_HOUR = 7; // 7 AM
const END_HOUR = 22; // 10 PM
const HOUR_HEIGHT = 50; // 1시간당 50px

// 에브리타임 스타일 파스텔톤 팔레트
const COLORS = [
  'bg-[#ffcdd2] text-[#5c3a3a]', // pink
  'bg-[#fff59d] text-[#5c5029]', // yellow
  'bg-[#ffe0b2] text-[#634830]', // orange
  'bg-[#c8e6c9] text-[#385239]', // green
  'bg-[#b2dfdb] text-[#305450]', // mint
  'bg-[#d1c4e9] text-[#3e3b45]', // purple
  'bg-[#bbdefb] text-[#324559]', // blue
];

export default function TimetableModal({ isOpen, onClose, cart }: TimetableModalProps) {
  
  // 장바구니 데이터를 파싱하여 시간표 블록으로 변환
  const blocks = useMemo(() => {
    const result: any[] = [];
    
    cart.forEach((course, index) => {
      const courseName = course['교과목명'] || '';
      if (courseName.includes('현장교육실습')) return; // 현장교육실습 과목은 시간표에서 제외

      const timeStr = course['시간표(시간)'];
      if (!timeStr) return; // 시간표 정보가 없는 경우 패스

      const colorClass = COLORS[index % COLORS.length];

      // 대괄호 [...] 로 감싸진 블록들을 모두 추출
      let rawBlocks: string[] = [];
      const bracketMatches = Array.from(timeStr.matchAll(/\[([^\]]+)\]/g));
      if (bracketMatches.length > 0) {
        rawBlocks = bracketMatches.map(m => m[1]);
      } else {
        // 대괄호가 없는 경우 (예: "월(10:00~11:50)"), 쉼표로 분할하여 처리
        rawBlocks = timeStr.split(',').map(s => s.trim()).filter(s => s);
      }

      rawBlocks.forEach((blockStr, blockIdx) => {
        let place = '';
        let timeContent = '';

        // 콜론(:)이 있으면 앞부분은 장소, 뒷부분은 시간표
        if (blockStr.includes(':')) {
          const colonIdx = blockStr.indexOf(':');
          place = blockStr.substring(0, colonIdx).trim();
          timeContent = blockStr.substring(colonIdx + 1).trim();
        } else {
          timeContent = blockStr.trim();
        }

        // 시간표 내용에 콤마가 있으면 여러 요일/시간 세그먼트로 분할
        const timeSegments = timeContent.split(',').map(s => s.trim()).filter(s => s);

        timeSegments.forEach((segment, segIdx) => {
          // 요일 문자(들) 추출 (예: "수", "월수")
          const dayMatch = segment.match(/^([월화수목금토일]+)/);
          if (!dayMatch) return;

          const days = dayMatch[1].split('');

          // 시간 범위 추출 (예: 09:00~09:50, 9:00~9:50)
          const timeRanges = Array.from(segment.matchAll(/(\d{1,2}:\d{2})~(\d{1,2}:\d{2})/g)).map(m => ({
            start: m[1],
            end: m[2]
          }));

          if (timeRanges.length === 0) return;

          // 각 요일별로 블록 생성 (연속된 시간대는 하나로 병합)
          days.forEach(day => {
            const mergedRanges: { start: string; end: string }[] = [];
            if (timeRanges.length > 0) {
              let current = { ...timeRanges[0] };
              for (let i = 1; i < timeRanges.length; i++) {
                const [currEndH, currEndM] = current.end.split(':').map(Number);
                const [nextStartH, nextStartM] = timeRanges[i].start.split(':').map(Number);
                const currEndTotal = currEndH * 60 + currEndM;
                const nextStartTotal = nextStartH * 60 + nextStartM;
                // 15분 이내 간격이면 연속으로 병합 (휴식시간 고려)
                if (nextStartTotal - currEndTotal <= 15) {
                  current.end = timeRanges[i].end;
                } else {
                  mergedRanges.push(current);
                  current = { ...timeRanges[i] };
                }
              }
              mergedRanges.push(current);
            }

            mergedRanges.forEach(({ start, end }, rangeIdx) => {
              const [startH, startM] = start.split(':').map(Number);
              const [endH, endM] = end.split(':').map(Number);

              const startTotalMin = startH * 60 + startM;
              const endTotalMin = endH * 60 + endM;
              const baseMin = START_HOUR * 60;
              const endLimit = END_HOUR * 60;

              // 그리드 범위 밖이면 클리핑 처리 (아예 버리지 않고 잘라서 표시)
              const clippedStart = Math.max(startTotalMin, baseMin);
              const clippedEnd = Math.min(endTotalMin, endLimit);

              if (clippedStart >= clippedEnd) return;

              const topPx = ((clippedStart - baseMin) / 60) * HOUR_HEIGHT;
              const heightPx = ((clippedEnd - clippedStart) / 60) * HOUR_HEIGHT;

              result.push({
                id: `${course['교과목명']}-${day}-${start}-${end}-${index}-${blockIdx}-${segIdx}-${rangeIdx}`,
                day,
                title: course['교과목명'],
                professor: course['담당교수'],
                room: place,
                startTime: start,
                endTime: end,
                topPx,
                heightPx,
                colorClass
              });
            });
          });
        });
      });
    });
    return result;
  }, [cart]);

  if (!isOpen) return null;

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[2rem] sm:max-w-[760px] flex flex-col overflow-hidden relative"
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors bg-white/50 backdrop-blur"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Header - Everytime Style */}
          <div className="flex justify-between items-end p-5 pb-4 bg-white relative z-10">
            <div>
              <div className="text-[12px] font-medium text-[#c62917] mb-0.5">2026년 1학기</div>
              <h2 className="text-[26px] font-extrabold text-[#292929] leading-none tracking-tight">시간표 1</h2>
            </div>
          </div>

          {/* Body - Timetable Grid */}
          <div className="flex-1 overflow-y-auto bg-white px-4 pb-6 scrollbar-thin">
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div className="min-w-[600px] border border-[#f0e6e6] rounded-xl overflow-hidden flex bg-white relative">
                
                {/* 시간축 (Y-axis) */}
                <div className="w-[32px] border-r border-[#f0e6e6] flex-shrink-0 relative bg-white">
                  <div className="h-8 border-b border-[#f0e6e6] sticky top-0 bg-white z-20"></div>
                  {hours.map((hour) => (
                    <div key={hour} className="relative border-b border-[#f0e6e6]" style={{ height: `${HOUR_HEIGHT}px` }}>
                      <span className="absolute top-0 right-1 text-[11px] font-medium text-[#c62917]/70 mt-[2px]">
                        {hour > 12 ? hour - 12 : hour}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 요일축 (X-axis) 및 그리드 영역 */}
                <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${DAYS.length}, minmax(0, 1fr))` }}>
                  {/* 헤더 */}
                  {DAYS.map((day, i) => (
                    <div 
                      key={day} 
                      className={`h-8 border-b border-[#f0e6e6] flex items-center justify-center text-[12px] font-medium text-[#c62917]/80 bg-[#fdfbfb] sticky top-0 z-20 ${i !== 0 ? 'border-l border-[#f0e6e6]' : ''}`}
                    >
                      {day}
                    </div>
                  ))}

                  {/* 그리드 선 및 블록들 */}
                  <div 
                    className="relative bg-[#fdfbfb]" 
                    style={{ 
                      gridColumn: `span ${DAYS.length} / span ${DAYS.length}`, 
                      height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` 
                    }}
                  >
                    {/* 가로선 (시간) */}
                    {hours.map((_, i) => (
                      <div key={`h-${i}`} className="absolute w-full border-t border-[#f0e6e6] pointer-events-none" style={{ top: `${(i+1) * HOUR_HEIGHT}px` }} />
                    ))}
                    
                    {/* 세로 구분선 (요일) */}
                    {DAYS.map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute h-full border-r border-[#f0e6e6] pointer-events-none" 
                        style={{ left: `${(100 / DAYS.length) * (i + 1)}%` }} 
                      />
                    ))}

                    {/* 강좌 블록 렌더링 */}
                    {blocks.map(block => {
                      const colIndex = DAYS.indexOf(block.day);
                      if (colIndex === -1) return null;

                      const dayPercentage = 100 / DAYS.length;

                      return (
                        <div
                          key={block.id}
                          className="absolute left-0 p-[1px] transition-all hover:z-10"
                          style={{
                            top: `${block.topPx}px`,
                            height: `${block.heightPx}px`,
                            left: `${dayPercentage * colIndex}%`,
                            width: `${dayPercentage}%`
                          }}
                        >
                          <div className={`h-full w-full p-1.5 overflow-hidden leading-[1.15] rounded-md shadow-sm border border-black/5 ${block.colorClass}`}>
                            <div className="font-semibold text-[11px] break-keep">{block.title}</div>
                            {block.room && (
                              <div className="text-[10px] mt-0.5 opacity-90 break-keep font-medium">
                                {block.room}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
