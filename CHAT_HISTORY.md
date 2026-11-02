# Web-Projector Development & Architecture History

This document provides a comprehensive record of all features, enhancements, architecture decisions, and build pipelines implemented in **Web-Projector**. Use this as an authoritative reference whenever resuming or expanding the project.

---

## 1. Project Overview & Architecture

**Web-Projector** is a professional church, stage, and event projection desktop application built for high-performance live presentation of Bible scriptures, worship song lyrics, and media backgrounds.

* **Frontend**: React 19, TypeScript, React Router, TailwindCSS / Vanilla CSS, Framer Motion, Lucide Icons.
* **Desktop Shell**: Electron 44, Node.js embedded HTTP server (`electron/server.cjs`), Electron Preload IPC bridge (`electron/preload.cjs`).
* **Multi-Display Architecture**: Dual-window model (Operator Control Panel on primary display + automated borderless stage projection window on secondary projector/TV display).
* **Packaging & Distribution**: `electron-builder` targeting Windows NSIS Installer and Portable `.exe`.

---

## 2. Key Features Implemented

### A. Dynamic Font Resizing (Auto-Fit) for Scripture Projection
* **Context**: When projecting Bible verses in **Fullscreen Middle** layout (`FS` mode), scriptures vary wildly in length—from 11 characters (*"Jesus wept."*) to 300+ characters (*Revelation 20:4*). Fixed font sizes caused short verses to look lost and long verses to clip off the screen.
* **Implementation** ([OutputView.tsx](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/src/pages/OutputView.tsx) & [LiveContext.tsx](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/src/store/LiveContext.tsx)):
  * Implemented `calculateAutoFitBibleFontSize(text: string): number` based on character length brackets:
    * `len <= 45`: **7.2vw** (e.g. John 11:35)
    * `45 < len <= 85`: **6.4vw – 5.5vw**
    * `85 < len <= 130`: **5.5vw – 4.7vw** (e.g. Matthew 28:18)
    * `130 < len <= 190`: **4.7vw – 4.0vw** (e.g. John 3:16)
    * `190 < len <= 270`: **4.0vw – 3.3vw**
    * `270 < len <= 380`: **3.3vw – 2.7vw**
    * `len > 380`: dynamically scales down to a readable floor (~1.85vw).
  * **Static Reference Font Size**: The scripture reference (e.g., *"JOHN 3:16 KJV"*) remains fixed and constant at its configured size (`refFontSize`), ensuring the book/chapter/verse header is never bloated or deformed.
  * **Clean Verse Text**: Stripped out any prepended verse number badges from the main scripture text for a clean, distraction-free reading experience.

### B. High-Contrast Text Stroke Outline
* **Context**: Stage environments often use bright background images, live video loops, or high-lumen LED walls. Without an outline, white text gets washed out.
* **Implementation** ([panel.css](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/src/styles/panel.css), [ControlPanel.tsx](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/src/pages/ControlPanel.tsx), [OutputView.tsx](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/src/pages/OutputView.tsx)):
  * Used standard CSS `-webkit-text-stroke: {width}vw {color}` combined with `paint-order: stroke fill`.
  * `paint-order: stroke fill` ensures the stroke is painted underneath the text fill, avoiding letter distortion or thinning at high stroke widths.
  * Added controls in the Control Panel:
    * Outline toggle (`enableTextOutline`)
    * Stroke width slider (`textOutlineWidth`, default `0.12vw`, range `0.02vw`–`0.35vw`)
    * Stroke color picker (`textOutlineColor`, default `#000000`).

### C. Redesigned Song Service Queue
* **Context**: The previous queue items occupied too much vertical screen real estate, making managing Sunday service orders clunky.
* **Implementation** ([panel.css](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/src/styles/panel.css) & [ControlPanel.tsx](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/src/pages/ControlPanel.tsx)):
  * Compact single-row layout (~38px height).
  * Pill order badge (`#1`, `#2`, `#3`...) with subtle gradient.
  * Truncated bold song title with distinct artist/hymn metadata badge.
  * Drag handle icon, Move Up / Move Down buttons, and Delete button with clean hover states.

