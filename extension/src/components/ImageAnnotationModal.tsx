import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AnnotationTool,
  AnnotationItem,
  renderAnnotationItem,
  drawSelectionBox,
  flattenAnnotations,
} from '../utils/annotationEngine';
import { Language, ImageInfo } from '../types';
import { useTranslation } from '../utils/i18n';
import {
  X,
  Check,
  Undo2,
  Redo2,
  Trash2,
  MousePointer,
  ArrowUpRight,
  Square,
  Circle,
  Minus,
  PenTool,
  Highlighter,
  Type,
  ListOrdered,
  EyeOff,
  RotateCw,
  FlipHorizontal2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Palette,
} from 'lucide-react';

interface ImageAnnotationModalProps {
  imageInfo: ImageInfo;
  imageElement: HTMLImageElement;
  lang: Language;
  onApply: (dataUrl: string, width: number, height: number) => void;
  onClose: () => void;
}

const COLOR_PALETTE = [
  { name: 'Đỏ', value: '#ef4444' },
  { name: 'Cam', value: '#f97316' },
  { name: 'Vàng', value: '#eab308' },
  { name: 'Xanh lá', value: '#22c55e' },
  { name: 'Xanh dương', value: '#3b82f6' },
  { name: 'Tím', value: '#a855f7' },
  { name: 'Trắng', value: '#ffffff' },
  { name: 'Đen', value: '#0f172a' },
];

