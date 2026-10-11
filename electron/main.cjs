const { app, BrowserWindow, screen, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer } = require('./server.cjs');

let mainWindow = null;
let projectorWindow = null;
let serverInstance = null;
let serverPort = 5173;

const isPackaged = app.isPackaged;
const baseDir = isPackaged
  ? process.resourcesPath
  : path.resolve(__dirname, '..');
const userDataDir = app.getPath('userData');
const appIcon = process.platform === 'win32'
  ? path.join(__dirname, '../build/icon.ico')
  : path.join(__dirname, '../build/icon.png');

// Ensure starter BIBLE & songs exist in userData
function ensureStarterAssets() {
  const userSongsDir = path.join(userDataDir, 'songs');
  if (!fs.existsSync(userSongsDir)) {
    try {
      fs.mkdirSync(userSongsDir, { recursive: true });
      const srcSongs = path.join(baseDir, 'songs');
      if (fs.existsSync(srcSongs)) {
        fs.readdirSync(srcSongs).forEach((f) => {
          fs.copyFileSync(path.join(srcSongs, f), path.join(userSongsDir, f));
        });
      }
    } catch (e) {
      console.error('Error copying starter songs:', e);
    }
  }

  const userBiblesDir = path.join(userDataDir, 'BIBLE');
  if (!fs.existsSync(userBiblesDir)) {
    try {
      fs.mkdirSync(userBiblesDir, { recursive: true });
      const srcBibles = path.join(baseDir, 'BIBLE');
      if (fs.existsSync(srcBibles)) {
        fs.readdirSync(srcBibles).forEach((f) => {
          if (f.toLowerCase().endsWith('.xml')) {
            fs.copyFileSync(path.join(srcBibles, f), path.join(userBiblesDir, f));
          }
        });
      }
    } catch (e) {
      console.error('Error copying starter bibles:', e);
    }
  }

  const userSettingsFile = path.join(userDataDir, 'super_settings.json');
  if (!fs.existsSync(userSettingsFile)) {
    try {
      const srcSettings = path.join(baseDir, 'super_settings.json');
      if (fs.existsSync(srcSettings)) {
        fs.copyFileSync(srcSettings, userSettingsFile);
      }
    } catch (e) {
      console.error('Error copying starter super_settings.json:', e);
    }
  }
}

async function openOrUpdateProjector() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  const externalDisplay = displays.find((d) => d.id !== primaryDisplay.id);

  if (projectorWindow && !projectorWindow.isDestroyed()) {
    if (externalDisplay) {
      projectorWindow.setBounds(externalDisplay.bounds);
      projectorWindow.setFullScreen(true);
    }
    projectorWindow.show();
    projectorWindow.focus();
    return {
      success: true,
      isExternal: !!externalDisplay,
      displayCount: displays.length,
    };
  }

  const preloadPath = path.join(__dirname, 'preload.cjs');

  if (externalDisplay) {
    // External monitor / projector detected (Extended Display)
    projectorWindow = new BrowserWindow({
      x: externalDisplay.bounds.x,
      y: externalDisplay.bounds.y,
      width: externalDisplay.bounds.width,
      height: externalDisplay.bounds.height,
      fullscreen: true,
      frame: false,
      autoHideMenuBar: true,
      backgroundColor: '#000000',
      title: 'Web Projector - Stage Output',
      icon: appIcon,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
  } else {
    // Single display (no external screen) - windowed preview mode
    projectorWindow = new BrowserWindow({
      width: 1280,
      height: 720,
      title: 'Web Projector - Output Preview (Single Screen)',
      autoHideMenuBar: true,
      backgroundColor: '#000000',
      icon: appIcon,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
  }

  projectorWindow.loadURL(`http://localhost:${serverPort}/output?autoFullscreen=true`);

  projectorWindow.on('closed', () => {
    projectorWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('projector-closed');
    }
  });

  return {
    success: true,
    isExternal: !!externalDisplay,
    displayCount: displays.length,
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
    },
  });

  mainWindow.loadURL(`http://localhost:${serverPort}/`);

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
        baseDir: baseDir,
        userDataDir: userDataDir,
      });
      serverInstance = started.server;
      serverPort = started.port;
    } catch (e) {
      console.error('Failed to start embedded HTTP server:', e);
    }

    createMainWindow();

    // IPC handlers
    ipcMain.handle('launch-projector', async () => {
      return await openOrUpdateProjector();
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
      return screen.getAllDisplays().map((d) => ({
        id: d.id,
        bounds: d.bounds,
        isPrimary: d.id === primary.id,
      }));
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
