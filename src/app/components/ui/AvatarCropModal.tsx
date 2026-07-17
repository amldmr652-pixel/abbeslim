'use client';

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';
import { Card, Button } from '@/app/components/ui';
import { Camera, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface AvatarCropModalProps {
  imageSrc: string;
  onCrop: (croppedBlob: Blob) => void;
  onClose: () => void;
}

export default function AvatarCropModal({ imageSrc, onCrop, onClose }: AvatarCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = 'anonymous'; // Avoid canvas pollution
    img.onload = () => {
      imageRef.current = img;
      // Reset position and zoom on image load
      setPosition({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      drawCanvas();
    };
  }, [imageSrc]);

  // Redraw canvas whenever zoom, rotation, or position changes
  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [zoom, rotation, position]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300; // Fixed resolution of cropped avatar
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    
    // Move to center of canvas
    ctx.translate(size / 2, size / 2);
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    // Apply zoom & translation
    ctx.translate(position.x, position.y);

    // Calculate dimensions to maintain aspect ratio
    const imgRatio = img.width / img.height;
    let drawWidth = size;
    let drawHeight = size;

    if (imgRatio > 1) {
      drawWidth = size * imgRatio;
    } else {
      drawHeight = size / imgRatio;
    }

    // Scale by zoom
    drawWidth *= zoom;
    drawHeight *= zoom;

    // Draw the image centered
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    ctx.restore();
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    });
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div className="glass w-full max-w-[420px] rounded-[32px] p-6 relative animate-in fade-in zoom-in-95 duration-200 shadow-2xl bg-stone-950/95 border border-green-900/30 flex flex-col items-center">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Camera size={18} className="text-green-500" />
          Fotoğrafı Kırp
        </h3>
        <p className="text-xs text-gray-500 mb-5 text-center">Profil fotoğrafınızın daire içinde nasıl görüneceğini ayarlayın.</p>

        {/* Interactive Workspace */}
        <div 
          className="relative w-[300px] h-[300px] bg-stone-900 border border-white/10 rounded-2xl overflow-hidden cursor-move mb-5 select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Output visual canvas */}
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Dairesel Kırpma Maskesi Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[260px] h-[260px] rounded-full border-[3px] border-green-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        {/* Sliders and Controls */}
        <div className="w-full space-y-4 px-2 mb-6">
          {/* Zoom Control */}
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-gray-500" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-green-500 focus:outline-none"
            />
            <ZoomIn size={16} className="text-gray-500" />
          </div>

          {/* Rotation and Reset Buttons */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Çevir / Çevirme</span>
            <Button
              variant="secondary"
              className="py-1 px-3 flex items-center gap-1.5 text-xs"
              onClick={() => setRotation(r => (r + 90) % 360)}
            >
              <RotateCw size={12} />
              Döndür (90°)
            </Button>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            İptal
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
          >
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}
