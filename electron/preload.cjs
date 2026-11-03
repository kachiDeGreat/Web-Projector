const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  launchProjector: () => ipcRenderer.invoke('launch-projector'),
  closeProjector: () => ipcRenderer.invoke('close-projector'),
  toggleProjector: () => ipcRenderer.invoke('toggle-projector'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  onProjectorClosed: (callback) => {
    ipcRenderer.on('projector-closed', () => callback());
  },
  onDisplaysChanged: (callback) => {
    ipcRenderer.on('displays-changed', (_event, data) => callback(data));
  },
  sendLiveState: (state) => {
    ipcRenderer.send('live-state-update', state);
  },
  onLiveState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('live-state-update', listener);
    return () => ipcRenderer.removeListener('live-state-update', listener);
  },
  getLatestLiveState: () => ipcRenderer.invoke('get-latest-live-state'),
});
