const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('litebrowser', {
  getBookmarks: () => ipcRenderer.invoke('bookmarks-get'),
  addBookmark: (name, url, time) => ipcRenderer.send('bookmarks-add', name, url, time),
  delBookmark: (name) => ipcRenderer.send('bookmarks-del', name),
  getSetting: (isimg) => ipcRenderer.invoke('setting-get', isimg),
  setSetting: (json) => ipcRenderer.send('setting-change', json),
  imgSetting: (type, base64) => ipcRenderer.send('setting-change-image', type, base64),
})

