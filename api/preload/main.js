const { ipcRenderer, contextBridge } = require('electron');
let contextmenu = true;
let topmenu = true;
let accessR, accessW, cfg;

try {
  // 配置参数获取
  const configArg = process.argv.find(arg => arg.startsWith('--app-config='));
  const cfgRaw = configArg.substring(configArg.indexOf('=') + 1);
  cfg = JSON.parse(atob(cfgRaw));

  // 目录权限参数获取
  const accessArg = process.argv.find(arg => arg.startsWith('--dir-access='));
  const dirAccess = parseInt(accessArg.split('=')[1]) ?? 0;
  accessR = (dirAccess >> 0) & 1
  accessW = (dirAccess >> 1) & 1
} catch (err) {
  alert('Preload script error: Unable to parse command line arguments!')
  console.error('Preload script error:', err.stack)
}
let api = {};

try {
  // 顶部菜单
  if (cfg.topMenu) api.switchTopMenu = () => {
    topmenu = !topmenu;
    ipcRenderer.send('menu-switch-top-menu', topmenu);
  };

  // JS 注入
  if (cfg.insertjs) api.registerWindow = () => ipcRenderer.send('insertjs-register-window');

  // 右键菜单
  if (cfg.contentMenu) api.switchContextMenu = () => contextmenu = !contextmenu;
} catch (err) { console.error('Preload script error:', err.stack) }

// 暴露接口
contextBridge.exposeInMainWorld('litebrowser', {
  // 主页面设置
  background: cfg.mainWin.background,
  searchUrl: cfg.mainWin.searchUrl,
  custom: cfg.mainWin.custom,
  // 数据目录权限
  dataDirAccess: { R: accessR, W: accessW },
  // 新建窗口
  newWindow: (url) => ipcRenderer.send('window-open', url),
  // 书签相关
  getBookmarks: () => ipcRenderer.invoke('bookmarks-get'),
  setBookmark: (data) => ipcRenderer.send('bookmarks-set', data),
  // 获取翻译文件
  getLang: () => ipcRenderer.invoke('languageJson-get'),
  // 获取文件
  getFile: (name, type) => ipcRenderer.invoke('localFile-get', name, type),
  setFile: (name, base64) => ipcRenderer.invoke('localFile-get', name, base64),
  // 动态api
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