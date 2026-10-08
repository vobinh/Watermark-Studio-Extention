import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Sidebar,
  Settings as SettingsIcon,
  Check,
  Languages,
  Trash2,
} from 'lucide-react';
import { ViewMode, Language } from '../types';
import { getDefaultViewMode, setDefaultViewMode as saveDefaultViewMode } from '../utils/storage';
import { useTranslation } from '../utils/i18n';

interface HeaderProps {
  currentMode: ViewMode;
  lang: Language;
  onLanguageChange: (newLang: Language) => void;
  hasImage: boolean;
  onChangeImage?: () => void;
  onReset: () => void;
  onLoadSample: () => void;
  onSwitchMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  lang,
  onLanguageChange,
  hasImage,
  onChangeImage,
  onReset,
  onLoadSample,
  onSwitchMode,
}) => {
  const { t } = useTranslation(lang);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [preferredMode, setPreferredMode] = useState<ViewMode>('sidepanel');

  useEffect(() => {
    getDefaultViewMode().then((mode) => setPreferredMode(mode));
  }, []);

  const handleSelectDefaultMode = async (mode: ViewMode) => {
    setPreferredMode(mode);
    await saveDefaultViewMode(mode);
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    onLanguageChange(nextLang);
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="w-full px-3 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                  {t('brandTitle')}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                  <Sparkles className="w-2.5 h-2.5" /> {t('extensionBadge')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                {currentMode === 'sidepanel'
                  ? t('sidepanelSubtitle')
                  : t('fulltabSubtitle')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Language Toggle Pill */}
            <button
              id="btn-quick-toggle-lang"
              type="button"
              onClick={toggleLanguage}
              className="px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
              title={lang === 'vi' ? 'Chuyển sang English' : 'Switch to Tiếng Việt'}
            >
              <Languages className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'vi' ? 'EN' : 'VI'}</span>
            </button>

            {/* Mode Switcher Button */}
            <button
              id="btn-switch-view-mode"
              type="button"
              onClick={onSwitchMode}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              title={
                currentMode === 'sidepanel'
                  ? t('openFullTab')
                  : t('openSidePanel')
              }
            >
              {currentMode === 'sidepanel' ? (
                <>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden xs:inline">{t('openFullTab')}</span>
                </>
              ) : (
                <>
                  <Sidebar className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden xs:inline">{t('openSidePanel')}</span>
                </>
              )}
            </button>

            {/* Quick Action: Reset or Sample */}
            {!hasImage ? (
              <button
                id="btn-header-sample"
                onClick={onLoadSample}
                type="button"
                className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 rounded-lg transition-colors flex items-center gap-1.5"
                title={t('sampleImageBtn')}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">{t('sampleImageBtn')}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  id="btn-header-change-image"
                  type="button"
                  onClick={onChangeImage || onReset}
                  className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  title={t('changeImageBtn')}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">{t('changeImageBtn')}</span>
                </button>
                <button
                  id="btn-header-reset"
                  type="button"
                  onClick={onReset}
                  className="p-1.5 text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center justify-center"
                  title={t('removeImageBtn')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Extension Settings Modal Trigger */}
            <button
              id="btn-open-settings"
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title={t('settingsBtnTitle')}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-blue-600" />
              {t('settingsTitle')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t('settingsDesc')}
            </p>

            {/* Language Selection */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-blue-600" />
                {t('languageLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onLanguageChange('vi')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    lang === 'vi'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span>🇻🇳 Tiếng Việt</span>
                  {lang === 'vi' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    lang === 'en'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span>🇬🇧 English</span>
                  {lang === 'en' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>
            </div>

            {/* Display Mode Selection */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                {t('defaultModeLabel')}
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelectDefaultMode('sidepanel')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between gap-2.5 transition-all ${
                    preferredMode === 'sidepanel'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <Sidebar className="w-3.5 h-3.5 text-blue-600" />
                      {t('sidePanelOptionTitle')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {t('sidePanelOptionDesc')}
                    </div>
                  </div>
                  {preferredMode === 'sidepanel' && (
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectDefaultMode('fulltab')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start justify-between gap-2.5 transition-all ${
                    preferredMode === 'fulltab'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      {t('fullTabOptionTitle')}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {t('fullTabOptionDesc')}
                    </div>
                  </div>
                  {preferredMode === 'fulltab' && (
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> {t('autoSaved')}
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                {t('closeBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
