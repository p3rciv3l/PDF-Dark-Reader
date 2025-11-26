# PDF Color Inverter - Chrome Extension

A Chrome extension that replicates Adobe Acrobat's "Document Colors Options" functionality, allowing you to invert PDF colors with a keyboard shortcut.

## Features

- **Toggle PDF color inversion** with `Cmd+Shift+Y` (Mac) / `Ctrl+Shift+Y` (Windows/Linux)
- **Cycle through color modes** with `Cmd+Shift+U` (Mac) / `Ctrl+Shift+U` (Windows/Linux)
- **4 Color Modes:**
  - **Invert** - Full color inversion with hue rotation (preserves image colors)
  - **Dark** - Softer inversion with enhanced contrast
  - **Sepia** - Warm, sepia-toned dark mode
  - **Custom** - Set your own background and text colors
- **Auto-enable option** - Automatically activate on PDF pages
- **Visual notification** - Shows current mode when toggling

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `pdf_invert` folder
5. The extension is now installed!

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Shift + Y` | Toggle color inversion on/off |
| `Cmd/Ctrl + Shift + U` | Cycle through color modes |

### Popup Menu

Click the extension icon to access:
- Toggle button
- Mode selection (Invert, Dark, Sepia, Custom)
- Custom color pickers for background and text
- Auto-enable setting

## Customizing Keyboard Shortcuts

If the default shortcuts conflict with other extensions:

1. Go to `chrome://extensions/shortcuts`
2. Find "PDF Color Inverter"
3. Click the pencil icon to set your preferred shortcuts

## How It Works

The extension applies CSS filters to invert the colors of PDF documents viewed in Chrome's built-in PDF viewer. Images and media are double-inverted to preserve their original colors.

This mimics Adobe Acrobat's "Replace Document Colors" feature with the "Custom Color" option, giving you control over page background and text colors.

## Comparison to Adobe Acrobat

| Adobe Feature | Extension Equivalent |
|---------------|---------------------|
| Replace Document Colors | Toggle with shortcut |
| High-Contrast colors | "Invert" or "Dark" mode |
| Custom Color (Background) | Custom mode + color picker |
| Custom Color (Text) | Custom mode + color picker |

## Troubleshooting

**Extension not working on a PDF?**
- Make sure you're viewing a PDF directly in Chrome (not embedded in another page)
- Try refreshing the page after installing the extension

**Shortcut not working?**
- Check `chrome://extensions/shortcuts` to verify the shortcuts are set
- Some websites may capture keyboard shortcuts - try on a different PDF

**Colors look wrong?**
- Try cycling through modes with `Cmd/Ctrl + Shift + U`
- The "Custom" mode gives you full control over colors

## License

MIT License - Feel free to modify and distribute!

