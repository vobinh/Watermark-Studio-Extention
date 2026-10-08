import React, { useState } from 'react';
import {
  WatermarkSettings,
  WatermarkPosition,
  ExportFormat,
  TileDensity,
} from '../types';
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
  Eye,
  Trash2,
} from 'lucide-react';

interface WatermarkControlsProps {
  settings: WatermarkSettings;
  onChange: (updated: Partial<WatermarkSettings>) => void;
  onDownload: (format: ExportFormat, quality: number) => Promise<void>;
  onCopyClipboard: () => Promise<boolean>;
  isExporting: boolean;
}

const COLOR_PRESETS = [
  { name: 'Trắng', value: '#ffffff', border: true },
  { name: 'Đen', value: '#0f172a' },
  { name: 'Vàng kim', value: '#facc15' },
  { name: 'Đỏ', value: '#ef4444' },
  { name: 'Xanh dương', value: '#2563eb' },
  { name: 'Xanh lục', value: '#10b981' },
];

const FONT_OPTIONS = [
  { label: 'Plus Jakarta (Hiện đại)', value: 'Plus Jakarta Sans' },
  { label: 'Montserrat (Đậm nét)', value: 'Montserrat' },
  { label: 'Playfair (Thanh lịch)', value: 'Playfair Display' },
  { label: 'Cinzel (Cổ điển & Sang trọng)', value: 'Cinzel' },
  { label: 'Bebas Neue (Poster Đậm)', value: 'Bebas Neue' },
  { label: 'Roboto Mono (Kỹ thuật)', value: 'Roboto Mono' },
  { label: 'Arial / Hệ thống', value: 'Arial' },
];

const POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'Trên - Trái' },
  { id: 'top-center', label: 'Trên - Giữa' },
  { id: 'top-right', label: 'Trên - Phải' },
  { id: 'middle-left', label: 'Giữa - Trái' },
  { id: 'center', label: 'Chính giữa' },
  { id: 'middle-right', label: 'Giữa - Phải' },
  { id: 'bottom-left', label: 'Dưới - Trái' },
  { id: 'bottom-center', label: 'Dưới - Giữa' },
  { id: 'bottom-right', label: 'Dưới - Phải' },
];

