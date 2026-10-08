import React, { useState, useRef } from 'react';
import {
  WatermarkSettings,
  WatermarkPosition,
  ExportFormat,
  TileDensity,
  Language,
  LogoShape,
} from '../types';
import { PresetShapeType } from '../utils/sampleLogo';
import { useTranslation } from '../utils/i18n';
import {
  Download,
  Copy,
  Check,
  Grid,
  Type,
  Palette,
  RotateCw,
  Sliders,
  Sparkles,
  Move,
  Trash2,
  Image as ImageIcon,
  UploadCloud,
  FileImage,
  Layers,
  Circle,
  Square,
  Heart,
  Star,
  Shield,
  Diamond,
} from 'lucide-react';

interface WatermarkControlsProps {
  settings: WatermarkSettings;
  lang: Language;
  logoElement: HTMLImageElement | null;
  activeLayer: 'logo' | 'text';
  onActiveLayerChange: (layer: 'logo' | 'text') => void;
  onLogoSelected: (file: File) => void;
  onLoadSampleLogo: () => void;
  onSelectPresetShape?: (shape: PresetShapeType) => void;
  onChange: (updated: Partial<WatermarkSettings>) => void;
  onDownload: (format: ExportFormat, quality: number) => Promise<void>;
  onCopyClipboard: () => Promise<boolean>;
  isExporting: boolean;
}

const COLOR_PRESETS = [
  { nameVi: 'Trắng', nameEn: 'White', value: '#ffffff', border: true },
  { nameVi: 'Đen', nameEn: 'Black', value: '#0f172a' },
  { nameVi: 'Vàng kim', nameEn: 'Gold', value: '#facc15' },
  { nameVi: 'Đỏ', nameEn: 'Red', value: '#ef4444' },
  { nameVi: 'Xanh dương', nameEn: 'Blue', value: '#2563eb' },
  { nameVi: 'Xanh lục', nameEn: 'Green', value: '#10b981' },
];

const FONT_OPTIONS = [
  { labelVi: 'System UI (Hiện đại & Nhanh)', labelEn: 'System UI (Fast & Clean)', value: 'system-ui' },
  { labelVi: 'Arial / Sans-serif', labelEn: 'Arial / Sans-serif', value: 'Arial' },
  { labelVi: 'Impact (Đậm nét poster)', labelEn: 'Impact (Bold Poster)', value: 'Impact' },
  { labelVi: 'Georgia (Thanh lịch & Có chân)', labelEn: 'Georgia (Serif Elegant)', value: 'Georgia' },
  { labelVi: 'Times New Roman (Cổ điển)', labelEn: 'Times New Roman (Classic)', value: 'Times New Roman' },
  { labelVi: 'Courier New (Kỹ thuật / Mono)', labelEn: 'Courier New (Monospace)', value: 'Courier New' },
  { labelVi: 'Trebuchet MS (Trang nhã)', labelEn: 'Trebuchet MS (Modern)', value: 'Trebuchet MS' },
  { labelVi: 'Verdana (Rõ ràng)', labelEn: 'Verdana (Clean & Legible)', value: 'Verdana' },
];

const POSITIONS: { id: WatermarkPosition; labelVi: string; labelEn: string }[] = [
  { id: 'top-left', labelVi: 'Trên - Trái', labelEn: 'Top - Left' },
  { id: 'top-center', labelVi: 'Trên - Giữa', labelEn: 'Top - Center' },
  { id: 'top-right', labelVi: 'Trên - Phải', labelEn: 'Top - Right' },
  { id: 'middle-left', labelVi: 'Giữa - Trái', labelEn: 'Middle - Left' },
  { id: 'center', labelVi: 'Chính giữa', labelEn: 'Center' },
  { id: 'middle-right', labelVi: 'Giữa - Phải', labelEn: 'Middle - Right' },
  { id: 'bottom-left', labelVi: 'Dưới - Trái', labelEn: 'Bottom - Left' },
  { id: 'bottom-center', labelVi: 'Dưới - Giữa', labelEn: 'Bottom - Center' },
  { id: 'bottom-right', labelVi: 'Dưới - Phải', labelEn: 'Bottom - Right' },
];

