import { appPath, DataPath, iconPath } from './lib/config.js';
import { app, session, BrowserWindow, Menu } from 'electron';
import { cmdLineHandle, getNomenuSession } from './lib/functions.js';
import { TopMenu } from './api/menu.js';
import path from "path";
const gotTheLock = app.requestSingleInstanceLock();
let mainWin = null;

// 设置缓存路径
app.setPath('userData', path.join(DataPath, 'userData'));

// 关闭第二实例
if (!gotTheLock) process.exit(0);
// 语言设置

// 主逻辑
app.whenReady().then(() => {
  // 设置应用菜单
  Menu.setApplicationMenu(TopMenu);
  getNomenuSession();

  // 命令行参数处理
  cmdLineHandle(process.argv, createMainWindow);

  // 预加载脚本
  session.defaultSession.registerPreloadScript({
    type: 'frame',
    filePath: path.join(appPath, 'api', 'preload', 'normal.js')
  });

  // 引入所有 ipc 事件
  import('./api/ipc/main.js');
});

// 所有窗口在独立线程中打开
app.on('web-contents-created', (_, contents) => {
  const mainSession = session.fromPartition('persist:main');
  contents.setWindowOpenHandler((details) => {
    if (contents.session === mainSession) return { action: 'allow' };
    setImmediate(() => {
      const newWin = new BrowserWindow({
        width: 800,
        height: 600,
        icon: iconPath,
        webPreferences: {
          sandbox: true,
          spellcheck: false,
          webSecurity: true,
          nodeIntegration: false,
          contextIsolation: true,
          session: session.defaultSession
        }
      });
      newWin.loadURL(details.url);
    });
    return { action: 'deny' }
  })
});

// 为所有窗口添加错误处理函数
app.on('browser-window-created', (_, window) => {
  window.webContents.on('did-fail-load', (event, code, desc, errURL, isMainFrame) => {
    if (!isMainFrame) return; // 仅处理主框架加载失败
    event.preventDefault();

    // 拼接URL
    const rawPath = path.join(appPath, 'html', 'error', 'index.html');
    const url = `file://${rawPath}?code=${code}&desc=${desc}&time=${new Date().toTimeString()}&url=${encodeURIComponent(errURL)}`;

    // 加载本地错误页面
    window.loadURL(url)
  });
});

// 处理第二实例
app.on('second-instance', (_, argv) => {
  cmdLineHandle(argv, () => {
    if (mainWin && !mainWin.isDestroyed()) {
      if (!mainWin.isVisible()) mainWin.show();
      mainWin.focus();
    } else {
      createMainWindow();
    }
  })
});

// 关闭所有窗口时退出
app.on('window-all-closed', app.quit);

// 主窗口实例
function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1024,
    height: 600,
    minWidth: 640,
    minHeight: 360,
    icon: iconPath,
    webPreferences: {
      sandbox: true,
      spellcheck: false,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
      session: session.fromPartition('persist:main'),
      preload: path.join(appPath, 'api', 'preload', 'main.js')
    }
  });
  mainWin.loadFile(path.join(appPath, 'html', 'index.html'));
  mainWin.on('closed', () => mainWin = null);
}