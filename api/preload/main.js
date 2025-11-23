const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('litebrowser', {
  // 禁用右键菜单
  disableContextMenu: () => window.litebrowser_contextmenu = false,
  // 新建窗口
  newWindow: (url) => ipcRenderer.send('new-window', url),
  // 数据目录权限查询
  dataDirPermission: () => ipcRenderer.invoke('dataDir-permission'),
  // 插入脚本相关
  registerWindow: () => ipcRenderer.send('insertjs-register-window'),
  // 书签相关
  getBookmarks: () => ipcRenderer.invoke('bookmarks-get'),
  addBookmark: (name, url, time) => ipcRenderer.send('bookmarks-add', name, url, time),
  delBookmark: (name) => ipcRenderer.send('bookmarks-del', name),
  // 设置相关
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