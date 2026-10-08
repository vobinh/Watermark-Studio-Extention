import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Clipboard } from 'lucide-react';

interface UploadZoneProps {
  onImageSelected: (file: File) => void;
  onLoadSample: () => void;
  isLoading?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onImageSelected,
  onLoadSample,
  isLoading = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith('image/')) {
      onImageSelected(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            onImageSelected(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onImageSelected]);

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4">
      <div
        id="upload-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/60 scale-[1.01] shadow-lg shadow-blue-500/10'
            : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/60 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="file-upload-input"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110 ${
              isDragOver
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}
          >
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Tải ảnh của bạn lên
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Kéo và thả ảnh vào đây, hoặc{' '}
            <span className="text-blue-600 font-semibold underline decoration-blue-300 underline-offset-2">
              bấm để chọn từ máy tính
            </span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="btn-upload-browse"
              type="button"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Chọn ảnh từ máy</span>
            </button>

            <button
              id="btn-upload-sample"
              type="button"
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium text-sm transition-all flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample();
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Thử bằng ảnh mẫu</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 w-full flex flex-wrap items-center justify-around gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clipboard className="w-3.5 h-3.5 text-slate-400" />
              Hỗ trợ phím tắt <strong>Ctrl+V</strong> để dán ảnh
            </span>
            <span>Hỗ trợ PNG, JPG, JPEG, WEBP, SVG</span>
            <span>Độ phân giải gốc giữ nguyên 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