export const WatermarkControls: React.FC<WatermarkControlsProps> = ({
  settings,
  onChange,
  onDownload,
  onCopyClipboard,
  isExporting,
}) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportQuality, setExportQuality] = useState<number>(0.92);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'position' | 'style' | 'advanced'>('position');

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

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col divide-y divide-slate-100 overflow-hidden">
      {/* 1. PRIMARY INPUT: Ô ĐIỀN WATERMARK */}
      <div className="p-5 sm:p-6 bg-gradient-to-b from-blue-50/40 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="watermark-text-input"
            className="text-sm font-bold text-slate-900 flex items-center gap-1.5"
          >
            <Type className="w-4 h-4 text-blue-600" />
            <span>Nội dung Watermark</span>
          </label>
          {settings.text && (
            <button
              id="btn-clear-watermark-text"
              type="button"
              onClick={() => onChange({ text: '' })}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa chữ</span>
            </button>
          )}
        </div>

        <div className="relative">
          <textarea
            id="watermark-text-input"
            rows={2}
            value={settings.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="Nhập chữ chèn vào ảnh (VD: © 2026 Tên Tác Giả, SĐT, Ký tên...)"
            className="w-full rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-500/15 p-3 text-slate-800 text-sm placeholder:text-slate-400 resize-none font-medium transition-all shadow-inner bg-white"
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Gợi ý nhanh:
          </span>
          <button
            id="chip-copyright"
            type="button"
            onClick={insertCurrentYear}
            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
          >
            © Bản quyền {new Date().getFullYear()}
          </button>
          <button
            id="chip-donotcopy"
            type="button"
            onClick={() => handleInsertPreset('DO NOT COPY')}
            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
          >
            DO NOT COPY
          </button>
          <button
            id="chip-confidential"
            type="button"
            onClick={() => handleInsertPreset('BẢN XEM TRƯỚC')}
            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
          >
            Bản xem trước
          </button>
        </div>
      </div>

      {/* 2. TABBED SETTINGS: VỊ TRÍ - KIỂU DÁNG - NÂNG CAO */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Sub-tabs header */}
        <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
          <button
            id="tab-btn-position"
            type="button"
            onClick={() => setActiveTab('position')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'position'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Vị trí</span>
          </button>
          <button
            id="tab-btn-style"
            type="button"
            onClick={() => setActiveTab('style')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'style'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Màu & Phông</span>
          </button>
          <button
            id="tab-btn-advanced"
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'advanced'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Nâng cao</span>
          </button>
        </div>

        {/* TAB 1: VỊ TRÍ */}
        {activeTab === 'position' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">
                Chọn kiểu bố cục vị trí
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-mode-grid"
                  type="button"
                  onClick={() => onChange({ position: 'bottom-right' })}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    settings.position !== 'tile' && settings.position !== 'custom'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  <span>9 Góc cố định</span>
                </button>

                <button
                  id="btn-mode-tile"
                  type="button"
                  onClick={() =>
                    onChange({
                      position: 'tile',
                      rotation: settings.rotation === 0 ? -30 : settings.rotation,
                      opacity: Math.min(settings.opacity, 0.4),
                    })
                  }
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    settings.position === 'tile'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Lặp toàn ảnh (Tile)</span>
                </button>
              </div>
            </div>

            {/* If 9-grid position */}
            {settings.position !== 'tile' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">
                    Bấm vào ô để chọn vị trí trên ảnh:
                  </span>
                  <button
                    id="btn-pos-custom"
                    type="button"
                    onClick={() => onChange({ position: 'custom' })}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      settings.position === 'custom'
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-blue-600 hover:underline'
                    }`}
                  >
                    Kéo thả tự do
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 w-full max-w-[240px] mx-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {POSITIONS.map((pos) => {
                    const isSelected = settings.position === pos.id;
                    return (
                      <button
                        key={pos.id}
                        id={`btn-pos-${pos.id}`}
                        type="button"
                        onClick={() => onChange({ position: pos.id })}
                        title={pos.label}
                        className={`h-9 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center ${
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
                {settings.position === 'custom' && (
                  <p className="text-center text-xs text-blue-600 mt-2 flex items-center justify-center gap-1">
                    <Move className="w-3.5 h-3.5" />
                    Bấm hoặc kéo trực tiếp trên ảnh bên trái để đặt watermark
                  </p>
                )}
              </div>
            )}

            {/* Tile Density if Tile mode is active */}
            {settings.position === 'tile' && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-xs font-semibold text-slate-700 mb-2 block">
                  Mật độ lặp lại
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as TileDensity[]).map((density) => (
                    <button
                      key={density}
                      id={`btn-density-${density}`}
                      type="button"
                      onClick={() => onChange({ tileDensity: density })}
                      className={`py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        settings.tileDensity === density
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {density === 'low'
                        ? 'Thưa'
                        : density === 'medium'
                        ? 'Vừa'
                        : 'Dày'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size & Opacity Sliders */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                  <span>Kích thước chữ ({settings.fontSizePercent}%)</span>
                  <span className="text-slate-400">Tỷ lệ theo ảnh</span>
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
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                  <span>Độ trong suốt ({Math.round(settings.opacity * 100)}%)</span>
                  <span className="text-slate-400">
                    {settings.opacity < 0.4
                      ? 'Mờ nhẹ'
                      : settings.opacity > 0.8
                      ? 'Rõ nét'
                      : 'Chuẩn'}
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
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MÀU SẮC & PHÔNG CHỮ */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Color selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">
                Màu sắc chữ
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((col) => (
                  <button
                    key={col.value}
                    id={`btn-color-${col.name}`}
                    type="button"
                    onClick={() => onChange({ color: col.value })}
                    title={col.name}
                    className={`w-8 h-8 rounded-full transition-transform flex items-center justify-center ${
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
                        className={`w-4 h-4 ${
                          col.value === '#ffffff' ? 'text-black' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
                {/* Custom color picker */}
                <label
                  htmlFor="custom-color-picker"
                  className="w-8 h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-blue-500 overflow-hidden relative"
                  title="Chọn mã màu riêng"
                >
                  <input
                    id="custom-color-picker"
                    type="color"
                    value={settings.color}
                    onChange={(e) => onChange({ color: e.target.value })}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                  />
                  <Palette className="w-4 h-4 text-slate-600" />
                </label>
              </div>
            </div>

            {/* Font selector */}
            <div>
              <label
                htmlFor="select-font-family"
                className="text-xs font-semibold text-slate-700 mb-1.5 block"
              >
                Kiểu phông chữ
              </label>
              <select
                id="select-font-family"
                value={settings.fontFamily}
                onChange={(e) => onChange({ fontFamily: e.target.value })}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick styles: Bold, Italic, Uppercase */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block">
                Định dạng chữ
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="btn-format-bold"
                  type="button"
                  onClick={() => onChange({ bold: !settings.bold })}
                  className={`py-2 text-xs rounded-xl border font-bold transition-colors ${
                    settings.bold
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Đậm (B)
                </button>

                <button
                  id="btn-format-italic"
                  type="button"
                  onClick={() => onChange({ italic: !settings.italic })}
                  className={`py-2 text-xs rounded-xl border italic font-medium transition-colors ${
                    settings.italic
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Nghiêng (I)
                </button>

                <button
                  id="btn-format-caps"
                  type="button"
                  onClick={() => onChange({ uppercase: !settings.uppercase })}
                  className={`py-2 text-xs rounded-xl border uppercase font-medium transition-colors ${
                    settings.uppercase
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  IN HOA (AA)
                </button>
              </div>
            </div>

            {/* Contrast Stroke and Shadow */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Đổ bóng (Drop Shadow)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Giúp watermark nổi bật trên nền trùng màu
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

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Viền chữ tương phản (Stroke)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Đường viền bảo vệ chữ luôn đọc rõ ràng
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
          </div>
        )}

        {/* TAB 3: NÂNG CAO (XOAY, KHOẢNG CÁCH VIỀN) */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Rotation slider & presets */}
            <div>
              <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                  Góc xoay ({settings.rotation}°)
                </span>
                <button
                  type="button"
                  onClick={() => onChange({ rotation: 0 })}
                  className="text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  Đặt lại 0°
                </button>
              </div>
              <input
                id="slider-rotation"
                type="range"
                min={-180}
                max={180}
                step={5}
                value={settings.rotation}
                onChange={(e) =>
                  onChange({ rotation: parseInt(e.target.value) })
                }
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg mb-2"
              />
              <div className="flex items-center gap-1.5 justify-center">
                {[-45, -30, 0, 30, 45, 90].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => onChange({ rotation: deg })}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium ${
                      settings.rotation === deg
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
            {settings.position !== 'tile' && settings.position !== 'custom' && (
              <div>
                <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                  <span>Khoảng cách mép ảnh ({settings.paddingPercent}%)</span>
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
                  className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
              </div>
            )}

            {/* Stroke styling if enabled */}
            {settings.hasStroke && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    Màu viền chữ:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['#000000', '#ffffff', '#ef4444', '#2563eb'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onChange({ strokeColor: c })}
                        className={`w-5 h-5 rounded-full border ${
                          settings.strokeColor === c ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Độ dày viền ({settings.strokeWidth}px)</span>
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

      {/* 3. QUICK DOWNLOAD ACTION: TẢI XUỐNG NHANH CHÓNG */}
      <div className="p-5 sm:p-6 bg-slate-50/70 border-t border-slate-200/80 space-y-3">
        {/* Format Selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Định dạng xuất:</span>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            {(['png', 'jpeg', 'webp'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                id={`btn-format-${fmt}`}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
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

        {/* Quality slider for JPG/WebP */}
        {exportFormat !== 'png' && (
          <div className="pt-1">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Chất lượng nén: {Math.round(exportQuality * 100)}%</span>
              <span className="text-slate-400">
                {exportQuality > 0.9 ? 'Chất lượng cao' : 'Dung lượng nhẹ'}
              </span>
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
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          <span>Tải ảnh về máy ngay (Download)</span>
          <span className="text-[10px] uppercase font-normal tracking-wide px-1.5 py-0.5 rounded bg-white/20 ml-1">
            Ctrl + S
          </span>
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
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Đã sao chép ảnh vào Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Sao chép ảnh (Dán ngay vào tin nhắn, văn bản)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
