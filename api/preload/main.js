const { ipcRenderer, contextBridge } = require('electron');
let contextmenu = true;
let topmenu = true;

// 参数获取
const configArg = process.argv.find(arg => arg.startsWith('--app-config='));
let passedConfig = {};
if (configArg) {
  try {
    const jsonString = configArg.substring(configArg.indexOf('=') + 1);
    passedConfig = JSON.parse(jsonString);
  } catch (_) { }
}
const cfg = {
  topMenu: true,
  insertjs: true,
  contentMenu: true,
  ...passedConfig
};

let api = {};

// 顶部菜单
if (cfg.topMenu) api.switchTopMenu = () => {
  topmenu = !topmenu;
  ipcRenderer.send('menu-switch-top-menu', topmenu);
};

// JS 注入
if (cfg.insertjs) api.registerWindow = () => ipcRenderer.send('insertjs-register-window');

// 右键菜单
if (cfg.contentMenu) api.switchContextMenu = () => contextmenu = !contextmenu;

// 暴露接口
contextBridge.exposeInMainWorld('litebrowser', {
  // 新建窗口
  newWindow: (url) => ipcRenderer.send('new-window', url),
  // 数据目录权限查询
  dataDirPermission: () => ipcRenderer.invoke('dataDir-permission'),
  // 书签相关
  getBookmarks: () => ipcRenderer.invoke('bookmarks-get'),
  addBookmark: (name, url, time) => ipcRenderer.send('bookmarks-add', name, url, time),
  delBookmark: (name) => ipcRenderer.send('bookmarks-del', name),
  // 设置相关
  getSetting: (isimg) => ipcRenderer.invoke('setting-get', isimg),
  setSetting: (json) => ipcRenderer.send('setting-change', json),
  imgSetting: (type, base64) => ipcRenderer.send('setting-change-image', type, base64),
  // 获取翻译文件
  getLang: () => ipcRenderer.invoke('get-languageJson'),
  ...api,
});

// 页面加载完成事件
window.addEventListener('DOMContentLoaded', () => {
  if (cfg.contentMenu) {
    window.addEventListener('contextmenu', (e) => {
      if (!contextmenu) return;
      e.preventDefault();
      ipcRenderer.send('menu-contextmenu', { x: e.clientX, y: e.clientY });
    });
  }
});