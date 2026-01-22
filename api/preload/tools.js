const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('litebrowser', {
    getLang: () => ipcRenderer.invoke('get-languageJson'),
    dataDirPermission: () => ipcRenderer.invoke('dataDir-permission'),
    notepad: {
        get: (id) => ipcRenderer.invoke('tools-notepad-get', id),
        set: (content, id) => ipcRenderer.invoke('tools-notepad-set', content, id),
        del: (id) => ipcRenderer.invoke('tools-notepad-del', id)
    },
    code: {
        get: () => ipcRenderer.invoke('tools-code-get'),
        set: (content, type) => ipcRenderer.invoke('tools-code-set', content, type),
        del: () => ipcRenderer.invoke('tools-code-del')
    },
    markdown: {
        get: async () => ipcRenderer.invoke('tools-markdown-get'),
        set: (content) => ipcRenderer.invoke('tools-markdown-set', content),
        del: () => ipcRenderer.invoke('tools-markdown-del')
    }
});