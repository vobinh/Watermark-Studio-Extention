import { WatermarkSettings, ViewMode, PendingImageInfo, Language } from '../types';

export const DEFAULT_SETTINGS: WatermarkSettings = {
  watermarkType: 'text',
  text: '© Bản quyền hình ảnh',
  fontSizePercent: 4,
  fontFamily: 'system-ui',
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
  logoDataUrl: null,
  logoName: null,
  logoScalePercent: 16,
  logoOpacity: 0.85,
  logoRotation: 0,
  logoHasShadow: true,
  logoShadowColor: 'rgba(0, 0, 0, 0.6)',
  logoShape: 'original',
  logoBorderWidth: 0,
  logoBorderColor: '#ffffff',
  position: 'bottom-right',
  customX: 50,
  customY: 50,
  paddingPercent: 4,
  tileDensity: 'medium',
};

// Check if running in Chrome extension context
function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

/**
 * Load saved watermark settings
 */
export async function loadSavedSettings(): Promise<WatermarkSettings> {
  if (isChromeExtension()) {
    try {
      const res = await chrome.storage.local.get('watermarkSettings');
      if (res.watermarkSettings && typeof res.watermarkSettings === 'object') {
        return { ...DEFAULT_SETTINGS, ...(res.watermarkSettings as Partial<WatermarkSettings>) };
      }
    } catch (e) {
      console.warn('Lỗi khi tải cài đặt từ chrome.storage:', e);
    }
  } else {
    try {
      const stored = localStorage.getItem('watermarkSettings');
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save watermark settings
 */
export async function saveUserSettings(settings: WatermarkSettings): Promise<void> {
  if (isChromeExtension()) {
    try {
      await chrome.storage.local.set({ watermarkSettings: settings });
    } catch (e) {
      console.warn('Lỗi khi lưu cài đặt vào chrome.storage:', e);
    }
  } else {
    try {
      localStorage.setItem('watermarkSettings', JSON.stringify(settings));
    } catch {}
  }
}

/**
 * Get preferred default view mode ('sidepanel' | 'fulltab')
 */
export async function getDefaultViewMode(): Promise<ViewMode> {
  if (isChromeExtension()) {
    try {
      const res = await chrome.storage.local.get('defaultViewMode');
      if (res.defaultViewMode === 'fulltab' || res.defaultViewMode === 'sidepanel') {
        return res.defaultViewMode;
      }
    } catch {}
  } else {
    const mode = localStorage.getItem('defaultViewMode');
    if (mode === 'fulltab' || mode === 'sidepanel') return mode;
  }
  return 'sidepanel';
}

/**
 * Save preferred default view mode
 */
export async function setDefaultViewMode(mode: ViewMode): Promise<void> {
  if (isChromeExtension()) {
    try {
      await chrome.storage.local.set({ defaultViewMode: mode });
    } catch {}
  } else {
    localStorage.setItem('defaultViewMode', mode);
  }
}

/**
 * Get preferred language ('vi' | 'en')
 */
export async function getPreferredLanguage(): Promise<Language> {
  if (isChromeExtension()) {
    try {
      const res = await chrome.storage.local.get('preferredLanguage');
      if (res.preferredLanguage === 'vi' || res.preferredLanguage === 'en') {
        return res.preferredLanguage;
      }
    } catch {}
  } else {
    const lang = localStorage.getItem('preferredLanguage');
    if (lang === 'vi' || lang === 'en') return lang;
  }
  // Check browser language or default to 'vi'
  if (typeof navigator !== 'undefined' && navigator.language && !navigator.language.startsWith('vi')) {
    return 'en';
  }
  return 'vi';
}

/**
 * Save preferred language
 */
export async function setPreferredLanguage(lang: Language): Promise<void> {
  if (isChromeExtension()) {
    try {
      await chrome.storage.local.set({ preferredLanguage: lang });
    } catch {}
  } else {
    localStorage.setItem('preferredLanguage', lang);
  }
}

/**
 * Get pending image dispatched by context menu
 */
export async function getPendingImage(): Promise<PendingImageInfo | null> {
  if (isChromeExtension()) {
    try {
      const res = await chrome.storage.local.get('pendingImage');
      if (res.pendingImage) {
        return res.pendingImage as PendingImageInfo;
      }
    } catch {}
  }
  return null;
}

/**
 * Clear pending image after loaded
 */
export async function clearPendingImage(): Promise<void> {
  if (isChromeExtension()) {
    try {
      await chrome.storage.local.remove('pendingImage');
    } catch {}
  }
}

/**
 * Save active image session to transfer between SidePanel and FullTab
 */
export async function saveActiveImageSession(data: { dataUrl: string; name: string }): Promise<void> {
  if (isChromeExtension()) {
    try {
      await chrome.storage.local.set({
        activeSessionImage: {
          ...data,
          timestamp: Date.now(),
        },
      });
    } catch {}
  }
}

/**
 * Get active image session
 */
export async function getActiveImageSession(): Promise<{ dataUrl: string; name: string } | null> {
  if (isChromeExtension()) {
    try {
      const res = await chrome.storage.local.get('activeSessionImage');
      return (res.activeSessionImage as { dataUrl: string; name: string }) || null;
    } catch {}
  }
  return null;
}

/**
 * Clear active image session when user resets or closes image
 */
export async function clearActiveImageSession(): Promise<void> {
  if (isChromeExtension()) {
    try {
      await chrome.storage.local.remove('activeSessionImage');
    } catch {}
  } else {
    localStorage.removeItem('activeSessionImage');
  }
}

