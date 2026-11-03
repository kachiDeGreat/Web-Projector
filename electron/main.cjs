const { app, BrowserWindow, screen, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer } = require('./server.cjs');

// High performance stage projection switches
// Prevent Chromium from throttling rendering, timers, or network when windows are in background or occluded by OBS
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

// Linux environment integration
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
}

let mainWindow = null;
let projectorWindow = null;
let serverInstance = null;
let serverPort = 5173;
let latestLiveState = null;

const isPackaged = app.isPackaged;
const appDir = app.getAppPath();
const resourcesDir = isPackaged
  ? process.resourcesPath
  : path.resolve(__dirname, '..');
const baseDir = resourcesDir;
const userDataDir = app.getPath('userData');

function resolveAppIcon() {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  const candidates = [
    path.join(resourcesDir, 'build', iconName),
    path.join(appDir, 'build', iconName),
    path.join(__dirname, '..', 'build', iconName),
    path.join(process.cwd(), 'build', iconName),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[2];
}
const appIcon = resolveAppIcon();

// Ensure starter BIBLE & songs exist in userData
function ensureStarterAssets() {
  const userSongsDir = path.join(userDataDir, 'songs');
  if (!fs.existsSync(userSongsDir)) {
    try {
      fs.mkdirSync(userSongsDir, { recursive: true });
      const songCandidates = [
        path.join(resourcesDir, 'songs'),
        path.join(appDir, 'songs'),
        path.join(__dirname, '..', 'songs'),
      ];
      for (const srcSongs of songCandidates) {
        if (fs.existsSync(srcSongs)) {
          fs.readdirSync(srcSongs).forEach((f) => {
            if (f.toLowerCase().endsWith('.txt')) {
              fs.copyFileSync(path.join(srcSongs, f), path.join(userSongsDir, f));
            }
          });
          break;
        }
      }
    } catch (e) {
      console.error('Error copying starter songs:', e);
    }
  }

  const userBiblesDir = path.join(userDataDir, 'BIBLE');
  if (!fs.existsSync(userBiblesDir)) {
    try {
      fs.mkdirSync(userBiblesDir, { recursive: true });
      const bibleCandidates = [
        path.join(resourcesDir, 'BIBLE'),
        path.join(appDir, 'BIBLE'),
        path.join(__dirname, '..', 'BIBLE'),
      ];
      for (const srcBibles of bibleCandidates) {
        if (fs.existsSync(srcBibles)) {
          fs.readdirSync(srcBibles).forEach((f) => {
            if (f.toLowerCase().endsWith('.xml')) {
              fs.copyFileSync(path.join(srcBibles, f), path.join(userBiblesDir, f));
            }
          });
          break;
        }
      }
    } catch (e) {
      console.error('Error copying starter bibles:', e);
    }
  }

  const userSettingsFile = path.join(userDataDir, 'super_settings.json');
  if (!fs.existsSync(userSettingsFile)) {
    try {
      const settingsCandidates = [
        path.join(resourcesDir, 'super_settings.json'),
        path.join(appDir, 'super_settings.json'),
        path.join(__dirname, '..', 'super_settings.json'),
      ];
      for (const srcSettings of settingsCandidates) {
        if (fs.existsSync(srcSettings)) {
          fs.copyFileSync(srcSettings, userSettingsFile);
          break;
        }
      }
    } catch (e) {
      console.error('Error copying starter super_settings.json:', e);
    }
  }
}

function findExternalDisplay() {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const found = displays.find((d) => d.id !== primary.id);
  if (found) return found;

  // Linux fallback: parse xrandr to guarantee connected HDMI monitor is never missed
  if (process.platform === 'linux') {
    try {
      const { execSync } = require('child_process');
      const out = execSync('xrandr --listmonitors', { encoding: 'utf8' });
      const lines = out.split('\n').filter((l) => l.trim().match(/^\d+:/));
      if (lines.length > 1) {
        for (const line of lines) {
          if (!line.includes('*')) {
            const match = line.match(/\s*(\d+):\s*\+([^\s]+)\s+(\d+)\/\d+x(\d+)\/\d+\+(\d+)\+(\d+)/);
            if (match) {
              const [_, _idx, name, w, h, x, y] = match;
              const scale = primary.scaleFactor || 1;
              return {
                id: 9999,
                label: name,
                bounds: {
                  x: Math.round(parseInt(x, 10) / scale),
                  y: Math.round(parseInt(y, 10) / scale),
                  width: Math.round(parseInt(w, 10) / scale),
                  height: Math.round(parseInt(h, 10) / scale),
                },
              };
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

function applyExternalPlacement(win, externalDisplay) {
  if (!win || win.isDestroyed() || !externalDisplay) return;
  const target = externalDisplay.bounds;
  const isWin = process.platform === 'win32';

  if (isWin) {
    // 1. Position window bounds strictly over the external display
    win.setBounds(target);
    win.show();

    // 2. Windows: Engage true fullscreen & topmost screen-saver level.
    // This instructs Windows DWM to completely suppress the Windows taskbar on the external display
    // and keeps it covered even when the operator clicks buttons on the laptop Control Surface.
    win.setFullScreen(true);
    win.setAlwaysOnTop(true, 'screen-saver');

    // 3. Multi-stage reinforcement to guarantee taskbar remains hidden
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setBounds(target);
        win.setFullScreen(true);
        win.setAlwaysOnTop(true, 'screen-saver');
      }
    }, 150);

    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setFullScreen(true);
        win.setAlwaysOnTop(true, 'screen-saver');
      }
    }, 400);

    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setFullScreen(true);
        win.setAlwaysOnTop(true, 'screen-saver');
      }
    }, 800);
  } else {
    // Linux (GNOME Wayland/Mutter) & macOS
    if (win.isFullScreen()) {
      win.setFullScreen(false);
    }

    win.setBounds(target);
    win.show();
    win.setAlwaysOnTop(true, 'screen-saver');

    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setBounds(target);
        win.setAlwaysOnTop(true, 'screen-saver');
      }
    }, 150);

    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setBounds(target);
        win.setAlwaysOnTop(true, 'screen-saver');
        win.focus();
      }
    }, 400);

    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setBounds(target);
        win.setAlwaysOnTop(true, 'screen-saver');
      }
    }, 800);
  }
}

