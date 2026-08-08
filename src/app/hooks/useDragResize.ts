'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseDragResizeOptions {
  minWidth?: number;
  minHeight?: number;
  storageKey?: string;
  defaultWidth?: number;
  defaultHeight?: number;
}

export function useDragResize(options: UseDragResizeOptions = {}) {
  const {
    minWidth = 360,
    minHeight = 400,
    storageKey = 'lifeos-chat-panel-geometry',
    defaultWidth = 400,
    defaultHeight = 650,
  } = options;

  const [geometry, setGeometry] = useState<Geometry>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Geometri verisi okunamadı:', e);
      }
    }

    // Varsayılan konum: Ekranın sağ tarafına yakın
    const initialWidth = defaultWidth;
    const initialHeight = defaultHeight;
    const initialX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth - initialWidth - 140) : 100;
    const initialY = typeof window !== 'undefined' ? Math.max(20, (window.innerHeight - initialHeight) / 2) : 50;

    return {
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: initialHeight,
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const resizeStartRef = useRef<{ startX: number; startY: number; initialWidth: number; initialHeight: number }>({
    startX: 0,
    startY: 0,
    initialWidth: 0,
    initialHeight: 0,
  });

  // Ekran boyutu değiştiğinde sınırlar içinde kalmasını sağla
  useEffect(() => {
    const handleResize = () => {
      setGeometry((prev) => {
        const maxX = Math.max(0, window.innerWidth - prev.width);
        const maxY = Math.max(0, window.innerHeight - prev.height);
        const newX = Math.min(Math.max(10, prev.x), maxX);
        const newY = Math.min(Math.max(10, prev.y), maxY);
        if (newX !== prev.x || newY !== prev.y) {
          return { ...prev, x: newX, y: newY };
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Geometri değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(geometry));
      } catch (e) {
        console.warn('Geometri kaydedilemedi:', e);
      }
    }
  }, [geometry, storageKey]);

  // Sürükleme Başlatma
  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    // Buton veya input tıklamalarında drag başlatma
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('a')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: geometry.x,
      initialY: geometry.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [geometry.x, geometry.y]);

  // Sürükleme / Boyutlandırma esnasında Pointer Move
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;

      const maxX = Math.max(0, window.innerWidth - geometry.width - 10);
      const maxY = Math.max(0, window.innerHeight - geometry.height - 10);

      const newX = Math.min(Math.max(10, dragStartRef.current.initialX + deltaX), maxX);
      const newY = Math.min(Math.max(10, dragStartRef.current.initialY + deltaY), maxY);

      setGeometry((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStartRef.current.startX;
      const deltaY = e.clientY - resizeStartRef.current.startY;

      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.9;

      const newWidth = Math.min(Math.max(minWidth, resizeStartRef.current.initialWidth + deltaX), maxWidth);
      const newHeight = Math.min(Math.max(minHeight, resizeStartRef.current.initialHeight + deltaY), maxHeight);

      setGeometry((prev) => ({ ...prev, width: newWidth, height: newHeight }));
    }
  }, [isDragging, isResizing, geometry.width, geometry.height, minWidth, minHeight]);

  // Pointer Up (Bitiş)
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isResizing, handlePointerMove, handlePointerUp]);

  // Boyutlandırma Başlatma
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: geometry.width,
      initialHeight: geometry.height,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [geometry.width, geometry.height]);

  // Geometri Sıfırlama
  const resetGeometry = useCallback(() => {
    const initialWidth = defaultWidth;
    const initialHeight = defaultHeight;
    const initialX = Math.max(20, window.innerWidth - initialWidth - 140);
    const initialY = Math.max(20, (window.innerHeight - initialHeight) / 2);

    const defaultGeom = {
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: initialHeight,
    };
    setGeometry(defaultGeom);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('LocalStorage temizlenemedi:', e);
    }
  }, [defaultWidth, defaultHeight, storageKey]);

  return {
    geometry,
    isDragging,
    isResizing,
    dragHandleProps: {
      onPointerDown: handleDragPointerDown,
    },
    resizeHandleProps: {
      onPointerDown: handleResizePointerDown,
    },
    resetGeometry,
  };
}
