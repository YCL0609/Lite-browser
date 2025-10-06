const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('litebrowser', {
    notepad: {
        save: (id, context) => ipcRenderer.send('notepad-save', id, context),
        read: (id) => ipcRenderer.on('notepad-read-reply', id),
    }
});