import { isDataDirCanRead, isDataDirCanWrite, iconPath } from '../../lib/config.js';
import { ipcMain, BrowserWindow, session } from 'electron';
import { getLocale } from '../../lib/functions.js';

// 正常新窗口
ipcMain.on('new-window', (_, url) => {
  const newwin = new BrowserWindow({
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
    },
  });
  newwin.loadURL(url);
});

// 数据目录权限查询
ipcMain.handle('dataDir-permission', () => ({ read: isDataDirCanRead, write: isDataDirCanWrite }));

// 获取语言文件
const lang = getLocale();
ipcMain.handle('get-languageJson', () => lang);