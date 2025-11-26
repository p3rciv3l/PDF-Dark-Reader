// Store custom keybinds
let keybinds = {
  'toggle-site': { keys: ['Meta', 'Shift', 'Z'], code: 'KeyZ', key: 'z' },
  'toggle-global': { keys: ['Meta', 'Shift', 'X'], code: 'KeyX', key: 'x' }
};

// Load keybinds from storage
chrome.storage.sync.get(['keybinds'], function(r) {
  if (r.keybinds) {
    keybinds = r.keybinds;
  }
});

// Listen for keybind updates from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'updateKeybind') {
    keybinds[msg.command] = msg.keybind;
    sendResponse({ success: true });
  }
  return true;
});

// Handle Chrome's built-in command shortcuts
chrome.commands.onCommand.addListener(function(command) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0]) return;
    
    if (command === 'toggle-global') {
      chrome.storage.sync.get(['globalEnabled'], function(r) {
        var newEnabled = !(r.globalEnabled === true);
        chrome.storage.sync.set({ globalEnabled: newEnabled });
        chrome.tabs.sendMessage(tabs[0].id, { action: 'setGlobalEnabled', enabled: newEnabled }, function() {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
        // Notify popup to refresh
        chrome.runtime.sendMessage({ action: 'stateChanged' }).catch(() => {});
      });
    } else if (command === 'toggle-site') {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleSiteOverride' }, function() {
        if (chrome.runtime.lastError) { /* ignore */ }
        // Notify popup to refresh after a short delay to allow storage update
        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'stateChanged' }).catch(() => {});
        }, 100);
      });
    }
  });
});
