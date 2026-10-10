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
});
