import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WatermarkSettings, ImageInfo, ViewMode, Language } from '../types';
import { drawWatermark } from '../utils/watermarkRenderer';
import { useTranslation } from '../utils/i18n';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Move,
  Info,
  Image as ImageIcon,
} from 'lucide-react';

interface PreviewCanvasProps {
  imageInfo: ImageInfo;
  imageElement: HTMLImageElement | null;
  logoElement?: HTMLImageElement | null;
  settings: WatermarkSettings;
  mode: ViewMode;
  lang: Language;
  onCustomPositionChange: (xPercent: number, yPercent: number) => void;
  onChangeImage?: () => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  imageInfo,
  imageElement,
  logoElement,
  settings,
  mode,
  lang,
  onCustomPositionChange,
  onChangeImage,
}) => {
  const { t } = useTranslation(lang);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isDraggingPosition, setIsDraggingPosition] = useState<boolean>(false);

  // Redraw canvas whenever settings, image, logoElement, or showOriginal changes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElement) return;

    canvas.width = imageInfo.width;
    canvas.height = imageInfo.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    if (!showOriginal) {
      drawWatermark(ctx, canvas.width, canvas.height, settings, logoElement);
    }
  }, [imageElement, imageInfo, settings, showOriginal, logoElement]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Pointer position for custom positioning
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

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(imageInfo.width, imageInfo.height);
  const aspectW = Math.round(imageInfo.width / divisor);
  const aspectH = Math.round(imageInfo.height / divisor);

  return (
    <div className="flex flex-col h-full bg-slate-900/95 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onChangeImage && (
            <button
              id="btn-preview-change-image"
              type="button"
              onClick={onChangeImage}
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 text-[11px] sm:text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-blue-300 shadow-2xs"
              title={t('changeImageBtn')}
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('changeImageBtn')}</span>
            </button>
          )}

          <button
            id="btn-preview-toggle-original"
            type="button"
            onMouseDown={() => setShowOriginal(true)}
            onMouseUp={() => setShowOriginal(false)}
            onMouseLeave={() => setShowOriginal(false)}
            onTouchStart={() => setShowOriginal(true)}
            onTouchEnd={() => setShowOriginal(false)}
            className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 text-[11px] sm:text-xs ${
              showOriginal
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={t('holdToViewOriginalHint')}
          >
            {showOriginal ? (
              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span>{showOriginal ? t('viewingOriginalBtn') : t('viewOriginalBtn')}</span>
          </button>

          {settings.position !== 'tile' && mode === 'fulltab' && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Move className="w-3 h-3 text-blue-400" />
              {t('dragToPositionHint')}
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 sm:p-1 rounded-lg border border-slate-700/60">
          <button
            id="btn-zoom-out"
            type="button"
            onClick={() => setZoomLevel((prev) => Math.max(0.4, prev - 0.2))}
            className="p-1 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title={t('zoomOut')}
          >
            <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <span className="px-1 font-mono text-[10px] sm:text-[11px] text-slate-300 min-w-[36px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            id="btn-zoom-in"
            type="button"
            onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.2))}
            className="p-1 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title={t('zoomIn')}
          >
            <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-slate-700 mx-0.5" />
          <button
            id="btn-zoom-fit"
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1 hover:bg-slate-700 text-slate-300 rounded transition-colors"
            title={t('zoomFit')}
          >
            <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className={`relative flex-1 ${
          mode === 'sidepanel' ? 'min-h-[260px] max-h-[380px]' : 'min-h-[420px] sm:min-h-[520px]'
        } overflow-auto flex items-center justify-center p-3 sm:p-6 bg-[linear-gradient(45deg,#0b0f19_25%,transparent_25%),linear-gradient(-45deg,#0b0f19_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0b0f19_75%),linear-gradient(-45deg,transparent_75%,#0b0f19_75%)] bg-[size:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] bg-slate-950 select-none`}
        onMouseUp={handlePointerUp}
      >
        <div
          className="relative transition-transform duration-75 ease-out shadow-2xl rounded-lg overflow-hidden flex items-center justify-center max-w-full"
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
            className={`max-w-full ${
              mode === 'sidepanel' ? 'max-h-[340px]' : 'max-h-[70vh]'
            } object-contain rounded-md ${
              settings.position !== 'tile' ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />
        </div>
      </div>

      {/* Bottom Status Info Bar */}
      <div className="px-3 sm:px-4 py-2 bg-slate-900 border-t border-slate-800 text-[10px] sm:text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs">
          <Info className="w-3 h-3 text-blue-400 shrink-0" />
          <span className="truncate font-medium text-slate-300" title={imageInfo.name}>
            {imageInfo.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            {imageInfo.width}×{imageInfo.height}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>{formatSize(imageInfo.sizeBytes)}</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span className="text-emerald-400 font-medium">{t('crispBadge')}</span>
        </div>
      </div>
    </div>
  );
};
