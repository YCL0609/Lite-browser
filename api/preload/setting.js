const { ipcRenderer, contextBridge } = require('electron');

// 暴露接口
contextBridge.exposeInMainWorld('litebrowser', {
    // 获取翻译文件
    getLang: () => ipcRenderer.invoke('languageJson-get'),
    // 文件相关
    getFile: (name, type) => ipcRenderer.invoke('localFile-get', name, type),
    setFile: (name, base64) => ipcRenderer.invoke('localFile-set', name, base64),
    // 配置读取和设置
    getSettings: () => ipcRenderer.invoke('settings-get'),
    setSettings: (data) => ipcRenderer.send('settings-set', data),
});