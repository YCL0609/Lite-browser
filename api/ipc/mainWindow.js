import { ipcMain, BrowserWindow, session } from 'electron';
import { isDataDirCanRead, isDataDirCanWrite } from '../../lib/config.js';

// 正常新窗口
ipcMain.on('new-window', (_, url) => {
  const newwin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      session: session.defaultSession,
    },
  });
  newwin.loadURL(url);
});

// 数据目录权限查询
ipcMain.handle('dataDir-permission', () => ({ read: isDataDirCanRead, write: isDataDirCanWrite }));