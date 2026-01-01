const { ipcRenderer, contextBridge } = require('electron');
let contextmenu = true;
let topmenu = true;

contextBridge.exposeInMainWorld('litebrowser', {
  // 菜单相关
  disableContextMenu: () => contextmenu = false,
  switchTopMenu: () => {
    ipcRenderer.send('menu-switch-top-menu', !topmenu);
    topmenu = !topmenu;
  },
  // 新建窗口
  newWindow: (url) => ipcRenderer.send('new-window', url),
  // 数据目录权限查询
  dataDirPermission: () => ipcRenderer.invoke('dataDir-permission'),
  // 脚本注入相关
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
window.addEventListener('contextmenu', (e) => {
  if (!contextmenu) return;
  e.preventDefault();
  ipcRenderer.send('menu-contextmenu', { x: e.clientX, y: e.clientY });
});