export const WatermarkControls: React.FC<WatermarkControlsProps> = ({
  settings,
  lang,
  logoElement,
  activeLayer,
  onActiveLayerChange,
  onLogoSelected,
  onLoadSampleLogo,
  onSelectPresetShape,
  onChange,
  onDownload,
  onCopyClipboard,
  isExporting,
}) => {
  const { t } = useTranslation(lang);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportQuality, setExportQuality] = useState<number>(0.92);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'position' | 'style' | 'advanced'>('position');

  const isBothMode = settings.watermarkType === 'both';
  const isLogoMode = settings.watermarkType === 'logo';
  const isTextMode = settings.watermarkType === 'text';

  // Determine current editing layer
  const editingTarget = isBothMode ? activeLayer : isLogoMode ? 'logo' : 'text';

  // Current position for the active editing target
  const currentTargetPosition =
    editingTarget === 'logo'
      ? settings.logoPosition || settings.position
      : settings.textPosition || settings.position;

  const handleCopy = async () => {
    const success = await onCopyClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInsertPreset = (textToAdd: string) => {
    if (!settings.text) {
      onChange({ text: textToAdd });
    } else {
      onChange({ text: `${settings.text} • ${textToAdd}` });
    }
  };

  const insertCurrentYear = () => {
    const year = new Date().getFullYear();
    handleInsertPreset(`© ${year}`);
  };

  const handleLogoFileInput = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith('image/')) {
      onLogoSelected(file);
    }
  };

  // Switch to Both mode with reasonable default positions
  const handleSwitchToBoth = () => {
    onChange({
      watermarkType: 'both',
      logoPosition: settings.logoPosition || 'top-right',
      textPosition: settings.textPosition || 'bottom-right',
    });
  };

  // Update position for active target
  const handlePositionChange = (pos: WatermarkPosition) => {
    if (isBothMode) {
      if (activeLayer === 'logo') {
        onChange({ logoPosition: pos });
      } else {
        onChange({ textPosition: pos });
      }
    } else if (isLogoMode) {
      onChange({ logoPosition: pos, position: pos });
    } else {
      onChange({ textPosition: pos, position: pos });
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col divide-y divide-slate-100 overflow-hidden">
      {/* 0. WATERMARK TYPE SELECTOR: TEXT vs LOGO vs BOTH */}
      <div className="p-3 sm:p-3.5 bg-slate-50 border-b border-slate-200/80">
        <div className="grid grid-cols-3 p-1 bg-slate-200/70 rounded-xl text-xs font-bold text-slate-600 gap-1">
          <button
            id="btn-switch-type-text"
            type="button"
            onClick={() => onChange({ watermarkType: 'text' })}
            className={`py-2 px-1 sm:px-2 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs ${
              isTextMode
                ? 'bg-white text-blue-700 shadow-xs scale-[1.01]'
                : 'hover:text-slate-900 text-slate-600'
            }`}
          >
            <Type className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate">{t('typeText')}</span>
          </button>

          <button
            id="btn-switch-type-logo"
            type="button"
            onClick={() => onChange({ watermarkType: 'logo' })}
            className={`py-2 px-1 sm:px-2 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs ${
              isLogoMode
                ? 'bg-white text-blue-700 shadow-xs scale-[1.01]'
                : 'hover:text-slate-900 text-slate-600'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span className="truncate">{t('typeLogo')}</span>
          </button>

          <button
            id="btn-switch-type-both"
            type="button"
            onClick={handleSwitchToBoth}
            className={`py-2 px-1 sm:px-2 rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs ${
              isBothMode
                ? 'bg-white text-blue-700 shadow-xs scale-[1.01]'
                : 'hover:text-slate-900 text-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate">{t('typeBoth')}</span>
          </button>
        </div>

        {/* Both mode banner & layer switcher */}
        {isBothMode && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>{t('editingLayerLabel')}</span>
            </span>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => onActiveLayerChange('logo')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                  activeLayer === 'logo'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{t('targetLogo')}</span>
              </button>
              <button
                type="button"
                onClick={() => onActiveLayerChange('text')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                  activeLayer === 'text'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{t('targetText')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. PRIMARY INPUT SECTION */}
      {/* (In BOTH mode, we display both Logo card/upload AND Text area) */}
      <div className="divide-y divide-slate-100">
        {/* LOGO SECTION (if in Logo or Both mode) */}
        {(isLogoMode || isBothMode) && (
          <div className="p-4 sm:p-5 bg-gradient-to-b from-indigo-50/40 to-transparent">
            <input
              ref={logoFileInputRef}
              type="file"
              id="logo-file-input"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleLogoFileInput(e.target.files);
                e.target.value = '';
              }}
            />

            {!settings.logoDataUrl ? (
              /* Upload Logo Box */
              <div
                id="dropzone-logo-upload"
                onClick={() => logoFileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 mx-auto mb-1.5 flex items-center justify-center border border-indigo-100">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-0.5">
                  {t('uploadLogoTitle')}
                </h4>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  {t('uploadLogoSubtitle')}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      logoFileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                    <span>{t('chooseLogoBtn')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadSampleLogo();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('sampleLogoBtn')}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Logo Active Card with Direct Shape Masking */
              <div className="bg-white rounded-2xl border border-indigo-200/80 p-3 sm:p-3.5 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Live Shaped Thumbnail Preview */}
                    <div
                      className={`w-12 h-12 border border-slate-200 overflow-hidden bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%),linear-gradient(-45deg,#e2e8f0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e8f0_75%),linear-gradient(-45deg,transparent_75%,#e2e8f0_75%)] bg-[size:10px_10px] bg-[position:0_0,0_5px,5px_-5px,-5px_0px] bg-slate-50 shrink-0 flex items-center justify-center p-0.5 transition-all shadow-2xs ${
                        settings.logoShape === 'circle'
                          ? 'rounded-full ring-2 ring-indigo-500/40'
                          : settings.logoShape === 'rounded'
                          ? 'rounded-xl'
                          : 'rounded-md'
                      }`}
                      style={
                        settings.logoShape === 'heart'
                          ? { clipPath: 'path("M 24 42 C 0 26 -2 8 13 4 C 18 2 22 7 24 10 C 26 7 30 2 35 4 C 50 8 48 26 24 42 Z")' }
                          : settings.logoShape === 'star'
                          ? { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }
                          : settings.logoShape === 'shield'
                          ? { clipPath: 'polygon(50% 100%, 100% 75%, 100% 0%, 0% 0%, 0% 75%)' }
                          : undefined
                      }
                    >
                      <img
                        src={settings.logoDataUrl}
                        alt="Logo preview"
                        className={`w-full h-full object-cover ${
                          settings.logoShape === 'circle' ? 'rounded-full' : ''
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate" title={settings.logoName || 'logo.png'}>
                        {settings.logoName || 'logo.png'}
                      </div>
                      {logoElement && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {logoElement.naturalWidth}×{logoElement.naturalHeight}px
                        </div>
                      )}
                      <div className="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-semibold mt-0.5 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/60">
                        <Check className="w-2.5 h-2.5 text-indigo-600" />
                        <span>
                          {settings.logoShape === 'circle'
                            ? `${t('shapeCircle')} (1:1)`
                            : settings.logoShape === 'rounded'
                            ? t('shapeRounded')
                            : settings.logoShape === 'heart'
                            ? t('shapeHeart')
                            : settings.logoShape === 'star'
                            ? t('shapeStar')
                            : settings.logoShape === 'shield'
                            ? t('shapeShield')
                            : t('shapeOriginal')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors"
                    >
                      {t('changeLogoBtn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ logoDataUrl: null, logoName: null })}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t('removeLogoBtn')}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Shape Mask Selector for User's Logo */}
                <div className="pt-2.5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{t('shapeMaskLabel')}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {settings.logoShape === 'circle' ? 'Cắt tròn logo' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {([
                      { id: 'original', label: t('shapeOriginal'), icon: Square },
                      { id: 'circle', label: t('shapeCircle'), icon: Circle },
                      { id: 'rounded', label: t('shapeRounded'), icon: Square },
                      { id: 'heart', label: t('shapeHeart'), icon: Heart },
                      { id: 'star', label: t('shapeStar'), icon: Star },
                      { id: 'shield', label: t('shapeShield'), icon: Shield },
                    ] as const).map((s) => {
                      const Icon = s.icon;
                      const isSelected = (settings.logoShape || 'original') === s.id;
                      return (
                        <button
                          key={s.id}
                          id={`btn-logo-shape-${s.id}`}
                          type="button"
                          onClick={() => onChange({ logoShape: s.id as LogoShape })}
                          title={s.label}
                          className={`py-1.5 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-xs ring-2 ring-indigo-500/20 scale-[1.02]'
                              : 'border-slate-200 bg-slate-50/60 hover:bg-white text-slate-600'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${s.id === 'rounded' ? 'rounded-xs' : ''}`} />
                          <span className="text-[10px] truncate max-w-full">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick border adjustment if a shape is active */}
                  {settings.logoShape && settings.logoShape !== 'original' && (
                    <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                        <span>{t('shapeBorderLabel')}:</span>
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                          {[
                            { label: '0px', val: 0 },
                            { label: '2px', val: 2 },
                            { label: '4px', val: 4 },
                            { label: '6px', val: 6 },
                          ].map((b) => (
                            <button
                              key={b.val}
                              type="button"
                              onClick={() => onChange({ logoBorderWidth: b.val })}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                                (settings.logoBorderWidth || 0) === b.val
                                  ? 'bg-white text-indigo-600 shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(settings.logoBorderWidth || 0) > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-medium">{t('shapeBorderColorLabel')}</span>
                          {['#ffffff', '#0f172a', '#facc15', '#ef4444', '#3b82f6'].map((col) => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => onChange({ logoBorderColor: col })}
                              className={`w-4 h-4 rounded-full border border-slate-300 transition-transform ${
                                (settings.logoBorderColor || '#ffffff').toLowerCase() === col.toLowerCase()
                                  ? 'ring-2 ring-indigo-600 ring-offset-1 scale-110'
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: col }}
                            />
                          ))}
                          <label
                            className="w-4 h-4 rounded-full border border-dashed border-slate-300 flex items-center justify-center cursor-pointer relative overflow-hidden"
                            title={t('customColorTitle')}
                          >
                            <input
                              type="color"
                              value={settings.logoBorderColor || '#ffffff'}
                              onChange={(e) => onChange({ logoBorderColor: e.target.value })}
                              className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                            />
                            <Palette className="w-2.5 h-2.5 text-slate-500" />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TEXT SECTION (if in Text or Both mode) */}
        {(isTextMode || isBothMode) && (
          <div className="p-4 sm:p-5 bg-gradient-to-b from-blue-50/40 to-transparent">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="watermark-text-input"
                className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5"
              >
                <Type className="w-4 h-4 text-blue-600" />
                <span>{t('watermarkContentLabel')}</span>
              </label>
              {settings.text && (
                <button
                  id="btn-clear-watermark-text"
                  type="button"
                  onClick={() => onChange({ text: '' })}
                  className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('clearTextBtn')}</span>
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                id="watermark-text-input"
                rows={2}
                value={settings.text}
                onChange={(e) => onChange({ text: e.target.value })}
                placeholder={t('textPlaceholder')}
                className="w-full rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 p-2.5 sm:p-3 text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 resize-none font-medium transition-all shadow-inner bg-white"
              />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> {t('suggestionsLabel')}
              </span>
              <button
                id="chip-copyright"
                type="button"
                onClick={insertCurrentYear}
                className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                © {new Date().getFullYear()}
              </button>
              <button
                id="chip-donotcopy"
                type="button"
                onClick={() => handleInsertPreset('DO NOT COPY')}
                className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                DO NOT COPY
              </button>
              <button
                id="chip-confidential"
                type="button"
                onClick={() => handleInsertPreset(lang === 'vi' ? 'BẢN XEM TRƯỚC' : 'PREVIEW ONLY')}
                className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                {t('previewPreset')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. TABBED SETTINGS */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Sub-tabs header */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
          <button
            id="tab-btn-position"
            type="button"
            onClick={() => setActiveTab('position')}
            className={`py-1.5 sm:py-2 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              activeTab === 'position'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{t('tabPosition')}</span>
          </button>
          <button
            id="tab-btn-style"
            type="button"
            onClick={() => setActiveTab('style')}
            className={`py-1.5 sm:py-2 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              activeTab === 'style'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{editingTarget === 'logo' ? t('tabLogoSize') : t('tabStyle')}</span>
          </button>
          <button
            id="tab-btn-advanced"
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`py-1.5 sm:py-2 rounded-lg transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs ${
              activeTab === 'advanced'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('tabAdvanced')}</span>
          </button>
        </div>

        {/* TAB 1: VỊ TRÍ / POSITION */}
        {activeTab === 'position' && (
          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  {t('layoutTypeLabel')}
                </label>
                {isBothMode && (
                  <span className="text-[11px] font-bold text-indigo-600">
                    ({editingTarget === 'logo' ? t('targetLogo') : t('targetText')})
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-mode-grid"
                  type="button"
                  onClick={() => handlePositionChange('bottom-right')}
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    currentTargetPosition !== 'tile' && currentTargetPosition !== 'custom'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>{t('gridModeBtn')}</span>
                </button>

                <button
                  id="btn-mode-tile"
                  type="button"
                  onClick={() => handlePositionChange('tile')}
                  className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    currentTargetPosition === 'tile'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('tileModeBtn')}</span>
                </button>
              </div>
            </div>

            {/* 9-grid position */}
            {currentTargetPosition !== 'tile' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-500">
                    {t('selectGridPosition')}
                  </span>
                  <button
                    id="btn-pos-custom"
                    type="button"
                    onClick={() => handlePositionChange('custom')}
                    className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                      currentTargetPosition === 'custom'
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-blue-600 hover:underline'
                    }`}
                  >
                    {t('freeDragBtn')}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 w-full max-w-[220px] mx-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                  {POSITIONS.map((pos) => {
                    const isSelected = currentTargetPosition === pos.id;
                    const label = lang === 'vi' ? pos.labelVi : pos.labelEn;
                    return (
                      <button
                        key={pos.id}
                        id={`btn-pos-${pos.id}`}
                        type="button"
                        onClick={() => handlePositionChange(pos.id)}
                        title={label}
                        className={`h-8 rounded-lg text-[10px] font-medium transition-all flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs scale-95 font-semibold'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full border border-current" />
                      </button>
                    );
                  })}
                </div>
                {currentTargetPosition === 'custom' && (
                  <p className="text-center text-[11px] text-blue-600 mt-1.5 flex items-center justify-center gap-1">
                    <Move className="w-3 h-3" />
                    {t('freeDragHint')}
                  </p>
                )}
              </div>
            )}

            {/* Tile Density */}
            {currentTargetPosition === 'tile' && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  {t('tileDensityLabel')}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['low', 'medium', 'high'] as TileDensity[]).map((density) => (
                    <button
                      key={density}
                      id={`btn-density-${density}`}
                      type="button"
                      onClick={() => onChange({ tileDensity: density })}
                      className={`py-1 text-xs rounded-lg font-medium transition-colors ${
                        settings.tileDensity === density
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {density === 'low'
                        ? t('densityLow')
                        : density === 'medium'
                        ? t('densityMedium')
                        : t('densityHigh')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STYLE / SIZE (Dựa theo editingTarget) */}
        {activeTab === 'style' && (
          <div className="space-y-3.5">
            {editingTarget === 'text' ? (
              /* TEXT STYLE CONTROLS */
              <>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                      <span>{t('fontSizeLabel')} ({settings.fontSizePercent}%)</span>
                      <span className="text-slate-400 text-[11px]">{t('relativeToImage')}</span>
                    </div>
                    <input
                      id="slider-font-size"
                      type="range"
                      min={1}
                      max={15}
                      step={0.5}
                      value={settings.fontSizePercent}
                      onChange={(e) =>
                        onChange({ fontSizePercent: parseFloat(e.target.value) })
                      }
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                      <span>{t('opacityLabel')} ({Math.round(settings.opacity * 100)}%)</span>
                      <span className="text-slate-400 text-[11px]">
                        {settings.opacity < 0.4
                          ? t('opacityLight')
                          : settings.opacity > 0.8
                          ? t('opacityCrisp')
                          : t('opacityNormal')}
                      </span>
                    </div>
                    <input
                      id="slider-opacity"
                      type="range"
                      min={0.05}
                      max={1}
                      step={0.05}
                      value={settings.opacity}
                      onChange={(e) =>
                        onChange({ opacity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Color selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    {t('textColorLabel')}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((col) => {
                      const colorName = lang === 'vi' ? col.nameVi : col.nameEn;
                      return (
                        <button
                          key={col.value}
                          id={`btn-color-${col.value}`}
                          type="button"
                          onClick={() => onChange({ color: col.value })}
                          title={colorName}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-transform flex items-center justify-center ${
                            col.border ? 'border border-slate-300' : ''
                          } ${
                            settings.color.toLowerCase() === col.value.toLowerCase()
                              ? 'ring-2 ring-blue-600 ring-offset-2 scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: col.value }}
                        >
                          {settings.color.toLowerCase() === col.value.toLowerCase() && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                col.value === '#ffffff' ? 'text-black' : 'text-white'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                    <label
                      htmlFor="custom-color-picker"
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-500 overflow-hidden relative"
                      title={t('customColorTitle')}
                    >
                      <input
                        id="custom-color-picker"
                        type="color"
                        value={settings.color}
                        onChange={(e) => onChange({ color: e.target.value })}
                        className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                      />
                      <Palette className="w-3.5 h-3.5 text-slate-600" />
                    </label>
                  </div>
                </div>

                {/* Font selector */}
                <div>
                  <label
                    htmlFor="select-font-family"
                    className="text-xs font-semibold text-slate-700 mb-1 block"
                  >
                    {t('fontFamilyLabel')}
                  </label>
                  <select
                    id="select-font-family"
                    value={settings.fontFamily}
                    onChange={(e) => onChange({ fontFamily: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {lang === 'vi' ? f.labelVi : f.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick styles */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    {t('textFormatLabel')}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      id="btn-format-bold"
                      type="button"
                      onClick={() => onChange({ bold: !settings.bold })}
                      className={`py-1.5 text-xs rounded-xl border font-bold transition-colors ${
                        settings.bold
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t('boldBtn')}
                    </button>

                    <button
                      id="btn-format-italic"
                      type="button"
                      onClick={() => onChange({ italic: !settings.italic })}
                      className={`py-1.5 text-xs rounded-xl border italic font-medium transition-colors ${
                        settings.italic
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t('italicBtn')}
                    </button>

                    <button
                      id="btn-format-caps"
                      type="button"
                      onClick={() => onChange({ uppercase: !settings.uppercase })}
                      className={`py-1.5 text-xs rounded-xl border uppercase font-medium transition-colors ${
                        settings.uppercase
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t('capsBtn')}
                    </button>
                  </div>
                </div>

                {/* Contrast Stroke and Shadow */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        {t('dropShadowLabel')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t('dropShadowDesc')}
                      </span>
                    </div>
                    <input
                      id="checkbox-has-shadow"
                      type="checkbox"
                      checked={settings.hasShadow}
                      onChange={(e) => onChange({ hasShadow: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        {t('strokeLabel')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t('strokeDesc')}
                      </span>
                    </div>
                    <input
                      id="checkbox-has-stroke"
                      type="checkbox"
                      checked={settings.hasStroke}
                      onChange={(e) => onChange({ hasStroke: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </>
            ) : (
              /* LOGO SIZE & OPACITY CONTROLS */
              <>
                <div>
                  <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                    <span>{t('logoScaleLabel')} ({settings.logoScalePercent}%)</span>
                    <span className="text-slate-400 text-[11px]">{t('relativeToImage')}</span>
                  </div>
                  <input
                    id="slider-logo-scale"
                    type="range"
                    min={4}
                    max={40}
                    step={1}
                    value={settings.logoScalePercent}
                    onChange={(e) =>
                      onChange({ logoScalePercent: parseInt(e.target.value) })
                    }
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                    <span>{t('logoOpacityLabel')} ({Math.round(settings.logoOpacity * 100)}%)</span>
                    <span className="text-slate-400 text-[11px]">
                      {settings.logoOpacity < 0.4
                        ? t('opacityLight')
                        : settings.logoOpacity > 0.8
                        ? t('opacityCrisp')
                        : t('opacityNormal')}
                    </span>
                  </div>
                  <input
                    id="slider-logo-opacity"
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={settings.logoOpacity}
                    onChange={(e) =>
                      onChange({ logoOpacity: parseFloat(e.target.value) })
                    }
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>

                {/* LOGO SHAPE MASK CONTROLS */}
                <div className="pt-1">
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    {t('shapeMaskLabel')}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {([
                      { id: 'original', label: t('shapeOriginal'), icon: Square },
                      { id: 'circle', label: t('shapeCircle'), icon: Circle },
                      { id: 'rounded', label: t('shapeRounded'), icon: Square },
                      { id: 'heart', label: t('shapeHeart'), icon: Heart },
                      { id: 'star', label: t('shapeStar'), icon: Star },
                      { id: 'shield', label: t('shapeShield'), icon: Shield },
                    ] as const).map((s) => {
                      const Icon = s.icon;
                      const isSelected = (settings.logoShape || 'original') === s.id;
                      return (
                        <button
                          key={s.id}
                          id={`btn-shape-${s.id}`}
                          type="button"
                          onClick={() => onChange({ logoShape: s.id as LogoShape })}
                          className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/90 text-indigo-700 font-bold shadow-xs scale-[1.02]'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${s.id === 'rounded' ? 'rounded-xs' : ''}`} />
                          <span className="text-[10px] truncate max-w-full">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SHAPE BORDER WIDTH & COLOR (when shape is not original) */}
                {(settings.logoShape && settings.logoShape !== 'original') && (
                  <div className="space-y-2.5 p-2.5 rounded-xl bg-indigo-50/40 border border-indigo-100">
                    <div>
                      <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                        <span>{t('shapeBorderLabel')} ({settings.logoBorderWidth || 0}px)</span>
                      </div>
                      <input
                        id="slider-logo-border-width"
                        type="range"
                        min={0}
                        max={8}
                        step={1}
                        value={settings.logoBorderWidth || 0}
                        onChange={(e) =>
                          onChange({ logoBorderWidth: parseInt(e.target.value) })
                        }
                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                      />
                    </div>

                    {(settings.logoBorderWidth || 0) > 0 && (
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 mb-1.5 block">
                          {t('shapeBorderColorLabel')}
                        </label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            { name: 'Trắng', value: '#ffffff' },
                            { name: 'Đen', value: '#0f172a' },
                            { name: 'Vàng', value: '#facc15' },
                            { name: 'Đỏ', value: '#ef4444' },
                            { name: 'Xanh dương', value: '#3b82f6' },
                          ].map((col) => (
                            <button
                              key={col.value}
                              type="button"
                              onClick={() => onChange({ logoBorderColor: col.value })}
                              className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center border border-slate-300 ${
                                (settings.logoBorderColor || '#ffffff').toLowerCase() === col.value.toLowerCase()
                                  ? 'ring-2 ring-indigo-600 ring-offset-1 scale-110'
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: col.value }}
                            >
                              {(settings.logoBorderColor || '#ffffff').toLowerCase() === col.value.toLowerCase() && (
                                <Check
                                  className={`w-3 h-3 ${col.value === '#ffffff' ? 'text-black' : 'text-white'}`}
                                />
                              )}
                            </button>
                          ))}
                          <label
                            htmlFor="custom-logo-border-color-picker"
                            className="w-6 h-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 overflow-hidden relative"
                            title={t('customColorTitle')}
                          >
                            <input
                              id="custom-logo-border-color-picker"
                              type="color"
                              value={settings.logoBorderColor || '#ffffff'}
                              onChange={(e) => onChange({ logoBorderColor: e.target.value })}
                              className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                            />
                            <Palette className="w-3 h-3 text-slate-600" />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-1">
                  <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        {t('logoShadowLabel')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {t('logoShadowDesc')}
                      </span>
                    </div>
                    <input
                      id="checkbox-logo-has-shadow"
                      type="checkbox"
                      checked={settings.logoHasShadow}
                      onChange={(e) => onChange({ logoHasShadow: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: NÂNG CAO / ADVANCED */}
        {activeTab === 'advanced' && (
          <div className="space-y-3.5">
            {/* Rotation slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                  {t('rotationLabel')} ({editingTarget === 'logo' ? settings.logoRotation : settings.rotation}°)
                </span>
                <button
                  type="button"
                  onClick={() => onChange(editingTarget === 'logo' ? { logoRotation: 0 } : { rotation: 0 })}
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  {t('reset0Btn')}
                </button>
              </div>
              <input
                id="slider-rotation"
                type="range"
                min={-180}
                max={180}
                step={5}
                value={editingTarget === 'logo' ? settings.logoRotation : settings.rotation}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onChange(editingTarget === 'logo' ? { logoRotation: val } : { rotation: val });
                }}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg mb-1.5"
              />
              <div className="flex items-center gap-1 justify-center flex-wrap">
                {[-45, -30, 0, 30, 45, 90].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() =>
                      onChange(editingTarget === 'logo' ? { logoRotation: deg } : { rotation: deg })
                    }
                    className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                      (editingTarget === 'logo' ? settings.logoRotation : settings.rotation) === deg
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* Edge Padding */}
            {currentTargetPosition !== 'tile' && currentTargetPosition !== 'custom' && (
              <div>
                <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                  <span>{t('edgePaddingLabel')} ({settings.paddingPercent}%)</span>
                </div>
                <input
                  id="slider-padding"
                  type="range"
                  min={1}
                  max={15}
                  step={0.5}
                  value={settings.paddingPercent}
                  onChange={(e) =>
                    onChange({ paddingPercent: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
            )}

            {/* Stroke styling for text only */}
            {editingTarget === 'text' && settings.hasStroke && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    {t('strokeColorLabel')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['#000000', '#ffffff', '#ef4444', '#2563eb'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onChange({ strokeColor: c })}
                        className={`w-4 h-4 rounded-full border ${
                          settings.strokeColor === c ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>{t('strokeWidthLabel')} ({settings.strokeWidth}px)</span>
                  </div>
                  <input
                    id="slider-stroke-width"
                    type="range"
                    min={1}
                    max={6}
                    step={1}
                    value={settings.strokeWidth}
                    onChange={(e) =>
                      onChange({ strokeWidth: parseInt(e.target.value) })
                    }
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. EXPORT & DOWNLOAD ACTIONS */}
      <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-200/80 space-y-2.5">
        {/* Format Selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">{t('exportFormatLabel')}</span>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                id={`btn-format-${fmt}`}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                  exportFormat === fmt
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {fmt === 'jpeg' ? 'JPG' : fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Quality slider */}
        {exportFormat !== 'png' && (
          <div className="pt-0.5">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>{t('compressionQualityLabel')} {Math.round(exportQuality * 100)}%</span>
            </div>
            <input
              id="slider-export-quality"
              type="range"
              min={0.6}
              max={1.0}
              step={0.05}
              value={exportQuality}
              onChange={(e) => setExportQuality(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>
        )}

        {/* Primary Download Button */}
        <button
          id="btn-quick-download"
          type="button"
          disabled={isExporting}
          onClick={() => onDownload(exportFormat, exportQuality)}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{t('downloadBtn')}</span>
        </button>

        {/* Secondary Action: Copy to Clipboard */}
        <button
          id="btn-copy-clipboard"
          type="button"
          onClick={handleCopy}
          className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">{t('copiedSuccess')}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>{t('copyBtn')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
