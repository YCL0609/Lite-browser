const { ipcMain, BrowserWindow, session } = require('electron');

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

// 无菜单新窗口
ipcMain.on('new-window-nomenu', (_, url) => {
  const newwin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      session: session.defaultSession,
    },
  });
  newwin.loadURL(url);
});