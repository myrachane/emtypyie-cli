'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('emt', {
  exec: (cmd, arg, opts) => ipcRenderer.invoke('engine:exec', { cmd, arg, opts }),
  openTab: (tabId, project) => ipcRenderer.invoke('tab:open', { tabId, project }),
  send: (tabId, cmd, arg) => ipcRenderer.send('tab:send', { tabId, cmd, arg }),
  closeTab: (tabId) => ipcRenderer.send('tab:close', { tabId }),
  onTabData: (cb) => ipcRenderer.on('tab:data', (_e, d) => cb(d)),
  onTabJson: (cb) => ipcRenderer.on('tab:json', (_e, d) => cb(d)),
  onTabExit: (cb) => ipcRenderer.on('tab:exit', (_e, d) => cb(d)),

  // Environment section — reads/writes ~/.emtypyie/env.json
  getEnv: () => ipcRenderer.invoke('env:get'),
  setEnv: (obj) => ipcRenderer.invoke('env:set', obj),

  // Node-side update flow (GitHub API in the main process)
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  applyUpdate: (url) => ipcRenderer.invoke('update:apply', { url }),
  onUpdateProgress: (cb) => ipcRenderer.on('update:progress', (_e, pct) => cb(pct)),
  onUpdateDone: (cb) => ipcRenderer.on('update:done', () => cb())
});
