const { contextBridge, ipcRenderer } = require('electron');

const arg = process.argv.find(arg => arg.startsWith('--parent-window-id='));
const parentID = arg ? parseInt(arg.split('=')[1], 10) : null;

contextBridge.exposeInMainWorld('litebrowser', {
    parentID: parentID,
    getList: () => ipcRenderer.invoke('insertjs-get-jslist'),
    addJS: () => ipcRenderer.send('insertjs-add-js'),
    removeJS: (name) => ipcRenderer.send('insertjs-remove-js', name),
    openDir: () => ipcRenderer.send('insertjs-open-dir'),
    insertJS: (id, js) => ipcRenderer.send('insertjs-insert-js', id, js)
})