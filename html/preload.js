const { ipcRenderer } = require('electron');

ipcRenderer.send('insertjs-register-window');

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  ipcRenderer.send('show-context-menu', { x: e.clientX, y: e.clientY, });
});

