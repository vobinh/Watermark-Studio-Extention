import { WatermarkSettings, ExportFormat, WatermarkPosition, LogoShape } from '../types';

/**
 * Creates path for basic geometric shapes centered around (0,0)
 */
function createShapePath(ctx: CanvasRenderingContext2D, shape: LogoShape, w: number, h: number) {
  ctx.beginPath();
  const halfW = w / 2;
  const halfH = h / 2;
  const minDim = Math.min(w, h);
  const r = minDim / 2;

  switch (shape) {
    case 'circle': {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      break;
    }
    case 'rounded': {
      const radius = minDim * 0.22;
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-halfW, -halfH, w, h, radius);
      } else {
        const x = -halfW;
        const y = -halfH;
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
      }
      break;
    }
    case 'heart': {
      ctx.moveTo(0, halfH * 0.85);
      ctx.bezierCurveTo(-halfW * 0.95, halfH * 0.15, -halfW * 1.05, -halfH * 0.75, 0, -halfH * 0.3);
      ctx.bezierCurveTo(halfW * 1.05, -halfH * 0.75, halfW * 0.95, halfH * 0.15, 0, halfH * 0.85);
      break;
    }
    case 'star': {
      const points = 5;
      const outerR = minDim * 0.48;
      const innerR = outerR * 0.42;
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case 'shield': {
      ctx.moveTo(0, -halfH * 0.9);
      ctx.lineTo(halfW * 0.85, -halfH * 0.9);
      ctx.quadraticCurveTo(halfW * 0.85, halfH * 0.1, 0, halfH * 0.9);
      ctx.quadraticCurveTo(-halfW * 0.85, halfH * 0.1, -halfW * 0.85, -halfH * 0.9);
      ctx.closePath();
      break;
    }
    default:
      ctx.rect(-halfW, -halfH, w, h);
      break;
  }
}

/**
 * Draws a single logo unit (with shape masking, background, and optional border)
 */
function renderLogoElement(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  w: number,
  h: number,
  settings: WatermarkSettings
) {
  const shape = settings.logoShape || 'original';
  const borderWidth = settings.logoBorderWidth || 0;
  const borderColor = settings.logoBorderColor || '#ffffff';

  if (shape === 'original') {
    ctx.drawImage(logoImg, -w / 2, -h / 2, w, h);
    if (borderWidth > 0) {
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    }
    return;
  }

  // For shapes (circle, rounded, heart, star, shield):
  // Render via offscreen canvas so that:
  // 1. Clipping is crisp and accurate
  // 2. User's uploaded image (square or rectangular) is centered and cropped (object-fit: cover)
  // 3. Destination canvas casts an authentic drop shadow around the exact shape without cutoff
  const size = Math.max(32, Math.round(Math.max(w, h)));
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  const half = size / 2;
  offCtx.translate(half, half);

  // 1. Clip to geometric shape
  offCtx.save();
  createShapePath(offCtx, shape, size, size);
  offCtx.clip();

  // Draw user's uploaded logo centered and covering the shape (cover style)
  const imgW = logoImg.naturalWidth || logoImg.width;
  const imgH = logoImg.naturalHeight || logoImg.height;
  const aspect = imgW / imgH;
  let drawW = size;
  let drawH = size;
  if (aspect > 1) {
    drawW = size * aspect;
    drawH = size;
  } else {
    drawW = size;
    drawH = size / aspect;
  }
  offCtx.drawImage(logoImg, -drawW / 2, -drawH / 2, drawW, drawH);
  offCtx.restore();

  // 2. Draw border stroke around shape if configured
  if (borderWidth > 0) {
    offCtx.save();
    createShapePath(offCtx, shape, size, size);
    offCtx.lineWidth = borderWidth;
    offCtx.strokeStyle = borderColor;
    offCtx.stroke();
    offCtx.restore();
  }

  // 3. Draw final shaped logo onto destination canvas (destination canvas drop shadow applies naturally)
  ctx.drawImage(offscreen, -w / 2, -h / 2, w, h);
}

/**
 * Draws the logo watermark onto canvas
 */
