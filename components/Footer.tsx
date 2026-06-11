import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function Footer() {
  const links = [
    { name: '인천대학교 홈페이지', url: 'https://www.inu.ac.kr' },
    { name: 'INU 포털', url: 'https://portal.inu.ac.kr' },
    { name: '이러닝', url: 'https://cyber.inu.ac.kr' }
  ];

  return (
    <footer className="mt-12 py-6 px-8 border-t border-gray-200 bg-white rounded-xl shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* 외부 링크 영역 */}
        <div className="flex flex-wrap gap-6 items-center justify-center md:justify-start">
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-700 transition-colors"
            >
              <span>{link.name}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ))}
        </div>
        
        {/* 카피라이트 및 제작자 영역 */}
        <div className="flex flex-col items-center md:items-end text-xs text-gray-400 gap-1 mt-4 md:mt-0">
          <span>© 2026 Incheon National University. All rights reserved.</span>
          <span className="font-semibold text-gray-500">제작자: [202500620 박성민]</span>
        </div>
      </div>
    </footer>
  );
}
