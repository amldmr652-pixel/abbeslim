'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  collapsed?: boolean;
  isPalestine?: boolean;
  className?: string;
  showSubtitle?: boolean;
}

export default function Logo({
  collapsed = false,
  isPalestine = false,
  className = '',
  showSubtitle = false,
}: LogoProps) {
  const primaryStroke = isPalestine ? '#009736' : '#4ade80';
  const secondaryStroke = isPalestine ? '#007A2B' : '#22c55e';
  const dotColor = isPalestine ? '#CE1126' : '#22c55e';

  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-3 transition-all duration-300 ${className}`}
      aria-label="abbeslim. Life OS Ana Sayfa"
    >
      {/* Bold Modern Emblem Icon */}
      <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500/10 via-stone-900 to-black border border-green-500/20 shadow-sm shadow-green-500/5 group-hover:border-green-400/50 group-hover:shadow-green-500/20 group-hover:scale-105 transition-all duration-300 shrink-0">

        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 relative z-10"
        >
          {/* Bold Modern Stylized 'A' Arch */}
          <path
            d="M7 23.5L14.6 7.5C15.2 6.2 16.8 6.2 17.4 7.5L25 23.5"
            stroke={primaryStroke}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="miter"
          />
          {/* Connecting Crossbar */}
          <path
            d="M10.5 17H21.5"
            stroke={secondaryStroke}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Text */}
      {!collapsed && (
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline leading-none">
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-green-300 transition-colors">
              abbeslim
            </span>
            <span
              className="text-2xl font-black ml-0.5"
              style={{ color: dotColor }}
            >
              .
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-green-400/90 mt-1">
              LIFE OS
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
