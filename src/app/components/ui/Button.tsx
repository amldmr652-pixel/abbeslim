'use client';

import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg shadow-green-900/20 hover:shadow-green-800/30',
  secondary:
    'glass px-6 py-2 rounded-full text-gray-300 hover:text-green-400 transition-colors',
  ghost:
    'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 rounded-full',
  danger:
    'bg-red-900/50 hover:bg-red-900/80 text-red-200 border border-red-500/30 rounded-full',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3 text-base gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 cursor-pointer
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
