const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Key symbol map
const KEY_SYMBOLS = {
  'command': '⌘', 'cmd': '⌘', 'meta': '⌘', '⌘': '⌘',
  'ctrl': '⌃', 'control': '⌃', '⌃': '⌃',
  'alt': '⌥', 'option': '⌥', '⌥': '⌥',
  'shift': '⇧', '⇧': '⇧',
  'arrowup': '↑', 'arrowdown': '↓', 'arrowleft': '←', 'arrowright': '→',
  'backspace': '⌫', 'delete': '⌦', 'enter': '⏎', 'tab': '⇥',
  'escape': '⎋', 'space': '␣'
};

const MODIFIER_KEYS = new Set(['⌘', '⌃', '⌥', '⇧', 'command', 'cmd', 'ctrl', 'control', 'alt', 'option', 'shift', 'meta']);

let state = {
  globalEnabled: false,
  globalMode: 'invert',
  siteOverride: false,
  currentMode: 'invert',
  effectivelyEnabled: false,
  isPDF: false
};

function sendToTab(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, msg, function() {
        if (chrome.runtime.lastError) {}
      });
    }
  });
}

function updateTheme() {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = state.globalEnabled && systemDark;
  
  document.body.style.background = isDark ? '#000000' : '#ffffff';
  document.documentElement.style.setProperty('--fg', isDark ? '#f0f0f0' : '#1a1a1a');
  document.documentElement.style.setProperty('--fg2', isDark ? '#f0f0f0' : '#1a1a1a');
  document.documentElement.style.setProperty('--bg2', isDark ? '#282828' : '#e8e8e8');
  document.documentElement.style.setProperty('--bg', isDark ? '#000000' : '#ffffff');
  document.documentElement.style.setProperty('--bdr', isDark ? '#ffffff30' : '#00000020');
  // Universal border: light grey for both modes
  document.documentElement.style.setProperty('--key-border', '#cccccc');
  // Modifier keys: light grey bg in light mode, dark grey bg in dark mode
  document.documentElement.style.setProperty('--mod-bg', isDark ? '#333333' : '#e0e0e0');
}

