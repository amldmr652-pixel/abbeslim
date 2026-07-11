'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  titleIcon,
  children,
  maxWidth = 'max-w-lg',
  showCloseButton = true,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          glass rounded-3xl w-full ${maxWidth}
          transform transition-all duration-300
          animate-[modalIn_0.25s_ease-out]
          p-6
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {titleIcon && (
                <span className="text-green-400">{titleIcon}</span>
              )}
              {title && (
                <h2 className="text-lg font-semibold text-white">{title}</h2>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
