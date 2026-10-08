/**
 * Image Annotation & Markup Engine
 * Handles rendering of arrows, rectangles, circles, lines, pen strokes,
 * highlighters, text annotations, numbered step badges, mosaic blur, and flattening.
 */

export type AnnotationTool =
  | 'select'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'line'
  | 'pen'
  | 'highlighter'
  | 'text'
  | 'badge'
  | 'blur';

export interface Point {
  x: number;
  y: number;
}

export interface AnnotationItem {
  id: string;
  tool: AnnotationTool;
  color: string;
  strokeWidth: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  points?: Point[];
  text?: string;
  fontSize?: number;
  stepNumber?: number;
  filled?: boolean;
  fillOpacity?: number; // 0 to 100%
  hasBorder?: boolean; // For text note: true (with pill/border) or false (text only)
}

/**
 * Draws an arrow from (fromX, fromY) to (toX, toY)
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  strokeWidth: number
) {
  const headLen = Math.max(12, strokeWidth * 3.2);
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw main shaft
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrow head
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - (headLen * 0.7) * Math.cos(angle),
    toY - (headLen * 0.7) * Math.sin(angle)
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draws rounded rectangle
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, Math.abs(w) / 2, Math.abs(h) / 2);
  const x1 = Math.min(x, x + w);
  const y1 = Math.min(y, y + h);
  const rw = Math.abs(w);
  const rh = Math.abs(h);

  ctx.beginPath();
  ctx.moveTo(x1 + r, y1);
  ctx.lineTo(x1 + rw - r, y1);
  ctx.quadraticCurveTo(x1 + rw, y1, x1 + rw, y1 + r);
  ctx.lineTo(x1 + rw, y1 + rh - r);
  ctx.quadraticCurveTo(x1 + rw, y1 + rh, x1 + rw - r, y1 + rh);
  ctx.lineTo(x1 + r, y1 + rh);
  ctx.quadraticCurveTo(x1, y1 + rh, x1, y1 + rh - r);
  ctx.lineTo(x1, y1 + r);
  ctx.quadraticCurveTo(x1, y1, x1 + r, y1);
  ctx.closePath();
}

/**
 * Draws mosaic/pixelated rectangle over image region to censor sensitive information
 */
export function drawMosaic(
  ctx: CanvasRenderingContext2D,
  baseImg: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scaleX: number = 1,
  scaleY: number = 1
) {
  const normX = Math.round(Math.min(x, x + w) * scaleX);
  const normY = Math.round(Math.min(y, y + h) * scaleY);
  const normW = Math.round(Math.abs(w) * scaleX);
  const normH = Math.round(Math.abs(h) * scaleY);

  if (normW <= 0 || normH <= 0) return;

  const blockSize = Math.max(8, Math.round(Math.min(normW, normH) / 10));

  // Temporary canvas to pixelate
  const off = document.createElement('canvas');
  off.width = Math.max(1, Math.floor(normW / blockSize));
  off.height = Math.max(1, Math.floor(normH / blockSize));
  const offCtx = off.getContext('2d');
  if (!offCtx) return;

  // Draw scaled down
  offCtx.imageSmoothingEnabled = false;
  offCtx.drawImage(
    baseImg,
    normX,
    normY,
    normW,
    normH,
    0,
    0,
    off.width,
    off.height
  );

  // Draw back scaled up onto destination ctx
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    off,
    0,
    0,
    off.width,
    off.height,
    Math.min(x, x + w),
    Math.min(y, y + h),
    Math.abs(w),
    Math.abs(h)
  );

  // Border outline for blur region
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(Math.min(x, x + w), Math.min(y, y + h), Math.abs(w), Math.abs(h));
  ctx.restore();
}

/**
 * Wraps text into lines fitting within maxWidth
 */