function updateUI() {
  const mode = state.currentMode;
  const isFiltering = state.effectivelyEnabled;
  
  $('#dot').className = 'dot' + (isFiltering ? ' on' : ' off');
  $('#status').textContent = isFiltering ? 'Active' : 'No Filter';
  $('#global').checked = state.globalEnabled;
  $('#site').checked = state.siteOverride;
  
  $$('[data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
  $('#siteRow').classList.toggle('hidden', !state.isPDF);
  updateTheme();
}

function getKeySymbol(key) {
  const k = key.toLowerCase();
  if (KEY_SYMBOLS[k]) return KEY_SYMBOLS[k];
  if (KEY_SYMBOLS[key]) return KEY_SYMBOLS[key];
  return key.toUpperCase();
}

function isModifier(key) {
  return MODIFIER_KEYS.has(key.toLowerCase());
}

function parseShortcut(shortcut) {
  if (!shortcut) return null;
  
  console.log('Raw shortcut from Chrome:', shortcut);
  
  // If it contains +, split by + (format: "Shift+Command+Z")
  if (shortcut.includes('+')) {
    const parts = shortcut.split('+');
    const result = parts.map(part => getKeySymbol(part.trim()));
    console.log('Parsed (+ split):', result);
    return result;
  }
  
  // Otherwise tokenize character by character (format: "⇧⌘Z")
  // Known modifier symbols
  const modifierSymbols = new Set(['⌘', '⌃', '⌥', '⇧', '⏎', '⇥', '⎋', '⌫', '⌦']);
  
  const tokens = [];
  const chars = [...shortcut]; // Spread to handle Unicode properly
  
  for (const char of chars) {
    if (modifierSymbols.has(char)) {
      // It's a known symbol, add as its own token
      tokens.push(char);
    } else if (/[A-Za-z0-9]/.test(char)) {
      // It's an alphanumeric character
      tokens.push(char.toUpperCase());
    } else if (char.trim()) {
      // Some other character (arrow keys, etc)
      tokens.push(char);
    }
  }
  
  console.log('Parsed (tokenized):', tokens);
  return tokens;
}

function renderShortcut(el, shortcut) {
  el.innerHTML = '';
  
  if (!shortcut) {
    el.innerHTML = '<span class="not-set">Not set</span>';
    el.classList.add('empty');
    return;
  }
  
  el.classList.remove('empty');
  const keys = parseShortcut(shortcut);
  
  console.log('Rendering keys:', keys);
  
  keys.forEach(key => {
    const span = document.createElement('span');
    span.className = 'key';
    // If it's a single alphanumeric character, it's a char key (orange)
    // Otherwise it's a modifier/special key (theme colored)
    const isCharKey = /^[A-Z0-9]$/i.test(key);
    console.log('Key:', key, 'isCharKey:', isCharKey);
    if (!isCharKey) {
      span.classList.add('mod');
    }
    span.textContent = key;
    el.appendChild(span);
  });
  
  console.log('Final HTML:', el.innerHTML);
}

function loadShortcuts() {
  chrome.commands.getAll(function(commands) {
    console.log('Commands from Chrome:', commands);
    commands.forEach(cmd => {
      console.log('Command:', cmd.name, 'Shortcut:', cmd.shortcut);
      if (cmd.name === 'toggle-site') {
        renderShortcut($('#keybindSite'), cmd.shortcut);
      } else if (cmd.name === 'toggle-global') {
        renderShortcut($('#keybindGlobal'), cmd.shortcut);
      }
    });
  });
}

function openChromeShortcuts() {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
}

function refresh() {
  chrome.storage.sync.get(['globalEnabled', 'globalMode'], function(r) {
    state.globalEnabled = r.globalEnabled === true;
    state.globalMode = r.globalMode || 'invert';
    state.currentMode = state.globalMode;
    updateUI();
  });
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getState' }, function(r) {
      if (chrome.runtime.lastError || !r) return;
      state.globalEnabled = r.globalEnabled;
      state.globalMode = r.globalMode;
      state.siteOverride = r.siteOverride;
      state.currentMode = r.currentMode;
      state.effectivelyEnabled = r.effectivelyEnabled;
      state.isPDF = r.isPDF;
      updateUI();
    });
  });
}

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#' + id).classList.add('active');
  
  // Reload shortcuts when opening advanced screen
  if (id === 'advancedScreen') {
    loadShortcuts();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  $('#openAdvanced').addEventListener('click', () => showScreen('advancedScreen'));
  $('#backBtn').addEventListener('click', () => showScreen('mainScreen'));
  
  $$('[data-m]').forEach(function(b) {
    b.addEventListener('click', function() {
      state.currentMode = b.dataset.m;
      sendToTab({ action: 'setMode', mode: b.dataset.m });
      chrome.storage.sync.set({ globalMode: b.dataset.m });
      updateUI();
    });
  });

  $('#globalSwitch').addEventListener('click', function() {
    state.globalEnabled = !state.globalEnabled;
    $('#global').checked = state.globalEnabled;
    chrome.storage.sync.set({ globalEnabled: state.globalEnabled });
    sendToTab({ action: 'setGlobalEnabled', enabled: state.globalEnabled });
    updateTheme();
    setTimeout(refresh, 100);
  });

  $('#siteSwitch').addEventListener('click', function() {
    state.siteOverride = !state.siteOverride;
    $('#site').checked = state.siteOverride;
    sendToTab({ action: 'setSiteOverride', enabled: state.siteOverride });
    updateUI();
  });

  // All keybind elements open Chrome shortcuts
  $('#keybindSite').addEventListener('click', openChromeShortcuts);
  $('#keybindGlobal').addEventListener('click', openChromeShortcuts);
  $('#openChromeShortcuts').addEventListener('click', openChromeShortcuts);
  
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);

  refresh();
  loadShortcuts();
});
