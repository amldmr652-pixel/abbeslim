'use client';

import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const positionClasses: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export default function Tooltip({
  content,
  children,
  position = 'top',
}: TooltipProps) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={`
          absolute ${positionClasses[position]}
          px-3 py-1.5 rounded-xl
          bg-gray-900 border border-white/10
          text-xs text-gray-200 whitespace-nowrap
          opacity-0 invisible
          group-hover:opacity-100 group-hover:visible
          transition-all duration-200
          pointer-events-none z-50
        `}
      >
        {content}
      </div>
    </div>
  );
}
