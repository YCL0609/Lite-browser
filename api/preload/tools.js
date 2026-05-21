const { ipcRenderer, contextBridge } = require('electron');

// 目录权限参数获取
let accessR = 0;
let accessW = 0;
try {
    const accessArg = process.argv.find(arg => arg.startsWith('--dir-access='));
    const dirAccess = parseInt(accessArg.split('=')[1]) ?? 0;
    accessR = (dirAccess >> 0) & 1
    accessW = (dirAccess >> 1) & 1
} catch (_) { }

contextBridge.exposeInMainWorld('litebrowser', {
    dataDirAccess: { R: accessR, W: accessW },
    getLang: () => ipcRenderer.invoke('languageJson-get'),
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