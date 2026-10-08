import React from 'react';
import { ShieldCheck, Image as ImageIcon, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  hasImage: boolean;
  onReset: () => void;
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasImage,
  onReset,
  onLoadSample,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-lg tracking-tight">
                Watermark Studio
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                <Sparkles className="w-3 h-3" /> Tự động & Nhanh chóng
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              Chèn watermark bản quyền chất lượng gốc, xử lý trực tiếp trên trình duyệt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2.5 py-1.5 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Riêng tư (Không tải lên máy chủ)</span>
          </div>

          {!hasImage ? (
            <button
              id="btn-header-sample"
              onClick={onLoadSample}
              type="button"
              className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Dùng ảnh mẫu</span>
            </button>
          ) : (
            <button
              id="btn-header-reset"
              onClick={onReset}
              type="button"
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              title="Tải ảnh khác"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đổi ảnh khác</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
