const { ipcRenderer, contextBridge } = require('electron');

ipcRenderer.send('insertjs-register-window');

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  ipcRenderer.send('show-context-menu', { x: e.clientX, y: e.clientY, });
});

contextBridge.exposeInMainWorld('litebrowser',{
  getBookmarks: () => ipcRenderer.invoke('bookmarks-get'),
  addBookmark: (name, url) => ipcRenderer.send('bookmarks-add', name, url),
  delBookmark: (name) => ipcRenderer.send('bookmarks-del', name)
})