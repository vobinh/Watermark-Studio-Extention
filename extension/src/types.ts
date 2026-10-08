export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom'
  | 'tile';

export type TileDensity = 'low' | 'medium' | 'high';

export type WatermarkType = 'text' | 'logo' | 'both';

export type LogoShape = 'original' | 'circle' | 'rounded' | 'heart' | 'star' | 'shield';

export interface WatermarkSettings {
  watermarkType: WatermarkType;

  // Text watermark settings
  text: string;
  fontSizePercent: number; // 1 - 20 (percent of image min dimension)
  fontFamily: string;
  color: string;
  opacity: number; // 0.05 - 1.0
  rotation: number; // -180 to 180 degrees
  bold: boolean;
  italic: boolean;
  uppercase: boolean;
  hasShadow: boolean;
  shadowColor: string;
  hasStroke: boolean;
  strokeColor: string;
  strokeWidth: number; // 1 - 8
  textPosition?: WatermarkPosition;
  textCustomX?: number;
  textCustomY?: number;

  // Logo watermark settings
  logoDataUrl: string | null;
  logoName: string | null;
  logoScalePercent: number; // 3 - 40
  logoOpacity: number; // 0.05 - 1.0
  logoRotation: number; // -180 to 180
  logoHasShadow: boolean;
  logoShadowColor: string;
  logoShape: LogoShape;
  logoBorderWidth: number; // 0 - 8
  logoBorderColor: string;
  logoPosition?: WatermarkPosition;
  logoCustomX?: number;
  logoCustomY?: number;

  // Shared / default position settings
  position: WatermarkPosition;
  customX: number; // 0 - 100 percentage
  customY: number; // 0 - 100 percentage
  paddingPercent: number; // 1 - 15 (distance from edges)
  tileDensity: TileDensity;
}

export interface ImageInfo {
  dataUrl: string;
  name: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
}

export type ExportFormat = 'png' | 'jpeg' | 'webp';

export type ViewMode = 'sidepanel' | 'fulltab';

export type Language = 'vi' | 'en';

export interface PendingImageInfo {
  dataUrl: string;
  name: string;
  mimeType: string;
  sourceUrl?: string;
  timestamp: number;
}
