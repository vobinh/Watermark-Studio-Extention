/// <reference types="chrome" />

// Utility to convert blob to base64 Data URL
async function fetchImageAsDataUrl(url: string): Promise<{ dataUrl: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không thể tải ảnh (${response.status} ${response.statusText})`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        dataUrl: reader.result as string,
        mimeType: blob.type || 'image/png',
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Extract filename from URL
function getFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const name = pathname.substring(pathname.lastIndexOf('/') + 1);
    if (name && /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(name)) {
      return name;
    }
  } catch {
    // fallback
  }
  return 'web_image_' + Date.now() + '.png';
}

// Configure behavior when clicking extension action icon
async function configureActionBehavior() {
  try {
    const { defaultViewMode } = await chrome.storage.local.get('defaultViewMode');
    const mode = defaultViewMode || 'sidepanel';

    if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
      if (mode === 'sidepanel') {
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
      } else {
        await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
      }
    }
  } catch (err) {
    console.warn('Không thể cài đặt hành vi SidePanel:', err);
  }
}

// Setup or refresh context menus with bilingual titles
async function updateContextMenus() {
  try {
    const { preferredLanguage } = await chrome.storage.local.get('preferredLanguage');
    const isEn = preferredLanguage === 'en';

    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'watermark_image_sidepanel',
        title: isEn
          ? 'Add Watermark (Open Side Panel)'
          : 'Chèn Watermark (Mở thanh bên Side Panel)',
        contexts: ['image'],
      });

      chrome.contextMenus.create({
        id: 'watermark_image_fulltab',
        title: isEn
          ? 'Add Watermark (Open Full Tab)'
          : 'Chèn Watermark (Mở Tab mới đầy đủ)',
        contexts: ['image'],
      });

      chrome.contextMenus.create({
        id: 'watermark_open_fulltab_standalone',
        title: isEn
          ? 'Open Watermark Studio in New Tab'
          : 'Mở Watermark Studio trong Tab mới',
        contexts: ['action'],
      });
    });
  } catch (err) {
    console.warn('Không thể cập nhật Context Menus:', err);
  }
}

// On install or startup
chrome.runtime.onInstalled.addListener(async () => {
  // Ensure defaultViewMode is set
  const { defaultViewMode } = await chrome.storage.local.get('defaultViewMode');
  if (!defaultViewMode) {
    await chrome.storage.local.set({ defaultViewMode: 'sidepanel' });
  }

  await configureActionBehavior();
  await updateContextMenus();
});

chrome.runtime.onStartup.addListener(async () => {
  await configureActionBehavior();
  await updateContextMenus();
});

// React when user changes preferences (ViewMode or Language)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    if (changes.defaultViewMode) {
      configureActionBehavior();
    }
    if (changes.preferredLanguage) {
      updateContextMenus();
    }
  }
});

// Handle clicking extension action icon when sidepanel is NOT configured to open on click
chrome.action.onClicked.addListener(async (tab) => {
  const { defaultViewMode } = await chrome.storage.local.get('defaultViewMode');
  if (defaultViewMode === 'fulltab') {
    chrome.tabs.create({ url: chrome.runtime.getURL('fulltab.html') });
  } else {
    if (tab.windowId && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  }
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const srcUrl = info.srcUrl;

  if (info.menuItemId === 'watermark_open_fulltab_standalone') {
    chrome.tabs.create({ url: chrome.runtime.getURL('fulltab.html') });
    return;
  }

  if (!srcUrl) return;

  try {
    const { dataUrl, mimeType } = await fetchImageAsDataUrl(srcUrl);
    const fileName = getFilenameFromUrl(srcUrl);

    // Save image to storage so newly opened panel or tab can pick it up
    await chrome.storage.local.set({
      pendingImage: {
        dataUrl,
        name: fileName,
        mimeType,
        sourceUrl: srcUrl,
        timestamp: Date.now(),
      },
    });

    if (info.menuItemId === 'watermark_image_sidepanel') {
      if (tab?.windowId && chrome.sidePanel && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
      // Broadcast message to any currently open side panel
      chrome.runtime.sendMessage({
        type: 'LOAD_PENDING_IMAGE',
        dataUrl,
        name: fileName,
      }).catch(() => {});
    } else if (info.menuItemId === 'watermark_image_fulltab') {
      chrome.tabs.create({ url: chrome.runtime.getURL('fulltab.html') });
    }
  } catch (error) {
    console.error('Lỗi khi nạp ảnh từ menu ngữ cảnh:', error);
  }
});

// Support messaging from UI
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'FETCH_EXTERNAL_IMAGE') {
    fetchImageAsDataUrl(message.url)
      .then((res) => sendResponse({ success: true, ...res }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }

  if (message.type === 'OPEN_FULL_TAB') {
    chrome.tabs.create({ url: chrome.runtime.getURL('fulltab.html') });
    sendResponse({ success: true });
  }

  if (message.type === 'OPEN_SIDE_PANEL') {
    chrome.windows.getCurrent((win) => {
      if (win?.id && chrome.sidePanel && chrome.sidePanel.open) {
        chrome.sidePanel.open({ windowId: win.id });
        sendResponse({ success: true });
      }
    });
    return true;
  }
});
