const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('litebrowser', {
  disableContextMenu: () => window.litebrowser_contextmenu = false,
  newWindow: (url) => ipcRenderer.send('new-window', url),
  registerWindow: () => ipcRenderer.send('insertjs-register-window'),
  getBookmarks: () => ipcRenderer.invoke('bookmarks-get'),
  addBookmark: (name, url, time) => ipcRenderer.send('bookmarks-add', name, url, time),
  delBookmark: (name) => ipcRenderer.send('bookmarks-del', name),
  getSetting: (isimg) => ipcRenderer.invoke('setting-get', isimg),
  setSetting: (json) => ipcRenderer.send('setting-change', json),
  imgSetting: (type, base64) => ipcRenderer.send('setting-change-image', type, base64)
});

// 右键菜单事件
window.litebrowser_contextmenu = true;
window.addEventListener('contextmenu', (e) => {
  if (typeof litebrowser_contextmenu === 'boolean' && !litebrowser_contextmenu) return;
  e.preventDefault();
  ipcRenderer.send('show-context-menu', { x: e.clientX, y: e.clientY });
});