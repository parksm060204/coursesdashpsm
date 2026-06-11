import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  selectedDepartment: string;
}

export default function Breadcrumb({ selectedDepartment }: BreadcrumbProps) {
  const isAll = selectedDepartment === '대학전체';

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6 font-medium">
      <div className="flex items-center text-gray-500 hover:text-purple-600 transition-colors cursor-pointer">
        <Home className="w-4 h-4 mr-1.5" />
        <span>Home</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
      <span className="text-gray-900 bg-purple-50 px-2.5 py-1 rounded-md text-purple-700">
        {isAll ? '전체 대시보드' : selectedDepartment}
      </span>
    </nav>
  );
}