export function drawLogoWatermark(
  ctx: CanvasRenderingContext2D,
  imgWidth: number,
  imgHeight: number,
  logoImg: HTMLImageElement,
  settings: WatermarkSettings
) {
  if (!logoImg.complete || !logoImg.naturalWidth) return;

  const minDim = Math.min(imgWidth, imgHeight);
  // Base logo width in px derived from min dimension and scale percent
  const logoWidth = Math.max(20, Math.round((minDim * settings.logoScalePercent) / 100));
  const isShaped = settings.logoShape && settings.logoShape !== 'original';
  // Shapes (circle, heart, star, shield, rounded) use 1:1 square bounding box
  const logoHeight = isShaped
    ? logoWidth
    : Math.round(logoWidth * (logoImg.naturalHeight / logoImg.naturalWidth));

  const position: WatermarkPosition = settings.logoPosition || settings.position;
  const customX = settings.logoCustomX ?? settings.customX;
  const customY = settings.logoCustomY ?? settings.customY;

  ctx.save();
  ctx.globalAlpha = settings.logoOpacity;

  // Configure shadow if enabled
  if (settings.logoHasShadow) {
    ctx.shadowColor = settings.logoShadowColor || 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = Math.max(4, Math.round(logoWidth * 0.08));
    ctx.shadowOffsetX = Math.max(2, Math.round(logoWidth * 0.03));
    ctx.shadowOffsetY = Math.max(2, Math.round(logoWidth * 0.03));
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // TILED PATTERN FOR LOGO
  if (position === 'tile') {
    const densityGapMap = {
      low: logoWidth * 2.2,
      medium: logoWidth * 1.3,
      high: logoWidth * 0.6,
    };
    const gap = densityGapMap[settings.tileDensity] || logoWidth * 1.3;
    const stepX = logoWidth + gap;
    const stepY = logoHeight + gap;

    const diag = Math.sqrt(imgWidth * imgWidth + imgHeight * imgHeight);
    const angleRad = (settings.logoRotation * Math.PI) / 180;

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
        ctx.save();
        ctx.translate(x + xOffset, y);
        renderLogoElement(ctx, logoImg, logoWidth, logoHeight, settings);
        ctx.restore();
      }
      rowIndex++;
    }
    ctx.restore();
    ctx.restore();
    return;
  }

  // SINGLE LOGO POSITIONING (9-grid or custom)
  const paddingX = (imgWidth * settings.paddingPercent) / 100;
  const paddingY = (imgHeight * settings.paddingPercent) / 100;

  let centerX = imgWidth / 2;
  let centerY = imgHeight / 2;

  if (position === 'custom') {
    centerX = (imgWidth * customX) / 100;
    centerY = (imgHeight * customY) / 100;
  } else {
    switch (position) {
      case 'top-left':
        centerX = paddingX + logoWidth / 2;
        centerY = paddingY + logoHeight / 2;
        break;
      case 'top-center':
        centerX = imgWidth / 2;
        centerY = paddingY + logoHeight / 2;
        break;
      case 'top-right':
        centerX = imgWidth - paddingX - logoWidth / 2;
        centerY = paddingY + logoHeight / 2;
        break;
      case 'middle-left':
        centerX = paddingX + logoWidth / 2;
        centerY = imgHeight / 2;
        break;
      case 'center':
        centerX = imgWidth / 2;
        centerY = imgHeight / 2;
        break;
      case 'middle-right':
        centerX = imgWidth - paddingX - logoWidth / 2;
        centerY = imgHeight / 2;
        break;
      case 'bottom-left':
        centerX = paddingX + logoWidth / 2;
        centerY = imgHeight - paddingY - logoHeight / 2;
        break;
      case 'bottom-center':
        centerX = imgWidth / 2;
        centerY = imgHeight - paddingY - logoHeight / 2;
        break;
      case 'bottom-right':
        centerX = imgWidth - paddingX - logoWidth / 2;
        centerY = imgHeight - paddingY - logoHeight / 2;
        break;
    }
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  if (settings.logoRotation !== 0) {
    ctx.rotate((settings.logoRotation * Math.PI) / 180);
  }

  renderLogoElement(ctx, logoImg, logoWidth, logoHeight, settings);

  ctx.restore();
  ctx.restore();
}

/**
 * Draws the text watermark onto canvas
 */
export function drawTextWatermark(
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

  const position: WatermarkPosition = settings.textPosition || settings.position;
  const customX = settings.textCustomX ?? settings.customX;
  const customY = settings.textCustomY ?? settings.customY;

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
  if (position === 'tile') {
    const densityGapMap = {
      low: fontSize * 4.5,
      medium: fontSize * 3.0,
      high: fontSize * 1.8,
    };
    const gap = densityGapMap[settings.tileDensity] || fontSize * 3;
    const stepX = maxLineWidth + gap;
    const stepY = totalTextHeight + gap;

    // Expanded bounding area to cover during rotation
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

  if (position === 'custom') {
    centerX = (imgWidth * customX) / 100;
    centerY = (imgHeight * customY) / 100;
  } else {
    switch (position) {
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
  lineYBase: number,
  fontSize: number,
  lineHeight: number,
  settings: WatermarkSettings,
  isCentered = false
) {
  ctx.textAlign = isCentered ? 'center' : 'left';
  ctx.textBaseline = 'alphabetic';

  lines.forEach((line, index) => {
    const lineY = lineYBase + index * lineHeight;

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
 * Main dispatcher: Draws Text, Logo, or BOTH watermarks
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  imgWidth: number,
  imgHeight: number,
  settings: WatermarkSettings,
  logoImg?: HTMLImageElement | null
) {
  if (settings.watermarkType === 'both') {
    // 1. Draw logo if available
    if (logoImg && settings.logoDataUrl) {
      drawLogoWatermark(ctx, imgWidth, imgHeight, logoImg, settings);
    }
    // 2. Draw text if available
    if (settings.text.trim()) {
      drawTextWatermark(ctx, imgWidth, imgHeight, settings);
    }
  } else if (settings.watermarkType === 'logo') {
    if (logoImg && settings.logoDataUrl) {
      drawLogoWatermark(ctx, imgWidth, imgHeight, logoImg, settings);
    }
  } else {
    if (settings.text.trim()) {
      drawTextWatermark(ctx, imgWidth, imgHeight, settings);
    }
  }
}

/**
 * Creates full resolution canvas with source image and watermark
 */
export function createFullResolutionCanvas(
  img: HTMLImageElement,
  settings: WatermarkSettings,
  logoImg?: HTMLImageElement | null
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  // Draw base image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Draw watermark
  drawWatermark(ctx, canvas.width, canvas.height, settings, logoImg);

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
export async function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  format: ExportFormat = 'png',
  quality = 0.92
): Promise<void> {
  const mimeType =
    format === 'jpeg'
      ? 'image/jpeg'
      : format === 'webp'
      ? 'image/webp'
      : 'image/png';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }

        const url = URL.createObjectURL(blob);

        if (typeof chrome !== 'undefined' && chrome.downloads?.download) {
          try {
            await chrome.downloads.download({
              url: url,
              filename: filename,
              saveAs: false,
            });
            setTimeout(() => URL.revokeObjectURL(url), 4000);
            resolve();
            return;
          } catch {
            // Fall back to link click
          }
        }

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
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
