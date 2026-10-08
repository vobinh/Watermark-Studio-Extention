import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WatermarkSettings, ImageInfo } from '../types';
import { drawWatermark } from '../utils/watermarkRenderer';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Move,
  Info,
} from 'lucide-react';

interface PreviewCanvasProps {
  imageInfo: ImageInfo;
  imageElement: HTMLImageElement | null;
  settings: WatermarkSettings;
  onCustomPositionChange: (xPercent: number, yPercent: number) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  imageInfo,
  imageElement,
  settings,
  onCustomPositionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isDraggingPosition, setIsDraggingPosition] = useState<boolean>(false);

  // Redraw canvas whenever settings, image, or showOriginal changes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElement) return;

    canvas.width = imageInfo.width;
    canvas.height = imageInfo.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base image
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    // Draw watermark if not in "show original" mode
    if (!showOriginal && settings.text.trim()) {
      drawWatermark(ctx, canvas.width, canvas.height, settings);
    }
  }, [imageElement, imageInfo, settings, showOriginal]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Handle click or drag on canvas for custom positioning
  const updatePositionFromPointer = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const percentX = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (clickY / rect.height) * 100));

    onCustomPositionChange(Math.round(percentX * 10) / 10, Math.round(percentY * 10) / 10);
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (settings.position === 'tile') return;
    setIsDraggingPosition(true);
    updatePositionFromPointer(e);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingPosition || settings.position === 'tile') return;
    updatePositionFromPointer(e);
  };

  const handlePointerUp = () => {
    setIsDraggingPosition(false);
  };

  // Human readable file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Aspect ratio calculation
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(imageInfo.width, imageInfo.height);
  const aspectW = Math.round(imageInfo.width / divisor);
  const aspectH = Math.round(imageInfo.height / divisor);

  return (
    <div className="flex flex-col h-full bg-slate-900/95 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <button
            id="btn-preview-toggle-original"
            type="button"
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
            className={`px-2.5 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
              showOriginal
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Giữ chuột để xem ảnh gốc trước khi chèn watermark"
          >
            {showOriginal ? (
              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span>{showOriginal ? 'Đang hiện ảnh gốc' : 'Giữ xem ảnh gốc'}</span>
          </button>

          {settings.position !== 'tile' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Move className="w-3 h-3 text-blue-400" />
              Bấm/Kéo trên ảnh để chỉnh vị trí
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button
            id="btn-zoom-out"
            type="button"
            onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
            className="p-1 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-mono text-[11px] text-slate-300 min-w-[42px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            id="btn-zoom-in"
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
            className="p-1 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />
          <button
            id="btn-zoom-fit"
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title="Vừa màn hình"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport (Transparent checkerboard background for transparent PNGs) */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[420px] sm:min-h-[520px] overflow-auto flex items-center justify-center p-4 sm:p-6 bg-[linear-gradient(45deg,#0b0f19_25%,transparent_25%),linear-gradient(-45deg,#0b0f19_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0b0f19_75%),linear-gradient(-45deg,transparent_75%,#0b0f19_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] bg-slate-950 select-none"
        onMouseUp={handlePointerUp}
      >
        <div
          className="relative transition-transform duration-100 ease-out shadow-2xl rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          <canvas
            ref={canvasRef}
            id="watermark-main-canvas"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            className={`max-w-full max-h-[70vh] object-contain rounded-md ${
              settings.position !== 'tile' ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />
        </div>
      </div>

      {/* Bottom Status Info Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate max-w-sm">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate font-medium text-slate-300" title={imageInfo.name}>
            {imageInfo.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>
            {imageInfo.width} × {imageInfo.height} px
            {aspectW <= 21 && aspectH <= 21 && ` (${aspectW}:${aspectH})`}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>{formatSize(imageInfo.sizeBytes)}</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="text-emerald-400 font-semibold">100% Độ nét gốc</span>
        </div>
      </div>
    </div>
  );
};