export const ImageAnnotationModal: React.FC<ImageAnnotationModalProps> = ({
  imageInfo,
  imageElement,
  lang,
  onApply,
  onClose,
}) => {
  const { t } = useTranslation(lang);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tools & Properties
  const [activeTool, setActiveTool] = useState<AnnotationTool>('arrow');
  const [activeColor, setActiveColor] = useState<string>('#ef4444');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState<number>(4);
  const [fillShape, setFillShape] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>('Ghi chú quan trọng');

  // Step counter for step badges ① ② ③
  const [nextStepNumber, setNextStepNumber] = useState<number>(1);

  // Transforms
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Annotations list & history
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [undoStack, setUndoStack] = useState<AnnotationItem[][]>([]);
  const [redoStack, setRedoStack] = useState<AnnotationItem[][]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Interaction State
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [tempItem, setTempItem] = useState<AnnotationItem | null>(null);

  // Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Calculate stage dimensions based on rotation
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const stageWidth = isRotated90or270 ? imageInfo.height : imageInfo.width;
  const stageHeight = isRotated90or270 ? imageInfo.width : imageInfo.height;

  // Push to history for undo
  const pushHistory = (newAnnotations: AnnotationItem[]) => {
    setUndoStack((prev) => [...prev, annotations]);
    setRedoStack([]);
    setAnnotations(newAnnotations);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, annotations]);
    setAnnotations(previous);
    setSelectedId(null);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, annotations]);
    setAnnotations(next);
    setSelectedId(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    pushHistory(annotations.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  };

  const handleClearAll = () => {
    if (annotations.length === 0) return;
    pushHistory([]);
    setSelectedId(null);
  };

  // Convert mouse event coordinates to stage coordinates
  const getStageCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.round(clientX * scaleX),
      y: Math.round(clientY * scaleY),
    };
  };

  // Check if click hits an existing item
  const findItemAt = (x: number, y: number): AnnotationItem | null => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const item = annotations[i];
      const pad = 12;

      if (item.tool === 'arrow' || item.tool === 'line') {
        const endX = item.endX ?? item.x + (item.width ?? 60);
        const endY = item.endY ?? item.y + (item.height ?? 60);
        const minX = Math.min(item.x, endX) - pad;
        const maxX = Math.max(item.x, endX) + pad;
        const minY = Math.min(item.y, endY) - pad;
        const maxY = Math.max(item.y, endY) + pad;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) return item;
      } else if (item.tool === 'rect' || item.tool === 'circle' || item.tool === 'blur') {
        const w = item.width ?? 0;
        const h = item.height ?? 0;
        const minX = Math.min(item.x, item.x + w) - pad;
        const maxX = Math.max(item.x, item.x + w) + pad;
        const minY = Math.min(item.y, item.y + h) - pad;
        const maxY = Math.max(item.y, item.y + h) + pad;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) return item;
      } else if (item.tool === 'badge') {
        const r = Math.max(14, item.strokeWidth * 3) + pad;
        const dist = Math.hypot(x - item.x, y - item.y);
        if (dist <= r) return item;
      } else if (item.tool === 'text') {
        const w = (item.text?.length || 5) * (item.fontSize || 22) * 0.7;
        const h = (item.fontSize || 22) * 1.5;
        if (x >= item.x - pad && x <= item.x + w + pad && y >= item.y - h - pad && y <= item.y + pad) {
          return item;
        }
      } else if (item.tool === 'pen' || item.tool === 'highlighter') {
        if (item.points) {
          for (const pt of item.points) {
            if (Math.hypot(x - pt.x, y - pt.y) <= pad * 1.5) return item;
          }
        }
      }
    }
    return null;
  };

  // Redraw complete canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElement) return;

    canvas.width = stageWidth;
    canvas.height = stageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw transformed base image
    ctx.save();
    ctx.translate(stageWidth / 2, stageHeight / 2);
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(
      imageElement,
      -imageInfo.width / 2,
      -imageInfo.height / 2,
      imageInfo.width,
      imageInfo.height
    );
    ctx.restore();

    // 2. Render committed annotations
    annotations.forEach((item) => {
      renderAnnotationItem(ctx, item, imageElement);
    });

    // 3. Render in-progress temporary item
    if (tempItem) {
      renderAnnotationItem(ctx, tempItem, imageElement);
    }

    // 4. Render active selection outline & handles
    if (selectedId && !tempItem) {
      const selectedItem = annotations.find((a) => a.id === selectedId);
      if (selectedItem) {
        drawSelectionBox(ctx, selectedItem);
      }
    }
  }, [
    imageElement,
    imageInfo,
    stageWidth,
    stageHeight,
    rotation,
    flipH,
    flipV,
    annotations,
    tempItem,
    selectedId,
  ]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !(e.target instanceof HTMLInputElement)) {
          e.preventDefault();
          handleDeleteSelected();
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, undoStack, redoStack, annotations]);

  // Pointer Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getStageCoordinates(e);

    // If Select tool: check hit
    if (activeTool === 'select') {
      const hit = findItemAt(pt.x, pt.y);
      if (hit) {
        setSelectedId(hit.id);
        setIsDragging(true);
        setDragStartPoint(pt);
      } else {
        setSelectedId(null);
      }
      return;
    }

    // If Step Badge tool: Click to place numbered badge immediately!
    if (activeTool === 'badge') {
      const newBadge: AnnotationItem = {
        id: `badge-${Date.now()}`,
        tool: 'badge',
        x: pt.x,
        y: pt.y,
        color: activeColor,
        strokeWidth: activeStrokeWidth,
        stepNumber: nextStepNumber,
      };
      setNextStepNumber((prev) => prev + 1);
      pushHistory([...annotations, newBadge]);
      setSelectedId(newBadge.id);
      setActiveTool('select');
      return;
    }

    // If Text Note tool: Click to place text annotation!
    if (activeTool === 'text') {
      const newText: AnnotationItem = {
        id: `text-${Date.now()}`,
        tool: 'text',
        x: pt.x,
        y: pt.y,
        text: textInput.trim() || 'Ghi chú',
        color: activeColor,
        strokeWidth: activeStrokeWidth,
        fontSize: Math.max(18, activeStrokeWidth * 5),
      };
      pushHistory([...annotations, newText]);
      setSelectedId(newText.id);
      setActiveTool('select');
      return;
    }

    // Drawing shape tools (arrow, rect, circle, line, pen, highlighter, blur)
    setIsDrawing(true);
    setSelectedId(null);

    const initialItem: AnnotationItem = {
      id: `item-${Date.now()}`,
      tool: activeTool,
      color: activeColor,
      strokeWidth: activeStrokeWidth,
      filled: fillShape,
      x: pt.x,
      y: pt.y,
      endX: pt.x,
      endY: pt.y,
      width: 0,
      height: 0,
      points: [pt],
    };

    setTempItem(initialItem);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getStageCoordinates(e);

    // Dragging selected item
    if (isDragging && selectedId && dragStartPoint) {
      const dx = pt.x - dragStartPoint.x;
      const dy = pt.y - dragStartPoint.y;

      setAnnotations((prev) =>
        prev.map((item) => {
          if (item.id !== selectedId) return item;
          if (item.tool === 'pen' || item.tool === 'highlighter') {
            return {
              ...item,
              x: item.x + dx,
              y: item.y + dy,
              points: item.points?.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            };
          }
          return {
            ...item,
            x: item.x + dx,
            y: item.y + dy,
            endX: item.endX !== undefined ? item.endX + dx : undefined,
            endY: item.endY !== undefined ? item.endY + dy : undefined,
          };
        })
      );
      setDragStartPoint(pt);
      return;
    }

    // Drawing new item
    if (isDrawing && tempItem) {
      if (tempItem.tool === 'pen' || tempItem.tool === 'highlighter') {
        setTempItem((prev) =>
          prev
            ? {
                ...prev,
                points: [...(prev.points || []), pt],
              }
            : null
        );
      } else {
        setTempItem((prev) =>
          prev
            ? {
                ...prev,
                endX: pt.x,
                endY: pt.y,
                width: pt.x - prev.x,
                height: pt.y - prev.y,
              }
            : null
        );
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStartPoint(null);
      setUndoStack((prev) => [...prev, annotations]);
      return;
    }

    if (isDrawing && tempItem) {
      setIsDrawing(false);

      // Check if item has meaningful size or points
      const hasSize =
        (tempItem.tool === 'pen' || tempItem.tool === 'highlighter')
          ? (tempItem.points?.length || 0) > 1
          : Math.hypot(tempItem.width || 0, tempItem.height || 0) > 5;

      if (hasSize) {
        pushHistory([...annotations, tempItem]);
        setSelectedId(tempItem.id);
      }

      setTempItem(null);
    }
  };

  // Apply Changes Handler
  const handleApplyChanges = async () => {
    setIsApplying(true);
    try {
      const result = await flattenAnnotations(imageElement, annotations, {
        rotation,
        flipH,
        flipV,
      });
      onApply(result.dataUrl, result.width, result.height);
      onClose();
    } catch (err) {
      console.error('Lỗi khi áp dụng chỉnh sửa:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none overflow-hidden text-slate-100 font-sans">
      {/* 1. TOP HEADER BAR */}
      <header className="h-13 bg-slate-900 border-b border-slate-800 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <PenTool className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate">
              {t('annotationStudioTitle')}
            </h2>
          </div>
        </div>

        {/* History & Zoom Quick Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
              undoStack.length > 0
                ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                : 'border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title={t('undoBtn')}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
              redoStack.length > 0
                ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                : 'border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title={t('redoBtn')}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          {selectedId && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="p-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition-colors"
              title={t('deleteSelectedBtn')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {annotations.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2 py-1 text-[11px] rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors hidden md:inline-flex"
            >
              {t('clearAllAnnotationsBtn')}
            </button>
          )}

          <div className="w-[1px] h-4 bg-slate-800 mx-1 hidden sm:block" />

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.3, prev - 0.2))}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] text-slate-300 px-1 min-w-[32px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(2.5, prev + 0.2))}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded"
              title="Fit"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Action Buttons: Cancel & Apply */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t('discardAnnotationBtn')}</span>
          </button>
          <button
            type="button"
            onClick={handleApplyChanges}
            disabled={isApplying}
            className="px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isApplying ? 'Đang lưu...' : t('applyAnnotationBtn')}</span>
          </button>
        </div>
      </header>

      {/* 2. PRIMARY TOOLBAR: Annotation Tools Selection */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 shrink-0">
          {[
            { id: 'select', label: t('toolSelect'), icon: MousePointer },
            { id: 'arrow', label: t('toolArrow'), icon: ArrowUpRight },
            { id: 'rect', label: t('toolRect'), icon: Square },
            { id: 'circle', label: t('toolCircle'), icon: Circle },
            { id: 'line', label: t('toolLine'), icon: Minus },
            { id: 'pen', label: t('toolPen'), icon: PenTool },
            { id: 'highlighter', label: t('toolHighlighter'), icon: Highlighter },
            { id: 'text', label: t('toolText'), icon: Type },
            { id: 'badge', label: t('toolBadge'), icon: ListOrdered },
            { id: 'blur', label: t('toolBlur'), icon: EyeOff },
          ].map((tool) => {
            const Icon = tool.icon;
            const isSelected = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveTool(tool.id as AnnotationTool);
                  if (tool.id !== 'select') setSelectedId(null);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
                title={tool.label}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Rotate & Flip Tools */}
        <div className="flex items-center gap-1 border-l border-slate-800 pl-2 shrink-0">
          <button
            type="button"
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={t('toolRotateCW')}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setFlipH((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-colors ${
              flipH
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={t('toolFlipH')}
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. SECONDARY PROPERTIES BAR: Colors, Strokes, Fill, and Text input */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between gap-3 text-xs overflow-x-auto shrink-0">
        <div className="flex items-center gap-3">
          {/* Color Palette */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              {t('colorLabel')}
            </span>
            <div className="flex items-center gap-1">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setActiveColor(c.value)}
                  className={`w-5 h-5 rounded-full transition-transform border border-slate-700/80 ${
                    activeColor.toLowerCase() === c.value.toLowerCase()
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'hover:scale-105 opacity-85'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
              <label
                className="w-5 h-5 rounded-full border border-dashed border-slate-600 flex items-center justify-center cursor-pointer relative overflow-hidden ml-0.5"
                title="Tùy chọn màu"
              >
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                />
                <Palette className="w-2.5 h-2.5 text-slate-400" />
              </label>
            </div>
          </div>

          <div className="w-[1px] h-3.5 bg-slate-800" />

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              {t('annotateStrokeWidthLabel')}
            </span>
            {[
              { val: 2, label: '2px' },
              { val: 4, label: '4px' },
              { val: 8, label: '8px' },
              { val: 12, label: '12px' },
            ].map((sw) => (
              <button
                key={sw.val}
                type="button"
                onClick={() => setActiveStrokeWidth(sw.val)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                  activeStrokeWidth === sw.val
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {sw.label}
              </button>
            ))}
          </div>

          {/* Fill shape checkbox (for rect/circle) */}
          {(activeTool === 'rect' || activeTool === 'circle') && (
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 text-[11px] border-l border-slate-800 pl-2">
              <input
                type="checkbox"
                checked={fillShape}
                onChange={(e) => setFillShape(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
              />
              <span>{t('fillShapeLabel')}</span>
            </label>
          )}

          {/* Text note input (when text tool active) */}
          {activeTool === 'text' && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t('annotateTextPlaceholder')}
                className="px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white w-44 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Current tool helpful hint */}
        <div className="text-[11px] text-slate-400 truncate hidden lg:block">
          {activeTool === 'badge' && t('clickToPlaceBadgeHint')}
          {activeTool === 'text' && t('clickToPlaceTextHint')}
          {activeTool === 'select' && t('dragToMoveHint')}
        </div>
      </div>

      {/* 4. MAIN INTERACTIVE CANVAS AREA */}
      <main
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-3 sm:p-6"
      >
        <div
          className="relative transition-transform duration-75 shadow-2xl rounded-lg overflow-hidden border border-slate-800/80 bg-[linear-gradient(45deg,#0f172a_25%,transparent_25%),linear-gradient(-45deg,#0f172a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#0f172a_75%),linear-gradient(-45deg,transparent_75%,#0f172a_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-slate-900"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`block max-w-full max-h-[75vh] object-contain touch-none ${
              activeTool === 'select'
                ? 'cursor-default'
                : activeTool === 'text'
                ? 'cursor-text'
                : 'cursor-crosshair'
            }`}
          />
        </div>
      </main>
    </div>
  );
};
