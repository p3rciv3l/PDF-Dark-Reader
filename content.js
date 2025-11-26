(() => {
  let globalEnabled = false;
  let globalMode = 'system'; // Default to system
  let siteOverride = false;
  let siteMode = 'system';
  
  const siteKey = location.hostname + location.pathname;
  
  const isSystemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const isPDF = () => {
    const url = location.href.toLowerCase();
    return url.includes('.pdf') || 
           document.contentType === 'application/pdf' || 
           !!document.querySelector('embed[type="application/pdf"], pdf-viewer') ||
           (document.body?.children.length === 1 && document.body.children[0]?.tagName === 'EMBED');
  };

  const FILTERS = {
    invert: 'invert(1) hue-rotate(180deg)',
    system: null // Uses invert when system is dark
  };

  const getStyle = () => {
    let el = document.getElementById('pdf-inv');
    if (!el) {
      el = document.createElement('style');
      el.id = 'pdf-inv';
      (document.head || document.documentElement).appendChild(el);
    }
    return el;
  };

  const getCurrentMode = () => siteOverride ? siteMode : globalMode;
  
  const getEffectiveFilter = (mode) => {
    if (mode === 'system') {
      return isSystemDark() ? FILTERS.invert : 'none';
    }
    return FILTERS[mode] || FILTERS.invert;
  };
  
  const shouldBeEnabled = () => {
    const mode = getCurrentMode();
    if (mode === 'system' && !isSystemDark()) return false;
    return globalEnabled;
  };

  const update = () => {
    const style = getStyle();
    const mode = getCurrentMode();
    const filter = getEffectiveFilter(mode);
    
    if (globalEnabled && isPDF() && filter !== 'none') {
      style.textContent = `embed, pdf-viewer { filter: ${filter} !important; }`;
    } else {
      style.textContent = '';
    }
  };

  const toast = (msg) => {
    let t = document.getElementById('pdf-inv-toast');
    if (!t) {
      t = document.createElement('div'); 
      t.id = 'pdf-inv-toast';
      t.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;padding:.875rem 1.5rem;background:#1a1a1a;color:#fff;font:500 .875rem system-ui;border-radius:.75rem;box-shadow:0 .5rem 2rem #0006;z-index:2147483647;opacity:0;transform:translateY(1rem);transition:all .3s';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1'; 
    t.style.transform = 'translateY(0)';
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(1rem)'; }, 2000);
  };

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'setGlobalEnabled') {
      globalEnabled = msg.enabled;
      update();
      toast(globalEnabled ? 'Extension ON' : 'Extension OFF');
    }
    else if (msg.action === 'setSiteOverride') {
      siteOverride = msg.enabled;
      if (siteOverride) {
        siteMode = getCurrentMode();
        chrome.storage.sync.set({ ['site_' + siteKey]: { mode: siteMode } }, () => {
          chrome.runtime.sendMessage({ action: 'stateChanged' }).catch(() => {});
        });
        toast('Custom settings for this PDF');
      } else {
        chrome.storage.sync.remove('site_' + siteKey, () => {
          chrome.runtime.sendMessage({ action: 'stateChanged' }).catch(() => {});
        });
        toast('Using global settings');
      }
      update();
    }
    else if (msg.action === 'toggleSiteOverride') {
      siteOverride = !siteOverride;
      if (siteOverride) {
        siteMode = getCurrentMode();
        chrome.storage.sync.set({ ['site_' + siteKey]: { mode: siteMode } }, () => {
          // Notify popup to refresh after storage update
          chrome.runtime.sendMessage({ action: 'stateChanged' }).catch(() => {});
        });
        toast('Custom settings for this PDF');
      } else {
        chrome.storage.sync.remove('site_' + siteKey, () => {
          // Notify popup to refresh after storage update
          chrome.runtime.sendMessage({ action: 'stateChanged' }).catch(() => {});
        });
        toast('Using global settings');
      }
      update();
    }
    else if (msg.action === 'setMode') {
      if (siteOverride) {
        siteMode = msg.mode;
        chrome.storage.sync.set({ ['site_' + siteKey]: { mode: siteMode } });
      } else {
        globalMode = msg.mode;
        chrome.storage.sync.set({ globalMode: globalMode });
      }
      update();
      toast('Mode: ' + msg.mode);
    }
    else if (msg.action === 'getState') {
      sendResponse({ 
        globalEnabled, 
        globalMode,
        siteOverride, 
        siteMode,
        currentMode: getCurrentMode(),
        effectivelyEnabled: shouldBeEnabled(),
        isSystemDark: isSystemDark(),
        isPDF: isPDF(),
        siteKey
      });
      return true;
    }
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getCurrentMode() === 'system') update();
  });

  // Init
  chrome.storage.sync.get(['globalEnabled', 'globalMode', 'site_' + siteKey], (r) => {
    globalEnabled = r.globalEnabled === true;
    globalMode = r.globalMode || 'system';
    
    const siteData = r['site_' + siteKey];
    if (siteData) {
      siteOverride = true;
      siteMode = siteData.mode || 'system';
    }
    
    if (isPDF()) update();
  });
})();
