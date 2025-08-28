const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('litebrowser', {
  registerWindow: () => ipcRenderer.send('insertjs-register-window'),
  disableContextMenu: () => window.litebrowser_contextmenu = false
});

// 右键菜单事件
window.litebrowser_contextmenu = true;
window.addEventListener('contextmenu', (e) => {
  if (typeof litebrowser_contextmenu === 'boolean' && !litebrowser_contextmenu) return;
  e.preventDefault();
  ipcRenderer.send('show-context-menu', { x: e.clientX, y: e.clientY });
});

// 自动注入脚本
ipcRenderer.send('insertjs-auto-js-insert');