### D. Automated Multi-Display Projection (The VideoPsalm Standard)
* **Context**: Stage software should operate seamlessly like commercial church presentation tools (VideoPsalm, EasyWorship, ProPresenter): launching the desktop app must automatically blank the connected projector without the operator needing to drag windows or manually click buttons.
* **Implementation** ([electron/main.cjs](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/electron/main.cjs)):
  1. **Guaranteed External Screen Discovery**: `findExternalDisplay()` queries Electron's `screen.getAllDisplays()` and falls back to parsing Linux `xrandr --listmonitors` so external HDMI outputs are never missed.
  2. **Auto-Launch on Startup**: In `app.whenReady()`, if a secondary display is connected, the projector window opens immediately on the external screen.
  3. **Blank on Launch**: Created with `backgroundColor: '#000000'`, `skipTaskbar: isExternal`, and borderless geometry. Starts in idle/clear state (pure black), leaving no desktop wallpaper or system icons visible to the congregation.
  4. **Immediate Control Panel Focus**: Automatically calls `mainWindow.focus()` 300ms after opening the projector, keeping operator typing focus strictly on the control surface.
  5. **Windows DWM Taskbar Suppression**: On Windows, calls `win.setFullScreen(true)` and `win.setAlwaysOnTop(true, 'screen-saver')` with reinforced timeouts (150ms, 400ms, 800ms) to prevent Windows taskbar overlap.
  6. **Display Hotplugging**: Handled via `screen.on('display-added')` and `screen.on('display-removed')`. Plugging in an HDMI cable mid-service automatically opens the black projection screen on the new monitor.
  7. **Emergency & Keyboard Controls**: `Esc`, `Alt + F4`, and `Ctrl + W` immediately close the projector window; `F11` toggles fullscreen.

---

## 3. Production Windows Packaging Pipeline

### A. Configuration Details ([package.json](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/package.json))
```json
"scripts": {
  "dev": "vite --host",
  "build": "vite build",
  "electron:start": "electron electron/main.cjs --no-sandbox",
  "electron:dev": "vite build && electron electron/main.cjs --no-sandbox",
  "build:exe": "npm run build && electron-builder --win nsis portable",
  "build:win": "npm run build && electron-builder --win nsis portable",
  "build:linux": "npm run build && electron-builder --linux AppImage deb",
  "dist": "npm run build && electron-builder"
}
```

### B. Build Fixes & Resolutions
1. **Wine Dependency Bypass**:
   * On Linux build systems without Wine installed, electron-builder failed with `spawn wine ENOENT` when attempting code-signing on Windows executables and uninstaller binaries.
   * **Resolution 1**: Configured `"win": { "signExecutable": false }`. This preserves all executable resource editing (`resedit`, versioning, `.ico` embedding) while bypassing external `signtool.exe` execution.
   * **Resolution 2**: Applied the `UninstallerReader` extraction patch in `node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js` to extract NSIS uninstaller binaries natively using pure Node.js without calling Wine.
2. **Runtime Asset Bundling**:
   * Added `extraResources` for `BIBLE`, `songs`, `public/backgrounds`, and `super_settings.json`.
   * Added `formidable` to production `dependencies` for embedded HTTP file upload handling.

### C. Generated Release Artifacts
All generated Windows binaries are output to `release/`:
* **`Web Projector Setup 1.0.0.exe`** (147 MB): Standard Windows NSIS Setup Installer (installs to Program Files, creates Desktop/Start Menu shortcuts, includes uninstaller).
* **`Web Projector 1.0.0.exe`** (147 MB): Standalone Portable Executable (runs immediately from flash drives without installation).

---

## 4. Useful Commands Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launch local Vite dev server (`http://localhost:5173` or host IP) |
| `npm run electron:start` | Launch Electron desktop application in local dev environment |
| `npm run build` | Compile frontend assets to `dist/` |
| `npm run build:win` | Build Windows NSIS Setup Installer & Portable `.exe` into `release/` |
| `npm run build:linux` | Build Linux AppImage and `.deb` into `release/` |

---

## 5. Keyboard & Projection Shortcut Reference

| Shortcut | Scope | Action |
| :--- | :--- | :--- |
| `Esc` | Projector Window | Close projector screen |
| `Alt + F4` | Projector Window | Close projector screen |
| `Ctrl + W` / `Cmd + W` | Projector Window | Close projector screen |
| `F11` | Projector Window | Toggle Fullscreen on/off |
| `Ctrl + Alt + P` | Global Desktop | Launch/Focus Projector Screen |
| `Ctrl + Shift + P` | Global Desktop | Launch/Focus Projector Screen |
| `Clear` / `F5` button | Control Panel | Clear live projection to pitch black |

---
*Created on 2026-11-02. Maintained for Web-Projector.*
