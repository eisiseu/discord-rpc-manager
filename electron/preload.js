const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Store
  getStore: (key) => ipcRenderer.invoke('get-store', key),
  setStore: (key, value) => ipcRenderer.invoke('set-store', key, value),

  // RPC
  rpcConnect: () => ipcRenderer.invoke('rpc-connect'),
  rpcDisconnect: () => ipcRenderer.invoke('rpc-disconnect'),
  rpcSetActivity: (activity) => ipcRenderer.invoke('rpc-set-activity', activity),
  rpcClearActivity: () => ipcRenderer.invoke('rpc-clear-activity'),
  rpcGetStatus: () => ipcRenderer.invoke('rpc-get-status'),

  // RPC events
  onRpcStatus: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('rpc-status', handler);
    return () => ipcRenderer.removeListener('rpc-status', handler);
  },
  onActivityChanged: (callback) => {
    const handler = (_, index) => callback(index);
    ipcRenderer.on('activity-changed', handler);
    return () => ipcRenderer.removeListener('activity-changed', handler);
  },

  // Process detection
  processDetectStart: () => ipcRenderer.invoke('process-detect-start'),
  processDetectStop: () => ipcRenderer.invoke('process-detect-stop'),
  getRunningProcesses: () => ipcRenderer.invoke('get-running-processes'),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),

  // App icons
  getAppIcon: (processName) => ipcRenderer.invoke('get-app-icon', processName),
  getAppIconsBatch: (processNames) => ipcRenderer.invoke('get-app-icons-batch', processNames),

  // Launch on startup
  getLaunchOnStartup: () => ipcRenderer.invoke('get-launch-on-startup'),
  setLaunchOnStartup: (enabled) => ipcRenderer.invoke('set-launch-on-startup', enabled),

  // Discord app name lookup
  getDiscordAppName: (clientId) => ipcRenderer.invoke('get-discord-app-name', clientId),

  // Shell - open URL in default browser via IPC
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell-open-external', url),
  },
});
