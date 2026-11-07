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
* **`Web Projector Setup 1.0.1.exe`** (~149 MB): Standard Windows NSIS Setup Installer (installs to Program Files, creates Desktop/Start Menu shortcuts, includes uninstaller).
* **`Web Projector 1.0.1.exe`** (~148 MB): Standalone Portable Executable (runs immediately from flash drives without installation).

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

## 6. Windows Packaged Executable ("Not found") Resolution & Projection Flow

### A. Root Cause of "Not found" on .exe Launch
* **Cause**: In packaged Electron (`isPackaged = true`), `main.cjs` passed `baseDir = process.resourcesPath` to `server.cjs`. `server.cjs` attempted to serve frontend files from `path.join(baseDir, 'dist')` (`resources/dist`). However, `dist` was only listed in `"files"` in `package.json`, packaging it inside `app.asar`. Since `dist` was missing from `extraResources`, `resources/dist` did not exist on the filesystem. Consequently, the embedded HTTP server returned `404 Not found` for `/` and `/output`, resulting in a black window displaying plain-text `"Not found"`.
* **Fix**:
  1. Added `{ "from": "dist", "to": "dist" }` to `extraResources` in [package.json](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/package.json). This guarantees `resources/dist` exists on disk next to `resources/BIBLE` and `resources/songs`.
  2. Enhanced [electron/server.cjs](file:///home/onyekachi-godswill-richard/Desktop/WEB%20DEV/Web%20Dev/Web-Projector/electron/server.cjs) to search multiple directory candidates (`resourcesDir`, `appDir`, `baseDir`, `../dist`, `process.cwd()/dist`) for `distDir`, `biblesDir`, `songsDir`, `backgroundsDir`, and `super_settings.json`.
  3. Replaced streaming with synchronous `fs.readFileSync` with strict MIME types and `Content-Length` for static assets and SPA routing fallback.

### B. Standard Desktop Presentation Workflow
* **Startup**: When launching the desktop application, the **Control Panel** immediately opens maximized on the primary display (operator screen) with full access to Songs, Scriptures, Media, Queue, and Projection controls. The projector window does NOT auto-launch without user initiation.
* **Launch Projector Button**:
  * Located prominently in the Control Panel topbar.
  * Clicking **Launch Projector**:
    1. Queries connected displays (`findExternalDisplay()`).
    2. If an external display (HDMI / secondary monitor) is connected: launches the borderless projector window directly on the external screen in pitch black (`#000000` clear state) with `alwaysOnTop: 'screen-saver'` and `skipTaskbar: true`.
    3. If no external display is plugged in: opens a desktop preview window.
    4. Focus is automatically returned to the Control Panel so the operator can type, search, and queue songs/scriptures without disruption.
  * Button reflects real-time status: changes to glowing green **`Projector Live (HDMI)`** when active, and allows closing/toggling directly or via `Esc` on the projector.
* **Live Projection ("Shooting" Content)**:
  * Selecting any Bible verse, song lyric, or media in the Control Panel immediately projects to the blanked external display.
  * Pressing `Clear` / `F5` instantly blanks the external screen back to pitch black.

---

## 7. Performance & Latency Optimization for Live Verse Projection

### A. Problem Statement
When running the packaged Windows `.exe` application alongside OBS Studio on the same computer, verse changes took noticeable time to effect, whereas running the web version on separate machines was instant.

### B. Root Causes Identified
1. **Fallback from WebSockets to HTTP/SSE**: In dev mode (`npm run dev`), state synced over Vite's internal WebSocket (<1ms). In production, it fell back to HTTP POST + Node SSE. Node's HTTP socket had Nagle's TCP buffering enabled by default (`TCP_NODELAY = false`), delaying small SSE packets by 150-300ms.
2. **Chromium Background Throttling**: Electron's `backgroundThrottling` defaults to `true`. Because focus is directed to the Control Panel, the external Stage Projector Window was unfocused and occluded, causing Chromium to throttle timers (down to 1Hz) and deprioritize rendering and network events. Clicking into OBS throttled both windows.
3. **No Direct Inter-Window IPC**: The desktop app relied on network roundtrips to sync state between windows on the same machine instead of local IPC.
4. **Single-Machine GPU Contention**: OBS running 60fps compositing and video encoding + 3 Chromium browser instances (Control Panel, Stage Output, OBS CEF browser source) competed for GPU time. Heavy `-webkit-text-stroke` and Framer Motion exit transitions with `mode="sync"` caused rendering stalls.

### C. Solutions Implemented
1. **Disabled Background Throttling**:
   * Added `backgroundThrottling: false` to `webPreferences` in both `mainWindow` and `projectorWindow` in `electron/main.cjs`.
   * Added Chrome switches `disable-background-timer-throttling`, `disable-backgrounding-occluded-windows`, and `disable-renderer-backgrounding`.
2. **Multi-Layer Zero-Latency State Sync** (`src/services/dbService.ts`):
   * **Layer 1: Native BroadcastChannel**: Transmits live state updates in-memory across local windows in 0.1ms without network stack overhead.
   * **Layer 2: Direct Electron IPC**: Added `live-state-update` relay via `electron/preload.cjs` and `electron/main.cjs` to push updates directly to the projector window.
   * **Layer 3: Non-blocking Fire-and-Forget Network POST**: Unblocked the React render thread by removing `await fetch(...)`, keeping the UI 0ms responsive.
   * **Layer 4: TCP_NODELAY & Socket Optimization**: Configured `socket.setNoDelay(true)` and `res.flushHeaders()` in `electron/server.cjs` and `vite.config.ts` to immediately flush SSE packets to OBS and remote devices.
3. **Optimized Output Transitions** (`src/pages/OutputView.tsx`):
   * When `animation: "none"`, exit and entry durations are set to 0ms (instant DOM replacement) eliminating lingering exit nodes.
   * Snappy 220ms/300ms transitions for fade/slide when enabled.
   * Promoted animated layers with `willChange: "transform, opacity"` during active animations.

---

## 8. Multi-Provider Lyrics Search & Contextual Ctrl+S Saving

### A. Automatic Lyrics Backup API (`src/services/lyricsService.ts`)
* **Problem**: LRCLIB alone often returned empty results or timed out for certain worship songs, hymns, and contemporary tracks.
* **Solution**: Implemented a multi-provider automatic fallback service:
  1. **Primary Provider (LRCLIB)**: Queries `search?track_name` and `artist_name`, followed by `search?q` and exact `api/get` with a 6-second `AbortController` timeout.
  2. **Backup Provider (Lyrics.ovh)**: If LRCLIB returns 0 results or fails, the service automatically triggers Lyrics.ovh, executing direct artist/title lookups and Deezer suggest track queries to retrieve clean lyrics.
  3. **Attribution Badges**: Search result items now clearly show whether they were sourced from `[LRCLIB]` or `[Lyrics.ovh]`.

### B. Contextual `Ctrl + S` Shortcut Routing (`src/pages/ControlPanel.tsx`)
* **Problem**: Previously, pressing `Ctrl + S` anywhere in the app immediately triggered `saveGlobalSettings()`, saving super settings to JSON even when the user was typing/editing lyrics for a song.
* **Solution**:
  1. **Settings Dialog**: `Ctrl + S` now ONLY saves global settings if the Settings modal is open (`isSettingsOpenRef.current === true`).
  2. **Song Editor**: If the user is on a song being edited (`activeTab === 'songs' && songViewMode === 'edit'` or typing song lyrics/title), `Ctrl + S` saves the song to the songs folder and updates the database, then switches to play mode.
  3. **Neutral Context**: If neither settings nor a song is being edited, `Ctrl + S` prevents default without triggering any unwanted settings saves.

---
*Created on 2026-11-02. Updated on 2026-11-07. Maintained for Web-Projector.*
