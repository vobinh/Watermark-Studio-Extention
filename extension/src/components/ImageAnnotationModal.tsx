import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  AnnotationTool,
  AnnotationItem,
  renderAnnotationItem,
  drawSelectionBox,
  getTextAnnotationDimensions,
  flattenAnnotations,
} from '../utils/annotationEngine';
import {
  downloadCanvas,
  copyCanvasToClipboard,
} from '../utils/watermarkRenderer';
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
  Pencil,
  Scaling,
  Download,
  Copy,
  ImageIcon,
  Sparkles,
  SquareDashed,
  Frame,
} from 'lucide-react';

interface ActiveTextEditor {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  hasBorder: boolean;
}

interface ImageAnnotationModalProps {
  imageInfo: ImageInfo;
  imageElement: HTMLImageElement;
  lang: Language;
  onApply: (dataUrl: string, width: number, height: number, newImg?: HTMLImageElement) => void;
  onClose: () => void;
  onChangeImageFile?: (file: File) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
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
  onChangeImageFile,
  showToast,
}) => {
  const { t } = useTranslation(lang);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const changeImageInputRef = useRef<HTMLInputElement>(null);

  // Tools & Properties
  const [activeTool, setActiveTool] = useState<AnnotationTool>('arrow');
  const [activeColor, setActiveColor] = useState<string>('#ef4444');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState<number>(4);
  const [fillOpacity, setFillOpacity] = useState<number>(25); // 0% to 100%
  const [textHasBorder, setTextHasBorder] = useState<boolean>(true); // default true

  // Export & Feedback states
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const notifyUser = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (showToast) {
      showToast(msg, type);
    }
  };

  // Interactive floating text note editor state
  const [activeTextEditor, setActiveTextEditor] = useState<ActiveTextEditor | null>(null);
  const [isResizingText, setIsResizingText] = useState<boolean>(false);
  const textResizeStartRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Canvas corner resize for selected item
  const [isResizingCanvasItem, setIsResizingCanvasItem] = useState<boolean>(false);
  const [canvasResizeStart, setCanvasResizeStart] = useState<{
    startX: number;
    startY: number;
    initW: number;
    initH: number;
  } | null>(null);

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
        const ctx = canvasRef.current?.getContext('2d');
        const dims = ctx
          ? getTextAnnotationDimensions(ctx, item)
          : { width: item.width || 120, height: item.height || 40 };
        if (
          x >= item.x - pad &&
          x <= item.x + dims.width + pad &&
          y >= item.y - pad &&
          y <= item.y + dims.height + pad
        ) {
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

    // 2. Render committed annotations (skip if currently being edited in floating DOM overlay)
    annotations.forEach((item) => {
      if (activeTextEditor && activeTextEditor.id === item.id) return;
      renderAnnotationItem(ctx, item, imageElement);
    });

    // 3. Render in-progress temporary item
    if (tempItem) {
      renderAnnotationItem(ctx, tempItem, imageElement);
    }

    // 4. Render active selection outline & handles
    if (selectedId && !tempItem && (!activeTextEditor || activeTextEditor.id !== selectedId)) {
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
    activeTextEditor,
  ]);

  // Auto-focus textarea when activeTextEditor is opened
  useEffect(() => {
    if (activeTextEditor && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeTextEditor?.id, activeTextEditor?.x, activeTextEditor?.y]);

  // Window mouse listener for resizing the floating text editor box
  useEffect(() => {
    if (!isResizingText) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!textResizeStartRef.current || !activeTextEditor) return;
      const canvas = canvasRef.current;
      const canvasRect = canvas?.getBoundingClientRect();
      const scaleFactor = canvasRect && canvas ? canvas.width / canvasRect.width : 1;

      const dx = (e.clientX - textResizeStartRef.current.startX) * scaleFactor;
      const dy = (e.clientY - textResizeStartRef.current.startY) * scaleFactor;

      const newW = Math.max(140, Math.round(textResizeStartRef.current.startW + dx));
      const newH = Math.max(50, Math.round(textResizeStartRef.current.startH + dy));

      setActiveTextEditor((prev) => (prev ? { ...prev, width: newW, height: newH } : null));
    };

    const handleWindowMouseUp = () => {
      setIsResizingText(false);
      textResizeStartRef.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isResizingText, activeTextEditor]);

  const handleCommitTextEditor = useCallback(() => {
    if (!activeTextEditor) return;
    const trimmed = activeTextEditor.text.trim();

    if (!trimmed) {
      if (activeTextEditor.id) {
        const next = annotations.filter((a) => a.id !== activeTextEditor.id);
        setAnnotations(next);
        pushHistory(next);
      }
      setActiveTextEditor(null);
      return;
    }

    if (activeTextEditor.id) {
      const updated = annotations.map((item) =>
        item.id === activeTextEditor.id
          ? {
              ...item,
              text: trimmed,
              width: activeTextEditor.width,
              height: activeTextEditor.height,
              fontSize: activeTextEditor.fontSize,
              color: activeTextEditor.color,
              hasBorder: activeTextEditor.hasBorder,
            }
          : item
      );
      setAnnotations(updated);
      pushHistory(updated);
      setSelectedId(activeTextEditor.id);
    } else {
      const newItem: AnnotationItem = {
        id: `text-${Date.now()}`,
        tool: 'text',
        x: activeTextEditor.x,
        y: activeTextEditor.y,
        width: activeTextEditor.width,
        height: activeTextEditor.height,
        text: trimmed,
        color: activeTextEditor.color,
        strokeWidth: activeStrokeWidth,
        fontSize: activeTextEditor.fontSize,
        hasBorder: activeTextEditor.hasBorder,
      };
      const next = [...annotations, newItem];
      setAnnotations(next);
      pushHistory(next);
      setSelectedId(newItem.id);
    }

    setActiveTextEditor(null);
    setActiveTool('select');
  }, [activeTextEditor, annotations, activeStrokeWidth, pushHistory]);

  const handleCancelTextEditor = useCallback(() => {
    setActiveTextEditor(null);
  }, []);

  const handleSetFillOpacity = (val: number) => {
    setFillOpacity(val);
    if (selectedId) {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === selectedId && (a.tool === 'rect' || a.tool === 'circle')
            ? { ...a, filled: val > 0, fillOpacity: val }
            : a
        )
      );
    }
  };

  const handleToggleTextBorder = () => {
    const nextVal = !textHasBorder;
    setTextHasBorder(nextVal);
    if (activeTextEditor) {
      setActiveTextEditor((prev) => (prev ? { ...prev, hasBorder: nextVal } : null));
    }
    if (selectedId) {
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === selectedId && a.tool === 'text'
            ? { ...a, hasBorder: nextVal }
            : a
        )
      );
    }
  };

  const handleTextResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingText(true);
    textResizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: activeTextEditor?.width || 240,
      startH: activeTextEditor?.height || 90,
    };
  };

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

    // If text editor is open and clicked canvas, commit it first
    if (activeTextEditor) {
      handleCommitTextEditor();
      return;
    }

    // If Select tool: check hit
    if (activeTool === 'select') {
      const hit = findItemAt(pt.x, pt.y);
      if (hit) {
        setSelectedId(hit.id);
        if (hit.tool === 'text' && hit.hasBorder !== undefined) {
          setTextHasBorder(hit.hasBorder);
        }
        if ((hit.tool === 'rect' || hit.tool === 'circle') && hit.fillOpacity !== undefined) {
          setFillOpacity(hit.fillOpacity);
        }

        // Check if clicking near the bottom-right corner of the item's bounding box
        const ctx = canvasRef.current?.getContext('2d');
        const dims =
          hit.tool === 'text' && ctx
            ? getTextAnnotationDimensions(ctx, hit)
            : { width: hit.width || 100, height: hit.height || 60 };

        const cornerX = hit.x + dims.width;
        const cornerY = hit.y + dims.height;

        if (Math.hypot(pt.x - cornerX, pt.y - cornerY) <= 22) {
          setIsResizingCanvasItem(true);
          setCanvasResizeStart({
            startX: pt.x,
            startY: pt.y,
            initW: dims.width,
            initH: dims.height,
          });
        } else {
          setIsDragging(true);
          setDragStartPoint(pt);
        }
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

    // If Text Note tool: Click to open interactive resizable text box!
    if (activeTool === 'text') {
      setActiveTextEditor({
        x: pt.x,
        y: pt.y,
        width: 240,
        height: 90,
        text: '',
        fontSize: Math.max(18, activeStrokeWidth * 5),
        color: activeColor,
        hasBorder: textHasBorder,
      });
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
      filled: fillOpacity > 0,
      fillOpacity: (activeTool === 'rect' || activeTool === 'circle') ? fillOpacity : 0,
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

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getStageCoordinates(e);
    const hit = findItemAt(pt.x, pt.y);
    if (hit && hit.tool === 'text') {
      setActiveTextEditor({
        id: hit.id,
        x: hit.x,
        y: hit.y,
        width: hit.width || 240,
        height: hit.height || 90,
        text: hit.text || '',
        fontSize: hit.fontSize || 22,
        color: hit.color || activeColor,
        hasBorder: hit.hasBorder !== false,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getStageCoordinates(e);

    // Resizing canvas item from corner handle
    if (isResizingCanvasItem && selectedId && canvasResizeStart) {
      const dx = pt.x - canvasResizeStart.startX;
      const dy = pt.y - canvasResizeStart.startY;

      setAnnotations((prev) =>
        prev.map((item) => {
          if (item.id !== selectedId) return item;
          return {
            ...item,
            width: Math.max(80, Math.round(canvasResizeStart.initW + dx)),
            height: Math.max(40, Math.round(canvasResizeStart.initH + dy)),
          };
        })
      );
      return;
    }

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
    if (isResizingCanvasItem) {
      setIsResizingCanvasItem(false);
      setCanvasResizeStart(null);
      setUndoStack((prev) => [...prev, annotations]);
      return;
    }

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

  // Helper to get all annotations including any text note currently being typed
  const getCommittedAnnotations = useCallback((): AnnotationItem[] => {
    let current = [...annotations];
    if (activeTextEditor && activeTextEditor.text.trim()) {
      const textItem: AnnotationItem = {
        id: activeTextEditor.id || `text-${Date.now()}`,
        tool: 'text',
        x: activeTextEditor.x,
        y: activeTextEditor.y,
        width: activeTextEditor.width,
        height: activeTextEditor.height,
        text: activeTextEditor.text.trim(),
        color: activeTextEditor.color,
        strokeWidth: activeStrokeWidth,
        fontSize: activeTextEditor.fontSize,
        hasBorder: activeTextEditor.hasBorder,
      };
      const idx = current.findIndex((a) => a.id === textItem.id);
      if (idx >= 0) {
        current[idx] = textItem;
      } else {
        current.push(textItem);
      }
    }
    return current;
  }, [annotations, activeTextEditor, activeStrokeWidth]);

  // Save/Download annotated image directly
  const handleSaveImage = async (format: 'png' | 'jpeg' = 'png') => {
    setIsApplying(true);
    try {
      const finalAnnotations = getCommittedAnnotations();
      const result = await flattenAnnotations(imageElement, finalAnnotations, {
        rotation,
        flipH,
        flipV,
      });
      const baseName = imageInfo.name ? imageInfo.name.replace(/\.[^.]+$/, '') : 'photo';
      const filename = `${baseName}_markup.${format === 'jpeg' ? 'jpg' : 'png'}`;
      await downloadCanvas(result.canvas, filename, format, 0.95);
      notifyUser(t('toastDownloadAnnotatedSuccess'), 'success');
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh:', err);
      notifyUser('Lỗi khi tải ảnh: ' + (err?.message || err), 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // Copy annotated image directly to clipboard
  const handleCopyImage = async () => {
    setIsApplying(true);
    try {
      const finalAnnotations = getCommittedAnnotations();
      const result = await flattenAnnotations(imageElement, finalAnnotations, {
        rotation,
        flipH,
        flipV,
      });
      const ok = await copyCanvasToClipboard(result.canvas);
      if (ok) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        notifyUser(t('toastCopyAnnotatedSuccess'), 'success');
      } else {
        notifyUser('Trình duyệt không hỗ trợ sao chép ảnh vào clipboard', 'error');
      }
    } catch (err: any) {
      console.error('Lỗi khi sao chép ảnh:', err);
      notifyUser('Lỗi khi sao chép ảnh: ' + (err?.message || err), 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // Change image from file dialog
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onChangeImageFile) {
        onChangeImageFile(file);
      }
      setAnnotations([]);
      setUndoStack([]);
      setRedoStack([]);
      setSelectedId(null);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setActiveTextEditor(null);
      notifyUser(`${file.name}`, 'info');
    }
  };

  // Apply to Watermark
  const handleApplyToWatermark = async () => {
    setIsApplying(true);
    try {
      // 1. Commit active text editor if open
      const finalAnnotations = getCommittedAnnotations();

      // 2. Flatten annotations onto stage
      const result = await flattenAnnotations(imageElement, finalAnnotations, {
        rotation,
        flipH,
        flipV,
      });

      // 3. Create blob URL for fast, zero-copy image transfer
      let blobUrl = '';
      try {
        const blob = await new Promise<Blob | null>((resolve) => {
          result.canvas.toBlob((b) => resolve(b), 'image/png');
        });
        if (blob) {
          blobUrl = URL.createObjectURL(blob);
        }
      } catch (blobErr) {
        console.warn('toBlob fallback:', blobErr);
      }

      const imgSource = blobUrl || result.dataUrl || result.canvas.toDataURL('image/png');

      // 4. Preload and verify image object is fully ready before transferring
      const newImg = new Image();
      newImg.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        newImg.onload = () => resolve();
        newImg.onerror = () => {
          if (result.dataUrl && newImg.src !== result.dataUrl) {
            newImg.src = result.dataUrl;
          } else {
            reject(new Error('Không thể tải dữ liệu ảnh đã vẽ chú thích'));
          }
        };
        newImg.src = imgSource;
      });

      // 5. Transfer to main Watermark screen
      onApply(result.dataUrl || imgSource, result.width, result.height, newImg);
      onClose();
    } catch (err: any) {
      console.error('Lỗi khi chuyển sang Watermark:', err);
      notifyUser('Lỗi khi chuyển sang Watermark: ' + (err?.message || err), 'error');
    } finally {
      setIsApplying(false);
    }
  };

  const selectedItem = selectedId ? annotations.find((a) => a.id === selectedId) : null;
  const isFillToolActive =
    activeTool === 'rect' ||
    activeTool === 'circle' ||
    (selectedItem?.tool === 'rect' || selectedItem?.tool === 'circle');
  const isTextToolActive =
    activeTool === 'text' ||
    selectedItem?.tool === 'text' ||
    !!activeTextEditor;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none overflow-hidden text-slate-100 font-sans">
      <input
        type="file"
        ref={changeImageInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* 1. TOP HEADER BAR */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <PenTool className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 hidden md:block">
            <h2 className="text-xs font-bold text-white truncate">
              {t('annotationStudioTitle')}
            </h2>
          </div>

          {/* Change Image Button */}
          <button
            type="button"
            onClick={() => changeImageInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs hover:border-slate-600"
            title={t('changeImageBtn')}
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{t('changeImageBtn')}</span>
          </button>
        </div>

        {/* History, Selected item tools, Zoom controls */}
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

          {selectedId && annotations.find((a) => a.id === selectedId)?.tool === 'text' && (
            <button
              type="button"
              onClick={() => {
                const target = annotations.find((a) => a.id === selectedId);
                if (target) {
                  setActiveTextEditor({
                    id: target.id,
                    x: target.x,
                    y: target.y,
                    width: target.width || 240,
                    height: target.height || 90,
                    text: target.text || '',
                    fontSize: target.fontSize || 22,
                    color: target.color || activeColor,
                    hasBorder: target.hasBorder !== false,
                  });
                }
              }}
              className="px-2 py-1 rounded-lg border border-blue-500/50 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors"
              title={t('editTextBtn')}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('editTextBtn')}</span>
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

        {/* Right Action Buttons: Copy, Save Image, Apply to Watermark, Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopyImage}
            disabled={isApplying}
            className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title={t('copyAnnotatedBtn')}
          >
            {copySuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span className="hidden md:inline">
              {copySuccess ? 'Đã sao chép!' : t('copyAnnotatedBtn')}
            </span>
          </button>

          {/* Save Image button */}
          <button
            type="button"
            onClick={() => handleSaveImage('png')}
            disabled={isApplying}
            className="px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            title={t('saveAnnotatedBtn')}
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('saveAnnotatedBtn')}</span>
          </button>

          {/* Apply to Watermark button */}
          <button
            type="button"
            onClick={handleApplyToWatermark}
            disabled={isApplying}
            className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 shrink-0"
            title={t('applyToWatermarkBtn')}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
            <span>{isApplying ? 'Đang chuyển...' : t('applyToWatermarkBtn')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-1"
            title={t('discardAnnotationBtn')}
          >
            <X className="w-4 h-4" />
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
                  onClick={() => {
                    setActiveColor(c.value);
                    if (activeTextEditor) {
                      setActiveTextEditor((prev) => (prev ? { ...prev, color: c.value } : null));
                    }
                    if (selectedId) {
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === selectedId ? { ...a, color: c.value } : a))
                      );
                    }
                  }}
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
                  onChange={(e) => {
                    setActiveColor(e.target.value);
                    if (activeTextEditor) {
                      setActiveTextEditor((prev) => (prev ? { ...prev, color: e.target.value } : null));
                    }
                    if (selectedId) {
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === selectedId ? { ...a, color: e.target.value } : a))
                      );
                    }
                  }}
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

          {/* Fill Opacity selector for rect/circle */}
          {isFillToolActive && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                {t('fillOpacityLabel')}:
              </span>
              <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800/80">
                {[
                  { val: 0, label: t('fillNone') },
                  { val: 25, label: '25%' },
                  { val: 50, label: '50%' },
                  { val: 75, label: '75%' },
                  { val: 100, label: '100%' },
                ].map((opt) => {
                  const currentVal =
                    selectedItem && (selectedItem.tool === 'rect' || selectedItem.tool === 'circle')
                      ? selectedItem.fillOpacity ?? (selectedItem.filled ? 50 : 0)
                      : fillOpacity;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => handleSetFillOpacity(opt.val)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        currentVal === opt.val
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Text Border toggle button */}
          {isTextToolActive && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
              <button
                type="button"
                onClick={handleToggleTextBorder}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all border ${
                  (activeTextEditor
                    ? activeTextEditor.hasBorder !== false
                    : selectedItem && selectedItem.tool === 'text'
                    ? selectedItem.hasBorder !== false
                    : textHasBorder)
                    ? 'bg-blue-600/25 text-blue-300 border-blue-500/40 hover:bg-blue-600/35'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title={
                  (activeTextEditor
                    ? activeTextEditor.hasBorder !== false
                    : selectedItem && selectedItem.tool === 'text'
                    ? selectedItem.hasBorder !== false
                    : textHasBorder)
                    ? t('textBorderLabel')
                    : t('textNoBorderLabel')
                }
              >
                {(activeTextEditor
                  ? activeTextEditor.hasBorder !== false
                  : selectedItem && selectedItem.tool === 'text'
                  ? selectedItem.hasBorder !== false
                  : textHasBorder) ? (
                  <>
                    <Frame className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('textBorderLabel')}</span>
                  </>
                ) : (
                  <>
                    <SquareDashed className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('textNoBorderLabel')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Text note active hint */}
          {activeTool === 'text' && !activeTextEditor && (
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2 text-blue-400 font-semibold text-xs">
              <Type className="w-3.5 h-3.5" />
              <span>{t('clickToPlaceTextHint')}</span>
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
            onDoubleClick={handleCanvasDoubleClick}
            className={`block max-w-full max-h-[75vh] object-contain touch-none ${
              activeTool === 'select'
                ? 'cursor-default'
                : activeTool === 'text'
                ? 'cursor-text'
                : 'cursor-crosshair'
            }`}
          />

          {/* Interactive Floating Resizable Text Box */}
          {activeTextEditor && (
            <div
              className="absolute z-30 flex flex-col rounded-xl border-2 shadow-2xl backdrop-blur-md select-none group"
              style={{
                left: `${(activeTextEditor.x / stageWidth) * 100}%`,
                top: `${(activeTextEditor.y / stageHeight) * 100}%`,
                width: `${(activeTextEditor.width / stageWidth) * 100}%`,
                minWidth: '200px',
                borderColor:
                  activeTextEditor.hasBorder !== false
                    ? activeTextEditor.color
                    : 'rgba(148, 163, 184, 0.45)',
                borderStyle: activeTextEditor.hasBorder !== false ? 'solid' : 'dashed',
                backgroundColor:
                  activeTextEditor.hasBorder !== false
                    ? 'rgba(15, 23, 42, 0.94)'
                    : 'rgba(15, 23, 42, 0.75)',
                boxShadow:
                  activeTextEditor.hasBorder !== false
                    ? `0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px ${activeTextEditor.color}33`
                    : '0 10px 20px -3px rgba(0, 0, 0, 0.4)',
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Mini Header: Font Size Controls + Border Toggle + Done/Cancel */}
              <div className="flex items-center justify-between gap-1 px-2.5 py-1.5 bg-slate-900/95 border-b border-slate-800 rounded-t-xl select-none">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {t('textFontSizeLabel')}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTextEditor((prev) =>
                        prev ? { ...prev, fontSize: Math.max(12, prev.fontSize - 3) } : null
                      )
                    }
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                    title="Giảm cỡ chữ"
                  >
                    -
                  </button>
                  <span className="text-[11px] font-mono font-bold text-blue-400 min-w-[28px] text-center">
                    {activeTextEditor.fontSize}px
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTextEditor((prev) =>
                        prev ? { ...prev, fontSize: Math.min(64, prev.fontSize + 3) } : null
                      )
                    }
                    className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
                    title="Tăng cỡ chữ"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTextEditor((prev) =>
                        prev ? { ...prev, hasBorder: !prev.hasBorder } : null
                      );
                      setTextHasBorder((prev) => !prev);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors border ${
                      activeTextEditor.hasBorder !== false
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                    title={
                      activeTextEditor.hasBorder !== false
                        ? t('textBorderLabel')
                        : t('textNoBorderLabel')
                    }
                  >
                    {activeTextEditor.hasBorder !== false ? (
                      <>
                        <Frame className="w-3 h-3 text-blue-400" />
                        <span className="hidden sm:inline">{t('textBorderLabel')}</span>
                      </>
                    ) : (
                      <>
                        <SquareDashed className="w-3 h-3 text-amber-400" />
                        <span className="hidden sm:inline">{t('textNoBorderLabel')}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelTextEditor}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title={t('textCancelBtn')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitTextEditor}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-blue-600/30 transition-all"
                    title={t('textDoneBtn')}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('textDoneBtn')}</span>
                  </button>
                </div>
              </div>

              {/* Textarea Input */}
              <div className="p-2 flex-1">
                <textarea
                  ref={textareaRef}
                  autoFocus
                  value={activeTextEditor.text}
                  onChange={(e) =>
                    setActiveTextEditor((prev) =>
                      prev ? { ...prev, text: e.target.value } : null
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleCommitTextEditor();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancelTextEditor();
                    }
                  }}
                  placeholder={t('annotateTextPlaceholder')}
                  rows={2}
                  className="w-full bg-transparent text-white placeholder-slate-500 resize-none outline-none font-sans font-bold leading-normal min-h-[48px]"
                  style={{
                    color:
                      activeTextEditor.color.toLowerCase() === '#0f172a'
                        ? '#ffffff'
                        : activeTextEditor.color,
                    fontSize: `${activeTextEditor.fontSize}px`,
                  }}
                />
              </div>

              {/* Bottom Resizing Handle Bar */}
              <div className="flex items-center justify-between px-2.5 py-1 text-[10px] text-slate-400 bg-slate-950/70 rounded-b-xl border-t border-slate-800/80">
                <span className="truncate">{t('textResizeHint')}</span>
                <div
                  onMouseDown={handleTextResizeMouseDown}
                  className="cursor-nwse-resize p-1 text-slate-400 hover:text-blue-400 transition-colors"
                  title="Kéo góc này để thay đổi kích thước khung"
                >
                  <Scaling className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
