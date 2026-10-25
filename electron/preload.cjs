const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  appVersion: '1.0.0'
});
