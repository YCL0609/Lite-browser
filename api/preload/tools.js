const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('litebrowser', {
    notepad: {
        read: (id) => ipcRenderer.invoke('tools-notepad-read', id),
        save: (id, content) => ipcRenderer.invoke('tools-notepad-save', id, content)
    },
    code: {
        get: () => ipcRenderer.invoke('tools-code-get'),
        set: (type, content) => ipcRenderer.invoke('tools-code-set', type, content)
    }
});