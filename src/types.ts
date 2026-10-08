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

export interface WatermarkSettings {
  text: string;
  position: WatermarkPosition;
  customX: number; // 0 - 100 percentage
  customY: number; // 0 - 100 percentage
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