function loadWithRetry(win, url, maxRetries = 25, delayMs = 300) {
  let attempts = 0;
  const tryLoad = () => {
    attempts++;
    win.loadURL(url).catch((err) => {
      if (attempts < maxRetries && !win.isDestroyed()) {
        setTimeout(tryLoad, delayMs);
      } else {
        console.error(`Failed to load ${url}:`, err.message || err);
      }
    });
  };
  tryLoad();
}

function openOrUpdateProjector() {
  const externalDisplay = findExternalDisplay();
  const primaryDisplay = screen.getPrimaryDisplay();
  const isExternal = Boolean(externalDisplay);
  const targetDisplay = externalDisplay || primaryDisplay;

  if (projectorWindow && !projectorWindow.isDestroyed()) {
    if (isExternal) {
      applyExternalPlacement(projectorWindow, externalDisplay);
      if (mainWindow && !mainWindow.isDestroyed()) {
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.focus();
          }
        }, 200);
      }
    } else {
      projectorWindow.setBounds({
        x: primaryDisplay.bounds.x + 80,
        y: primaryDisplay.bounds.y + 80,
        width: 1280,
        height: 720,
      });
      projectorWindow.show();
      projectorWindow.focus();
    }
    return {
      success: true,
      isExternal,
      displayCount: screen.getAllDisplays().length,
    };
  }

  const preloadPath = path.join(__dirname, 'preload.cjs');

  projectorWindow = new BrowserWindow({
    x: isExternal ? targetDisplay.bounds.x : primaryDisplay.bounds.x + 80,
    y: isExternal ? targetDisplay.bounds.y : primaryDisplay.bounds.y + 80,
    width: isExternal ? targetDisplay.bounds.width : 1280,
    height: isExternal ? targetDisplay.bounds.height : 720,
    show: false,
    frame: !isExternal,
    fullscreen: false,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    title: 'Web Projector - Stage Output',
    icon: appIcon,
    skipTaskbar: isExternal,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  projectorWindow.setMenu(null);

  // Keyboard shortcut listener: Escape, Alt+F4, Ctrl+W immediately close the projector window
  // F11 toggles fullscreen
  projectorWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    if (
      input.key === 'Escape' ||
      (input.alt && (input.key === 'F4' || input.key === 'f4')) ||
      ((input.control || input.meta) && (input.key === 'w' || input.key === 'W'))
    ) {
      if (projectorWindow && !projectorWindow.isDestroyed()) {
        projectorWindow.close();
      }
      event.preventDefault();
      return;
    }

    if (input.key === 'F11') {
      if (projectorWindow && !projectorWindow.isDestroyed()) {
        const isFS = projectorWindow.isFullScreen();
        const nextFS = !isFS;
        projectorWindow.setFullScreen(nextFS);
        if (nextFS) {
          projectorWindow.setAlwaysOnTop(true, 'screen-saver');
        } else {
          projectorWindow.setAlwaysOnTop(false);
        }
      }
      event.preventDefault();
      return;
    }
  });

  const projectorUrl = `http://localhost:${serverPort}/output?autoFullscreen=true`;
  loadWithRetry(projectorWindow, projectorUrl);

  if (isExternal) {
    applyExternalPlacement(projectorWindow, targetDisplay);
    if (mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
        }
      }, 300);
    }
  } else {
    projectorWindow.show();
    projectorWindow.focus();
  }

  projectorWindow.on('closed', () => {
    projectorWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('projector-closed');
    }
  });

  return {
    success: true,
    isExternal,
    displayCount: screen.getAllDisplays().length,
  };
}

