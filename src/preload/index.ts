import electron, { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, listener: (...args: any[]) => void) => ipcRenderer.on(channel, (_event, ...args) => listener(...args)),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
});

contextBridge.exposeInMainWorld('theme', {
  isDark: () => ipcRenderer.invoke('getTheme'),
  onUpdated: (callback: () => void) => {
    const nativeTheme = electron.nativeTheme
    return nativeTheme.on('updated', callback)
  },
});

// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
