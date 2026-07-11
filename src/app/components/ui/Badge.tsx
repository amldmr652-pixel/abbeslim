'use client';

import React from 'react';

interface BadgeProps {
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  green: 'bg-green-500/15 text-green-400 border-green-500/25',
  yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  red: 'bg-red-500/15 text-red-400 border-red-500/25',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  gray: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-3 py-1 text-xs gap-1.5',
};

export default function Badge({
  variant = 'green',
  size = 'md',
  icon,
  children,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
