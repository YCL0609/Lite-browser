import { getLocale, getSettings, IconPath } from '../../core/index.js';
import { ipcMain, BrowserWindow, session } from 'electron';
const settingsRaw = getSettings();
const cfg = JSON.stringify(settingsRaw?.app)

// 正常新窗口
ipcMain.on('window-open', (_, url) => {
  if (!url?.trim() === '') return;
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
      additionalArguments: ['--app-config=' + cfg],
    },
  });
  newwin.loadURL(url.trim());
});

// 获取语言文件
const lang = getLocale();
ipcMain.handle('languageJson-get', () => lang);