function closeProjector() {
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.close();
    projectorWindow = null;
    return true;
  }
  return false;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: 'Web Projector',
    icon: appIcon,
    autoHideMenuBar: true,
    backgroundColor: '#0a0f1d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.setMenu(null);
  mainWindow.maximize();

  const mainUrl = `http://localhost:${serverPort}/`;
  loadWithRetry(mainWindow, mainUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (projectorWindow && !projectorWindow.isDestroyed()) {
      projectorWindow.close();
    }
    app.quit();
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    ensureStarterAssets();

    try {
      const started = await startServer({
        port: 5173,
        appDir: appDir,
        resourcesDir: resourcesDir,
        baseDir: baseDir,
        userDataDir: userDataDir,
      });
      serverInstance = started.server;
      serverPort = started.port;
    } catch (e) {
      console.error('Failed to start embedded HTTP server:', e);
    }

    createMainWindow();

    // Screen listeners for automatic external display migration
    screen.on('display-added', (_event, newDisplay) => {
      if (projectorWindow && !projectorWindow.isDestroyed()) {
        applyExternalPlacement(projectorWindow, newDisplay);
        if (mainWindow && !mainWindow.isDestroyed()) {
          setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.focus();
            }
          }, 300);
        }
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('displays-changed', {
          hasExternal: true,
          externalDisplay: newDisplay,
        });
      }
    });

    screen.on('display-removed', () => {
      if (projectorWindow && !projectorWindow.isDestroyed()) {
        const external = findExternalDisplay();
        if (external) {
          applyExternalPlacement(projectorWindow, external);
        } else {
          const primary = screen.getPrimaryDisplay();
          if (projectorWindow.isFullScreen()) {
            projectorWindow.setFullScreen(false);
          }
          projectorWindow.setAlwaysOnTop(false);
          projectorWindow.setSkipTaskbar(false);
          projectorWindow.setBounds({
            x: primary.bounds.x + 80,
            y: primary.bounds.y + 80,
            width: 1280,
            height: 720,
          });
        }
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('displays-changed', {
          hasExternal: Boolean(findExternalDisplay()),
          externalDisplay: findExternalDisplay(),
        });
      }
    });

    // IPC handlers
    ipcMain.on('live-state-update', (_event, state) => {
      latestLiveState = state;
      // Ultra-fast 0ms IPC relay directly to projector window
      if (projectorWindow && !projectorWindow.isDestroyed()) {
        projectorWindow.webContents.send('live-state-update', state);
      }
      // Also forward to mainWindow if update originated from secondary window
      if (mainWindow && !mainWindow.isDestroyed() && _event.sender !== mainWindow.webContents) {
        mainWindow.webContents.send('live-state-update', state);
      }
    });

    ipcMain.handle('get-latest-live-state', () => {
      return latestLiveState;
    });

    ipcMain.handle('launch-projector', async () => {
      return openOrUpdateProjector();
    });

    ipcMain.handle('close-projector', () => {
      return closeProjector();
    });

    ipcMain.handle('toggle-projector', async () => {
      if (projectorWindow && !projectorWindow.isDestroyed()) {
        closeProjector();
        return { open: false };
      } else {
        await openOrUpdateProjector();
        return { open: true };
      }
    });

    ipcMain.handle('get-displays', () => {
      const primary = screen.getPrimaryDisplay();
      const external = findExternalDisplay();
      return {
        displays: screen.getAllDisplays().map((d) => ({
          id: d.id,
          bounds: d.bounds,
          isPrimary: d.id === primary.id,
        })),
        hasExternal: Boolean(external),
        externalDisplay: external,
        isProjectorOpen: Boolean(projectorWindow && !projectorWindow.isDestroyed()),
      };
    });

    // Shortcuts
    try {
      globalShortcut.register('CommandOrControl+Alt+P', () => {
        openOrUpdateProjector();
      });
      globalShortcut.register('CommandOrControl+Shift+P', () => {
        openOrUpdateProjector();
      });
    } catch (err) {
      console.warn('Could not register global shortcuts:', err);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (serverInstance) {
    try {
      serverInstance.close();
    } catch (e) {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
