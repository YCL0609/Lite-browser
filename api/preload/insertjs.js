const { contextBridge, ipcRenderer } = require('electron');

let parentID = null;
const arg = process.argv.find(arg => arg.startsWith('--parent-window-id='));
if (arg) parentID = parseInt(arg.split('=')[1], 10)

contextBridge.exposeInMainWorld('litebrowser', {
    parentID: parentID,
    getList: () => {
        if (parentID === null || typeof parentID !== 'number') return Promise.resolve({ time: { start: Date.now(), used: 0 }, error: "错误:窗口参数'--parent-window-id'无效或不存在!", list: [] });
        return ipcRenderer.invoke('insertjs-get-jslist');
    },
    addJS: () => ipcRenderer.send('insertjs-add-js'),
    renameJS: (jsID, newName) => ipcRenderer.send('insertjs-rename-js', jsID, newName),
    removeJS: (jsIDs) => ipcRenderer.send('insertjs-remove-js', jsIDs),
    openDir: () => ipcRenderer.send('insertjs-open-dir'),
    insertJS: (winID, jsIDs) => ipcRenderer.send('insertjs-insert-js', winID, jsIDs),
    getAutoJS: (winID) => ipcRenderer.invoke('insertjs-get-auto-js', winID),
    changeAutoJS: (winID, jsIDs) => ipcRenderer.send('insertjs-change-auto-js', winID, jsIDs),
    dataDirPermission: () => ipcRenderer.invoke('dataDir-permission'),
});