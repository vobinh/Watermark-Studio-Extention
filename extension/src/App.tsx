import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WatermarkSettings, ImageInfo, ExportFormat, ViewMode, Language } from './types';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { WatermarkControls } from './components/WatermarkControls';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ImageAnnotationModal } from './components/ImageAnnotationModal';
import { generateSampleImage } from './utils/sampleImage';
import { generateSampleLogo, generatePresetShapeLogo, PresetShapeType } from './utils/sampleLogo';
import { useTranslation } from './utils/i18n';
import {
  createFullResolutionCanvas,
  getWatermarkedFilename,
  downloadCanvas,
  copyCanvasToClipboard,
} from './utils/watermarkRenderer';
import {
  DEFAULT_SETTINGS,
  loadSavedSettings,
  saveUserSettings,
  getPendingImage,
  clearPendingImage,
  saveActiveImageSession,
  getActiveImageSession,
  clearActiveImageSession,
  getPreferredLanguage,
  setPreferredLanguage,
} from './utils/storage';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AppProps {
  mode: ViewMode;
}

export default function App({ mode }: AppProps) {
  const [lang, setLang] = useState<Language>('vi');
  const { t } = useTranslation(lang);

  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [logoElement, setLogoElement] = useState<HTMLImageElement | null>(null);
  const [activeLayer, setActiveLayer] = useState<'logo' | 'text'>('logo');
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_SETTINGS);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  // 1. Initial Load: Load language and saved settings
  useEffect(() => {
    getPreferredLanguage().then((preferredLang) => {
      setLang(preferredLang);
    });

    loadSavedSettings().then((loaded) => {
      setSettings(loaded);
    });
  }, []);

  // 2. React to logoDataUrl changes to load HTMLImageElement for canvas
  useEffect(() => {
    if (!settings.logoDataUrl) {
      setLogoElement(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setLogoElement(img);
    };
    img.src = settings.logoDataUrl;
  }, [settings.logoDataUrl]);

  const handleLanguageChange = async (newLang: Language) => {
    setLang(newLang);
    await setPreferredLanguage(newLang);
  };

  // 3. Helper to load image from Data URL
  const loadImageFromDataUrl = useCallback((dataUrl: string, name: string) => {
    const img = new Image();
    img.onload = () => {
      setImageElement(img);
      setImageInfo({
        dataUrl,
        name: name || 'image.png',
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        sizeBytes: Math.round((dataUrl.length * 3) / 4),
        mimeType: 'image/png',
      });
      saveActiveImageSession({ dataUrl, name: name || 'image.png' });
    };
    img.src = dataUrl;
  }, []);

  // 4. Check for pending images (from context menu) or active session
  useEffect(() => {
    const checkImages = async () => {
      const pending = await getPendingImage();
      if (pending && pending.dataUrl) {
        loadImageFromDataUrl(pending.dataUrl, pending.name);
        await clearPendingImage();
        showToast(`${t('toastImageFromWeb')} ${pending.name}`);
        return;
      }

      const session = await getActiveImageSession();
      if (session && session.dataUrl) {
        loadImageFromDataUrl(session.dataUrl, session.name);
      }
    };

    checkImages();

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const messageListener = (message: any) => {
        if (message.type === 'LOAD_PENDING_IMAGE' && message.dataUrl) {
          loadImageFromDataUrl(message.dataUrl, message.name);
          showToast(`${t('toastImageFromWeb')} ${message.name}`);
        }
      };
      chrome.runtime.onMessage.addListener(messageListener);
      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };
    }
  }, [loadImageFromDataUrl, t]);

  // 5. Auto-save watermark settings on change with debounce
  const handleSettingsChange = (updated: Partial<WatermarkSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveUserSettings(next);
      }, 500);
      return next;
    });
  };

  // 6. Handle local logo file upload
  const handleLogoSelected = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      handleSettingsChange({
        watermarkType: 'logo',
        logoDataUrl: dataUrl,
        logoName: file.name,
      });
      showToast(`${t('toastLogoLoaded')} ${file.name}`);
    };
    reader.readAsDataURL(file);
  }, [t]);

  // 7. Handle loading transparent sample logo
  const handleLoadSampleLogo = useCallback(async () => {
    try {
      const sampleLogoUrl = await generateSampleLogo();
      handleSettingsChange({
        watermarkType: 'logo',
        logoDataUrl: sampleLogoUrl,
        logoName: 'sample_verified_emblem.png',
      });
      showToast(t('toastSampleLogoLoaded'));
    } catch (err) {
      console.error(err);
    }
  }, [t]);

  // 7b. Handle selecting preset shape logo (heart, star, shield, circle, diamond)
  const handleSelectPresetShape = useCallback(
    async (shape: PresetShapeType) => {
      try {
        const shapeLogoUrl = await generatePresetShapeLogo(shape);
        const shapeNames: Record<PresetShapeType, string> = {
          heart: 'heart_badge.png',
          star: 'star_badge.png',
          shield: 'shield_emblem.png',
          circle: 'circle_seal.png',
          diamond: 'diamond_badge.png',
        };
        const name = shapeNames[shape] || `${shape}_logo.png`;
        handleSettingsChange({
          watermarkType: settings.watermarkType === 'both' ? 'both' : 'logo',
          logoDataUrl: shapeLogoUrl,
          logoName: name,
        });
        showToast(`${t('toastPresetLoaded')} ${name}`);
      } catch (err) {
        console.error(err);
      }
    },
    [handleSettingsChange, settings.watermarkType, showToast, t]
  );

  // 8. Handle local main photo upload
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
        saveActiveImageSession({ dataUrl, name: file.name });
        showToast(`${t('toastImageLoaded')} ${file.name}`);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [t]);

  // 9. Handle loading sample demo photo
  const handleLoadSample = useCallback(async () => {
    setIsLoadingSample(true);
    try {
      const sampleDataUrl = await generateSampleImage();
      const img = new Image();
      img.onload = () => {
        setImageElement(img);
        const name = 'sample_landscape_sunset.jpg';
        setImageInfo({
          dataUrl: sampleDataUrl,
          name,
          width: 1920,
          height: 1280,
          sizeBytes: 850000,
          mimeType: 'image/jpeg',
        });
        saveActiveImageSession({ dataUrl: sampleDataUrl, name });
        setIsLoadingSample(false);
        showToast(t('toastSampleLoaded'));
      };
      img.src = sampleDataUrl;
    } catch {
      setIsLoadingSample(false);
      showToast(t('toastSampleError'), 'error');
    }
  }, [t]);

  // 10. Reset state & clear active session
  const handleReset = async () => {
    setImageInfo(null);
    setImageElement(null);
    await clearActiveImageSession();
  };

  // 10b. Trigger file dialog to change current image
  const handleChangeImage = () => {
    mainFileInputRef.current?.click();
  };

  // 10c. Apply annotated image from ImageAnnotationModal
  const handleApplyAnnotatedImage = (
    dataUrl: string,
    width: number,
    height: number,
    newImageElement?: HTMLImageElement
  ) => {
    setIsAnnotationModalOpen(false);
    const baseOriginalName = imageInfo?.name ? imageInfo.name.replace(/\.[^/.]+$/, '') : 'photo';
    const name = `${baseOriginalName}_annotated.png`;

    const applyReadyImage = (img: HTMLImageElement, url: string) => {
      setImageElement(img);
      setImageInfo({
        dataUrl: url,
        name,
        width: img.naturalWidth || width,
        height: img.naturalHeight || height,
        sizeBytes: Math.round((url.length * 3) / 4) || 2048,
        mimeType: 'image/png',
      });
      if (url.startsWith('data:')) {
        try {
          saveActiveImageSession({ dataUrl: url, name });
        } catch (err) {
          console.warn('Could not persist session image to storage', err);
        }
      }
      showToast(t('toastAnnotationApplied'));
    };

    if (newImageElement && newImageElement.complete && (newImageElement.naturalWidth > 0 || newImageElement.width > 0)) {
      applyReadyImage(newImageElement, dataUrl || newImageElement.src);
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => applyReadyImage(img, dataUrl);
      img.onerror = () => {
        showToast('Lỗi khi chuyển ảnh sang màn hình Watermark', 'error');
      };
      img.src = dataUrl;
    }
  };

  // 11. Custom position change
  const handleCustomPositionChange = (x: number, y: number) => {
    if (settings.watermarkType === 'both') {
      if (activeLayer === 'logo') {
        handleSettingsChange({
          logoPosition: 'custom',
          logoCustomX: x,
          logoCustomY: y,
        });
      } else {
        handleSettingsChange({
          textPosition: 'custom',
          textCustomX: x,
          textCustomY: y,
        });
      }
    } else if (settings.watermarkType === 'logo') {
      handleSettingsChange({
        position: 'custom',
        customX: x,
        customY: y,
        logoPosition: 'custom',
        logoCustomX: x,
        logoCustomY: y,
      });
    } else {
      handleSettingsChange({
        position: 'custom',
        customX: x,
        customY: y,
        textPosition: 'custom',
        textCustomX: x,
        textCustomY: y,
      });
    }
  };

  // 12. Download watermarked image
  const handleDownload = async (format: ExportFormat, quality: number) => {
    if (!imageElement || !imageInfo) {
      showToast(t('toastSelectImageFirst'), 'error');
      return;
    }

    if (settings.watermarkType === 'logo' && !settings.logoDataUrl) {
      showToast(t('toastPleaseSelectLogo'), 'error');
      return;
    }

    if (settings.watermarkType === 'both' && !settings.logoDataUrl && !settings.text.trim()) {
      showToast(t('toastPleaseSelectLogo'), 'error');
      return;
    }

    setIsExporting(true);
    try {
      const fullCanvas = createFullResolutionCanvas(imageElement, settings, logoElement);
      const filename = getWatermarkedFilename(imageInfo.name, format);
      await downloadCanvas(fullCanvas, filename, format, quality);
      showToast(`${t('toastDownloadSuccess')} ${filename}`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`${t('toastDownloadError')} ${(err?.message || '')}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 13. Copy watermarked image to clipboard
  const handleCopyClipboard = async (): Promise<boolean> => {
    if (!imageElement) {
      showToast(t('toastNoImageToCopy'), 'error');
      return false;
    }

    if (settings.watermarkType === 'logo' && !settings.logoDataUrl) {
      showToast(t('toastPleaseSelectLogo'), 'error');
      return false;
    }

    if (settings.watermarkType === 'both' && !settings.logoDataUrl && !settings.text.trim()) {
      showToast(t('toastPleaseSelectLogo'), 'error');
      return false;
    }

    try {
      const fullCanvas = createFullResolutionCanvas(imageElement, settings, logoElement);
      const ok = await copyCanvasToClipboard(fullCanvas);
      if (ok) {
        showToast(t('toastCopySuccess'), 'success');
        return true;
      } else {
        showToast(t('toastCopyNotSupported'), 'error');
        return false;
      }
    } catch {
      showToast(t('toastCopyError'), 'error');
      return false;
    }
  };

  // 14. Switch view mode (SidePanel <-> FullTab)
  const handleSwitchMode = () => {
    if (imageInfo) {
      saveActiveImageSession({ dataUrl: imageInfo.dataUrl, name: imageInfo.name });
    }

    if (mode === 'sidepanel') {
      if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
        chrome.tabs.create({ url: chrome.runtime.getURL('fulltab.html') });
      } else {
        window.open('fulltab.html', '_blank');
      }
    } else {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, () => {
          showToast(t('openSidePanel'));
        });
      } else {
        window.open('sidepanel.html', '_blank');
      }
    }
  };

  // 15. Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (imageElement) handleDownload('png', 0.92);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageElement, settings, logoElement]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl shadow-lg border text-xs sm:text-sm font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
                : toastMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-500/10'
                : 'bg-blue-50 text-blue-800 border-blue-200 shadow-blue-500/10'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Hidden file input for Change Image action anywhere */}
      <input
        ref={mainFileInputRef}
        type="file"
        id="main-change-image-input"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleImageFile(e.target.files[0]);
          }
          e.target.value = '';
        }}
      />

      {/* Header */}
      <Header
        currentMode={mode}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        hasImage={Boolean(imageInfo)}
        onChangeImage={handleChangeImage}
        onOpenAnnotate={() => setIsAnnotationModalOpen(true)}
        onReset={handleReset}
        onLoadSample={handleLoadSample}
        onSwitchMode={handleSwitchMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-2.5 sm:p-4 md:p-6 max-w-7xl w-full mx-auto">
        {!imageInfo ? (
          <div className="flex-1 flex items-center justify-center">
            <UploadZone
              lang={lang}
              onImageSelected={handleImageFile}
              onLoadSample={handleLoadSample}
              isLoading={isLoadingSample}
            />
          </div>
        ) : mode === 'sidepanel' ? (
          /* Side Panel: Vertical Flow Layout */
          <div className="flex flex-col gap-3 w-full">
            <div className="w-full shrink-0">
              <PreviewCanvas
                imageInfo={imageInfo}
                imageElement={imageElement}
                logoElement={logoElement}
                settings={settings}
                mode="sidepanel"
                lang={lang}
                onCustomPositionChange={handleCustomPositionChange}
                onChangeImage={handleChangeImage}
              />
            </div>
            <div className="w-full">
              <WatermarkControls
                settings={settings}
                lang={lang}
                logoElement={logoElement}
                activeLayer={activeLayer}
                onActiveLayerChange={setActiveLayer}
                onLogoSelected={handleLogoSelected}
                onLoadSampleLogo={handleLoadSampleLogo}
                onSelectPresetShape={handleSelectPresetShape}
                onChange={handleSettingsChange}
                onDownload={handleDownload}
                onCopyClipboard={handleCopyClipboard}
                isExporting={isExporting}
              />
            </div>
          </div>
        ) : (
          /* Full Tab: Two-Column Desktop Dashboard Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
            <div className="lg:col-span-7 xl:col-span-8 h-full flex flex-col min-h-[460px] lg:min-h-[640px]">
              <PreviewCanvas
                imageInfo={imageInfo}
                imageElement={imageElement}
                logoElement={logoElement}
                settings={settings}
                mode="fulltab"
                lang={lang}
                onCustomPositionChange={handleCustomPositionChange}
                onChangeImage={handleChangeImage}
              />
            </div>
            <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
              <WatermarkControls
                settings={settings}
                lang={lang}
                logoElement={logoElement}
                activeLayer={activeLayer}
                onActiveLayerChange={setActiveLayer}
                onLogoSelected={handleLogoSelected}
                onLoadSampleLogo={handleLoadSampleLogo}
                onSelectPresetShape={handleSelectPresetShape}
                onChange={handleSettingsChange}
                onDownload={handleDownload}
                onCopyClipboard={handleCopyClipboard}
                isExporting={isExporting}
              />
            </div>
          </div>
        )}
      </main>

      {/* Photo Markup & Annotation Studio Modal */}
      {isAnnotationModalOpen && imageInfo && imageElement && (
        <ImageAnnotationModal
          imageInfo={imageInfo}
          imageElement={imageElement}
          lang={lang}
          onChangeImageFile={handleImageFile}
          showToast={showToast}
          onApply={handleApplyAnnotatedImage}
          onClose={() => setIsAnnotationModalOpen(false)}
        />
      )}
    </div>
  );
}
