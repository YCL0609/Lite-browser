const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('litebrowser', {
    dataDirPermission: () => ipcRenderer.invoke('dataDir-permission'),
    notepad: {
        get: (id) => ipcRenderer.invoke('tools-notepad-get', id),
        set: (id, content) => ipcRenderer.invoke('tools-notepad-set', id, content),
        del: (id) => ipcRenderer.invoke('tools-notepad-del', id)
    },
    code: {
        get: () => ipcRenderer.invoke('tools-code-get'),
        set: (type, content) => ipcRenderer.invoke('tools-code-set', type, content),
        del: () => ipcRenderer.invoke('tools-code-del')
    },
    markdown: {
        get: async () => ipcRenderer.invoke('tools-markdown-get'),
        set: (content) => ipcRenderer.invoke('tools-markdown-set', content),
        del: () => ipcRenderer.invoke('tools-markdown-del')
    }
});