import { getLocale, getSettings } from '../../libs/functions.js';
import { ipcMain, BrowserWindow, session } from 'electron';
import { DataPath, IconPath } from '../../libs/config.js';
const settings = getSettings();

// 正常新窗口
ipcMain.on('new-window', (_, url) => {
  const newwin = new BrowserWindow({
    width: 800,
    height: 600,
    icon: IconPath,
    webPreferences: {
      sandbox: true,
      spellcheck: false,
      webSecurity: true,
      nodeIntegration: false,
      contextIsolation: true,
      session: session.defaultSession,
      additionalArguments: [`--app-config=${JSON.stringify(settings?.app)}`],
    },
  });
  newwin.loadURL(url);
});

// 数据目录权限查询
ipcMain.handle('dataDir-permission', () => ({ read: DataPath.access.R, write: DataPath.access.W }));

// 获取语言文件
const lang = getLocale();
ipcMain.handle('get-languageJson', () => lang);