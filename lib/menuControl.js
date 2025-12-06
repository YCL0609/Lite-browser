import { isDebug, appPath, getNomenuSession } from '../lib/config.js';
import { BrowserWindow, Menu, dialog } from 'electron';
import { pathToFileURL } from 'url';
import path from 'path';

const debugMenu = isDebug ? Menu.buildFromTemplate([{
  label: '忽略缓存刷新(shift+F5)',
  accelerator: 'shift+F5',
  role: 'forceReload'
}, {
  label: '开发者工具(F12)',
  accelerator: 'F12',
  role: 'toggleDevTools'
}]) : null;

function openToolsWindow(htmlfile) {
  const newwin = new BrowserWindow({
    width: 1024,
    height: 600,
    webPreferences: {
      session: getNomenuSession(),
      preload: path.join(appPath, 'api', 'preload', 'tools.js')
    }
  });
  newwin.setMenu(debugMenu);
  newwin.loadURL(pathToFileURL(path.join(appPath, 'html', 'tools', htmlfile)).href);
}

function insertJS() {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (!mainWindow || mainWindow.isDestroyed()) {
    dialog.showErrorBox('错误', '当前没有可用的浏览器窗口');
    return;
  }

  mainWindow.webContents.executeJavaScript('litebrowser.registerWindow()');

  const childWindow = new BrowserWindow({
    parent: mainWindow,
    width: 500,
    height: 500,
    webPreferences: {
      additionalArguments: [`--parent-window-id=${mainWindow.id}`],
      session: getNomenuSession(),
      contextIsolation: true,
      preload: path.join(appPath, 'api', 'preload', 'insertjs.js')
    }
  });
  childWindow.setMenu(debugMenu);
  childWindow.loadFile(path.join(appPath, 'html', 'insert', 'index.html'));
}

export {
  openToolsWindow,
  insertJS
}