export function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth?: number
): string[] {
  if (!text) return [];
  const paragraphs = text.split('\n');
  if (!maxWidth || maxWidth <= 0) {
    return paragraphs;
  }

  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para) {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = `${currentLine} ${word}`;
      const metrics = ctx.measureText(testLine);
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Computes bounding dimensions, lines, and layout metrics for a text annotation item
 */
export function getTextAnnotationDimensions(
  ctx: CanvasRenderingContext2D,
  item: AnnotationItem
): {
  width: number;
  height: number;
  lines: string[];
  lineHeight: number;
  padX: number;
  padY: number;
} {
  const fontSize = item.fontSize || 22;
  const lineHeight = Math.round(fontSize * 1.35);
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

  const padX = 12;
  const padY = 8;
  const contentMaxWidth = item.width ? Math.max(60, item.width - padX * 2) : undefined;
  const lines = wrapTextLines(ctx, item.text || '', contentMaxWidth);

  let maxLineWidth = 0;
  lines.forEach((line) => {
    const w = ctx.measureText(line).width;
    if (w > maxLineWidth) maxLineWidth = w;
  });

  const totalWidth = item.width
    ? Math.max(item.width, maxLineWidth + padX * 2)
    : Math.max(80, maxLineWidth + padX * 2);
  const totalHeight = Math.max(
    item.height || 0,
    Math.max(1, lines.length) * lineHeight + padY * 2
  );

  return {
    width: totalWidth,
    height: totalHeight,
    lines,
    lineHeight,
    padX,
    padY,
  };
}

/**
 * Renders a single annotation item
 */
export function renderAnnotationItem(
  ctx: CanvasRenderingContext2D,
  item: AnnotationItem,
  baseImg?: HTMLImageElement | null
) {
  ctx.save();

  switch (item.tool) {
    case 'arrow': {
      const endX = item.endX ?? item.x + (item.width ?? 60);
      const endY = item.endY ?? item.y + (item.height ?? 60);
      drawArrow(ctx, item.x, item.y, endX, endY, item.color, item.strokeWidth);
      break;
    }

    case 'rect': {
      const w = item.width ?? 0;
      const h = item.height ?? 0;
      ctx.lineWidth = item.strokeWidth;
      ctx.strokeStyle = item.color;
      ctx.fillStyle = item.color;

      drawRoundedRect(ctx, item.x, item.y, w, h, 6);
      const fillPercent = item.fillOpacity !== undefined ? item.fillOpacity : (item.filled ? 25 : 0);
      if (fillPercent > 0) {
        ctx.globalAlpha = Math.min(1, Math.max(0, fillPercent / 100));
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      ctx.stroke();
      break;
    }

    case 'circle': {
      const w = Math.abs(item.width ?? 0);
      const h = Math.abs(item.height ?? 0);
      const rx = w / 2;
      const ry = h / 2;
      const cx = Math.min(item.x, item.x + (item.width ?? 0)) + rx;
      const cy = Math.min(item.y, item.y + (item.height ?? 0)) + ry;

      if (rx > 0 && ry > 0) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.lineWidth = item.strokeWidth;
        ctx.strokeStyle = item.color;
        const fillPercent = item.fillOpacity !== undefined ? item.fillOpacity : (item.filled ? 25 : 0);
        if (fillPercent > 0) {
          ctx.fillStyle = item.color;
          ctx.globalAlpha = Math.min(1, Math.max(0, fillPercent / 100));
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
        ctx.stroke();
      }
      break;
    }

    case 'line': {
      const endX = item.endX ?? item.x + (item.width ?? 60);
      const endY = item.endY ?? item.y + (item.height ?? 60);
      ctx.beginPath();
      ctx.moveTo(item.x, item.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.strokeWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
      break;
    }

    case 'pen': {
      if (!item.points || item.points.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(item.points[0].x, item.points[0].y);
      for (let i = 1; i < item.points.length; i++) {
        const pt = item.points[i];
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      break;
    }

    case 'highlighter': {
      if (!item.points || item.points.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(item.points[0].x, item.points[0].y);
      for (let i = 1; i < item.points.length; i++) {
        const pt = item.points[i];
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.globalAlpha = 0.38;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = Math.max(16, item.strokeWidth * 3.5);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      break;
    }

    case 'text': {
      if (!item.text) break;
      const dims = getTextAnnotationDimensions(ctx, item);

      const hasBorder = item.hasBorder !== false;
      if (hasBorder) {
        // Draw rounded background badge/card for high contrast readability
        ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
        drawRoundedRect(ctx, item.x, item.y, dims.width, dims.height, 8);
        ctx.fill();

        // Border outline around badge
        ctx.strokeStyle = item.color;
        ctx.lineWidth = Math.max(1.5, item.strokeWidth * 0.5);
        ctx.stroke();
      } else {
        // Subtle drop shadow so borderless text is readable on any background
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
      }

      // Draw text lines
      ctx.fillStyle = item.color.toLowerCase() === '#0f172a' ? '#ffffff' : item.color;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      const fontSize = item.fontSize || 22;
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;

      dims.lines.forEach((line, idx) => {
        ctx.fillText(line, item.x + dims.padX, item.y + dims.padY + idx * dims.lineHeight);
      });

      ctx.shadowColor = 'transparent';
      break;
    }

    case 'badge': {
      const radius = Math.max(14, item.strokeWidth * 3);
      const num = item.stepNumber ?? 1;

      // Circle badge
      ctx.beginPath();
      ctx.arc(item.x, item.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 6;
      ctx.fill();

      // Outer white ring
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Number text
      ctx.fillStyle = item.color.toLowerCase() === '#ffffff' ? '#0f172a' : '#ffffff';
      ctx.font = `bold ${Math.round(radius * 1.15)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num), item.x, item.y + 0.5);
      break;
    }

    case 'blur': {
      if (baseImg) {
        const w = item.width ?? 0;
        const h = item.height ?? 0;
        drawMosaic(ctx, baseImg, item.x, item.y, w, h);
      }
      break;
    }
  }

  ctx.restore();
}

/**
 * Draws active selection bounding box and corner handles around the selected annotation
 */
export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  item: AnnotationItem
) {
  let minX = item.x;
  let minY = item.y;
  let maxX = item.x;
  let maxY = item.y;

  if (item.tool === 'arrow' || item.tool === 'line') {
    const endX = item.endX ?? item.x + (item.width ?? 60);
    const endY = item.endY ?? item.y + (item.height ?? 60);
    minX = Math.min(item.x, endX);
    minY = Math.min(item.y, endY);
    maxX = Math.max(item.x, endX);
    maxY = Math.max(item.y, endY);
  } else if (item.tool === 'rect' || item.tool === 'circle' || item.tool === 'blur') {
    const w = item.width ?? 0;
    const h = item.height ?? 0;
    minX = Math.min(item.x, item.x + w);
    minY = Math.min(item.y, item.y + h);
    maxX = Math.max(item.x, item.x + w);
    maxY = Math.max(item.y, item.y + h);
  } else if (item.tool === 'pen' || item.tool === 'highlighter') {
    if (item.points && item.points.length > 0) {
      minX = Math.min(...item.points.map((p) => p.x));
      minY = Math.min(...item.points.map((p) => p.y));
      maxX = Math.max(...item.points.map((p) => p.x));
      maxY = Math.max(...item.points.map((p) => p.y));
    }
  } else if (item.tool === 'badge') {
    const r = Math.max(14, item.strokeWidth * 3);
    minX = item.x - r;
    minY = item.y - r;
    maxX = item.x + r;
    maxY = item.y + r;
  } else if (item.tool === 'text') {
    const dims = getTextAnnotationDimensions(ctx, item);
    minX = item.x;
    minY = item.y;
    maxX = item.x + dims.width;
    maxY = item.y + dims.height;
  }

  const pad = 6;
  const boxX = minX - pad;
  const boxY = minY - pad;
  const boxW = maxX - minX + pad * 2;
  const boxH = maxY - minY + pad * 2;

  ctx.save();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Handles at 4 corners
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2563eb';
  ctx.setLineDash([]);
  const handleSize = 6;

  [
    [boxX, boxY],
    [boxX + boxW, boxY],
    [boxX, boxY + boxH],
    [boxX + boxW, boxY + boxH],
  ].forEach(([hx, hy]) => {
    ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
  });

  ctx.restore();
}

/**
 * Flattens base image + all annotations + optional transforms (rotate/flip/crop)
 * into a full-resolution final canvas and returns dataUrl and dimensions.
 */
export function flattenAnnotations(
  baseImg: HTMLImageElement,
  annotations: AnnotationItem[],
  transforms: {
    rotation: number; // 0, 90, 180, 270
    flipH: boolean;
    flipV: boolean;
    crop?: { x: number; y: number; width: number; height: number } | null;
  }
): Promise<{ canvas: HTMLCanvasElement; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve) => {
    // 1. Calculate transformed dimensions
    const imgW = baseImg.naturalWidth || baseImg.width;
    const imgH = baseImg.naturalHeight || baseImg.height;
    const isRotated90or270 = transforms.rotation === 90 || transforms.rotation === 270;
    const stageWidth = isRotated90or270 ? imgH : imgW;
    const stageHeight = isRotated90or270 ? imgW : imgH;

    // Stage canvas for rendering base image + annotations
    const stage = document.createElement('canvas');
    stage.width = stageWidth;
    stage.height = stageHeight;
    const sCtx = stage.getContext('2d')!;

    sCtx.save();
    // Center origin for rotation and flip
    sCtx.translate(stageWidth / 2, stageHeight / 2);
    if (transforms.rotation !== 0) {
      sCtx.rotate((transforms.rotation * Math.PI) / 180);
    }
    sCtx.scale(transforms.flipH ? -1 : 1, transforms.flipV ? -1 : 1);
    sCtx.drawImage(
      baseImg,
      -imgW / 2,
      -imgH / 2,
      imgW,
      imgH
    );
    sCtx.restore();

    // 2. Render all annotations onto stage
    annotations.forEach((item) => {
      renderAnnotationItem(sCtx, item, baseImg);
    });

    // 3. Apply crop if defined
    let targetCanvas = stage;
    if (transforms.crop && transforms.crop.width > 10 && transforms.crop.height > 10) {
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = Math.round(transforms.crop.width);
      finalCanvas.height = Math.round(transforms.crop.height);
      const fCtx = finalCanvas.getContext('2d')!;

      fCtx.drawImage(
        stage,
        transforms.crop.x,
        transforms.crop.y,
        transforms.crop.width,
        transforms.crop.height,
        0,
        0,
        finalCanvas.width,
        finalCanvas.height
      );
      targetCanvas = finalCanvas;
    }

    let dataUrl = '';
    try {
      dataUrl = targetCanvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Canvas toDataURL warning:', e);
    }

    resolve({
      canvas: targetCanvas,
      dataUrl,
      width: targetCanvas.width,
      height: targetCanvas.height,
    });
  });
}
