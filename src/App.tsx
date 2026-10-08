import React, { useState, useEffect, useCallback } from 'react';
import { WatermarkSettings, ImageInfo, ExportFormat } from './types';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { WatermarkControls } from './components/WatermarkControls';
import { PreviewCanvas } from './components/PreviewCanvas';
import { generateSampleImage } from './utils/sampleImage';
import {
  createFullResolutionCanvas,
  getWatermarkedFilename,
  downloadCanvas,
  copyCanvasToClipboard,
} from './utils/watermarkRenderer';
import { CheckCircle, AlertCircle } from 'lucide-react';

const DEFAULT_SETTINGS: WatermarkSettings = {
  text: '© Bản quyền hình ảnh',
  position: 'bottom-right',
  customX: 50,
  customY: 50,
  fontSizePercent: 4,
  fontFamily: 'Plus Jakarta Sans',
  color: '#ffffff',
  opacity: 0.85,
  rotation: 0,
  bold: true,
  italic: false,
  uppercase: false,
  hasShadow: true,
  shadowColor: 'rgba(0, 0, 0, 0.75)',
  hasStroke: true,
  strokeColor: '#000000',
  strokeWidth: 2,
  paddingPercent: 4,
  tileDensity: 'medium',
};

export default function App() {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_SETTINGS);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3000);
  };

  // Load an image file
  const handleImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        setImageElement(img);
        setImageInfo({
          dataUrl,
          name: file.name,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          sizeBytes: file.size,
          mimeType: file.type || 'image/png',
        });
        showToast(`Đã tải ảnh lên: ${file.name}`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  // Load sample demo image
  const handleLoadSample = useCallback(async () => {
    setIsLoadingSample(true);
    try {
      const sampleDataUrl = await generateSampleImage();
      const img = new Image();
      img.onload = () => {
        setImageElement(img);
        setImageInfo({
          dataUrl: sampleDataUrl,
          name: 'sample_landscape_sunset.jpg',
          width: 1920,
          height: 1280,
          sizeBytes: 850000,
          mimeType: 'image/jpeg',
        });
        setIsLoadingSample(false);
        showToast('Đã tải ảnh mẫu thử nghiệm!');
      };
      img.src = sampleDataUrl;
    } catch (err) {
      console.error(err);
      setIsLoadingSample(false);
    }
  }, []);

  // Update partial settings
  const handleSettingsChange = (updated: Partial<WatermarkSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  // Custom position change from dragging/clicking preview canvas
  const handleCustomPositionChange = (xPercent: number, yPercent: number) => {
    setSettings((prev) => ({
      ...prev,
      position: 'custom',
      customX: xPercent,
      customY: yPercent,
    }));
  };

  // Fast Download
  const handleDownload = async (
    format: ExportFormat = 'png',
    quality = 0.92
  ) => {
    if (!imageElement || !imageInfo) return;

    setIsExporting(true);
    try {
      // Build full resolution canvas
      const fullCanvas = createFullResolutionCanvas(imageElement, settings);
      const filename = getWatermarkedFilename(imageInfo.name, format);
      await downloadCanvas(fullCanvas, filename, format, quality);
      showToast(`Đã tải xuống thành công: ${filename}`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Có lỗi xảy ra khi tải ảnh xuống', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy image to clipboard
  const handleCopyClipboard = async (): Promise<boolean> => {
    if (!imageElement) return false;
    try {
      const fullCanvas = createFullResolutionCanvas(imageElement, settings);
      const success = await copyCanvasToClipboard(fullCanvas);
      if (success) {
        showToast('Đã sao chép ảnh vào bộ nhớ tạm (Clipboard)!');
        return true;
      } else {
        showToast('Trình duyệt chưa hỗ trợ sao chép ảnh trực tiếp', 'info');
        return false;
      }
    } catch {
      showToast('Không thể sao chép ảnh', 'error');
      return false;
    }
  };

  // Reset to select another image
  const handleReset = () => {
    setImageInfo(null);
    setImageElement(null);
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S to fast download
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (imageElement && imageInfo) {
          e.preventDefault();
          handleDownload('png', 0.95);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageElement, imageInfo, settings]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <Header
        hasImage={!!imageInfo}
        onReset={handleReset}
        onLoadSample={handleLoadSample}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col">
        {!imageInfo ? (
          /* Empty / Upload State */
          <div className="flex-1 flex flex-col items-center justify-center">
            <UploadZone
              onImageSelected={handleImageFile}
              onLoadSample={handleLoadSample}
              isLoading={isLoadingSample}
            />
          </div>
        ) : (
          /* Loaded Image & Active Editor State */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Live Canvas Preview */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">
              <PreviewCanvas
                imageInfo={imageInfo}
                imageElement={imageElement}
                settings={settings}
                onCustomPositionChange={handleCustomPositionChange}
              />
            </div>

            {/* Right Column: Watermark Controls & Quick Download */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
              <WatermarkControls
                settings={settings}
                onChange={handleSettingsChange}
                onDownload={handleDownload}
                onCopyClipboard={handleCopyClipboard}
                isExporting={isExporting}
              />
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold text-white ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600'
                : toastMessage.type === 'error'
                ? 'bg-rose-600'
                : 'bg-slate-800'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
