const { app, dialog, session, BrowserWindow, Menu } = require('electron');
let mainWin = null;
const fs = require('fs');
const path = require("path");
const MenuList = require('./api/menu');
const gotTheLock = app.requestSingleInstanceLock();
const { DataPath, defaultSetting } = require('./lib/config');
app.setPath('userData', path.join(DataPath, 'userData')); // 设置缓存路径

if (gotTheLock) {
  app.whenReady().then(() => {
    // 优先创建主窗口，后续初始化异步进行
    createMainWindow();
    // 设置菜单和预加载脚本
    const Menuobj = Menu.buildFromTemplate(MenuList);
    Menu.setApplicationMenu(Menuobj);
    global.nomenuSession = session.fromPartition('persist:nomenu');
    session.defaultSession.registerPreloadScript({
      type: 'frame',
      filePath: path.join(__dirname, 'api', 'preload', 'normal.js')
    });
    // 异步初始化配置文件等
    setImmediate(async () => {
      const files = [
        { name: 'setting.json', defaultdata: defaultSetting },
        { name: 'bookmarks.json', defaultdata: '{}' },
        { name: path.join('insertjs', 'name.json'), defaultdata: '{}' },
        { name: path.join('insertjs', 'auto.json'), defaultdata: '{"hosts":[]}' }
      ];
      for (const f of files) {
        const filePath = path.join(DataPath, f.name);
        try {
          await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
          if (!fs.existsSync(filePath)) {
            await fs.promises.writeFile(filePath, f.defaultdata);
          }
        } catch (err) {
          dialog.showErrorBox('初始化文件错误: ' + f.name, err.stack);
        }
      }
    });
  });

  // 引入所有 ipc 事件
  require('./api/ipc/main');

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
} else {
  // 关闭第二实例
  app.quit();
}

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