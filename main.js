import { cmdLineHandle, debugLog, getNomenuSession, getSettings } from './libs/functions.js';
import { app, session, BrowserWindow, Menu, dialog } from 'electron';
import { AppPath, DataPath, IconPath, isLog } from './libs/config.js';
import { TopMenu } from './api/menu.js';
import path from "node:path";
const gotTheLock = app.requestSingleInstanceLock();
const settings = getSettings();
let mainWin = null;

// 关闭第二实例
if (!gotTheLock) process.exit(0);

// 设置数据路径
if (DataPath.basic === '') {
  debugLog('error', 'Fatal Error: Data directory initialization failed!');
  dialog.showErrorBox('Fatal Error: Data directory initialization failed', 'Failed to initialize the default data directory. The program tried to fall back to initialize the temporary directory but still failed. The program will exit.');
  process.exit(1);
}
app.setPath('userData', DataPath.userData);

// GPU加速相关
if (!settings?.app.useGPU) app.disableHardwareAcceleration();

// 日志输出
debugLog('info', 'Data path:')
debugLog('table', {
  ...DataPath,
  access: `R: ${DataPath.access.R} W:${DataPath.access.W}`
});
debugLog('info', 'App settings:')
debugLog('table', settings?.app)

// 主窗口实例
function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1024,
    height: 600,
    minWidth: 640,
    minHeight: 360,
    icon: IconPath,
    webPreferences: {
      sandbox: true,
      spellcheck: false,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
      session: session.fromPartition('persist:main'),
      preload: path.join(AppPath, 'api', 'preload', 'main.js'),
      additionalArguments: [`--app-config=${JSON.stringify(settings?.app)}`],
    }
  });
  mainWin.loadFile(path.join(AppPath, 'html', 'index.html'));
  mainWin.on('closed', () => mainWin = null);
}

// 主逻辑
app.whenReady().then(() => {
  // 临时数据目录提示
  if (DataPath.usetmp) {
    debugLog('warn', 'Data path is not accessible. Using temporary directory instead.');
    dialog.showMessageBox({
      type: 'warning',
      title: 'Not use normal data path',
      message: 'Unable to use the specified data path. Using temporary directory instead.\n\nTemporary data path: ' + DataPath.basic,
      buttons: ['OK'],
    });
  }
  // 设置应用菜单
  Menu.setApplicationMenu(TopMenu);
  getNomenuSession();

  // 命令行参数处理
  cmdLineHandle(process.argv, createMainWindow);

  // 预加载脚本
  session.defaultSession.registerPreloadScript({
    type: 'frame',
    filePath: path.join(AppPath, 'api', 'preload', 'normal.js')
  });

  // 引入所有 ipc 事件
  import('./api/ipc/main.js');
});

// 处理第二实例
app.on('second-instance', (_, argv) => {
  debugLog('info', 'Second Instance Detected.');
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

// 引入所有全局监听事件
import('./api/app.js');