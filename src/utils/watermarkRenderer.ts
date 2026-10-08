import { WatermarkSettings, ExportFormat } from '../types';

/**
 * Draws the watermark onto a canvas at full image resolution
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  imgWidth: number,
  imgHeight: number,
  settings: WatermarkSettings
) {
  if (!settings.text.trim()) return;

  const minDim = Math.min(imgWidth, imgHeight);
  // Base font size in px derived from min dimension
  const fontSize = Math.max(12, Math.round((minDim * settings.fontSizePercent) / 100));

  let fontStyle = '';
  if (settings.italic) fontStyle += 'italic ';
  if (settings.bold) fontStyle += 'bold ';

  const fullFont = `${fontStyle}${fontSize}px "${settings.fontFamily}", sans-serif`;
  ctx.font = fullFont;

  const rawText = settings.uppercase ? settings.text.toUpperCase() : settings.text;
  const lines = rawText.split('\n');

  // Measure max width of all lines
  let maxLineWidth = 0;
  lines.forEach((line) => {
    const width = ctx.measureText(line).width;
    if (width > maxLineWidth) maxLineWidth = width;
  });

  const lineHeight = fontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;

  ctx.save();
  ctx.globalAlpha = settings.opacity;

  // Configure shadow if enabled
  if (settings.hasShadow) {
    ctx.shadowColor = settings.shadowColor || 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = Math.max(4, Math.round(fontSize * 0.15));
    ctx.shadowOffsetX = Math.max(2, Math.round(fontSize * 0.05));
    ctx.shadowOffsetY = Math.max(2, Math.round(fontSize * 0.05));
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // TILED PATTERN
  if (settings.position === 'tile') {
    const densityGapMap = {
      low: fontSize * 4.5,
      medium: fontSize * 3.0,
      high: fontSize * 1.8,
    };
    const gap = densityGapMap[settings.tileDensity] || fontSize * 3.0;
    const stepX = maxLineWidth + gap;
    const stepY = totalTextHeight + gap;

    // Draw diagonally across an expanded bounding area to cover during rotation
    const diag = Math.sqrt(imgWidth * imgWidth + imgHeight * imgHeight);
    const angleRad = (settings.rotation * Math.PI) / 180;

    ctx.save();
    ctx.translate(imgWidth / 2, imgHeight / 2);
    ctx.rotate(angleRad);

    const startX = -diag;
    const endX = diag;
    const startY = -diag;
    const endY = diag;

    let rowIndex = 0;
    for (let y = startY; y < endY; y += stepY) {
      const xOffset = rowIndex % 2 === 0 ? 0 : stepX / 2;
      for (let x = startX - stepX; x < endX + stepX; x += stepX) {
        renderTextLines(ctx, lines, x + xOffset, y, fontSize, lineHeight, settings);
      }
      rowIndex++;
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  // SINGLE WATERMARK (9-grid or custom)
  const paddingX = (imgWidth * settings.paddingPercent) / 100;
  const paddingY = (imgHeight * settings.paddingPercent) / 100;

  let centerX = imgWidth / 2;
  let centerY = imgHeight / 2;

  if (settings.position === 'custom') {
    centerX = (imgWidth * settings.customX) / 100;
    centerY = (imgHeight * settings.customY) / 100;
  } else {
    switch (settings.position) {
      case 'top-left':
        centerX = paddingX + maxLineWidth / 2;
        centerY = paddingY + totalTextHeight / 2;
        break;
      case 'top-center':
        centerX = imgWidth / 2;
        centerY = paddingY + totalTextHeight / 2;
        break;
      case 'top-right':
        centerX = imgWidth - paddingX - maxLineWidth / 2;
        centerY = paddingY + totalTextHeight / 2;
        break;
      case 'middle-left':
        centerX = paddingX + maxLineWidth / 2;
        centerY = imgHeight / 2;
        break;
      case 'center':
        centerX = imgWidth / 2;
        centerY = imgHeight / 2;
        break;
      case 'middle-right':
        centerX = imgWidth - paddingX - maxLineWidth / 2;
        centerY = imgHeight / 2;
        break;
      case 'bottom-left':
        centerX = paddingX + maxLineWidth / 2;
        centerY = imgHeight - paddingY - totalTextHeight / 2;
        break;
      case 'bottom-center':
        centerX = imgWidth / 2;
        centerY = imgHeight - paddingY - totalTextHeight / 2;
        break;
      case 'bottom-right':
        centerX = imgWidth - paddingX - maxLineWidth / 2;
        centerY = imgHeight - paddingY - totalTextHeight / 2;
        break;
    }
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  if (settings.rotation !== 0) {
    ctx.rotate((settings.rotation * Math.PI) / 180);
  }

  // Render centered on (0,0)
  const startY = -totalTextHeight / 2 + lineHeight * 0.8;
  renderTextLines(ctx, lines, 0, startY, fontSize, lineHeight, settings, true);

  ctx.restore();
  ctx.restore();
}

function renderTextLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  startY: number,
  fontSize: number,
  lineHeight: number,
  settings: WatermarkSettings,
  isCentered = false
) {
  ctx.textAlign = isCentered ? 'center' : 'left';
  ctx.textBaseline = 'alphabetic';

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;

    // Stroke / Outline
    if (settings.hasStroke) {
      ctx.strokeStyle = settings.strokeColor || '#000000';
      ctx.lineWidth = Math.max(1, (fontSize / 24) * settings.strokeWidth);
      ctx.lineJoin = 'round';
      ctx.strokeText(line, x, lineY);
    }

    // Fill
    ctx.fillStyle = settings.color;
    ctx.fillText(line, x, lineY);
  });
}

/**
 * Creates full resolution canvas with source image and watermark
 */
export function createFullResolutionCanvas(
  img: HTMLImageElement,
  settings: WatermarkSettings
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  // Draw base image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Draw watermark
  drawWatermark(ctx, canvas.width, canvas.height, settings);

  return canvas;
}

/**
 * Generates download filename
 */
export function getWatermarkedFilename(
  originalName: string,
  format: ExportFormat
): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const ext = format === 'jpeg' ? 'jpg' : format;
  return `${baseName}_watermark.${ext}`;
}

/**
 * Downloads the watermarked canvas
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  format: ExportFormat = 'png',
  quality = 0.92
): Promise<void> {
  return new Promise((resolve, reject) => {
    const mimeType =
      format === 'jpeg'
        ? 'image/jpeg'
        : format === 'webp'
        ? 'image/webp'
        : 'image/png';

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      },
      mimeType,
      quality
    );
  });
}

/**
 * Copies the watermarked image to system clipboard
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob || !navigator.clipboard || !window.ClipboardItem) {
        resolve(false);
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        resolve(true);
      } catch (err) {
        console.error('Clipboard copy failed', err);
        resolve(false);
      }
    }, 'image/png');
  });
}
