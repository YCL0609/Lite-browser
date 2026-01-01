const { ipcRenderer, contextBridge } = require('electron');
let contextmenu = true;
let topmenu = true;

// 主进程通信接口
contextBridge.exposeInMainWorld('litebrowser', {
  registerWindow: () => ipcRenderer.send('insertjs-register-window'),
  switchTopMenu: () => {
    ipcRenderer.send('menu-switch-top-menu', !topmenu);
    topmenu = !topmenu;
  },
  disableContextMenu: () => contextmenu = false
});

// 右键菜单事件
window.addEventListener('contextmenu', (e) => {
  if (!contextmenu) return;
  e.preventDefault();
  ipcRenderer.send('menu-contextmenu', { x: e.clientX, y: e.clientY });
});

// 自动插入JS
ipcRenderer.send('insertjs-auto-js-insert')
// document.addEventListener('DOMContentLoaded', () => );