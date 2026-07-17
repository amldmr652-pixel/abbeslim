'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingClasses: Record<string, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'md',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        glass rounded-3xl
        ${paddingClasses[padding]}
        transition-all duration-300
        ${hover ? 'hover:-translate-y-1 hover:border-green-500/20' : ''}
        ${glow ? 'shadow-lg shadow-green-500/10 hover:shadow-green-500/20' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
