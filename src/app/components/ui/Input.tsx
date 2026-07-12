'use client';

import React from 'react';

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  className = '',
  disabled = false,
}: InputProps) {
  const id = label
    ? `input-${label.toLowerCase().replace(/\s+/g, '-')}`
    : undefined;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-300"
        >
          {label}
          {required && <span className="text-green-400 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-2xl
          bg-white/5 border border-white/10
          text-white placeholder-gray-500
          outline-none
          focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
    </div>
  );
}
