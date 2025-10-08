const { app, session, BrowserWindow, Menu } = require('electron');
const { DataPath } = require('./lib/config');
const MenuList = require('./api/menu');
let mainWin = null;
const path = require("path");
const gotTheLock = app.requestSingleInstanceLock();
app.setPath('userData', path.join(DataPath, 'userData')); // 设置缓存路径

// 关闭第二实例
if (!gotTheLock) app.quit();

app.whenReady().then(() => {
  createMainWindow();// 优先创建主窗口，后续初始化异步进行

  // 设置菜单和预加载脚本
  const Menuobj = Menu.buildFromTemplate(MenuList);
  Menu.setApplicationMenu(Menuobj);
  global.nomenuSession = session.fromPartition('persist:nomenu');
  session.defaultSession.registerPreloadScript({
    type: 'frame',
    filePath: path.join(__dirname, 'api', 'preload', 'normal.js')
  });

  // 引入所有 ipc 事件
  require('./api/ipc/main');
});

// 关闭所有窗口时退出
app.on('window-all-closed', () => app.quit());

// 处理第二实例
app.on('second-instance', () => {
  if (mainWin && !mainWin.isDestroyed()) {
    if (!mainWin.isVisible()) mainWin.show();
    mainWin.focus();
  } else {
    createMainWindow();
  }
});

// 主窗口实例
function createMainWindow() {
  mainWin = new BrowserWindow({
    icon: path.join(__dirname, 'icons', `icon.${(process.platform == 'win32') ? 'ico' : 'png'}`),
    width: 1024,
    height: 600,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      session: session.fromPartition('persist:main'),
      contextIsolation: true,
      preload: path.join(__dirname, 'api', 'preload', 'main.js')
    }
  });
  mainWin.loadFile(path.join(__dirname, 'html', 'index.html'));
  mainWin.on('closed', () => mainWin = null);
}